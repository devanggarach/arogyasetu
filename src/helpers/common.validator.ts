import { param } from 'express-validator';

export function idParamValidator(id = 'id'): any {
	return param(id).not().isEmpty().withMessage({ error_code: 'EMPTY_VALUE' }).bail().isMongoId().withMessage({
		error_code: 'INVALID_ID',
	});
}

export function userIdParamValidator(userId = 'userId'): any {
	return param(userId).not().isEmpty().withMessage({ error_code: 'EMPTY_VALUE' }).bail().isMongoId().withMessage({
		error_code: 'INVALID_ID',
	});
}
