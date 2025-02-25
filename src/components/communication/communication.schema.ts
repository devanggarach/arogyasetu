import { Document, Model, model, Schema } from 'mongoose';
import { COMMUNICATION_STATUS, COMMUNICATION_TYPE } from '../../config/config.token';

export interface ICommunication extends ICommunicationDocument {
	_id: string;
}

export interface ICommunicationModel extends Model<ICommunication> {}

export interface ICommunicationDocument extends Document {
	userId: string;
	contentType: string;
	to: [string];
	from: string;
	status: number;
	type: string;
	emailContent?: {
		subject: string;
		content: string;
	};
	smsContent?: {
		content: string;
	};
	actionId: string;
}

export const communicationSchema: Schema = new Schema(
	{
		userId: { type: Schema.Types.ObjectId, default: null },
		contentType: { type: Schema.Types.String, required: true },
		to: [Schema.Types.Mixed],
		from: Schema.Types.String,
		status: { type: Schema.Types.String, enum: COMMUNICATION_STATUS, default: COMMUNICATION_STATUS.PENDING },
		type: { type: Schema.Types.String, enum: COMMUNICATION_TYPE, default: COMMUNICATION_TYPE.SMS },
		smsContent: {
			content: { type: Schema.Types.String },
		},
		actionId: { type: Schema.Types.String, default: null },
	},
	{ timestamps: true, versionKey: false },
);

communicationSchema.index({ userId: 1, to: 1, status: 1 });
export type TICommunicationOrNull = ICommunication | null | undefined;
export const Communication: ICommunicationModel = model<ICommunication, ICommunicationModel>(
	'Communication',
	communicationSchema,
);
export default Communication;
