import { Document, Model, model, Schema } from 'mongoose';

interface IAppFields {
	link: string;
	releaseNote: string;
	version: number;
	isSkippable: boolean;
}

export interface IConfig extends IConfigDocument {
	_id: string;
}

export interface IConfigModel extends Model<IConfig> {}

export interface IConfigDocument extends Document {
	key: string;
	apiVersion: string;
	color: any;
	androidApp: IAppFields;
	iosApp: IAppFields;
	inMaintenance: boolean;
	maintenanceNote: string;
}

export const configSchema: Schema = new Schema(
	{
		key: { type: Schema.Types.String, default: '' },
		inMaintenance: { type: Schema.Types.Boolean, default: false },
		maintenanceNote: { type: Schema.Types.String, default: '' },
	},
	{ timestamps: true, versionKey: false },
);

export const Config: IConfigModel = model<IConfig, IConfigModel>('Config', configSchema);
export type TIConfigOrNull = IConfig | null | undefined;
export default Config;
