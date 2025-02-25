import moment from 'moment';
import mongoose from 'mongoose';
import { Request, Response } from 'express';
import User, {
	IAuthSession,
	ISessionQueryType,
	ISessionUserAgent,
	IUser,
	IUserAgent,
	TIUserOrNull,
} from './user.schema';
import { UserRepository } from './user.repository';
import {
	SESSION_TYPE,
	USER_RESPONSE_MSG,
	USER_TYPE_DEFINITION,
	USER_LOGIN_TYPE_DEFINITION,
	CHECK_USER_TYPE,
	USER_CHECK_DEFINITION,
} from './user.token';
import { ERROR_CODE, ERROR_MESSAGE } from './user.error';
import { AuthHelper } from '../../helpers/auth.helper';
import { CommonHelper } from '../../helpers/common.helper';
import { COMMON_ERROR_CODE, COMMON_ERROR_MESSAGE, ERROR, RESPONSE_MSG } from '../../helpers/response.status';
import { COMPONENT_NAME, COUNTRY, USER_FLOW } from '../../helpers/common.token';
import { logger } from '../../services/logger';
import { Config } from '../../config';
import { RedisClient, generateRedisKeyFor } from '../../helpers/redis.helper';
import { UserHelper } from './user.helper';
import { EncryptionService } from '../../services/encryption.service';
import { COMMUNICATION_TYPE, PID_VALUE } from '../../config/config.token';
import { generateSmsContent, sendSms } from '../../components/communication/communication.helper';
import Setura from '../../components/setura/schema/setura.schema';
import Uhc from '../../components/setura/schema/uhc.schema';
import Appointment, { IAppointment } from '../../components/setura/schema/appointment.schema';
import { SETURA_SLOT_STATUS, VACCINE } from '../../components/setura/setura.token';

const LOG_FILENAME = 'UserController :';

export class UserController {
	create = async (req: Request, res: Response): Promise<void> => {
		const serviceResponse = req.serviceResponse;
		const traceId = serviceResponse.traceId;
		const time = new Date();
		const ip = req?.userIp ?? req?.ip ?? '';
		const client = req?.get('User-Agent') ?? '';
		const source = req?.useragent ?? {};
		try {
			logger.info({ traceId, data: { ...req.body } }, `${LOG_FILENAME}:create:req.body`);
			let { password, phone, isOtp, age, pincode, aadharNo, name } = req.body;
			let checkIsExists: any;
			let otp: any;
			let query: any;

			if (phone?.cellNo) {
				checkIsExists = {
					$and: [
						{
							[`phone.code`]: phone.code,
						},
						{
							[`phone.cellNo`]: phone.cellNo,
						},
					],
				};
			}

			// check key exists in redis db if not we throw error request is not acceptable
			if ([1, true].includes(isOtp) && Config.isPhoneVerificationEnabled) {
				await UserHelper.checkOtpIsVerifiedInRedis(traceId, {
					phone,
					pid: PID_VALUE.SIGNUP,
				});
			} else if (!password && isOtp != Config.server.masterOtp) {
				throw serviceResponse.authenticationError({
					errorCode: ERROR.UNAUTHORIZED_ACCESS.CODE,
					message: ERROR.UNAUTHORIZED_ACCESS.MESSAGE,
					error: ERROR.UNAUTHORIZED_ACCESS.ERROR,
					meta: {},
				});
			}

			let user: TIUserOrNull = await UserRepository.findOne(checkIsExists);
			if (user?._id) {
				let message: string = ERROR_MESSAGE.PHONE_EXISTS;
				throw serviceResponse.conflictError({
					errorCode: ERROR.USER_ALREADY_EXISTS.CODE,
					message,
					error: ERROR.USER_ALREADY_EXISTS.ERROR,
					meta: {},
				});
			}

			const filterSource: IUserAgent = CommonHelper.filterUserAgentDetails(source);
			const session: ISessionUserAgent[] = [
				{
					time,
					ip,
					type: SESSION_TYPE.SIGNUP,
					...filterSource,
					client: filterSource?.browser ?? client,
				},
			];
			const hashPassword = await AuthHelper.generatePasswordHash(password ?? '');

			otp = {
				phone: {
					value: CommonHelper.generateOTP(),
					timestamp: new Date(),
				},
			};
			phone.isVerified = true;
			query = {
				phone,
				name,
				age,
				pincode,
				aadharNo,
				password: hashPassword,
				session,
				otp,
				[`authType.phone`]: {
					id: `${phone?.code}${phone?.cellNo}`,
					isEligible: true,
					status: true,
					updatedAt: new Date(),
				},
				[`authType.pw`]: {
					id: null,
					isEligible: true,
					status: false,
					updatedAt: new Date(),
				},
			};

			let responseData: any = await UserRepository.createUser(query);
			responseData = CommonHelper.convertProperties(responseData, USER_TYPE_DEFINITION, COMPONENT_NAME.USER);
			const accessToken = AuthHelper.generateJwtToken({ id: responseData._id });
			const refreshToken = AuthHelper.generateJwtToken({ id: responseData._id }, true);
			const encryptedToken = EncryptionService.encryptNormal(traceId, accessToken);
			const authSession: IAuthSession = {
				token: encryptedToken,
				device: filterSource.device,
				ip,
				client,
				createdAt: time,
				lastActiveAt: time,
			};
			await UserRepository.updateUser({ _id: responseData._id }, { $set: { authSession } });
			serviceResponse.navigate = AuthHelper.identifyUserFlow(responseData) || '';
			serviceResponse.accessToken = accessToken;
			serviceResponse.refreshToken = refreshToken;
			responseData = serviceResponse.created({
				message: USER_RESPONSE_MSG.SIGNUP_SUCCESS,
				data: responseData,
			});
			res.status(responseData.statusCode).json(responseData);
			return;
		} catch (error: any) {
			logger.error({ traceId, data: {}, error }, `${LOG_FILENAME}:create::at-catch`);
			if (error?.statusCode) {
				res.status(error?.statusCode).json({ ...error, traceId });
				return;
			}

			const exception = serviceResponse.unhandledError({
				errorCode: ERROR.SOMETHING_WENT_WRONG.CODE,
				message: ERROR.SOMETHING_WENT_WRONG.MESSAGE,
				error: ERROR.SOMETHING_WENT_WRONG.ERROR,
				meta: {},
			});

			res.status(exception.statusCode).json(exception);
			return;
		}
	};

	login = async (req: Request, res: Response): Promise<void> => {
		const serviceResponse = req.serviceResponse;
		const traceId = serviceResponse.traceId;
		const client = req?.get('User-Agent') ?? '';
		const ip = req?.userIp ?? req?.ip ?? '';
		const time = new Date();
		let source = req?.useragent ?? {};
		try {
			// const { username, password, provider } = req.body;
			let { phone, password, isOtp } = req.body;
			if ([1, true].includes(isOtp) && Config.isPhoneVerificationEnabled) {
				await UserHelper.checkOtpIsVerifiedInRedis(traceId, {
					phone,
					pid: PID_VALUE.LOGIN,
				});
			} else if (!password && isOtp != Config.server.masterOtp) {
				throw serviceResponse.authenticationError({
					errorCode: ERROR.UNAUTHORIZED_ACCESS.CODE,
					message: ERROR.UNAUTHORIZED_ACCESS.MESSAGE,
					error: ERROR.UNAUTHORIZED_ACCESS.ERROR,
					meta: {},
				});
			}

			let checkIsExists;
			if (phone) {
				checkIsExists = {
					$and: [{ [`phone.code`]: phone.code, [`phone.cellNo`]: phone.cellNo }],
					isBlocked: false,
				};
			}
			const user: TIUserOrNull = await UserRepository.findOne(checkIsExists);
			const userId = user?._id;
			if (userId && !user?.isBlocked) {
				const filter = { _id: userId };
				let isMatched = false,
					isMasterLogin = false;
				logger.info({ isMatched, password, hash: user.password });
				if (!isOtp) {
					if (Config.server.appMode != 'production' || Config?.server?.masterPassword?.length) {
						isMatched = password == (Config?.server?.masterPassword ?? '') ? true : false;
						isMasterLogin = isMatched ? true : false;
						if (!isMatched) {
							isMatched = await AuthHelper.comparePasswordToHash(password, user.password);
						}
					} else {
						isMatched = await AuthHelper.comparePasswordToHash(password, user.password);
						logger.info({ isMatched }, 'checki');
					}
				} else {
					isMatched = true;
				}
				logger.info({ isMatched, isMasterLogin }, 'isMatched, isMasterLogin3');
				const filterSource: IUserAgent = CommonHelper.filterUserAgentDetails(source);
				let session: ISessionUserAgent[] = [
					{
						time,
						ip,
						type: SESSION_TYPE.LOGIN,
						...filterSource,
						client: filterSource?.browser ?? client,
					},
				];
				logger.info({ d: '233' });
				const accessToken = AuthHelper.generateJwtToken({ id: userId });
				const refreshToken = AuthHelper.generateJwtToken({ id: userId }, true);
				logger.info({ d: '232' });
				const encryptedToken = EncryptionService.encryptNormal(traceId, accessToken);
				logger.info({ d: '231' });
				const authSession: IAuthSession = {
					token: encryptedToken,
					device: filterSource.device,
					ip,
					client,
					createdAt: time,
					lastActiveAt: time,
				};
				let query: ISessionQueryType = {
					$push: {
						session: { $each: session, $slice: -Config.allowSession.regular },
						authSession: { $each: [authSession], $slice: -Config.allowSession.auth.all },
					},
				};
				logger.info({ d: '230', isMatched });
				if (!isMatched) {
					let session: ISessionUserAgent[] = [
						{
							time,
							ip,
							type: SESSION_TYPE.ATTEMPT,
							...filterSource,
							client: filterSource?.browser ?? client,
						},
					];
					query = { $push: { session: { $each: session, $slice: -Config.allowSession.regular } } };
					logger.info({ d: '123' });
					await UserRepository.updateUser(filter, query);
					logger.info({ d: '2123' });
					throw serviceResponse.authenticationError({
						errorCode: ERROR.UNAUTHORIZED_ACCESS.CODE,
						message: ERROR.UNAUTHORIZED_ACCESS.MESSAGE,
						error: ERROR.UNAUTHORIZED_ACCESS.ERROR,
						meta: {},
					});
				}
				logger.info({ d: '23' });

				let responseData: any = await UserRepository.updateUser(filter, query, { returnDocument: 'after' });
				responseData.navigate = AuthHelper.identifyUserFlow(responseData) || '';
				responseData = CommonHelper.convertProperties(
					responseData,
					USER_LOGIN_TYPE_DEFINITION,
					COMPONENT_NAME.USER,
				);
				serviceResponse.navigate = AuthHelper.identifyUserFlow(responseData) || '';
				serviceResponse.accessToken = accessToken;
				serviceResponse.refreshToken = refreshToken;
				responseData = serviceResponse.fetched({
					message: RESPONSE_MSG.USER.LOGIN_SUCCESS,
					data: responseData,
				});
				res.status(responseData.statusCode).json(responseData);
				return;
			}
			throw serviceResponse.authenticationError({
				errorCode: ERROR.UNAUTHORIZED_ACCESS.CODE,
				message: ERROR.UNAUTHORIZED_ACCESS.MESSAGE,
				error: ERROR.UNAUTHORIZED_ACCESS.ERROR,
				meta: {},
			});
		} catch (error: any) {
			logger.error({ traceId, data: {}, error }, `${LOG_FILENAME}:login::at-catch`);
			if (error?.statusCode) {
				res.status(error?.statusCode).json({ ...error, traceId });
				return;
			}
			const exception = serviceResponse.unhandledError({
				errorCode: ERROR.SOMETHING_WENT_WRONG.CODE,
				message: ERROR.SOMETHING_WENT_WRONG.MESSAGE,
				error: ERROR.SOMETHING_WENT_WRONG.ERROR,
				meta: {},
			});

			res.status(exception.statusCode).json(exception);
		}
	};

	getSignupFields = async (req: Request, res: Response): Promise<void> => {
		const serviceResponse = req.serviceResponse;
		const traceId = serviceResponse.traceId;
		let responseData: any = {
			country: COUNTRY,
		};
		try {
			const { countryCode, documentName } = req?.query as { countryCode: string; documentName: string };
			if (countryCode && !CommonHelper.empty(COUNTRY?.[countryCode])) {
				responseData = COUNTRY[countryCode];
			}
			responseData = serviceResponse.fetched({
				traceId,
				data: responseData,
				message: USER_RESPONSE_MSG.FIELDS_FETCH,
			});
			res.status(responseData.statusCode).json(responseData);
			return;
		} catch (error: any) {
			logger.error({ traceId, data: {}, error }, `${LOG_FILENAME}:getSignupFields::at-catch`);
			const exception = serviceResponse.unhandledError({
				errorCode: ERROR.SOMETHING_WENT_WRONG.CODE,
				message: ERROR.SOMETHING_WENT_WRONG.MESSAGE,
				error: ERROR.SOMETHING_WENT_WRONG.ERROR,
				meta: {},
			});
			res.status(exception?.statusCode).json(exception);
			return;
		}
	};

	update = async (req: Request, res: Response) => {
		let user = req.user as IUser;
		const serviceResponse = req.serviceResponse;
		const traceId = serviceResponse.traceId;
		const userId = user?._id;
		const { type } = req.params;
		let response: any;
		try {
			if (
				[USER_FLOW.PHONE_VERIFICATION].includes(serviceResponse.navigate) &&
				!(req?.body?.phone || req?.body?.email)
			) {
				const exception = serviceResponse.forbiddenError({
					errorCode: ERROR.ACCESS_DENIED.CODE,
					message: ERROR.ACCESS_DENIED.MESSAGE,
					error: ERROR.ACCESS_DENIED.ERROR,
					meta: {},
				});
				return res.status(exception.statusCode).json(exception);
			}
			if (req?.body?.phone) {
				await UserHelper.checkUserExistOnSignup(traceId, req.body);
			}
			response = await UserHelper.updateProfile(traceId, req.body, user, userId);
			return res.status(response.statusCode).json(response);
		} catch (error: any) {
			logger.error({ traceId, data: {}, error }, `${LOG_FILENAME}:update::at-catch`);
			if (error?.statusCode) {
				return res.status(error?.statusCode).json(error);
			} else {
				const exception = serviceResponse.unhandledError({
					errorCode: ERROR.SOMETHING_WENT_WRONG.CODE,
					message: ERROR.SOMETHING_WENT_WRONG.MESSAGE,
					error: ERROR.SOMETHING_WENT_WRONG.ERROR,
					meta: {},
				});
				return res.status(exception?.statusCode).json(exception);
			}
		}
	};

	sendOtp = async (req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined> => {
		let { serviceResponse } = req;
		let user;
		let otp: any;
		const traceId = serviceResponse.traceId;
		let { phone, pid } = req.body;
		let resendOtp = req?.query?.resend as string;
		let responseData: any;
		let receiver: string;

		try {
			let checkIsExists = {};
			if (phone?.code && phone?.cellNo) {
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
			user = await UserRepository.findOne(checkIsExists);
			// });
			if ([PID_VALUE.SIGNUP, PID_VALUE.UPDATE_NEW].includes(pid) && user != null) {
				const exception = serviceResponse.unprocessableEntityError({
					errorCode: ERROR_CODE.USER_ALREADY_EXISTS,
					message: ERROR_MESSAGE.NOT_ACCEPTABLE,
					meta: {},
				});
				return res.status(exception?.statusCode).json(exception);
			}
			if (![PID_VALUE.SIGNUP, PID_VALUE.UPDATE_NEW].includes(pid) && user == null) {
				const exception = serviceResponse.unprocessableEntityError({
					errorCode: ERROR_CODE.USER_NOT_EXISTS,
					message: ERROR_MESSAGE.USER_NOT_EXISTS,
					meta: {},
				});
				return res.status(exception?.statusCode).json(exception);
			}
			if (CommonHelper.empty(phone) || CommonHelper.empty(phone?.code) || CommonHelper.empty(phone?.cellNo)) {
				const exception = serviceResponse.unprocessableEntityError({
					errorCode: ERROR_CODE.ENTITY_REQUIRED,
					message: `${ERROR_MESSAGE.REQUEST_NOT_ACCEPTABLE} phone ${ERROR_CODE.ENTITY_REQUIRED}`,
					meta: {},
				});
				return res.status(exception?.statusCode).json(exception);
			}
			otp = {
				phone: {
					value: CommonHelper.generateOTP(),
					timestamp: new Date(),
					...phone,
					isVerified: false,
				},
				pid,
			};
			receiver = `${phone.code}${phone.cellNo}`;
			const key = generateRedisKeyFor.locateOtp(COMMUNICATION_TYPE.SMS, receiver, pid);
			let otpFromRedis: any = Config.isPhoneVerificationEnabled ? await RedisClient.get({ key }) : '{}';
			otpFromRedis = JSON.parse(otpFromRedis);

			if (
				Config.isPhoneVerificationEnabled &&
				otpFromRedis &&
				!CommonHelper.isOTPExpired(otpFromRedis.phone.timestamp, Config.otpExpireTime) &&
				parseInt(resendOtp || '0') == 0
			) {
				responseData = serviceResponse.created({
					data: { phoneNo: receiver },
					message: USER_RESPONSE_MSG.OTP_ALREADY_SENT,
				});
			} else {
				if (
					Config.isPhoneVerificationEnabled &&
					(!otpFromRedis ||
						CommonHelper.isOTPExpired(otpFromRedis.phone.timestamp, Config.otpExpireTime) ||
						parseInt(resendOtp || '0') == 1)
				) {
					await RedisClient.set({ key, value: JSON.stringify(otp), resetTTL: true });
				} else {
					otp = otpFromRedis;
				}
				const smsParamters: any = generateSmsContent(pid, receiver, otp.phone);
				await sendSms(traceId, null, { ...smsParamters });

				responseData = serviceResponse.created({
					data: { phoneNo: receiver },
					message: USER_RESPONSE_MSG.OTP_SENT_ON_PHONE,
				});
			}

			return res.status(responseData.statusCode).json(responseData);
		} catch (error: any) {
			logger.error(error, 'error-->>001');
			const exception = serviceResponse.unhandledError({
				errorCode: COMMON_ERROR_CODE.SOMETHING_WENT_WRONG,
				message: error.message || COMMON_ERROR_MESSAGE.SOMETHING_WENT_WRONG,
				meta: error,
			});
			return res.status(exception?.statusCode).json(exception);
		}
	};

	verifyOtp = async (req: Request, res: Response) => {
		let { serviceResponse } = req;
		try {
			const traceId = serviceResponse.traceId;
			let { phone, otp, type, pid } = req.body;
			let receiver: string;
			let exception = serviceResponse.badRequestError({
				errorCode: ERROR_CODE.INVALID_OTP,
				message: USER_RESPONSE_MSG.INVALID_OTP,
			});
			const client = req?.get('User-Agent') ?? '';
			const ip = req?.userIp ?? req?.ip ?? '';
			const time = new Date();
			const source = req?.useragent ?? {};
			let key: string, value: string;

			receiver = `${phone.code}${phone.cellNo}`;
			key = generateRedisKeyFor.locateOtp(COMMUNICATION_TYPE.SMS, receiver, pid);

			let data: any = Config.isPhoneVerificationEnabled ? await RedisClient.get({ key }) : '{}';
			data = JSON.parse(data);
			if (data?.pid != pid) return res.status(exception?.statusCode).json(exception);
			const filterSource: IUserAgent = CommonHelper.filterUserAgentDetails(source);
			if (!data?.phone?.cellNo) {
				const phoneException = serviceResponse.badRequestError({
					errorCode: ERROR_CODE.PHONE_NOT_EXISTS,
					message: ERROR_CODE.PHONE_NOT_EXISTS,
				});
				return res.status(phoneException?.statusCode).json(phoneException);
			}
			if (
				(Config.isPhoneVerificationEnabled && data?.phone?.value != otp) ||
				(data?.phone?.timestamp ? CommonHelper.isOTPExpired(data?.phone?.timestamp, Config.otpExpireTime) : 1)
			) {
				return res.status(exception?.statusCode).json(exception);
			}
			data.phone.isVerified = true;
			value = JSON.stringify(data);
			if (Config.isPhoneVerificationEnabled) await RedisClient.set({ key, value, resetTTL: true });
			const response = serviceResponse.updated({
				data: {},
				message: 'OTP Verified',
			});
			return res.status(response?.statusCode).json(response);
		} catch (error: any) {
			logger.error(error, 'error-->>001user');
			const exception = serviceResponse.unhandledError({
				errorCode: COMMON_ERROR_CODE.SOMETHING_WENT_WRONG,
				message: error.message || COMMON_ERROR_MESSAGE.SOMETHING_WENT_WRONG,
				meta: error,
			});
			return res.status(exception?.statusCode ?? 400).json(exception);
		}
	};

	checkAvailability = async (req: Request, res: Response) => {
		let { serviceResponse } = req;
		const traceId = serviceResponse.traceId;
		let message = USER_RESPONSE_MSG.NOT_FOUND;
		try {
			let { phone, type } = req.body;

			let checkIsExists;
			if (type == CHECK_USER_TYPE.SIGNUP) {
				checkIsExists = {
					$and: [
						{
							[`phone.code`]: phone.code,
						},
						{
							[`phone.cellNo`]: phone.cellNo,
						},
					],
					isBlocked: false,
				};
			}

			const user: TIUserOrNull = await UserRepository.findOne(checkIsExists);
			let responseData: any = CommonHelper.convertProperties(user, USER_CHECK_DEFINITION, COMPONENT_NAME.USER);
			responseData.isFound = user ? true : false;
			message = user ? USER_RESPONSE_MSG.ACCOUNT_ALREADY_EXISTS : USER_RESPONSE_MSG.NOT_FOUND;
			const response = serviceResponse.fetched({
				data: responseData,
				message,
			});
			return res.status(response.statusCode).json(response);
		} catch (error: any) {
			logger.error(error, 'error');
			const exception = serviceResponse.unhandledError({
				errorCode: COMMON_ERROR_CODE.SOMETHING_WENT_WRONG,
				message: error.message || COMMON_ERROR_MESSAGE.SOMETHING_WENT_WRONG,
				meta: error,
			});
			return res.status(exception?.statusCode).json(exception);
		}
	};

	forgotPassword = async (req: Request, res: Response): Promise<void> => {
		const serviceResponse = req.serviceResponse;
		const traceId = serviceResponse.traceId;

		try {
			let { phone, password, isOtp } = req.body;
			let checkIsExists = {};
			if (phone?.code && phone?.cellNo) {
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
			let user: TIUserOrNull = await UserRepository.findOne(checkIsExists);
			if (!user) {
				throw UserHelper.exceptionRequestNotAcceptable;
			}
			if ([1, true].includes(isOtp) && Config.isPhoneVerificationEnabled) {
				await UserHelper.checkOtpIsVerifiedInRedis(traceId, {
					phone,
					pid: PID_VALUE.FORGOT_PASSWORD,
				});
			} else if (isOtp != Config.server.masterOtp) {
				throw serviceResponse.authenticationError({
					errorCode: ERROR.UNAUTHORIZED_ACCESS.CODE,
					message: ERROR.UNAUTHORIZED_ACCESS.MESSAGE,
					error: ERROR.UNAUTHORIZED_ACCESS.ERROR,
					meta: {},
				});
			}
			const hashPassword = await AuthHelper.generatePasswordHash(password);
			logger.info({
				password,
				hashPassword,
				data: await AuthHelper.comparePasswordToHash(password, hashPassword),
			});

			const result = await UserRepository.updateUser(
				{ _id: user?._id },
				{ $set: { password: hashPassword } },
				{ returnDocument: 'after' },
			);
			let responseData = serviceResponse.updated({
				message: USER_RESPONSE_MSG.PASSWORD_CHANGE,
				data: {},
			});
			res.status(responseData.statusCode).json(responseData);
		} catch (error: any) {
			logger.error(error, 'error');
			if (error?.statusCode) {
				res.status(error?.statusCode).json({ ...error, traceId, meta: {} });
				return;
			}
			const exception = serviceResponse.unhandledError({
				errorCode: COMMON_ERROR_CODE.SOMETHING_WENT_WRONG,
				message: COMMON_ERROR_MESSAGE.SOMETHING_WENT_WRONG,
				meta: error,
			});
			res.status(exception.statusCode).json(exception);
		}
	};

	changePassword = async (req: Request, res: Response): Promise<void> => {
		const serviceResponse = req.serviceResponse;
		const traceId = serviceResponse.traceId;
		let user: any = req.user;
		try {
			const { oldPassword, newPassword } = req.body;
			user = await User.findById(user._id).lean().exec();
			if (!user) {
				throw UserHelper.exceptionRequestNotAcceptable;
			}
			const isMatched = await AuthHelper.comparePasswordToHash(oldPassword, user.password);
			if (!isMatched) {
				throw serviceResponse.unprocessableEntityError({
					errorCode: ERROR_CODE.REQUEST_NOT_ACCEPTABLE,
					message: 'Password mis-match',
					meta: {},
				});
			}
			const hashPassword = await AuthHelper.generatePasswordHash(newPassword);
			const result = await UserRepository.updateUser(
				{ _id: user?._id },
				{ $set: { password: hashPassword } },
				{ returnDocument: 'after' },
			);
			let responseData = serviceResponse.updated({
				message: USER_RESPONSE_MSG.PASSWORD_CHANGE,
				data: {},
			});
			res.status(responseData.statusCode).json(responseData);
		} catch (error: any) {
			logger.error(error, 'error');
			if (error?.statusCode) {
				res.status(error?.statusCode).json({ ...error, traceId, meta: {} });
				return;
			}
			const exception = serviceResponse.unhandledError({
				errorCode: COMMON_ERROR_CODE.SOMETHING_WENT_WRONG,
				message: COMMON_ERROR_MESSAGE.SOMETHING_WENT_WRONG,
				meta: error,
			});
			res.status(exception.statusCode).json(exception);
		}
	};

	logout = async (req: Request, res: Response): Promise<void> => {
		const serviceResponse = req.serviceResponse;
		const traceId = serviceResponse.traceId;
		const { deviceId } = req.body;
		const accessToken: string = req?.headers?.authorization?.split(' ')[1] ?? req?.headers?.authorization ?? '';
		const encryptedToken = EncryptionService.encryptNormal(traceId, accessToken);
		try {
			let responseData: any;
			if (req?.headers?.[`${Config.XFLUTTERAPP}`]) {
				await UserHelper.removeNotificationToken(traceId, {
					deviceId,
					user: req.user,
					accessToken: encryptedToken,
				});
			}

			responseData = serviceResponse.fetched({
				message: USER_RESPONSE_MSG.LOGOUT,
				data: { deviceId },
			});

			res.status(responseData.statusCode).json(responseData);
			return;
		} catch (error: any) {
			logger.error(error, 'error');
			if (error?.statusCode) {
				res.status(error?.statusCode).json({ ...error, traceId, meta: {} });
				return;
			}
			const exception = serviceResponse.unhandledError({
				errorCode: COMMON_ERROR_CODE.SOMETHING_WENT_WRONG,
				message: COMMON_ERROR_MESSAGE.SOMETHING_WENT_WRONG,
				meta: error,
			});
			res.status(exception.statusCode).json(exception);
		}
	};

	dashboard = async (req: Request, res: Response): Promise<void> => {
		const serviceResponse = req.serviceResponse;
		const traceId = serviceResponse.traceId;
		const { deviceId, fcmToken } = req.body;
		let user = req.user as IUser;
		try {
			let responseData: any;

			if (req?.headers?.[`${Config.XFLUTTERAPP}`] && deviceId && fcmToken) {
				responseData = await UserHelper.updateNotificationToken(traceId, {
					deviceId,
					fcmToken,
					user: req.user,
				});
			}

			responseData = { ...user };
			responseData = CommonHelper.convertProperties(responseData, USER_TYPE_DEFINITION, COMPONENT_NAME.USER);

			responseData = serviceResponse.fetched({
				message: USER_RESPONSE_MSG.DASHBOARD,
				data: responseData,
			});

			res.status(responseData.statusCode).json(responseData);
			return;
		} catch (error: any) {
			logger.error(error, 'error');
			if (error?.statusCode) {
				res.status(error?.statusCode).json({ ...error, traceId, meta: {} });
				return;
			}
			const exception = serviceResponse.unhandledError({
				errorCode: COMMON_ERROR_CODE.SOMETHING_WENT_WRONG,
				message: COMMON_ERROR_MESSAGE.SOMETHING_WENT_WRONG,
				meta: error,
			});
			res.status(exception.statusCode).json(exception);
		}
	};

	vaccineSlots = async (req: Request, res: Response): Promise<void> => {
		logger.info({ vaccine: 'slots' });
		let { serviceResponse } = req;
		let user = req.user as IUser;
		const currentTime = moment().format('HH:mm');
		const todayDate = moment().startOf('day').toDate();
		const traceId = serviceResponse.traceId;

		try {
			let uhcFilter: any = {};

			if (!CommonHelper.empty(req?.body?.pincode)) {
				uhcFilter.pincode = req.body.pincode;
			} else if (!CommonHelper.empty(user.pincode)) {
				uhcFilter.pincode = user.pincode;
			}
			if (!CommonHelper.empty(req?.body?.state)) {
				uhcFilter.state = req.body.state.toLowerCase();
			}
			if (!CommonHelper.empty(req?.body?.city)) {
				uhcFilter.city = req.body.city.toLowerCase();
			}
			if (!CommonHelper.empty(req?.body?.vaccine)) {
				uhcFilter.vaccine = req.body.vaccine.toLowerCase();
			}

			logger.info(uhcFilter, 'UHC Filter');

			const matchingUHCs = await Uhc.find(uhcFilter).select('_id');
			const uhcIds = matchingUHCs.map(uhc => uhc._id);

			if (uhcIds.length === 0) {
				res.status(200).json(
					serviceResponse.fetched({
						message: USER_RESPONSE_MSG.NOT_FOUND,
						data: [],
					}),
				);
				return;
			}

			let seturaFilter: any = { uhcId: { $in: uhcIds } };

			if (!CommonHelper.empty(req?.body?.dateFrom) || !CommonHelper.empty(req?.body?.dateTo)) {
				seturaFilter.date = {};
				if (!CommonHelper.empty(req?.body?.dateFrom)) {
					seturaFilter.date.$gte = moment(req.body.dateFrom, 'DD-MM-YYYY').startOf('day').toDate();
				}
				if (!CommonHelper.empty(req?.body?.dateTo)) {
					seturaFilter.date.$lte = moment(req.body.dateTo, 'DD-MM-YYYY').endOf('day').toDate();
				}
			} else {
				seturaFilter.date = { $gte: todayDate };
			}

			logger.info(seturaFilter, 'Setura Filter');

			let options = {
				page: parseInt(req.body.page) || 1,
				limit: parseInt(req.body.limit) || 10,
				sort: { date: 1 },
				lean: true,
			};

			let aggregationPipeline = [
				{ $match: seturaFilter },
				{
					$lookup: {
						from: 'uhcs',
						localField: 'uhcId',
						foreignField: '_id',
						as: 'uhcInfo',
					},
				},
				{ $unwind: '$uhcInfo' },
				{
					$group: {
						_id: '$uhcId', // Grouping by uhcId
						name: { $first: '$uhcInfo.name' },
						pincode: { $first: '$uhcInfo.pincode' },
						city: { $first: '$uhcInfo.city' },
						state: { $first: '$uhcInfo.state' },
						vaccine: { $first: '$uhcInfo.vaccine' },
						openTime: { $first: '$uhcInfo.openTime' },
						closeTime: { $first: '$uhcInfo.closeTime' },
						slotDuration: { $first: '$uhcInfo.slotDuration' },
						slotMaxAppointment: { $first: '$uhcInfo.slotMaxAppointment' },
						slots: {
							$push: {
								_id: '$_id', // Keeping Setura ID inside slots
								date: {
									$dateToString: {
										format: '%d-%m-%Y',
										date: { $toDate: '$date' },
										timezone: Config.timezone,
									},
								},
								slots: {
									$filter: {
										input: '$slots',
										as: 'slot',
										cond: {
											$or: [{ $gt: ['$$slot.time', currentTime] }, { $gt: ['$date', todayDate] }],
										},
									},
								},
							},
						},
					},
				},
				{ $match: { 'slots.0': { $exists: true } } },
			];

			let responseData = await Setura.aggregatePaginate(Setura.aggregate(aggregationPipeline), options);
			responseData = CommonHelper.formatPaginateResponse(responseData, COMPONENT_NAME.SETURA);
			res.status(200).json(
				serviceResponse.fetched({
					message: USER_RESPONSE_MSG.FOUND,
					data: responseData,
				}),
			);
			return;
		} catch (error: any) {
			logger.error(error, 'Error fetching vaccine slots');
			res.status(500).json(
				serviceResponse.unhandledError({
					errorCode: COMMON_ERROR_CODE.SOMETHING_WENT_WRONG,
					message: error.message || COMMON_ERROR_MESSAGE.SOMETHING_WENT_WRONG,
					meta: error,
				}),
			);
			return;
		}
	};

	bookAppointment = async (req: Request, res: Response): Promise<void> => {
		let { serviceResponse } = req;
		const traceId = serviceResponse.traceId;
		try {
			const { seturaId, time } = req.body;
			const user = req.user as IUser;

			if (!seturaId || !time) {
				throw serviceResponse.unprocessableEntityError({
					message: 'Setura ID and Time are required',
				});
			}

			const session = await mongoose.startSession();
			session.startTransaction();

			const activeAppointment = await Appointment.findOne(
				{ aadharNo: user.aadharNo, vaccinatedAt: null, canceledAt: null },
				{ _id: 1 },
			).session(session);

			if (activeAppointment) {
				throw serviceResponse.unprocessableEntityError({
					message: 'Already has an active appointment. Complete or cancel it before booking another',
				});
			}

			const lastVaccination = await Appointment.findOne(
				{ aadharNo: user.aadharNo, vaccinatedAt: { $ne: null } },
				{ vaccinatedAt: 1 },
				{ sort: { vaccinatedAt: -1 } },
			).session(session);

			const seturaSlot = await Setura.findOne({ _id: CommonHelper.toObjectId(seturaId) })
				.populate('uhcId')
				.session(session);

			if (!seturaSlot) {
				throw serviceResponse.unprocessableEntityError({ message: 'Invalid Setura slot' });
			}

			const vaccineType = (seturaSlot.uhcId as any)?.vaccine;
			const vaccineInfo = VACCINE[vaccineType];

			if (!vaccineInfo) {
				throw serviceResponse.unprocessableEntityError({ message: 'Invalid vaccine type' });
			}

			const { dose: requiredDoses, gap: gapDays } = vaccineInfo;

			const vaccinatedDoseCount = await Appointment.countDocuments({
				aadharNo: user.aadharNo,
				vaccinatedAt: { $ne: null },
			}).session(session);

			const nextDose = vaccinatedDoseCount + 1;

			if (nextDose > requiredDoses) {
				throw serviceResponse.unprocessableEntityError({ message: 'User is fully vaccinated' });
			}

			if (nextDose > 1 && !lastVaccination) {
				throw serviceResponse.unprocessableEntityError({ message: 'User must take Dose 1 before Dose 2' });
			}

			if (lastVaccination) {
				const nextEligibleDate = moment(lastVaccination.vaccinatedAt).add(gapDays, 'days');
				if (moment().isBefore(nextEligibleDate)) {
					throw serviceResponse.unprocessableEntityError({
						message: `Next dose available after ${nextEligibleDate.format('DD-MM-YYYY')}`,
					});
				}
			}

			const now = moment();
			const currentDate = now.clone().startOf('day');
			logger.info([currentDate.toDate(), seturaSlot.date, moment(seturaSlot.date).isSame(currentDate)], 'd');
			if (moment(seturaSlot.date).isSame(currentDate)) {
				const slotHour = time.split(':')[0];
				const slotMinute = time.split(':')[1].split('-')[0];
				const slotMoment = moment().set({ hour: slotHour, minute: slotMinute, second: 0 });
				logger.info([slotHour, slotMinute, slotMoment], 'd0');

				const nextAvailableSlot = now
					.clone()
					.startOf('minute')
					.add(30 - (now.minute() % 30), 'minutes');
				logger.info({ slotMoment, nextAvailableSlot }, 'chj');
				if (slotMoment.isBefore(nextAvailableSlot)) {
					throw serviceResponse.unprocessableEntityError({
						message: 'Cannot book a past or ongoing slot. Please choose a future time slot.',
					});
				}
			}

			const slotIndex = seturaSlot.slots.findIndex(s => s.time === time);
			const selectedSlot = seturaSlot.slots[slotIndex];

			if (slotIndex === -1 || selectedSlot.remainAppointment <= 0) {
				throw serviceResponse.unprocessableEntityError({ message: 'Selected slot is fully booked' });
			}

			const [appointment] = await Appointment.create(
				[
					{
						aadharNo: user.aadharNo,
						date: seturaSlot.date,
						time,
						seturaId,
						dose: nextDose,
						userId: user._id,
						vaccine: (seturaSlot.uhcId as any)?.vaccine,
					},
				],
				{
					session,
				},
			);

			logger.info({ appointment }, 'Appointment created');

			selectedSlot.patients.push({
				userId: CommonHelper.toObjectId(user._id),
				appointmentId: CommonHelper.toObjectId(appointment._id),
				vaccinatedAt: null,
			});
			selectedSlot.remainAppointment -= 1;

			if (selectedSlot.remainAppointment === 0) {
				selectedSlot.status = SETURA_SLOT_STATUS.FULL;
			}

			await seturaSlot.save({ session });

			await session.commitTransaction();
			session.endSession();

			res.status(200).json(
				serviceResponse.success({
					message: 'Appointment booked successfully',
					data: { appointmentId: appointment._id, dose: nextDose, vaccineType, seturaId, time },
				}),
			);
		} catch (error: any) {
			logger.error(error, 'Error in booking slot');

			if (error?.session?.inTransaction?.()) {
				await error.session.abortTransaction();
				error.session.endSession();
			}

			const responseError = error?.statusCode
				? { ...error, traceId: error.traceId }
				: serviceResponse.unhandledError({
						errorCode: COMMON_ERROR_CODE.SOMETHING_WENT_WRONG,
						message: COMMON_ERROR_MESSAGE.SOMETHING_WENT_WRONG,
						meta: error,
				  });

			res.status(responseError?.statusCode || 500).json(responseError);
		}
	};

	cancelAppointment = async (req: Request, res: Response): Promise<void> => {
		const { serviceResponse } = req;
		const user = req.user as IUser;
		const userId = user._id;
		const { appointmentId } = req.body;

		if (!appointmentId) {
			res.status(400).json(serviceResponse.unprocessableEntityError({ message: 'Appointment ID is required.' }));
			return;
		}

		const session = await mongoose.startSession();
		session.startTransaction();

		try {
			const appointment = await Appointment.findOne({
				_id: CommonHelper.toObjectId(appointmentId),
				aadharNo: user?.aadharNo ?? '',
			}).session(session);

			if (!appointment) {
				res.status(404).json(serviceResponse.unprocessableEntityError({ message: 'Appointment not found.' }));
				return;
			}

			if (appointment.vaccinatedAt || appointment.canceledAt) {
				res.status(400).json(
					serviceResponse.unprocessableEntityError({ message: 'Cannot cancel this appointment.' }),
				);
				return;
			}

			const { seturaId, date, time } = appointment;

			const seturaSlot = await Setura.findOne({ _id: seturaId, date: date }).session(session);

			if (!seturaSlot) {
				res.status(404).json(serviceResponse.unprocessableEntityError({ message: 'Slot not found.' }));
				return;
			}

			const slotIndex = seturaSlot.slots.findIndex(s => s.time === time);
			if (slotIndex === -1) {
				res.status(404).json(serviceResponse.unprocessableEntityError({ message: 'Slot not found.' }));
				return;
			}

			const slot = seturaSlot.slots[slotIndex];

			const slotDateTime = moment(`${date} ${time}`, 'YYYY-MM-DD HH:mm');
			const cancellationDeadline = slotDateTime.clone().subtract(24, 'hours');

			if (moment().isAfter(cancellationDeadline)) {
				res.status(400).json(
					serviceResponse.unprocessableEntityError({
						message: 'Cannot cancel within 24 hours of the slot start time.',
					}),
				);
				return;
			}

			await Appointment.updateOne({ _id: appointmentId }, { $set: { canceledAt: new Date() } }).session(session);

			seturaSlot.slots[slotIndex].patients = seturaSlot.slots[slotIndex].patients.filter(
				p => !p.userId.equals(userId),
			);
			seturaSlot.slots[slotIndex].remainAppointment += 1;

			await seturaSlot.save({ session });

			await session.commitTransaction();
			session.endSession();

			res.status(200).json(serviceResponse.success({ message: 'Appointment canceled successfully.' }));
		} catch (error: any) {
			await session.abortTransaction();
			session.endSession();

			logger.error(error, 'Error canceling appointment');
			res.status(500).json(serviceResponse.unhandledError({ message: 'Something went wrong.', meta: error }));
		}
	};

	listAppointments = async (req: Request, res: Response): Promise<void> => {
		const { serviceResponse } = req;
		const user = req.user as IUser;
		const traceId = serviceResponse.traceId;

		try {
			const filter: any = { aadharNo: user.aadharNo };

			const { dateFrom, dateTo, vaccinated, canceled } = req.body;
			if (dateFrom || dateTo) {
				filter.createdAt = {};
				if (dateFrom) filter.createdAt.$gte = moment(dateFrom, 'DD-MM-YYYY').startOf('day').toDate();
				if (dateTo) filter.createdAt.$lte = moment(dateTo, 'DD-MM-YYYY').endOf('day').toDate();
			}

			if (vaccinated !== undefined) filter.vaccinatedAt = vaccinated ? { $ne: null } : null;
			if (canceled !== undefined) filter.canceledAt = canceled ? { $ne: null } : null;

			const options = {
				page: Number(req?.body?.page) || 1,
				limit: Number(req?.body?.limit) || 10,
				sort: req?.body?.orderBy || { createdAt: -1 },
				lean: true,
			};

			let responseData = await Appointment.paginate(filter, options);
			responseData.docs = responseData.docs.map((data: any) => UserHelper.formatListAppointment(traceId, data));
			responseData = CommonHelper.formatPaginateResponse(responseData, 'APPOINTMENT');

			const finalResponse = serviceResponse.fetched({
				message: 'Appointments fetched successfully',
				data: responseData,
			});
			res.status(finalResponse.statusCode).json(finalResponse);
		} catch (error: any) {
			logger.error(error, 'listAppointments Error');
			const exception = serviceResponse.unhandledError({
				errorCode: COMMON_ERROR_CODE.SOMETHING_WENT_WRONG,
				message: error.message || COMMON_ERROR_MESSAGE.SOMETHING_WENT_WRONG,
				meta: error,
			});
			res.status(exception?.statusCode).json(exception);
		}
	};
}
