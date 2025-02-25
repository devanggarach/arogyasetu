import cron from 'node-cron';
import { logger } from '../services/logger';
import { Config } from '../config';
import { SCHEDULE_TIME } from './cronjob.token';
import { SeturaService } from './setura.service';

export const scheduleTimes = {
	[SCHEDULE_TIME.DAILY]: '0 2 * * *',
	[SCHEDULE_TIME.EVERY_HOUR]: '59 * * * *',
	[SCHEDULE_TIME.EVERY_1_MINUTES]: '*/1 * * * *',
};

export class CronJobConfig {
	private runTime: string;
	private runAt: SCHEDULE_TIME;
	private runCount: number;

	constructor(runAt: SCHEDULE_TIME) {
		this.runTime = scheduleTimes[runAt];
		this.runAt = runAt;
		this.runCount = 0;
	}

	private async daily() {
		// 24hr
		logger.info('DAILY CRON START');
		if (Config.server.appMode === 'production') {
		}
		logger.info('DAILY CRON END');
	}

	private async every60() {
		// 1hr
		logger.info('EVERY_HOUR CRON START');
		logger.info('EVERY_HOUR CRON END');
	}

	private async every1() {
		// 1 min
		logger.info('EVERY_1_MINUTES CRON START');
		SeturaService.createSlots();
		logger.info('EVERY_1_MINUTES CRON END');
	}

	public run() {
		cron.schedule(this.runTime, () => {
			// logger.info(`CRONJOB - check run ${this.runAt} (${++this.runCount})`);
			this[this.runAt]?.call(this);
		});
	}
}
