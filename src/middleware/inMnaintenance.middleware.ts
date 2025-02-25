import { CommonHelper } from '../helpers/common.helper';
import { NextFunction, Request, Response } from 'express';
import { Config as ConfigSchema } from '../config/config.schema';
import { ServiceResponse } from '../helpers/serviceResponse.helper';
import { COMMON_ERROR_CODE, COMMON_ERROR_MESSAGE, ERROR, RESPONSE_MSG } from '../helpers/response.status';
import { generateRedisKeyFor, RedisClient } from '../helpers/redis.helper';
import { Config } from '../config';

const serviceResponse = new ServiceResponse();

export const isInMaintenance = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const key = generateRedisKeyFor.adminConfig();
		let configRedisResult: any = Config.isPhoneVerificationEnabled ? await RedisClient.get({ key }) : null;
		if (CommonHelper.empty(configRedisResult)) {
			configRedisResult = await ConfigSchema.findOne({ key: 'main' }).lean().exec();
		} else {
			configRedisResult = JSON.parse(configRedisResult);
		}
		if (!CommonHelper.empty(configRedisResult) && configRedisResult?.inMaintenance) {
			const exception = serviceResponse.serviceUnavailableError({
				errorCode: ERROR.SERVICE_IN_MAINTENANCE.CODE,
				message: configRedisResult?.length
					? configRedisResult?.maintenanceNote ?? ERROR.SERVICE_IN_MAINTENANCE.MESSAGE
					: ERROR.SERVICE_IN_MAINTENANCE.MESSAGE,
				error: ERROR.SERVICE_IN_MAINTENANCE.ERROR,
				meta: { message: RESPONSE_MSG.COMMON.SERVICE_IN_MAINTENANCE },
			});
			return res.status(exception.statusCode).json(exception);
		}
		next();
	} catch (error) {
		console.error(error);
		const exception = serviceResponse.unhandledError({
			errorCode: COMMON_ERROR_CODE.SOMETHING_WENT_WRONG,
			message: COMMON_ERROR_MESSAGE.SOMETHING_WENT_WRONG,
			meta: error,
		});
		return res.status(exception.statusCode).json(exception);
	}
};
