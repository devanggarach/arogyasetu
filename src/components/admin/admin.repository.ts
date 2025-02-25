import { ModifyResult, Types } from 'mongoose';
import Admin, { PaginatedAdminResult, TIAdminOrNull } from './admin.schema';
import { ERROR_CODE } from './admin.error';
import { logger } from '../../services/logger';
import { ServiceResponse } from '../../helpers/serviceResponse.helper';

export class AdminRepository {
	static readonly serviceResponse = new ServiceResponse();
	static readonly getAdminById = async ({
		_id,
		projection,
	}: {
		_id: string | Types.ObjectId;
		projection?: Record<string, any>;
	}): Promise<TIAdminOrNull> => {
		try {
			return await Admin.findById(_id, projection);
		} catch (error) {
			throw this.serviceResponse.databaseError({
				errorCode: ERROR_CODE.GET_USER_DB,
				message: ERROR_CODE.GET_USER_DB,
				meta: error,
			});
		}
	};

	static readonly findById = async (
		id: Types.ObjectId | string,
		projection?: Record<string, any>,
	): Promise<TIAdminOrNull> => {
		try {
			return await Admin.findById(id, projection).lean().exec();
		} catch (error) {
			throw this.serviceResponse.databaseError({
				errorCode: ERROR_CODE.GET_USER_DB,
				message: ERROR_CODE.GET_USER_DB,
				meta: error,
			});
		}
	};

	static readonly findOne = async (filter: any, projection?: Record<string, any>): Promise<TIAdminOrNull> => {
		try {
			return await Admin.findOne(filter, projection).lean().exec();
		} catch (error) {
			throw this.serviceResponse.databaseError({
				errorCode: ERROR_CODE.GET_USER_DB,
				message: ERROR_CODE.GET_USER_DB,
				meta: error,
			});
		}
	};

	static readonly createUser = async (query: any): Promise<TIAdminOrNull> => {
		try {
			let userObject: TIAdminOrNull = await Admin.create(query);
			userObject = userObject?.toObject();
			return userObject;
		} catch (error) {
			throw this.serviceResponse.databaseError({
				errorCode: 'UNHANDLED_DB_ERROR',
				message: ERROR_CODE.GET_USER_DB,
				meta: error,
			});
		}
	};

	static readonly updateUser = async (filter: any, query: any, options: any = {}): Promise<TIAdminOrNull> => {
		try {
			let userObject: TIAdminOrNull = await Admin.findOneAndUpdate(filter, query, { returnDocument: 'after' });
			userObject = userObject?.toObject();
			return userObject;
		} catch (error) {
			throw this.serviceResponse.databaseError({
				errorCode: 'UNHANDLED_DB_ERROR',
				message: ERROR_CODE.GET_USER_DB,
				meta: error,
			});
		}
	};

	static readonly upsertUser = async (filter: any, query: any, options: any = {}): Promise<TIAdminOrNull> => {
		try {
			const result: ModifyResult<TIAdminOrNull> = await Admin.findOneAndUpdate(filter, query, {
				...options,
				upsert: true,
				returnDocument: 'after',
				lean: true,
			});
			const userObject: TIAdminOrNull = result ? (result as any).toObject() : null;
			// logger.info(userObject, 'userObj');
			return userObject;
		} catch (error) {
			throw this.serviceResponse.databaseError({
				errorCode: 'UNHANDLED_DB_ERROR',
				message: ERROR_CODE.GET_USER_DB,
				meta: error,
			});
		}
	};

	static readonly paginate = async (filter: any, options: any): Promise<PaginatedAdminResult> => {
		try {
			let userObjects: PaginatedAdminResult = await Admin.paginate(filter, options);
			return userObjects;
		} catch (error) {
			throw this.serviceResponse.databaseError({
				errorCode: 'UNHANDLED_DB_ERROR',
				message: ERROR_CODE.GET_USER_DB,
				meta: error,
			});
		}
	};
}
