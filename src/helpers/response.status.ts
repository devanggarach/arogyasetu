export const COMMON_ERROR_CODE = {
	UNKNOWN: 'UNKNOWN',
	SOMETHING_WENT_WRONG: 'SOMETHING_WENT_WRONG',
	REQUEST_NOT_ACCEPTABLE: 'REQUEST_NOT_ACCEPTABLE',

	EMAIL_DOMAIN_NOT_VALID: `EMAIL_DOMAIN_NOT_VALID`,
	EMPTY_VALUE: 'EMPTY_VALUE',
	UNPROCESSABLE_ENTITY: 'UNPROCESSABLE_ENTITY',
	UNHANDLED_DB_ERROR: 'UNHANDLED_DB_ERROR',
	UNAUTHORIZED_ACCESSS: 'UNAUTHORIZED_ACCESSS',
	FILE_FORMAT_NOT_SUPPORTED: 'FILE_FORMAT_NOT_SUPPORTED',
	LIMIT_UNEXPECTED_FILE: 'LIMIT_UNEXPECTED_FILE',
	LIMIT_FILE_SIZE: 'LIMIT_FILE_SIZE',
	UNSUPPORTED_MEDIA: 'UNSUPPORTED_MEDIA',
	AWS_UPLOAD_ERROR: 'AWS_UPLOAD_ERROR',
	SERVICE_IN_MAINTENANCE: 'SERVICE_IN_MAINTENANCE',
	PERMISSION_DENIED: 'PERMISSION_DENIED',
	INVALID_AUTH_TOKEN: 'INVALID_AUTH_TOKEN',
	INVALID_AUTH_CODE: 'INVALID_AUTH_CODE',
	ACCESS_DENIED: 'ACCESS_DENIED',
	ENCRYPT_UNHANDLED: 'ENCRYPT_UNHANDLED',
	DECRYPT_UNHANDLED: 'DECRYPT_UNHANDLED',
	NOT_FOUND: 'NOT_FOUND',
	MAX_API_LIMIT_RECHED: 'MAX_API_LIMIT_RECHED',
	VALIDATION_UNHANDLED: 'VALIDATION_UNAHNALDED',
	DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',
};

export const COMMON_ERROR_MESSAGE = {
	FOUND: 'Found',
	NOT_FOUND: 'Not found',
	UNAUTHORIZED_ACCESS: 'Unauthroized access',
	SOMETHING_WENT_WRONG: `Hiccup! Servers tangled up. Fixing now. Check back soon`,
	FILE_FORMAT_NOT_SUPPORTED: 'File format not supported',
	LIMIT_UNEXPECTED_FILE: 'Unexpected file type',
	LIMIT_FILE_SIZE: 'File size limit exceed',
	UNPROCESSABLE_ENTITY: 'Invalid entity',
	UNSUPPORTED_MEDIA: 'Unsupported media file',
	AWS_UPLOAD_ERROR: 'Error occurred while trying to upload to S3 bucket',
	DEPENDENT_API_ERROR: `Uh-oh! A small hitch with a dependent platform. We're on it! Thanks for bearing with us`,
	EMPTY_VALUE: 'Empty value',
	REQUIRED_VALUE: 'Required value',
	SHOULD_BE_STRING: 'Value should be string',
	SHOULD_BE_NUMBER: 'Value should be in number',
	SHOULD_BE_POSITIVE_NUMBER: 'Value must be greater than 0',
	SHOULD_BE_BOOLEAN: 'Value should be in boolean',
	SHOULD_BE_ALPHABET: 'Value should be alphanets only',
	SHOULD_BE_ALPHA_NUMERIC: 'Value should be alpha-numeric',
	INVALID_AUTH_TOKEN: 'Invalid auth token',
	INVALID_AUTH_CODE: 'The code you entered is incorrect. Please try again',
	PERMISSION_DENIED: 'Permission denied',
	ACCESS_DENIED: 'Access Denied. Please complete necessary prerequisites before accessing',
	INVALID_ROUTE_REQUEST: 'This route is not supported',
	MAX_API_LIMIT_RECHED: 'You reached to max request limit. Please try after sometime',
	INVALID_VALUE: 'Invalid value',
	INVALID_NUMBER: 'Invalid number',
	INVALID_FILTER: 'Invalid filter',
	INVALID_PAGE: 'Invalid page',
	INVALID_LIMIT: 'Invalid limit',
};

const USER_DYNAMIC_REQUIRED = {
	USERNAME_LENGTH: 3,
	PASSWORD_LENGTH: 8,
};

const ERROR_CODE = {
	SERVICE_IN_MAINTENANCE: 'ooooo',
	UNKNOWN: '00000',
	SOMETHING_WENT_WRONG: '00001',
	REQUEST_NOT_ACCEPTABLE: '00002',
	USER_ALREADY_EXISTS: '00003',
	PASSWORD_NOT_MATCH: '00006',
	REQUEST_TYPE_INVALID: '00007',
	INVALID_FORMAT: '00010',
	UNAUTHORIZED_ACCESS: '00011',
	ACCESS_DENIED: '00012',
	ALREADY_EXISTS: '00027',
};

const ERROR_NAME = {
	SERVICE_IN_MAINTENANCE: 'SERVICE_IN_MAINTENANCE',
	UNKNOWN: 'UNKNOWN',
	SOMETHING_WENT_WRONG: 'SOMETHING_WENT_WRONG',
	REQUEST_NOT_ACCEPTABLE: 'REQUEST_NOT_ACCEPTABLE',
	USER_ALREADY_EXISTS: 'USER_ALREADY_EXISTS',
	PASSWORD_NOT_MATCH: 'PASSWORD_NOT_MATCH',
	REQUEST_TYPE_INVALID: 'REQUEST_TYPE_INVALID',
	INVALID_FORMAT: 'INVALID_FORMAT',
	UNAUTHORIZED_ACCESS: 'UNAUTHORIZED_ACCESS',
	ACCESS_DENIED: 'ACCESS_DENIED',
	ALREADY_EXISTS: 'ALREADY_EXISTS',
};

const ERROR_DESCRIPTION = {
	SERVICE_IN_MAINTENANCE: ['Service in maintenance'],
	UNKNOWN: [
		'An unknown error occurred while processing the request',
		'An unknown error occurred while processing the request',
	],
	SOMETHING_WENT_WRONG: [
		'An unknown error occurred while processing the request',
		'An unknown error occurred while processing the request',
	],
	REQUEST_NOT_ACCEPTABLE: ['No valid authorization found', 'An OTP verification is incomplete', 'An OTP expired'],
	USER_ALREADY_EXISTS: ['User is already exists with email or phone'],
	NOT_ACCCETABLE_KYC_COMPLETE: ['KYC completed not allow to update profile details'],
	PASSWORD_NOT_MATCH: ['Password not match, or account not exists'],
	REQUEST_TYPE_INVALID: ['Request type is invalid'],
	INVALID_FORMAT: [`Entered format invalid`],
	UNAUTHORIZED_ACCESS: [`User doesn't exists or credentials are invalid`],
	ACCESS_DENIED: ['Access Denied. Please complete necessary prerequisites before accessing'],
	ALREADY_EXISTS: ['Already Exists'],
};
export const ERROR_MSG = {
	SERVICE_IN_MAINTENANCE:
		'We value your time! Our team is actively working and will be back shortly. Please check back later 😊',
	UNKNOWN: 'Unkonwn error found',
	SOMETHING_WENT_WRONG: 'Hiccup! Servers tangled up. Fixing now. Check back soon',
	REQUEST_NOT_ACCEPTABLE: 'Please verify or try with valid authorization',
	USER_ALREADY_EXISTS: 'User already exists',
	UNPROCESSABLE_ENTITY: 'Invalid entity',
	DEPENDENT_API_ERROR: `Uh-oh! A small hitch with a dependent platform. We're on it! Thanks for bearing with us`,
	EMPTY_VALUE: 'Empty value',
	REQUIRED_VALUE: 'Required value',
	SHOULD_BE_STRING: 'Value should be string',
	SHOULD_BE_NUMBER: 'Value should be in number',
	SHOULD_BE_BOOLEAN: 'Value should be in boolean',
	SHOULD_BE_ALPHABET: 'Value should be alphanets only',
	SHOULD_BE_ALPHA_NUMERIC: 'Value should be alpha-numeric',
	INVALID_AUTH_TOKEN: 'Invalid auth token',
	INVALID_AUTH_CODE: 'Invalid auth code',
	PERMISSION_DENIED: 'Permission denied',
	NOT_FOUND: 'Not found',
	INVALID_ROUTE_REQUEST: 'This route is not supported',
	MAX_API_LIMIT_RECHED: 'You reached to max request limit. Please try after sometime',
	INVALID_VALUE: 'Invalid value',
	INVALID_NUMBER: 'Invalid number',
	//--------------------------------------------------------------
	PHONE_EXISTS: 'Phone already exists',
	UNAUTHORIZED_USER_ACCESS: `Username or password your are trying doesn't match`,
	INVALID_OTP: 'OTP is invalid or expired',
	INVALID_EMAIL: 'Invalid email',
	INVALID_PHONE: 'Invalid phone',
	USERNAME_LENGTH: `Username should have at least ${USER_DYNAMIC_REQUIRED.USERNAME_LENGTH} characters`,
	PASSWORD_LENGTH: `Password should have at least ${USER_DYNAMIC_REQUIRED.PASSWORD_LENGTH} characters`,
	NOT_ACCEPTABLE: 'Request not accpetable please contact on support',
	INVALID_PID: 'Invalid PID',
	PASSWORD_NOT_MATCHED: 'Invalid password',
	OLD_PASSWORD_NOT_MATCHED: 'Invalid old password',
	ALREADY_EXISTS: 'Already Exits',
	PASSWORD_NOT_MATCH: 'Password not match, or account not exists',
	REQUEST_TYPE_INVALID: 'Request type is invalid',
	INVALID_FORMAT: `Entered format invalid`,
	UNAUTHORIZED_ACCESS: `User doesn't exists or credentials are invalid`,
	ACCESS_DENIED: 'Access Denied. Please complete necessary prerequisites before accessing',

	//--------------------------------------------------------------
};

const COMMON_ERROR = {
	UNKNOWN: {
		CODE: ERROR_CODE.UNKNOWN,
		ERROR: ERROR_NAME.UNKNOWN,
		MESSAGE: ERROR_MSG.UNKNOWN,
		DESCRIPTION: ERROR_DESCRIPTION.UNKNOWN,
	},
	SOMETHING_WENT_WRONG: {
		CODE: ERROR_CODE.SOMETHING_WENT_WRONG,
		ERROR: ERROR_NAME.SOMETHING_WENT_WRONG,
		MESSAGE: ERROR_MSG.SOMETHING_WENT_WRONG,
		DESCRIPTION: ERROR_DESCRIPTION.SOMETHING_WENT_WRONG,
	},
	REQUEST_NOT_ACCEPTABLE: {
		CODE: ERROR_CODE.REQUEST_NOT_ACCEPTABLE,
		ERROR: ERROR_NAME.REQUEST_NOT_ACCEPTABLE,
		MESSAGE: ERROR_MSG.REQUEST_NOT_ACCEPTABLE,
		DESCRIPTION: ERROR_DESCRIPTION.REQUEST_NOT_ACCEPTABLE,
	},
	PASSWORD_NOT_MATCH: {
		CODE: ERROR_CODE.PASSWORD_NOT_MATCH,
		ERROR: ERROR_NAME.PASSWORD_NOT_MATCH,
		MESSAGE: ERROR_MSG.PASSWORD_NOT_MATCH,
		DESCRIPTION: ERROR_DESCRIPTION.PASSWORD_NOT_MATCH,
	},
	REQUEST_TYPE_INVALID: {
		CODE: ERROR_CODE.REQUEST_TYPE_INVALID,
		ERROR: ERROR_NAME.REQUEST_TYPE_INVALID,
		MESSAGE: ERROR_MSG.REQUEST_TYPE_INVALID,
		DESCRIPTION: ERROR_DESCRIPTION.REQUEST_TYPE_INVALID,
	},
	UNAUTHORIZED_ACCESS: {
		CODE: ERROR_CODE.UNAUTHORIZED_ACCESS,
		ERROR: ERROR_NAME.UNAUTHORIZED_ACCESS,
		MESSAGE: ERROR_MSG.UNAUTHORIZED_ACCESS,
		DESCRIPTION: ERROR_DESCRIPTION.UNAUTHORIZED_ACCESS,
	},
	ACCESS_DENIED: {
		CODE: ERROR_CODE.ACCESS_DENIED,
		ERROR: ERROR_NAME.ACCESS_DENIED,
		MESSAGE: ERROR_MSG.ACCESS_DENIED,
		DESCRIPTION: ERROR_DESCRIPTION.ACCESS_DENIED,
	},
	SERVICE_IN_MAINTENANCE: {
		CODE: ERROR_CODE.SERVICE_IN_MAINTENANCE,
		ERROR: ERROR_NAME.SERVICE_IN_MAINTENANCE,
		MESSAGE: ERROR_MSG.SERVICE_IN_MAINTENANCE,
		DESCRIPTION: ERROR_DESCRIPTION.SERVICE_IN_MAINTENANCE,
	},
};

const USER_ERROR = {
	USER_ALREADY_EXISTS: {
		CODE: ERROR_CODE.USER_ALREADY_EXISTS,
		ERROR: ERROR_NAME.USER_ALREADY_EXISTS,
		MESSAGE: ERROR_MSG.USER_ALREADY_EXISTS,
		DESCRIPTION: ERROR_DESCRIPTION.USER_ALREADY_EXISTS,
	},
	INVALID_FORMAT: {
		CODE: ERROR_CODE.INVALID_FORMAT,
		ERROR: ERROR_NAME.INVALID_FORMAT,
		MESSAGE: ERROR_MSG.INVALID_FORMAT,
		DESCRIPTION: ERROR_DESCRIPTION.INVALID_FORMAT,
	},
	ALREADY_EXISTS: {
		CODE: ERROR_CODE.ALREADY_EXISTS,
		ERROR: ERROR_NAME.ALREADY_EXISTS,
		MESSAGE: ERROR_MSG.ALREADY_EXISTS,
		DESCRIPTION: ERROR_DESCRIPTION.ALREADY_EXISTS,
	},
};

export const ERROR = {
	...COMMON_ERROR,
	...USER_ERROR,
};

// ==================================================================
const COMMON_RESPONSE_MSG = {
	FOUND: 'Found',
	NOT_FOUND: 'Not found',
	UPDATED_SUCCESSFULLY: 'Updated successfully',
	UNAUTHORIZED_ACCESS: 'Unauthroized access',
	SOMETHING_WENT_WRONG: `Hiccup! Servers tangled up. Fixing now. Check back soon`,
	FILE_FORMAT_NOT_SUPPORTED: 'File format not supported',
	LIMIT_UNEXPECTED_FILE: 'Unexpected file type',
	LIMIT_FILE_SIZE: 'File size limit exceed',
	UNPROCESSABLE_ENTITY: 'Invalid entity',
	UNSUPPORTED_MEDIA: 'Unsupported media file',
	AWS_UPLOAD_ERROR: 'Error occurred while trying to upload to S3 bucket',
	DEPENDENT_API_ERROR: `Uh-oh! A small hitch with a dependent platform. We're on it! Thanks for bearing with us`,
	EMPTY_VALUE: 'Empty value',
	REQUIRED_VALUE: 'Required value',
	SHOULD_BE_STRING: 'Value should be string',
	SHOULD_BE_NUMBER: 'Value should be in number',
	SHOULD_BE_BOOLEAN: 'Value should be in boolean',
	SHOULD_BE_ALPHABET: 'Value should be alphanets only',
	SHOULD_BE_ALPHA_NUMERIC: 'Value should be alpha-numeric',
	INVALID_AUTH_TOKEN: 'Invalid auth token',
	INVALID_AUTH_CODE: 'Invalid auth code',
	PERMISSION_DENIED: 'Permission denied',
	ACCESS_DENIED: 'Access Denied. Please complete necessary prerequisites before accessing',
	INVALID_ROUTE_REQUEST: 'This route is not supported',
	MAX_API_LIMIT_RECHED: 'You reached to max request limit. Please try after sometime',
	INVALID_VALUE: 'Invalid value',
	INVALID_NUMBER: 'Invalid number',
	INVALID_UPLOAD_TYPE: 'Invalid upload file',
	FILE_UPLOADED_SUCCESS: 'File upload successfully',
	SERVICE_IN_MAINTENANCE: 'Maintenance Mode :-)',
};

const USER_RESPONSE_MSG = {
	LOGIN_SUCCESS: 'Login success',
	SIGNUP_SUCCESS: 'Account created successfully',
	FIELDS_FETCH: 'Fields fetched success',
	UPDATE_SUCCESS: 'Updated success',
	OTP_SENT_ON_PHONE: 'OTP sent on your phone',
	PASSWORD_CHANGE: 'Password changed success',
	DASHBOARD: 'Dashboard load success',
	ACCOUNT_INFO: 'Acount Info load success',
	LOGOUT: 'Logout success',
	ACCOUNT_ALREADY_EXISTS: 'This account already exists, please login',
	OTP_ALREADY_SENT: 'OTP already sent',
	INVALID_OTP: 'Invalid OTP, please enter correct One Time Password',
	USER_NOT_FOUND: 'User not found',
};

const SEED_RESPONSE_MSG = {
	LIST_OF_SEEDER_PORT_MODULE_NAMES: 'List of seeder port module names',
	PLEASE_ENTER_CORRECT_MODULE: 'Please enter correct module name in params',
	SEED_SUCCESS: 'SEED SUCCESS',
};

const ADMIN_RESPONSE_MSG = {
	LOGIN_SUCCESS: 'Login success',
	SIGNUP_SUCCESS: 'User account created success',
	FIELDS_FETCH: 'Fields fetched success',
	CREATED_SUCCESS: 'Created success',
	UPDATE_SUCCESS: 'Updated success',
	DELETE_SUCCESS: 'Deleted success',
	OTP_SENT_ON_PHONE: 'OTP sent on your phone',
	OTP_ALREADY_SENT: 'OTP already sent',
	INVALID_OTP: 'Invalid OTP, please enter correct One Time Password',
};

const SETURA_RESPONSE_MSG = {};
const COMMUNICATION_RESPONSE_MSG = {};
const CONFIG_RESPONSE_MSG = {};

export const RESPONSE_MSG = {
	COMMON: COMMON_RESPONSE_MSG,
	USER: USER_RESPONSE_MSG,
	SEED: SEED_RESPONSE_MSG,
	ADMIN: ADMIN_RESPONSE_MSG,
	SETURA: SETURA_RESPONSE_MSG,
	COMMUNICATION: COMMUNICATION_RESPONSE_MSG,
	CONFIG: CONFIG_RESPONSE_MSG,
};

// exporting to show users
export const ERROR_LIST = {
	...COMMON_ERROR,
};
