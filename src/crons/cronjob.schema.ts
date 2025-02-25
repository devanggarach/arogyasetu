import { Document, Model, model, Schema } from 'mongoose';
import { CRON_NAMES_ARR, CRON_STATUS_ARR, CRON_STATUS } from './cronjob.token';

export interface ICronJob extends ICronJobDocument {
	_id: string;
}

export interface ICronJobModel extends Model<ICronJob> {}

export interface ICronJobDocument extends Document {
	name: string;
	executionTime: Date;
	status: string;
	error: any;
}

export const cronJobSchema: Schema = new Schema(
	{
		name: { type: Schema.Types.String, enum: CRON_NAMES_ARR, default: null },
		executionTime: { type: Date, default: null },
		status: { type: Schema.Types.String, enum: CRON_STATUS_ARR, default: CRON_STATUS.START },
		error: { type: Schema.Types.Mixed, default: null },
	},
	{ timestamps: true, versionKey: false },
);

cronJobSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 });
export type TICronJobOrNull = ICronJob | null | undefined;
export const CronJob: ICronJobModel = model<ICronJob, ICronJobModel>('CronJob', cronJobSchema);
export default CronJob;
