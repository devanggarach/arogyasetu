import { Document, model, Schema, PaginateModel, PaginateResult } from 'mongoose';
import { SESSION_TYPE } from './admin.token';
import { ROLE_NAME } from './../../helpers/common.token';
import paginate from 'mongoose-paginate-v2';

interface IEmail {
	id: string;
	isVerified: boolean;
}

interface IPhone {
	code: string;
	cellNo: string;
	isVerified: boolean;
}

interface IName {
	first: string;
	middle?: string;
	last: string;
}
export interface IUserAgent {
	version: string;
	os: string;
	source: string;
	geoIp: any;
	device: string;
	browser: string;
}

export interface ISession {
	time: Date;
	ip: string;
	client: string;
	type: string;
}
export type ISessionUserAgent = ISession & IUserAgent;

interface IPermissionTypes {
	view: boolean;
	edit: boolean;
	all: boolean;
}

const defaultAuthTypeObj = {
	id: null,
	isEligible: false,
	status: false,
	updatedAt: null,
};

export type AuthType = 'phone' | 'pw';

const defaultAuthType = {
	phone: defaultAuthTypeObj,
	pw: defaultAuthTypeObj,
};

interface IDefaultAuthTypeObj {
	id: any;
	isEligible: boolean;
	status: boolean;
	updatedAt: Date;
}

export interface IAuthType {
	phone?: IDefaultAuthTypeObj;
	pw?: IDefaultAuthTypeObj;
	// Other 2FA types can be added similarly
}

export interface IAuthSession {
	token: string;
	device: string;
	client: string;
	lastActiveAt: Date;
	createdAt: Date;
	ip: string;
}
export type ISessionQueryType =
	| {
			$push: {
				session: { $each: ISessionUserAgent[]; $slice: number };
				authSession: { $each: IAuthSession[]; $slice: number };
			};
	  }
	| { $push: { session: { $each: ISessionUserAgent[]; $slice: number } } };

export interface IAdminDocument extends Document {
	email: IEmail;
	phone: IPhone;
	name: IName;
	profileImage: string;
	session: ISessionUserAgent[];
	isArchived: boolean;
	authType: IAuthType;
	role: string;
	authSession: IAuthSession[];
	isBlocked: boolean;
	password: string;
	navigate?: string;
}

export interface IAdmin extends IAdminDocument {
	_id: string;
}

export interface IAdminModel extends PaginateModel<IAdmin> {}

export const adminSchema: Schema = new Schema(
	{
		email: {
			id: { type: Schema.Types.String, default: null },
			isVerified: { type: Schema.Types.Boolean, default: false },
		},
		password: { type: Schema.Types.String, default: null },
		name: {
			first: { type: Schema.Types.String, default: null },
			middle: { type: Schema.Types.String, default: null },
			last: { type: Schema.Types.String, default: null },
		},
		session: [
			{
				time: { type: Schema.Types.Date },
				ip: { type: Schema.Types.String },
				client: { type: Schema.Types.String },
				type: { type: Schema.Types.String, enum: SESSION_TYPE, default: SESSION_TYPE.LOGIN },
				version: { type: Schema.Types.String },
				os: { type: Schema.Types.String },
				source: { type: Schema.Types.String },
				geoIp: { type: Schema.Types.Mixed },
				device: { type: Schema.Types.String },
			},
		],
		isArchived: { type: Schema.Types.Boolean, default: false }, // on delete or deactivate of acccount it will become true, logic of deactivate is not present on login create and social login, we update in future
		authType: { type: Schema.Types.Mixed, default: defaultAuthType },
		role: { type: Schema.Types.String, enum: ROLE_NAME, default: ROLE_NAME.REVIEWER },
		authSession: [
			{
				token: { type: Schema.Types.String },
				device: { type: Schema.Types.String },
				client: { type: Schema.Types.String },
				ip: { type: Schema.Types.String },
				lastActiveAt: { type: Schema.Types.Date },
				createdAt: { type: Schema.Types.Date },
			},
		],
		isBlocked: { type: Schema.Types.Boolean, default: false }, // not able to login
	},
	{ timestamps: true, versionKey: false },
);

adminSchema.plugin(paginate);
adminSchema.index({ 'email.id': 1 }, { unique: true });
export const Admin: IAdminModel = model<IAdmin, IAdminModel>('Admin', adminSchema);
export type TIAdminOrNull = IAdmin | null | undefined;
export type PaginatedAdminResult = PaginateResult<IAdmin>;
export default Admin;
