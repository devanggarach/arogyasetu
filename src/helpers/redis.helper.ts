import { Emitter } from '@socket.io/redis-emitter';
import { createClient, RedisClientType } from 'redis';
import { Config } from '../config';
import { logger } from '../services/logger';
import { PID_TYPE } from '../config/config.token';

const LOG_REDIS_HELPER = 'redis.helper : ';

export class RedisClient {
	public static socketEmitter: Emitter;

	private static redisClient: RedisClientType = createClient({
		socket: {
			host: Config?.redis?.host,
			port: Config?.redis?.port,
		},
		username: Config?.redis?.username,
		password: Config?.redis?.password,
	});

	private static readonly TTL = Config?.redis?.TTL * 24 * 60 * 60;

	public static async connectToRedis(): Promise<void> {
		RedisClient.redisClient.on('connect', () => {
			logger.info(`${LOG_REDIS_HELPER}Connecting to client`);
		});

		RedisClient.redisClient.on('ready', () => {
			logger.info(`${LOG_REDIS_HELPER}Connected to client`);
		});

		RedisClient.redisClient.on('end', () => {
			logger.warn(`${LOG_REDIS_HELPER}Client disconnected from Redis`);
		});

		RedisClient.redisClient.on('error', err => {
			logger.error(`${LOG_REDIS_HELPER}Redis network error occurred: `, err);
		});

		RedisClient.redisClient.on('reconnecting', () => {
			logger.info(`${LOG_REDIS_HELPER}Reconnecting to client`);
		});

		await RedisClient.redisClient.connect();
		RedisClient.socketEmitter = new Emitter(RedisClient.redisClient);
	}

	public static getClient() {
		return this.redisClient;
	}

	// Add an event listener for Redis messages
	public static on(event: string, listener: (channel: string, message: string) => void): void {
		this.redisClient.on(event, listener);
	}

	public static async set({
		key,
		value,
		resetTTL = false,
		options = { EX: this.TTL },
	}: {
		key: string;
		value: string;
		resetTTL?: boolean;
		options?: Record<string, any>;
	}): Promise<string | null> {
		try {
			if (resetTTL) {
				return await this.redisClient.set(key, value, options);
			}
			return await this.redisClient.set(key, value, { KEEPTTL: true });
		} catch (error) {
			logger.error(error, `${LOG_REDIS_HELPER}set command`);
		}
		return null;
	}

	public static async get({ key, resetTTL = false }: { key: string; resetTTL?: boolean }): Promise<string | null> {
		try {
			await this.expire({ key, time: this.TTL, resetTTL });
			return await this.redisClient.get(key);
		} catch (error) {
			logger.error(error, `${LOG_REDIS_HELPER}get command`);
		}
		return null;
	}

	public static async del({ key }: { key: string | Array<string> }): Promise<number> {
		try {
			return await this.redisClient.del(key);
		} catch (error) {
			logger.error(error, `${LOG_REDIS_HELPER}del command`);
		}
		return 0;
	}

	public static async keys(keyPattern: string): Promise<Array<string>> {
		try {
			return await this.redisClient.keys(keyPattern);
		} catch (error) {
			logger.error(error, `${LOG_REDIS_HELPER}keys command`);
		}
		return [];
	}

	public static async expire({
		key,
		time,
		resetTTL = true,
	}: {
		key: string;
		time: number;
		resetTTL?: boolean;
	}): Promise<boolean> {
		try {
			if (resetTTL) {
				return await this.redisClient.expire(key, time);
			}
		} catch (error) {
			logger.error(error, `${LOG_REDIS_HELPER}expire command`);
		}
		return false;
	}

	public static async keyExists(key: string): Promise<number> {
		try {
			return await this.redisClient.exists(key);
		} catch (err) {
			logger.error(`${LOG_REDIS_HELPER}keyExists command: `, key, err);
			return 0;
		}
	}
}

export const generateRedisKeyFor = {
	locateOtp: (platform: string, address: string, pid: number): string => {
		return `user:otp:${platform}:${address}:${PID_TYPE[pid]}`;
	},
	authToken: (token: string, isAdmin: boolean = false): string => {
		return isAdmin ? `auth:admin:token:${token}` : `auth:user:token:${token}`;
	},
	adminConfig: (): string => {
		return `admin:config`;
	},
};
