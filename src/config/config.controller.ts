import { Request, Response } from 'express';
import { logger } from '../services/logger';
import { Config as ConfigSchema, TIConfigOrNull } from './config.schema';
import { Config } from '../config';
import { CommonHelper } from '../helpers/common.helper';
import { COMMON_ERROR_CODE, COMMON_ERROR_MESSAGE } from '../helpers/response.status';
import { CONFIG_COUNTRY_TYPE_DEFINITION, CONFIG_TYPE_DEFINITION } from './config.token';
import { COMPONENT_NAME, COUNTRY } from '../helpers/common.token';
import { generateRedisKeyFor, RedisClient } from '../helpers/redis.helper';

const LOG_FILENAME = 'ConfigController :';

export class ConfigController {
	/** Request body verification */
	index = async (req: Request, res: Response): Promise<any> => {
		let { serviceResponse } = req;
		const traceId = serviceResponse.traceId;
		try {
			const key = generateRedisKeyFor.adminConfig();
			let configRedisResult: any = Config.isPhoneVerificationEnabled ? await RedisClient.get({ key }) : '{}';
			let configResult: TIConfigOrNull = JSON.parse(configRedisResult);
			if (CommonHelper.empty(configResult)) {
				configResult = await ConfigSchema.findOne({ key: Config.appName });
				await RedisClient.set({ key, value: JSON.stringify(configResult) });
			}
			if (CommonHelper.empty(configResult)) {
				throw new Error(COMMON_ERROR_MESSAGE.SOMETHING_WENT_WRONG);
			}
			const meta = {
				isPhoneVerificationEnabled: Config.isPhoneVerificationEnabled,
			};
			let responseData: any = CommonHelper.convertProperties(
				{ ...configResult, meta },
				CONFIG_TYPE_DEFINITION,
				COMPONENT_NAME.CONFIG,
			);
			const response = serviceResponse.fetched({
				data: responseData,
				message: 'Config fetch success',
			});
			return res.status(response.statusCode).json(response);
		} catch (error: any) {
			logger.error(error, 'error');
			const exception = serviceResponse.unhandledError({
				errorCode: COMMON_ERROR_CODE.SOMETHING_WENT_WRONG,
				message: error.message || COMMON_ERROR_MESSAGE.SOMETHING_WENT_WRONG,
				meta: error,
			});
			return res.status(exception?.statusCode).json(exception);
		}
	};

	countryList = async (req: Request, res: Response): Promise<any> => {
		let { serviceResponse } = req;
		const traceId = serviceResponse.traceId;
		try {
			const countryArr: any = Object.keys(COUNTRY).map((key: string) => ({
				...COUNTRY[key],
				flagUrl: `${req.protocol}://${req.get('host')}/flag/${key.toLowerCase()}.svg`,
			}));
			let responseData: any = CommonHelper.convertProperties(
				countryArr,
				CONFIG_COUNTRY_TYPE_DEFINITION,
				COMPONENT_NAME.CONFIG,
			);
			responseData = serviceResponse.fetched({
				traceId,
				data: responseData,
				message: 'Config country fetch success',
			});
			res.status(responseData.statusCode).json(responseData);
		} catch (error: any) {
			logger.error(error, 'error');
			const exception = serviceResponse.unhandledError({
				errorCode: COMMON_ERROR_CODE.SOMETHING_WENT_WRONG,
				message: error.message || COMMON_ERROR_MESSAGE.SOMETHING_WENT_WRONG,
				meta: error,
			});
			return res.status(exception?.statusCode).json(exception);
		}
	};
}
