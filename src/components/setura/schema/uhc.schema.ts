import { AggregatePaginateModel, model, Schema, Document, Types } from 'mongoose';
import mongooseAggregatePaginate = require('mongoose-aggregate-paginate-v2');
import { Config } from '../../../config';
import { VACCINE_NAME } from '../setura.token';

interface IUhcDocument extends Document {
	name: string;
	pincode: string;
	address: string;
	city: string;
	state: string;
	vaccine: string;
	isActive: boolean;
	slotDuration: number; // in minute
	slotMaxAppointment: number; // max appointmnet during slot duration
	openTime: string; // appointment slot open
	closeTime: string; // appointment slot close
}

export interface IUhc extends IUhcDocument {
	_id: string | Types.ObjectId;
}

const uhcSchema: Schema = new Schema<IUhcDocument>(
	{
		name: { type: String, required: true },
		pincode: { type: String, required: true },
		address: { type: String, required: true },
		city: { type: String, required: true },
		state: { type: String, required: true },
		vaccine: { type: String, enum: VACCINE_NAME, default: VACCINE_NAME.COVISHEILD },
		isActive: { type: Boolean, default: true },
		slotDuration: { type: Number, default: Config.uhcDefault.slotDuration },
		slotMaxAppointment: { type: Number, default: Config.uhcDefault.slotMaxAppointment },
		openTime: { type: String, default: Config.uhcDefault.openTime }, // uhc open time
		closeTime: { type: String, default: Config.uhcDefault.closeTime }, // uhc close time
	},
	{ timestamps: true, versionKey: false },
);

uhcSchema.plugin(mongooseAggregatePaginate);
uhcSchema.index({ pincode: 1, city: 1, state: 1 });
const Uhc = model<IUhcDocument, AggregatePaginateModel<IUhcDocument>>('Uhc', uhcSchema);
export type TIUhcOrNull = IUhc | null | undefined;

export default Uhc;
