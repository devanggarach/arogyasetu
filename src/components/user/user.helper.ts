import moment from 'moment';
import { v4 as uuidv4 } from 'uuid';
import { AuthHelper } from '../../helpers/auth.helper';
import { ERROR, ERROR_MSG, RESPONSE_MSG } from '../../helpers/response.status';
import { COMPONENT_NAME, COUNTRY } from '../../helpers/common.token';
import { RedisClient, generateRedisKeyFor } from '../../helpers/redis.helper';
import { ServiceResponse } from '../../helpers/serviceResponse.helper';
import { logger } from '../../services/logger';
import { UserRepository } from './user.repository';
import User, {
	TIUserOrNull,
	IUser,
	IAuthSession,
	IUserAgent,
	ISessionQueryType,
	ISessionUserAgent,
} from './user.schema';
import { SESSION_TYPE, USER_RESPONSE_MSG, USER_TYPE_DEFINITION } from './user.token';
import { Config } from '../../config';
import { CommonHelper } from '../../helpers/common.helper';
import { EncryptionService } from '../../services/encryption.service';
import { COMMUNICATION_TYPE, PID_VALUE } from '../../config/config.token';

const LOG_FILENAME = 'UserHelper :';

export class UserHelper {
	static readonly serviceResponse = new ServiceResponse();

	static readonly exception = this.serviceResponse.databaseError({
		errorCode: ERROR.SOMETHING_WENT_WRONG.CODE,
		message: ERROR.SOMETHING_WENT_WRONG.MESSAGE,
		error: ERROR.SOMETHING_WENT_WRONG.ERROR,
		meta: {},
	});

	static readonly exceptionRequestNotAcceptable = this.serviceResponse.unprocessableEntityError({
		errorCode: ERROR.REQUEST_NOT_ACCEPTABLE.CODE,
		message: ERROR.REQUEST_NOT_ACCEPTABLE.MESSAGE,
		error: ERROR.REQUEST_NOT_ACCEPTABLE.ERROR,
		meta: {},
	});

	static readonly checkOtpIsVerifiedInRedis = async (traceId: string, data: any): Promise<void> => {
		try {
			logger.info(
				{ traceId, data: { ...data } },
				`${LOG_FILENAME}:checkOtpIsVerifiedInRedis::data=>checkotpverifed`,
			);
			logger.info({ traceId, data: { test: 2 } }, `${LOG_FILENAME}:checkOtpIsVerifiedInRedis::test-2`);
			const key = generateRedisKeyFor.locateOtp(
				COMMUNICATION_TYPE.SMS,
				`${data?.phone?.code}${data?.phone?.cellNo}`,
				data?.pid,
			);
			logger.info({ traceId, data: { key } }, `${LOG_FILENAME}:checkOtpIsVerifiedInRedis::key-if`);
			let redisData = await RedisClient.get({ key });

			if (!redisData) {
				logger.error(
					{ traceId, data: {}, error: {} },
					`${LOG_FILENAME}:checkOtpIsVerifiedInRedis::No data found in Redis`,
				);
				throw this.exceptionRequestNotAcceptable;
			}

			// Parse and validate the data
			try {
				const parsedData = JSON.parse(redisData);
				logger.info(
					{ traceId, data: { parsedData } },
					`${LOG_FILENAME}:checkOtpIsVerifiedInRedis::Data parsed successfully`,
				);

				if (!parsedData?.phone?.isVerified) {
					logger.error(
						{ traceId, data: {}, error: {} },
						`${LOG_FILENAME}:checkOtpIsVerifiedInRedis::Phone not verified`,
					);
					throw this.exceptionRequestNotAcceptable;
				}

				// Delete the Redis key after successful validation
				await RedisClient.del({ key });
				logger.info(
					{ traceId, data: { key } },
					`${LOG_FILENAME}:checkOtpIsVerifiedInRedis::Redis key deleted successfully`,
				);
			} catch (error) {
				logger.error(
					{ traceId, data: {}, error },
					`${LOG_FILENAME}:checkOtpIsVerifiedInRedis::Error processing Redis data`,
				);
				throw new Error('Failed to process Redis data');
			}
			return;
		} catch (error) {
			logger.error({ traceId, data: {}, error }, `${LOG_FILENAME}:checkOtpIsVerifiedInRedis::at-catch`);
			throw error;
		}
	};

	static readonly setAuthTokenInRedis = async (traceId: string, token: string): Promise<void> => {
		try {
			const key = generateRedisKeyFor.authToken(token);
			await RedisClient.set({ key, value: token, resetTTL: true });
			return;
		} catch (error) {
			logger.error({ traceId, data: { token }, error }, `${LOG_FILENAME}:setAuthTokenInRedis::at-catch`);
			throw this.serviceResponse.unhandledError({
				errorCode: ERROR.SOMETHING_WENT_WRONG.CODE,
				message: ERROR.SOMETHING_WENT_WRONG.MESSAGE,
				error: ERROR.SOMETHING_WENT_WRONG.ERROR,
				meta: error,
			});
		}
	};

	static readonly locateOtpAndGetData = async (traceId: string, type: string, address: string, pid: number) => {
		try {
			const key = generateRedisKeyFor.locateOtp(type, address, pid);
			logger.info({ traceId, data: { key } }, `${LOG_FILENAME}:locateOtpAndGetData::key`);
			let data: string | null = await RedisClient.get({ key });
			logger.info({ traceId, data: { data } }, `${LOG_FILENAME}:locateOtpAndGetData::data`);
			if (data != null) {
				await RedisClient.del({ key });
				logger.info({ data, parsed: JSON.parse(data) }, 'date=>locateotpandgetdata');
				return JSON.parse(data);
			}
			return null;
		} catch (error) {
			logger.error(
				{ traceId, data: { type, address, pid }, error },
				`${LOG_FILENAME}:locateOtpAndGetData::at-catch`,
			);
			throw this.serviceResponse.unhandledError({
				errorCode: ERROR.SOMETHING_WENT_WRONG.CODE,
				message: ERROR.SOMETHING_WENT_WRONG.MESSAGE,
				error: ERROR.SOMETHING_WENT_WRONG.ERROR,
				meta: error,
			});
		}
	};

	static readonly checkUserExistOnSignup = async (traceId: string, body: any): Promise<void> => {
		try {
			let checkIsExists: any;
			let { phone } = body;
			if (phone) {
				checkIsExists = {
					$and: [
						{
							[`phone.code`]: phone?.code,
						},
						{
							[`phone.cellNo`]: phone?.cellNo,
						},
					],
				};
			}

			logger.info({ traceId, data: { checkIsExists } }, `${LOG_FILENAME}:checkUserExistOnSignup::checkIsExists`);
			const userResult: TIUserOrNull = await UserRepository.findOne(checkIsExists);
			logger.info({ traceId, data: { userResult } }, `${LOG_FILENAME}:checkUserExistOnSignup::userResult`);

			if (userResult?._id && userResult?.phone?.cellNo == phone?.cellNo && phone?.cellNo != null) {
				logger.info({ traceId, data: { phone } }, `${LOG_FILENAME}:checkUserExistOnSignup::check`);
				let message: string = ERROR_MSG.PHONE_EXISTS;
				logger.info({ traceId, data: { message } }, `${LOG_FILENAME}:checkUserExistOnSignup::2`);
				throw this.serviceResponse.conflictError({
					errorCode: ERROR.USER_ALREADY_EXISTS.CODE,
					message,
					error: ERROR.USER_ALREADY_EXISTS.ERROR,
					meta: {},
				});
			}
		} catch (error: any) {
			if (error?.statusCode) throw error;
			throw this.serviceResponse.unhandledError({
				errorCode: ERROR.SOMETHING_WENT_WRONG.CODE,
				message: ERROR.SOMETHING_WENT_WRONG.MESSAGE,
				error: ERROR.SOMETHING_WENT_WRONG.ERROR,
				meta: error,
			});
		}
	};

	static readonly updateNotificationToken = async (traceId: string, body: any) => {
		try {
			let { deviceId, fcmToken, user } = body;
			logger.info({ traceId, data: { deviceId, fcmToken } }, `${LOG_FILENAME}:updateDocument::body`);

			let isDocumentUpdated = false;
			let filter: any = {};
			let query: any = {};
			const currentDateTime = new Date();

			// update existing document
			for (const notify of user?.notificationToken || []) {
				if (notify.deviceId == deviceId) {
					if (notify.fcmToken == fcmToken) return user;
					filter = { _id: user._id, 'notificationToken.deviceId': deviceId };
					query = {
						$set: {
							'notificationToken.$[].fcmToken': fcmToken,
							'notificationToken.$[].updatedAt': currentDateTime,
						},
					};
					user = await UserRepository.updateUser(filter, query);
					isDocumentUpdated = true;
					break;
				}
			}

			// new document
			if (!isDocumentUpdated) {
				const docObj = {
					deviceId,
					fcmToken,
					createdAt: currentDateTime,
					updatedAt: currentDateTime,
				};
				filter = { _id: user._id };
				query = {
					$push: { notificationToken: { $each: [docObj], $slice: -5 } },
				};
				user = await UserRepository.updateUser(filter, query);
			}
			return user;
		} catch (error: any) {
			logger.error({ traceId, data: {}, error }, `${LOG_FILENAME}:updateNotificationToken::at-catch`);
			if (error?.statusCode) {
				throw this.serviceResponse.unhandledError({
					errorCode: ERROR.SOMETHING_WENT_WRONG.CODE,
					message: ERROR.SOMETHING_WENT_WRONG.MESSAGE,
					error: ERROR.SOMETHING_WENT_WRONG.ERROR,
					meta: error,
				});
			}
			throw this.serviceResponse.unhandledError({
				errorCode: ERROR.SOMETHING_WENT_WRONG.CODE,
				message: ERROR.SOMETHING_WENT_WRONG.MESSAGE,
				error: ERROR.SOMETHING_WENT_WRONG.ERROR,
				meta: error,
			});
		}
	};

	static readonly removeNotificationToken = async (traceId: string, body: any) => {
		try {
			let { deviceId, user, accessToken } = body;
			logger.info({ traceId, data: { deviceId, user } }, `${LOG_FILENAME}:removeNotificationToken::body-1`);

			let filter: any = {};
			let query: any = {};

			// update existing document
			logger.info(
				{ traceId, data: { filter, query, deviceId } },
				`${LOG_FILENAME}:removeNotificationToken::changeinfo0`,
			);
			filter = { _id: user._id };
			logger.info(
				{ traceId, data: { filter, query, deviceId } },
				`${LOG_FILENAME}:removeNotificationToken::changeinfo1`,
			);

			query = {
				$pull: {
					notificationToken: { deviceId },
					authSession: { token: accessToken },
				},
			};
			logger.info(
				{ traceId, data: { filter, query, deviceId } },
				`${LOG_FILENAME}:removeNotificationToken::changeinfo2`,
			);
			user = await UserRepository.updateUser(filter, query);

			return user;
		} catch (error: any) {
			logger.error({ traceId, data: {}, error }, `${LOG_FILENAME}:removeNotificationToken::at-catch`);
			if (error?.statusCode) {
				throw this.serviceResponse.unhandledError({
					errorCode: ERROR.SOMETHING_WENT_WRONG.CODE,
					message: ERROR.SOMETHING_WENT_WRONG.MESSAGE,
					error: ERROR.SOMETHING_WENT_WRONG.ERROR,
					meta: error,
				});
			}
			throw this.serviceResponse.unhandledError({
				errorCode: ERROR.SOMETHING_WENT_WRONG.CODE,
				message: ERROR.SOMETHING_WENT_WRONG.MESSAGE,
				error: ERROR.SOMETHING_WENT_WRONG.ERROR,
				meta: error,
			});
		}
	};

	static readonly updateProfile = async (traceId: string, body: any, user: IUser, userId: string) => {
		let { phone, name, age, pincode, aadharNo, password } = body;
		logger.info({ phone, name, age, pincode, aadharNo, password }, 'n');
		const fieldsArr = Object.keys(body);
		let profileObj: any = {};
		let isMatch: boolean;
		let receiver: string = '';
		try {
			let data: any;
			for (const field of fieldsArr) {
				switch (field) {
					case 'name':
						if (name?.first) profileObj['name.first'] = name.first;
						if (name?.middle) profileObj['name.middle'] = name.middle;
						if (name?.last) profileObj['name.last'] = name.last;
						break;
					case 'age':
						const ageIsValid = Number.isInteger(parseFloat(age)) && age > 0 && age <= 110;
						if (!ageIsValid) {
							throw this.serviceResponse.unprocessableEntityError({
								errorCode: ERROR.INVALID_FORMAT.CODE,
								message: ERROR.INVALID_FORMAT.MESSAGE,
								error: ERROR.INVALID_FORMAT.ERROR,
								meta: {},
							});
						}
						profileObj.age = Number(age);
						break;
					case 'phone':
						logger.info({ traceId, data: { phone } }, `${LOG_FILENAME}:updateProfile::phone`);
						receiver = `${phone?.code}${phone?.cellNo}`;
						data = await this.locateOtpAndGetData(
							traceId,
							COMMUNICATION_TYPE.SMS,
							`${user.phone?.code}${user.phone?.cellNo}`,
							PID_VALUE.UPDATE,
						);
						logger.info({ traceId, data: { ...data } }, `${LOG_FILENAME}:updateProfile::data`);

						if (!data?.phone?.isVerified) {
							throw this.serviceResponse.unprocessableEntityError({
								errorCode: ERROR.REQUEST_NOT_ACCEPTABLE.CODE,
								message: ERROR.REQUEST_NOT_ACCEPTABLE.MESSAGE,
								error: ERROR.REQUEST_NOT_ACCEPTABLE.ERROR,
								meta: {},
							});
						}
						data = await this.locateOtpAndGetData(
							traceId,
							COMMUNICATION_TYPE.SMS,
							receiver,
							PID_VALUE.UPDATE_NEW,
						);
						logger.info({ traceId, data: { ...data } }, `${LOG_FILENAME}:updateProfile::data`);

						if (!data?.phone?.isVerified) {
							throw this.serviceResponse.unprocessableEntityError({
								errorCode: ERROR.REQUEST_NOT_ACCEPTABLE.CODE,
								message: ERROR.REQUEST_NOT_ACCEPTABLE.MESSAGE,
								error: ERROR.REQUEST_NOT_ACCEPTABLE.ERROR,
								meta: {},
							});
						}
						profileObj.phone = {
							code: phone?.code,
							cellNo: phone?.cellNo,
							isVerified: true,
						};
						profileObj.authType = user?.authType;
						profileObj.authType['phone'] = {
							id: `${phone.code}${phone.cellNo}`,
							isEligible: true,
							status: true,
							updatedAt: new Date(),
						};
						break;
					case 'password':
						user = (await UserRepository.findById(userId)) as IUser;
						isMatch = await AuthHelper.comparePasswordToHash(password.old, user.password);
						if (!isMatch) {
							throw this.serviceResponse.badRequestError({
								errorCode: ERROR.PASSWORD_NOT_MATCH.CODE,
								message: ERROR.PASSWORD_NOT_MATCH.MESSAGE,
								error: ERROR.PASSWORD_NOT_MATCH.ERROR,
								meta: {},
							});
						}
						profileObj.password = await AuthHelper.generatePasswordHash(password.new);
						break;
					case 'pincode':
						if (!CommonHelper.pincodeRegex.test(pincode)) {
							throw this.serviceResponse.unprocessableEntityError({
								errorCode: ERROR.INVALID_FORMAT.CODE,
								message: ERROR.INVALID_FORMAT.MESSAGE,
								error: ERROR.INVALID_FORMAT.ERROR,
								meta: {},
							});
						}
						profileObj.pincode = pincode;
						break;
					case 'aadharNo':
						if (!CommonHelper.isValidAadhaar(aadharNo)) {
							throw this.serviceResponse.unprocessableEntityError({
								errorCode: ERROR.INVALID_FORMAT.CODE,
								message: ERROR.INVALID_FORMAT.MESSAGE,
								error: ERROR.INVALID_FORMAT.ERROR,
								meta: {},
							});
						}
						profileObj.aadharNo = aadharNo;
				}
			}
			const resultObj: any = await UserRepository.updateUser(
				{ _id: userId },
				{ $set: { ...profileObj } },
				{ returnDocument: 'after' },
			);
			let responseData = CommonHelper.convertProperties(resultObj, USER_TYPE_DEFINITION, COMPONENT_NAME.USER);
			responseData = CommonHelper.mergePropertiesTakeKeyFromObj(responseData, body);
			return this.serviceResponse.updated({
				data: responseData,
				message: 'Updated successfully',
			});
		} catch (error: any) {
			logger.error({ traceId, data: {}, error }, `${LOG_FILENAME}:updateProfile::at-catch`);
			if (error?.statusCode) throw error;
			throw this.serviceResponse.unhandledError({
				errorCode: ERROR.SOMETHING_WENT_WRONG.CODE,
				message: ERROR.SOMETHING_WENT_WRONG.MESSAGE,
				error: ERROR.SOMETHING_WENT_WRONG.ERROR,
				meta: error,
			});
		}
	};

	static readonly formatListAppointment = (traceId: string, data: any) => {
		let obj = { ...data };
		obj.date = CommonHelper.getDateFormat(obj?.date, '', 'DD-MM-YYYY');
		return obj;
	};
}
