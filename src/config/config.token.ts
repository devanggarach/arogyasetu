const APP_CONFIG_TYPE_DEFINITION = {
	appLink: 'string',
	releaseNote: 'string',
	version: 'number',
	isSkippable: 'boolean',
};

export const CONFIG_TYPE_DEFINITION = {
	key: 'string',
	logo: 'string',
	color: 'any',
	apiVersion: 'string',
	androidApp: APP_CONFIG_TYPE_DEFINITION,
	iosApp: APP_CONFIG_TYPE_DEFINITION,
	inMaintenance: 'boolean',
	maintenanceNote: 'string',
	meta: 'any',
};

export const CONFIG_COUNTRY_TYPE_DEFINITION = {
	name: 'string',
	code: 'string',
	unicode: 'string',
	emoji: 'string',
	phoneCode: 'string',
	flagUrl: 'string',
};

type NumericKeyWithValueString = {
	[key: number]: string;
};

export const PID_VALUE = {
	DEMO: 0,
	SIGNUP: 1,
	FORGOT_PASSWORD: 2,
	UPDATE: 2,
	LOGIN: 3,
	CHANGE_PASSWORD: 4,
	SIGNUP_SUCCESS: 5,
	PASSWORD_CHANGED: 6,
	UPDATE_NEW: 7,

	ADMIN_FORGOT_PASSWORD: 102,
	ADMIN_LOGIN: 103,
	ADMIN_CHANGE_PASSWORD: 104,
};

export const PID_TYPE: NumericKeyWithValueString = {
	[PID_VALUE.DEMO]: 'demo',
	[PID_VALUE.SIGNUP]: 'signup',
	[PID_VALUE.FORGOT_PASSWORD]: 'forgot_password',
	[PID_VALUE.UPDATE]: 'update',
	[PID_VALUE.LOGIN]: 'login',
	[PID_VALUE.CHANGE_PASSWORD]: 'change_password',
	[PID_VALUE.PASSWORD_CHANGED]: 'password_changed',
	[PID_VALUE.SIGNUP_SUCCESS]: 'signup_success',
	[PID_VALUE.UPDATE_NEW]: 'update_new',

	[PID_VALUE.ADMIN_FORGOT_PASSWORD]: 'admin_forgot_password',
	[PID_VALUE.ADMIN_LOGIN]: 'admin_login',
	[PID_VALUE.ADMIN_CHANGE_PASSWORD]: 'admin_change_password',
};

export const COMMUNICATION_TYPE = {
	SMS: 'sms',
};

export enum COMMUNICATION_STATUS {
	QUEUED = 'queued',
	SENDING = 'sending',
	SENT = 'sent',
	FAILED = 'failed',
	DELIVERED = 'delivered',
	PARTIALLY_DELIVERED = 'partially_delivered',
	UNDELIVERED = 'undelivered',
	RECEIVING = 'receiving',
	RECEIVED = 'received',
	ACCEPTED = 'accepted',
	READ = 'read',
	PENDING = 'pending',
	CANCELED = 'canceled',
}
