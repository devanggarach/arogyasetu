import { body, validationResult } from 'express-validator';
import { NextFunction, Request, Response } from 'express';
import { COMMON_ERROR_CODE, COMMON_ERROR_MESSAGE } from '../../helpers/response.status';
import { DYNAMIC_REQUIRED, ERROR_CODE, ERROR_MESSAGE } from './admin.error';
import { ServiceResponse } from '../../helpers/serviceResponse.helper';

const serviceResponse = new ServiceResponse();

export const create = [
	body('username')
		.optional()
		.notEmpty()
		.withMessage(COMMON_ERROR_MESSAGE.EMPTY_VALUE)
		.bail()
		.isString()
		.withMessage(COMMON_ERROR_MESSAGE.SHOULD_BE_STRING)
		.bail()
		.isLength({ min: DYNAMIC_REQUIRED.USERNAME_LENGTH })
		.withMessage(ERROR_MESSAGE.USERNAME_LENGTH),
	body('email')
		.optional()
		.notEmpty()
		.withMessage(COMMON_ERROR_MESSAGE.EMPTY_VALUE)
		.bail()
		.isString()
		.withMessage(COMMON_ERROR_MESSAGE.SHOULD_BE_STRING)
		.bail()
		.isEmail()
		.withMessage(ERROR_MESSAGE.INVALID_EMAIL),
	body('password')
		.exists()
		.withMessage(COMMON_ERROR_MESSAGE.REQUIRED_VALUE)
		.bail()
		.notEmpty()
		.withMessage(COMMON_ERROR_MESSAGE.EMPTY_VALUE)
		.bail()
		.isString()
		.withMessage(COMMON_ERROR_MESSAGE.SHOULD_BE_STRING)
		.isLength({ min: DYNAMIC_REQUIRED.PASSWORD_LENGTH })
		.withMessage(ERROR_MESSAGE.PASSWORD_LENGTH),
	(req: Request, res: Response, next: NextFunction) => {
		const traceId = req.serviceResponse.traceId;
		try {
			let errors = validationResult(req);
			if (!errors.isEmpty()) {
				throw serviceResponse.unprocessableEntityError({
					errorCode: ERROR_CODE.CREATE_VALIDATION_ENTITY,
					message: COMMON_ERROR_CODE.UNPROCESSABLE_ENTITY,
					meta: errors.array(),
				});
			}
			next();
		} catch (error: any) {
			if (error?.statusCode) {
				res.status(error?.statusCode).json({ ...error, traceId });
				return;
			}
			const exception = serviceResponse.unhandledError({
				errorCode: ERROR_CODE.CREATE_VALIDATION_UNHANDLED,
				message: COMMON_ERROR_CODE.SOMETHING_WENT_WRONG,
				meta: error,
			});
			return res.status(exception.statusCode).json(exception);
		}
	},
];

export const login = [
	body('username')
		.optional()
		.notEmpty()
		.withMessage(COMMON_ERROR_MESSAGE.EMPTY_VALUE)
		.bail()
		.isString()
		.withMessage(COMMON_ERROR_MESSAGE.SHOULD_BE_STRING),
	body('email')
		.optional()
		.notEmpty()
		.withMessage(COMMON_ERROR_MESSAGE.EMPTY_VALUE)
		.bail()
		.isString()
		.withMessage(COMMON_ERROR_MESSAGE.SHOULD_BE_STRING),
	body('password')
		.exists()
		.withMessage(COMMON_ERROR_MESSAGE.REQUIRED_VALUE)
		.bail()
		.notEmpty()
		.withMessage(COMMON_ERROR_MESSAGE.EMPTY_VALUE),
	(req: Request, res: Response, next: NextFunction) => {
		const traceId = req.serviceResponse.traceId;
		try {
			let errors = validationResult(req);
			if (!errors.isEmpty()) {
				throw serviceResponse.unprocessableEntityError({
					errorCode: ERROR_CODE.CREATE_VALIDATION_ENTITY,
					message: COMMON_ERROR_CODE.UNPROCESSABLE_ENTITY,
					meta: errors.array(),
				});
			}
			next();
		} catch (error: any) {
			if (error?.statusCode) {
				res.status(error?.statusCode).json({ ...error, traceId });
				return;
			}
			const exception = serviceResponse.unhandledError({
				errorCode: ERROR_CODE.CREATE_VALIDATION_UNHANDLED,
				message: COMMON_ERROR_CODE.SOMETHING_WENT_WRONG,
				meta: error,
			});
			return res.status(exception.statusCode).json(exception);
		}
	},
];

export const update = [
	(req: Request, res: Response, next: NextFunction) => {
		const traceId = req.serviceResponse.traceId;
		try {
			let errors = validationResult(req);
			if (!errors.isEmpty()) {
				throw serviceResponse.unprocessableEntityError({
					errorCode: ERROR_CODE.CREATE_VALIDATION_ENTITY,
					message: COMMON_ERROR_CODE.UNPROCESSABLE_ENTITY,
					meta: errors.array(),
				});
			}
			next();
		} catch (error: any) {
			if (error?.statusCode) {
				res.status(error?.statusCode).json({ ...error, traceId });
				return;
			}
			const exception = serviceResponse.unhandledError({
				errorCode: ERROR_CODE.CREATE_VALIDATION_UNHANDLED,
				message: COMMON_ERROR_CODE.SOMETHING_WENT_WRONG,
				meta: error,
			});
			return res.status(exception.statusCode).json(exception);
		}
	},
];

export const validateAddUhc = [
	body('name')
		.notEmpty()
		.withMessage(COMMON_ERROR_MESSAGE.EMPTY_VALUE)
		.bail()
		.isString()
		.withMessage(COMMON_ERROR_MESSAGE.SHOULD_BE_STRING),
	body('pincode')
		.notEmpty()
		.withMessage(COMMON_ERROR_MESSAGE.EMPTY_VALUE)
		.bail()
		.isString()
		.withMessage(COMMON_ERROR_MESSAGE.SHOULD_BE_STRING),
	body('address')
		.notEmpty()
		.withMessage(COMMON_ERROR_MESSAGE.EMPTY_VALUE)
		.bail()
		.isString()
		.withMessage(COMMON_ERROR_MESSAGE.SHOULD_BE_STRING),
	body('city')
		.notEmpty()
		.withMessage(COMMON_ERROR_MESSAGE.EMPTY_VALUE)
		.bail()
		.isString()
		.withMessage(COMMON_ERROR_MESSAGE.SHOULD_BE_STRING),
	body('state')
		.notEmpty()
		.withMessage(COMMON_ERROR_MESSAGE.EMPTY_VALUE)
		.bail()
		.isString()
		.withMessage(COMMON_ERROR_MESSAGE.SHOULD_BE_STRING),
	body('vaccine')
		.notEmpty()
		.withMessage(COMMON_ERROR_MESSAGE.EMPTY_VALUE)
		.bail()
		.isString()
		.withMessage(COMMON_ERROR_MESSAGE.SHOULD_BE_STRING),
	async (req: Request, res: Response, next: NextFunction) => {
		const traceId = req.serviceResponse.traceId;
		try {
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				throw req.serviceResponse.unprocessableEntityError({
					errorCode: ERROR_CODE.CREATE_VALIDATION_ENTITY,
					message: COMMON_ERROR_CODE.UNPROCESSABLE_ENTITY,
					meta: errors.array(),
				});
			}
			next();
		} catch (error: any) {
			if (error?.statusCode) {
				res.status(error?.statusCode).json({ ...error, traceId });
				return;
			}
			const exception = req.serviceResponse.unhandledError({
				errorCode: ERROR_CODE.CREATE_VALIDATION_UNHANDLED,
				message: COMMON_ERROR_CODE.SOMETHING_WENT_WRONG,
				meta: error,
			});
			return res.status(exception.statusCode).json(exception);
		}
	},
];
