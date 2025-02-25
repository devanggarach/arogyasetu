import mongooseAggregatePaginate = require('mongoose-aggregate-paginate-v2');
import { Document, model, PaginateModel, Schema, Types } from 'mongoose';
import { SETURA_SLOT_STATUS } from '../setura.token';
import { AggregatePaginateModel } from 'mongoose';

export interface ISetura extends ISeturaDocument {
	_id: string;
}

export interface ISeturaModel extends PaginateModel<ISetura> {}

export interface ISeturaDocument extends Document {
	uhcId: Types.ObjectId;
	date: Date;
	slots: {
		time: string;
		patients: {
			userId: Types.ObjectId;
			appointmentId: Types.ObjectId;
			vaccinatedAt: Date | null;
		}[];
		availAppointment: number;
		remainAppointment: number;
		totalVaccinated: number;
		actionBy?: Types.ObjectId | null;
		canceledAt?: Date | null;
		status: number;
	}[];
}

export const seturaSchema: Schema = new Schema(
	{
		uhcId: { type: Schema.Types.ObjectId, ref: 'Uhc', required: true },
		date: { type: Schema.Types.Date, required: true },
		slots: [
			{
				time: { type: Schema.Types.String, required: true },
				patients: [
					{
						userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
						appointmentId: { type: Schema.Types.ObjectId, ref: 'Appointment', required: true },
						vaccinatedAt: { type: Schema.Types.Date, default: null },
					},
				],
				availAppointment: { type: Number, required: true },
				remainAppointment: { type: Number, required: true },
				totalVaccinated: { type: Number, required: true },
				actionBy: { type: Schema.Types.ObjectId, ref: 'Admin', default: null },
				canceledAt: { type: Date, default: null },
				status: {
					type: Number,
					enum: Object.values(SETURA_SLOT_STATUS),
					default: SETURA_SLOT_STATUS.AVAILABLE,
				},
			},
		],
	},
	{ timestamps: true, versionKey: false },
);

seturaSchema.plugin(mongooseAggregatePaginate);
seturaSchema.index({ uhcId: 1, status: 1 });

seturaSchema.pre<ISeturaDocument>('validate', function (next) {
	if (!this.slots) return next();
	const slotTimes = new Set<string>();
	for (const slot of this.slots) {
		if (slotTimes.has(slot.time)) {
			return next(new Error('Duplicate slot time within the same document is not allowed.'));
		}
		slotTimes.add(slot.time);
	}
	next();
});

export type TISeturaOrNull = ISetura | null | undefined;
const Setura = model<ISetura, AggregatePaginateModel<ISeturaDocument>>('Setura', seturaSchema);
export default Setura;
