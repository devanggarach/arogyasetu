export enum SCHEDULE_TIME {
	DAILY = 'daily',
	EVERY_1_MINUTES = 'every1',
	EVERY_HOUR = 'every60',
}

export const SCHEDULE_TIME_KEYS: SCHEDULE_TIME[] = Object.values(SCHEDULE_TIME) as SCHEDULE_TIME[];

export const CRON_NAMES = {
	CREATE_SLOTS: 'CREATE_SLOTS',
};

export const CRON_STATUS = {
	START: 'START',
	SUCCESS: 'SUCCESS',
	FAILED: 'FAILED',
	PARTIAL: 'PARTIAL',
	ENTRY: 'ENTRY',
};

export const CRON_NAMES_ARR = Object.values(CRON_NAMES);

export const CRON_STATUS_ARR = Object.values(CRON_STATUS);
