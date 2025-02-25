import { body, validationResult } from 'express-validator';
import { NextFunction, Request, Response } from 'express';
import { COMMON_ERROR_CODE, COMMON_ERROR_MESSAGE, ERROR } from '../../helpers/response.status';
import { DYNAMIC_REQUIRED, ERROR_CODE, ERROR_MESSAGE } from './user.error';
import { ServiceResponse } from '../../helpers/serviceResponse.helper';
import { CommonHelper } from '../../helpers/common.helper';

const serviceResponse = new ServiceResponse();

export const create = [
	body('password')
		.optional()
		.notEmpty()
		.withMessage(COMMON_ERROR_MESSAGE.EMPTY_VALUE)
		.bail()
		.isString()
		.withMessage(COMMON_ERROR_MESSAGE.SHOULD_BE_STRING)
		.bail()
		.withMessage(COMMON_ERROR_MESSAGE.SHOULD_BE_STRING)
		.isLength({ min: DYNAMIC_REQUIRED.PASSWORD_LENGTH })
		.withMessage(ERROR_MESSAGE.PASSWORD_LENGTH),
	body('phone.code')
		.if(body('phone').exists())
		.notEmpty()
		.withMessage(COMMON_ERROR_MESSAGE.EMPTY_VALUE)
		.bail()
		.isString()
		.withMessage(COMMON_ERROR_MESSAGE.SHOULD_BE_STRING),
	body('phone.cellNo')
		.if(body('phone').exists())
		.notEmpty()
		.withMessage(COMMON_ERROR_MESSAGE.EMPTY_VALUE)
		.bail()
		.isString()
		.withMessage(COMMON_ERROR_MESSAGE.SHOULD_BE_STRING),
	body('name.first')
		.notEmpty()
		.withMessage(COMMON_ERROR_MESSAGE.EMPTY_VALUE)
		.bail()
		.isString()
		.withMessage(COMMON_ERROR_MESSAGE.SHOULD_BE_STRING),
	body('name.middle')
		.notEmpty()
		.withMessage(COMMON_ERROR_MESSAGE.EMPTY_VALUE)
		.bail()
		.isString()
		.withMessage(COMMON_ERROR_MESSAGE.SHOULD_BE_STRING),
	body('name.last')
		.notEmpty()
		.withMessage(COMMON_ERROR_MESSAGE.EMPTY_VALUE)
		.bail()
		.isString()
		.withMessage(COMMON_ERROR_MESSAGE.SHOULD_BE_STRING),
	body('age')
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
	body('aadharNo')
		.notEmpty()
		.withMessage(COMMON_ERROR_MESSAGE.EMPTY_VALUE)
		.bail()
		.isString()
		.withMessage(COMMON_ERROR_MESSAGE.SHOULD_BE_STRING),
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
			let { age, pincode, aadharNo } = req.body;
			if (age) {
				const ageIsValid = Number.isInteger(parseFloat(age)) && age > 0 && age <= 110;
				if (!ageIsValid) {
					throw serviceResponse.unprocessableEntityError({
						errorCode: ERROR.INVALID_FORMAT.CODE,
						message: 'Invalid Age',
						error: ERROR.INVALID_FORMAT.ERROR,
						meta: {},
					});
				}
			}
			if (pincode) {
				if (!CommonHelper.pincodeRegex.test(pincode)) {
					throw serviceResponse.unprocessableEntityError({
						errorCode: ERROR.INVALID_FORMAT.CODE,
						message: 'Invalid Pincode',
						error: ERROR.INVALID_FORMAT.ERROR,
						meta: {},
					});
				}
			}
			if (aadharNo && !CommonHelper.isValidAadhaar(aadharNo)) {
				throw serviceResponse.unprocessableEntityError({
					errorCode: ERROR.INVALID_FORMAT.CODE,
					message: 'Invalid Aadhar No',
					error: ERROR.INVALID_FORMAT.ERROR,
					meta: {},
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
	body('otp')
		.optional()
		.notEmpty()
		.withMessage(COMMON_ERROR_MESSAGE.EMPTY_VALUE)
		.bail()
		.isString()
		.withMessage(COMMON_ERROR_MESSAGE.SHOULD_BE_STRING),
	body('password')
		.optional()
		.notEmpty()
		.withMessage(COMMON_ERROR_MESSAGE.EMPTY_VALUE)
		.bail()
		.isString()
		.withMessage(COMMON_ERROR_MESSAGE.SHOULD_BE_STRING),
	body('phone.code')
		.if(body('phone').exists())
		.notEmpty()
		.withMessage(COMMON_ERROR_MESSAGE.EMPTY_VALUE)
		.bail()
		.isString()
		.withMessage(COMMON_ERROR_MESSAGE.SHOULD_BE_STRING),
	body('phone.cellNo')
		.if(body('phone').exists())
		.notEmpty()
		.withMessage(COMMON_ERROR_MESSAGE.EMPTY_VALUE)
		.bail()
		.isString()
		.withMessage(COMMON_ERROR_MESSAGE.SHOULD_BE_STRING),
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

export const logout = [
	body('deviceId')
		.optional()
		.notEmpty()
		.withMessage(COMMON_ERROR_MESSAGE.EMPTY_VALUE)
		.bail()
		.isString()
		.withMessage(COMMON_ERROR_MESSAGE.SHOULD_BE_STRING),
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
