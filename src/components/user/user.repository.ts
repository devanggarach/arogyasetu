import { ModifyResult, Types } from 'mongoose';
import User, { PaginatedUserResult, TIUserOrNull } from './user.schema';
import { ERROR_CODE } from './user.error';
import { logger } from '../../services/logger';
import { ServiceResponse } from '../../helpers/serviceResponse.helper';

export class UserRepository {
	static readonly serviceResponse = new ServiceResponse();
	static readonly getUserById = async ({
		_id,
		projection,
	}: {
		_id: string | Types.ObjectId;
		projection?: Record<string, any>;
	}): Promise<TIUserOrNull> => {
		try {
			return await User.findById(_id, projection);
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
	): Promise<TIUserOrNull> => {
		try {
			return await User.findById(id, projection).lean().exec();
		} catch (error) {
			throw this.serviceResponse.databaseError({
				errorCode: ERROR_CODE.GET_USER_DB,
				message: ERROR_CODE.GET_USER_DB,
				meta: error,
			});
		}
	};

	static readonly findOne = async (filter: any, projection?: Record<string, any>): Promise<TIUserOrNull> => {
		try {
			return await User.findOne(filter, projection).lean().exec();
		} catch (error) {
			throw this.serviceResponse.databaseError({
				errorCode: ERROR_CODE.GET_USER_DB,
				message: ERROR_CODE.GET_USER_DB,
				meta: error,
			});
		}
	};

	static readonly createUser = async (query: any): Promise<TIUserOrNull> => {
		try {
			let userObject: TIUserOrNull = await User.create(query);
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

	static readonly updateUser = async (filter: any, query: any, options: any = {}): Promise<TIUserOrNull> => {
		// logger.info({ filter, query, options }, 'checkfilterqueryoptions');
		try {
			const result: ModifyResult<TIUserOrNull> = await User.findOneAndUpdate(filter, query, options);
			const userObject: TIUserOrNull = result ? (result as any).toObject() : null;
			return userObject;
		} catch (error) {
			throw this.serviceResponse.databaseError({
				errorCode: 'UNHANDLED_DB_ERROR',
				message: ERROR_CODE.GET_USER_DB,
				meta: error,
			});
		}
	};

	static readonly upsertUser = async (filter: any, query: any, options: any = {}): Promise<TIUserOrNull> => {
		try {
			const result: ModifyResult<TIUserOrNull> = await User.findOneAndUpdate(filter, query, {
				...options,
				upsert: true,
				returnDocument: 'after',
				lean: true,
			});
			const userObject: TIUserOrNull = result ? (result as any).toObject() : null;
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

	static readonly paginate = async (filter: any, options: any): Promise<PaginatedUserResult> => {
		try {
			let userObjects: PaginatedUserResult = await User.paginate(filter, options);
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
