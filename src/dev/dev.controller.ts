import { Request, Response } from 'express';
import { logger } from '../services/logger';
import { ERROR } from '../helpers/response.status';
import { Config as ConfigSchema } from './../config/config.schema';
import { Config } from '../config';
import { generateRedisKeyFor, RedisClient } from '../helpers/redis.helper';

const LOG_FILENAME = 'DevController :';

export class DevController {
	maintenanceMode = async (req: Request, res: Response) => {
		let { serviceResponse } = req;
		const traceId = serviceResponse.traceId;
		try {
			const inMaintenance = String(req?.body?.inMaintenance ?? '');
			const maintenanceNote = String(req?.body?.maintenanceNote ?? '');
			if (!inMaintenance?.length) {
				const response = serviceResponse.unprocessableEntityError({
					errorCode: ERROR.REQUEST_NOT_ACCEPTABLE.CODE,
					message: ERROR.REQUEST_NOT_ACCEPTABLE.MESSAGE,
					error: ERROR.REQUEST_NOT_ACCEPTABLE.ERROR,
					meta: {},
				});
				return res.status(response.statusCode).json(response);
			}
			const configResult = await ConfigSchema.findOneAndUpdate(
				{ key: Config.appName },
				{
					$set: {
						inMaintenance,
						maintenanceNote,
					},
				},
				{
					returnDocument: 'after',
				},
			).exec();
			const key = generateRedisKeyFor.adminConfig();
			await RedisClient.set({ key, value: JSON.stringify(configResult) });
			const response = serviceResponse.success({
				data: { ...configResult },
				message: 'Success',
			});
			return res.status(response.statusCode).json(response);
		} catch (error: any) {
			logger.error(error, `error-at-catch-${traceId}`);
			const exception = serviceResponse.unhandledError({
				errorCode: ERROR.SOMETHING_WENT_WRONG.CODE,
				message: ERROR.SOMETHING_WENT_WRONG.MESSAGE,
				error: ERROR.SOMETHING_WENT_WRONG.ERROR,
				meta: error,
			});
			return res.status(exception?.statusCode).json(exception);
		}
	};
}
