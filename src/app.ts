import http from 'http';
import { cpus } from 'os';
import path from 'path';
import cluster from 'cluster';
import dotenv from 'dotenv';
import express, { Request, Response, NextFunction } from 'express';
import useragent from 'express-useragent';
import { pinoHttp } from 'pino-http';
import { incomingLog, logger } from './services/logger';
import helmet, { frameguard } from 'helmet';
import mongoose from 'mongoose';
import gracefulShutdown from 'http-graceful-shutdown';
import { BASE_DIR_PATH, Config } from './config';
import { ApplicationConfig } from './config/application.config';
import { DbHelper } from './helpers/db.helper';
import { IUser } from './components/user/user.schema';
import { IAdmin } from './components/admin/admin.schema';
import { ServiceResponse } from './helpers/serviceResponse.helper';
import cors from 'cors';
import { RedisClient } from './helpers/redis.helper';
import { EventEmitter } from 'events';
import requestIp from 'request-ip';
import { SCHEDULE_TIME, SCHEDULE_TIME_KEYS } from './crons/cronjob.token';
import { CronJobConfig } from './crons/cronjob.config';

EventEmitter.defaultMaxListeners = 20;

const LOG_FILENAME = `App`;

declare global {
	namespace Express {
		export interface Request {
			userIp: any;
			user: IUser | IAdmin;
			serviceResponse: any;
			skipLogging: boolean;
		}
	}
}

dotenv.config();

const mongoUrl: string = Config.server.mongoDBConnectionUrl;
const PORT: number = Config.server.port;
const ROUTES_TO_SKIP_LOG = ['/flag', '/image', '/document'];

export class App {
	public app: express.Application;
	public connections: any = new Map();
	public roomNames: Set<string> = new Set();

	private async shutdownConnection(): Promise<void> {
		logger.info({}, 'connection start to close');
		await mongoose.disconnect();
		await DbHelper.closeMongoDBNativeClient();
		logger.info({}, 'connection closed.');
	}

	private finalFunction(): void {
		logger.info({}, 'server shut down');
	}

	private runCronJobs(): void {
		SCHEDULE_TIME_KEYS.forEach((job: SCHEDULE_TIME) => {
			const cronJob = new CronJobConfig(job);
			cronJob.run();
		});
	}

	constructor() {
		this.mongoSetup().catch();
		if (Config.isPhoneVerificationEnabled) {
			RedisClient.connectToRedis().catch(error => {
				logger.error(
					{ error },
					`${LOG_FILENAME}:constructor:connectToRedis::at-catch:error in connecting to redis`,
				);
			});
		}
		this.app = express();
		const server = http.createServer(this.app);
		server.listen(PORT, () => {
			logger.info({}, `Server is running on port: ${PORT}`);
		});

		this.config();
		gracefulShutdown(server, {
			signals: 'SIGINT SIGTERM',
			timeout: 100000,
			development: false,
			forceExit: true,
			onShutdown: this.shutdownConnection,
			finally: this.finalFunction,
		});
		if (!cluster.isWorker || process.env.NODE_APP_INSTANCE === '0') {
			this.runCronJobs();
		}
	}

	private config(): void {
		this.app.set('trust proxy', 1);
		this.app.use(useragent.express());
		this.app.use(cors());
		this.app.use(frameguard({ action: 'deny' }), helmet.hidePoweredBy());
		this.app.use(express.static(__dirname + '/media'));
		this.app.use(function (req: Request, res: Response, next: NextFunction) {
			if (ROUTES_TO_SKIP_LOG.some(route => req.url.startsWith(route))) req.skipLogging = true;
			req.serviceResponse = new ServiceResponse(req, res);
			let clientIp = requestIp.getClientIp(req);
			const userIp =
				clientIp ?? req?.headers?.['x-forwarded-for'] ?? req?.connection?.remoteAddress ?? req?.ip ?? '';
			// logger.info({ clientIp, userIp }, 'ipcheck=>');
			req.userIp = userIp;
			next();
		});
		this.app.use(incomingLog);
		this.app.use(pinoHttp({ logger, autoLogging: { ignore: (req: Request) => req.skipLogging === true } }));
		this.app.use(express.json({ limit: 100 * 100000 }));
		this.app.use(express.urlencoded({ extended: false, limit: 100 * 100000 }));

		// Register Routers.
		ApplicationConfig.registerRoute(this.app);
		// Start static serving.
		this.app.use(express.static(path.join(BASE_DIR_PATH, '../media')));
		this.app.get('/healthCheck', (req: Request, res: Response) => {
			res.send({});
		});
	}

	private async mongoSetup(): Promise<void> {
		mongoose.connection.on('connected', () => {
			logger.info({}, 'DATABASE - Connected');
		});

		mongoose.connection.on('error', error => {
			logger.error({ error }, `${LOG_FILENAME}:mongoSetup::mongoose.connection.on:DATABASE - Error`);
		});

		mongoose.connection.on('disconnected', () => {
			logger.warn({}, 'DATABASE - disconnected');
		});

		await mongoose.connect(mongoUrl).catch(error => {
			logger.error({ error }, `${LOG_FILENAME}:mongoSetup::mongoose.connect:DATABASE - Error`);
		});
	}
}

let appInstance: App;

const numCPUs = cpus().length;

if (Config.server.appType && Config.server.appType === 'cluster') {
	if (cluster.isPrimary && numCPUs > 1) {
		logger.info({}, `Master ${process.pid} is running`);
		for (let i = 0; i < numCPUs; i += 1) {
			cluster.fork();
		}
		cluster.on('online', worker => {
			logger.info({}, `Worker ${worker.process.pid} is online.`);
		});
		cluster.on('exit', (worker, code, signal) => {
			logger.error({}, `Worker ${worker.process.pid} died with code: ${code}, signal: ${signal}`);
			cluster.fork();
		});
	} else {
		appInstance = new App();
	}
} else {
	appInstance = new App();
}
export { appInstance };
