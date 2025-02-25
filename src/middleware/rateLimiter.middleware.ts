import { rateLimit, RateLimitRequestHandler } from 'express-rate-limit';
import { ServiceResponse } from '../helpers/serviceResponse.helper';
import { COMMON_ERROR_CODE } from '../helpers/response.status';
import { logger } from '../services/logger';

const serviceResponse = new ServiceResponse();

export const apiLimiter = (windowMs: number, max: number): RateLimitRequestHandler => {
	// logger.info(`Rate limiter setup with windowMs: ${windowMs}, max: ${max}`);
	const exception = serviceResponse.rateLimitError({
		errorCode: COMMON_ERROR_CODE.MAX_API_LIMIT_RECHED,
		meta: {},
	});
	if (!windowMs || !max) {
		logger.error('Rate limiter configuration is invalid: missing windowMs or max');
	}
	return rateLimit({
		windowMs,
		max,
		standardHeaders: true,
		legacyHeaders: false,
		message: exception,
	});
};
