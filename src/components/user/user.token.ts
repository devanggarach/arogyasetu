export enum SESSION_TYPE {
	LOGIN = 'login',
	LOGIN2FA = 'login2fa',
	SIGNUP = 'signup',
	ATTEMPT = 'attempt',
}

export enum CHECK_USER_TYPE {
	SIGNUP = 'signup',
}

export const USER_LOGIN_TYPE_DEFINITION = {
	_id: 'objectId',
	id: 'string',
	phone: {
		code: 'string',
		cellNo: 'string',
		isVerified: 'boolean',
	},
	age: 'string',
	pincode: 'string',
	aadharNo: 'string',
	name: {
		first: 'string',
		middle: 'string',
		last: 'string',
	},
	isBlocked: 'boolean',
	isRestricted: 'boolean',
	timezone: 'string',
};

export const USER_CHECK_DEFINITION = {
	phone: {
		code: 'string',
		cellNo: 'string',
	},
};

export const USER_TYPE_DEFINITION = {
	_id: 'objectId',
	id: 'string',
	phone: {
		code: 'string',
		cellNo: 'string',
		isVerified: 'boolean',
	},
	name: {
		first: 'string',
		middle: 'string',
		last: 'string',
	},
	age: 'number',
	aadharNo: 'string',
	session: [
		{
			time: 'date',
			ip: 'string',
			client: 'string',
			type: 'string',
			version: 'string',
			os: 'string',
			source: 'string',
			device: 'string',
		},
	],
	isArchived: 'boolean', // on delete or deactivate of acccount it will become true
	createdAt: 'time',
	default2fa: 'string',
	isBlocked: 'boolean',
	isRestricted: 'boolean',
	timezone: 'string',
};

export const USER_RESPONSE_MSG = {
	LOGIN_SUCCESS: 'Login success',
	SIGNUP_SUCCESS: 'Account created successfully',
	FIELDS_FETCH: 'Fields fetched success',
	UPDATE_SUCCESS: 'Updated success',
	OTP_SENT_ON_EMAIL: 'OTP sent on your email',
	OTP_SENT_ON_PHONE: 'OTP sent on your phone',
	FOUND: 'found',
	NOT_FOUND: 'not found',
	PASSWORD_CHANGE: 'Password changed success',
	DASHBOARD: 'Dashboard load success',
	DASHBOARD_BALANCE: 'Balance load success',
	ACCOUNT_INFO: 'Acount Info load success',
	LOGOUT: 'Logout success',
	ACCOUNT_ALREADY_EXISTS: 'This account already exists, please login',
	OTP_ALREADY_SENT: 'OTP already sent',
	INVALID_OTP: 'Invalid OTP, please enter correct One Time Password',
};

const USER_ACCOUNT_INFO_AUTH_TYPE_DEFINITION = {
	id: 'string',
	isEligible: 'boolean',
	status: 'boolean',
	updatedAt: 'time',
};

export const USER_ACCOUNT_INFO_TYPE_DEFINITION = {
	_id: 'objectId',
	id: 'string',
	phone: {
		code: 'string',
		cellNo: 'string',
		isVerified: 'boolean',
	},
	name: {
		first: 'string',
		middle: 'string',
		last: 'string',
	},
	session: [
		{
			time: 'time',
			ip: 'string',
			client: 'string',
			type: 'string',
			version: 'string',
			os: 'string',
			source: 'string',
			device: 'string',
		},
	],
	isArchived: 'boolean', // on delete or deactivate of acccount it will become true
	createdAt: 'time',
	authType: {
		phone: USER_ACCOUNT_INFO_AUTH_TYPE_DEFINITION,
		pw: USER_ACCOUNT_INFO_AUTH_TYPE_DEFINITION,
	},
	isBlocked: 'boolean',
	isRestricted: 'boolean',
	timezone: 'string',
};
