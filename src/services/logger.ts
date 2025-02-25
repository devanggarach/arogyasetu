import { NextFunction, Request, Response } from 'express';
import pino from 'pino';

export const pinoConfig = {
	redact: ['password', 'sensitiveData', 'apiSecret', 'req.headers', 'req.headers.authorization'],
	quietReqLogger: true, // turn off the default logging output
	level: 'debug',
	transport: {
		target: 'pino-pretty',
		options: {
			colorize: true,
			levelFirst: true,
			translateTime: 'SYS:yyyy-mm-dd HH:MM:ss.l',
		},
	},
};
export const logger = pino(pinoConfig);

export const incomingLog = (req: any, res: any, next: any) => {
	if (req.skipLogging) return next();
	logger.info(
		{
			traceId: req.serviceResponse.traceId,
			id: req.id,
			method: req.method,
			url: req.url,
			query: req.query,
			params: req.params,
			headers: req.headers,
			remoteAddress: req?.userIp ?? req?.ip ?? '',
			remotePort: req?.connection?.remotePort ?? req?.socket?.remotePort,
			client: req.headers['user-agent'],
		},
		'request incoming',
	);
	next();
};
