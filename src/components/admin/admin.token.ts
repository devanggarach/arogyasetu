export enum SESSION_TYPE {
	LOGIN = 'login',
	LOGIN2FA = 'login2fa',
	SIGNUP = 'signup',
	ATTEMPT = 'attempt',
}

export const REFERRAL_ADMIN_USER_TYPE_DEFINITION = {
	_id: 'objectId',
	username: 'string',
	name: {
		first: 'string',
		middle: 'string',
		last: 'string',
	},
	profileImage: 'image',
};

export const ADMIN_USER_TYPE_DEFINITION = {
	_id: 'objectId',
	id: 'string',
	email: {
		id: 'string',
		isVerified: 'boolean',
	},
	username: 'string',
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
	is2faEnabled: 'time',
	default2fa: 'string',
	role: 'string',
};

export const ADMIN_USER_RESPONSE_MSG = {
	LOGIN_SUCCESS: 'Login success',
	SIGNUP_SUCCESS: 'User account created success',
	FIELDS_FETCH: 'Fields fetched success',
	CREATED_SUCCESS: 'Created success',
	UPDATE_SUCCESS: 'Updated success',
	DELETE_SUCCESS: 'Deleted success',
	OTP_SENT_ON_EMAIL: 'OTP sent on your email',
	FOUND: 'found',
	NOT_FOUND: 'not found',
	OTP_ALREADY_SENT: 'OTP already sent',
	INVALID_OTP: 'Invalid OTP, please enter correct One Time Password',
};

export const PERMISSION_MODULE = {
	DASHBOARD: 'dashboard',
	USER: 'user',
};

export const PERMISSION_TYPES = {
	EDIT: 'edit',
	VIEW: 'view',
	ALL: 'all',
};

export const ADMIN_DASHBOARD_TYPE_DEFINATION = {
	totalUsers: 'string',
	vaccineStats: 'any',
	partiallyVaccinated: 'string',
	fullyVaccinated: 'string',
	notVaccinated: 'string',
	usersByAge: 'any',
	uhcStats: 'any',
};

const ADMIN_USER_ACCOUNT_INFO_AUTH_TYPE_DEFINITION = {
	id: 'string',
	isEligible: 'boolean',
	status: 'boolean',
	updatedAt: 'time',
};

export const ADMIN_USER_ACCOUNT_INFO_TYPE_DEFINITION = {
	_id: 'objectId',
	id: 'string',
	email: {
		id: 'string',
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
		phone: ADMIN_USER_ACCOUNT_INFO_AUTH_TYPE_DEFINITION,
		pw: ADMIN_USER_ACCOUNT_INFO_AUTH_TYPE_DEFINITION,
	},
	isBlocked: 'boolean',
};
