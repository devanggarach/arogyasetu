import { v4 as uuidv4 } from 'uuid';
import { Document, model, Schema, PaginateModel, PaginateResult } from 'mongoose';
import { SESSION_TYPE } from './user.token';
import paginate from 'mongoose-paginate-v2';
import { SETURA_VACCIANTED_STATUS } from '../../components/setura/setura.token';

interface IName {
	first: string;
	middle?: string;
	last: string;
}

interface IOtpProp {
	value: string;
	timestamp: Date;
}

export interface IOtp {
	email?: IOtpProp;
	phone?: IOtpProp;
}

interface IPhone {
	code: string;
	cellNo: string;
	isVerified: boolean;
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

const defaultAuthTypeObj = {
	id: null,
	isEligible: false,
	status: false,
	updatedAt: null,
};

export type AuthType = 'phone' | 'pw';

const defaultAuthType = {
	phone: { ...defaultAuthTypeObj, isEligible: true },
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

export interface INotificationToken {
	deviceId: string;
	fcmToken: string;
	createdAt: Date;
	updatedAt: Date;
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

export interface IUserDocument extends Document {
	id: string;
	name: IName;
	age: number;
	pincode: string;
	aadharNo: string;
	phone: IPhone;
	session: ISessionUserAgent[];
	isArchived: boolean;
	default2fa: string;
	authType: IAuthType;
	notificationToken: INotificationToken[];
	authSession: IAuthSession[];
	timezone: string;
	isBlocked: boolean;
	isRestricted: boolean;
	adminActionBy?: Schema.Types.ObjectId;
	navigate?: string;
	password: string;
}

export interface IUser extends IUserDocument {
	_id: string;
}

export interface IUserModel extends PaginateModel<IUser> {}

export const userSchema: Schema = new Schema(
	{
		id: {
			type: Schema.Types.String,
			default: function () {
				return uuidv4();
			},
			unique: true,
		}, // for now id is uuid, which we have to change to hide mongodId, still we require other stragtegies which make proper indexing
		name: {
			first: { type: Schema.Types.String, default: null },
			middle: { type: Schema.Types.String, default: null },
			last: { type: Schema.Types.String, default: null },
		},
		age: {
			type: Schema.Types.Number,
		},
		pincode: {
			type: Schema.Types.String,
		},
		aadharNo: {
			type: Schema.Types.String,
		},
		phone: {
			code: { type: Schema.Types.String, default: null },
			cellNo: { type: Schema.Types.String, default: null },
			isVerified: { type: Schema.Types.Boolean, default: false },
		}, // we can enable and disable phone verification process from env variable, for cost effective of SMS charge we had disabled phone(we use twilio service)
		password: { type: Schema.Types.String, default: null },
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
		], // users login, signup and attempts are logged here
		isArchived: { type: Schema.Types.Boolean, default: false }, // on delete or deactivate of acccount it will become true, logic of deactivate is not present on login create and social login, we update in future
		authType: { type: Schema.Types.Mixed, default: defaultAuthType }, // we are mananging authtyp
		notificationToken: [
			{
				deviceId: { type: Schema.Types.String, default: null },
				fcmToken: { type: Schema.Types.String, default: null },
				createdAt: { type: Schema.Types.Date, default: null },
				updatedAt: { type: Schema.Types.Date, default: null },
			},
		], // we will manage fcm notification tokens here
		authSession: [
			{
				token: { type: Schema.Types.String },
				device: { type: Schema.Types.String },
				client: { type: Schema.Types.String },
				ip: { type: Schema.Types.String },
				lastActiveAt: { type: Schema.Types.Date },
				createdAt: { type: Schema.Types.Date },
			},
		], // user session will be stored here
		isRestricted: { type: Schema.Types.Boolean, default: false }, // user can login , not able in such module
		isBlocked: { type: Schema.Types.Boolean, default: false }, // not able to login
		timezone: { type: Schema.Types.String, default: 'Asia/Kolkata' },
		adminActionBy: { type: Schema.Types.ObjectId, ref: 'Admin', default: null }, // last admin action by
		vaccinationStatus: { type: Schema.Types.Number, enum: SETURA_VACCIANTED_STATUS, default: 0 },
		vaccine: { type: Schema.Types.String, default: null },
	},
	{ timestamps: true, versionKey: false },
);

userSchema.plugin(paginate);

userSchema.index({ createdAt: -1 }, { background: true });

export const User: IUserModel = model<IUser, IUserModel>('User', userSchema);
export type TIUserOrNull = IUser | null | undefined;
export type PaginatedUserResult = PaginateResult<IUser>;
export default User;
