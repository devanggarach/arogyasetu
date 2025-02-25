import moment from 'moment';
import { logger } from '../services/logger';
import Uhc from '../components/setura/schema/uhc.schema';
import Setura from '../components/setura/schema/setura.schema';
import { SETURA_SLOT_STATUS } from '../components/setura/setura.token';
import CronJob from '../crons/cronjob.schema';
import { CRON_NAMES, CRON_STATUS } from '../crons/cronjob.token';
import { Config } from '../config';

export class SeturaService {
	public static readonly createSlots = async (): Promise<void> => {
		const cronJobEntry = await CronJob.create({
			name: CRON_NAMES.CREATE_SLOTS,
			executionTime: new Date(),
			status: CRON_STATUS.START,
		});

		try {
			const currentTime = moment();
			const upcomingDays = Config.uhcDefault.upcomingSlot;
			const batchSize = 100;

			let page = 0;
			let hasMore = true;

			while (hasMore) {
				const listOfActiveUhc = await Uhc.find({ isActive: true })
					.skip(page * batchSize)
					.limit(batchSize)
					.lean();

				if (listOfActiveUhc.length === 0) {
					hasMore = false;
					break;
				}

				for (const uhc of listOfActiveUhc) {
					for (let i = 0; i < upcomingDays; i++) {
						const targetDate = moment().add(i, 'days').startOf('day');
						const startOfDay = targetDate.clone().toDate();
						const endOfDay = targetDate.clone().endOf('day').toDate();

						const existingSetura = await Setura.findOne({
							uhcId: uhc._id,
							createdAt: { $gte: startOfDay, $lte: endOfDay },
						}).lean();

						if (existingSetura) continue;

						const slots = [];
						let uhcOpeningTime = targetDate.clone().set({
							hour: parseInt(uhc.openTime.split(':')[0], 10),
							minute: parseInt(uhc.openTime.split(':')[1], 10),
							second: 0,
							millisecond: 0,
						});

						let uhcClosingTime = targetDate.clone().set({
							hour: parseInt(uhc.closeTime.split(':')[0], 10),
							minute: parseInt(uhc.closeTime.split(':')[1], 10),
							second: 0,
							millisecond: 0,
						});

						let slotStartTime = i === 0 ? moment.max(currentTime, uhcOpeningTime) : uhcOpeningTime;

						const minutesToNextSlot = uhc.slotDuration - (slotStartTime.minute() % uhc.slotDuration);
						slotStartTime = slotStartTime.clone().add(minutesToNextSlot, 'minutes');

						while (slotStartTime.clone().milliseconds(0).isBefore(uhcClosingTime.clone().milliseconds(0))) {
							const nextTime = moment(slotStartTime).add(uhc.slotDuration, 'minutes');

							if (nextTime.clone().milliseconds(0).isAfter(uhcClosingTime.clone().milliseconds(0))) break;

							const slotTime = `${slotStartTime.format('HH:mm')}-${nextTime.format('HH:mm')}`;

							slots.push({
								time: slotTime,
								patients: [],
								availAppointment: uhc.slotMaxAppointment,
								remainAppointment: uhc.slotMaxAppointment,
								totalVaccinated: 0,
								status: SETURA_SLOT_STATUS.AVAILABLE,
							});

							slotStartTime = nextTime;
						}

						if (slots.length > 0) {
							await Setura.create({
								uhcId: uhc._id,
								date: slotStartTime.startOf('day').toDate(),
								slots: slots,
								createdAt: targetDate.toDate(),
							});
						}
					}
				}

				page++;
			}

			await CronJob.findByIdAndUpdate(cronJobEntry._id, { status: CRON_STATUS.SUCCESS });
		} catch (error: any) {
			logger.error(error, 'Error in createSlots cron job');

			await CronJob.findByIdAndUpdate(cronJobEntry._id, {
				status: CRON_STATUS.FAILED,
				error: error?.message ?? error,
			});
		}
	};
}
