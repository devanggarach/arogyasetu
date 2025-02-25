import paginate from 'mongoose-paginate-v2';
import { Document, model, PaginateModel, PaginateResult, Schema, Types } from 'mongoose';

export interface IAppointment extends IAppointmentDocument {
	_id: string;
}

export interface IAppointmentModel extends PaginateModel<IAppointment> {}

export interface IAppointmentDocument extends Document {
	aadharNo: string;
	seturaId: Types.ObjectId;
	time: string;
	date: string;
	dose: number;
	actionBy: Date;
	canceledAt: Date;
	vaccinatedAt: Date;
	remark: string;
	userId: Types.ObjectId;
	vaccine: string;
}

export const appointmentSchema: Schema = new Schema(
	{
		aadharNo: { type: Schema.Types.String, ref: 'User', required: true },
		seturaId: { type: Schema.Types.ObjectId, ref: 'Setura', required: true },
		time: { type: Schema.Types.String, ref: 'Setura', required: true },
		date: { type: Schema.Types.Date, ref: 'Setura', required: true },
		dose: { type: Schema.Types.Number, required: true },
		actionBy: { type: Schema.Types.ObjectId, ref: 'Admin', default: null },
		canceledAt: { type: Schema.Types.Date, default: null },
		vaccinatedAt: { type: Schema.Types.Date, default: null },
		remark: { type: Schema.Types.String, default: null },
		userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
		vaccine: { type: Schema.Types.String, default: null },
	},
	{ timestamps: true, versionKey: false },
);

appointmentSchema.plugin(paginate);
appointmentSchema.index({ aadharNo: 1, seturaId: 1 });

export type TIAppointmentOrNull = IAppointment | null | undefined;
export const Appointment: IAppointmentModel = model<IAppointment, IAppointmentModel>('Appointment', appointmentSchema);
export type PaginatedAppointmentResult = PaginateResult<IAppointment>;

export default Appointment;
