import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Config } from '../config';
import { COMMON_ERROR_CODE, COMMON_ERROR_MESSAGE } from './response.status';
import { Request, Response, NextFunction } from 'express';
import { UserRepository } from '../components/user/user.repository';
import { CommonHelper } from './common.helper';
import { logger } from '../services/logger';
import { AuthType, IAuthType, IUser } from '../components/user/user.schema';
import { IAdmin } from '../components/admin/admin.schema';
import { USER_FLOW, ROLE_NAME, ROLE_PERMISSIONS } from './common.token';
import { ServiceResponse } from './serviceResponse.helper';
import { AdminRepository } from '../components/admin/admin.repository';
import { RedisClient, generateRedisKeyFor } from './redis.helper';

import { EncryptionService } from './../services/encryption.service';

dotenv.config();

export class AuthHelper {
	// // Middleware to verify JWT token
	static readonly serviceResponse = new ServiceResponse();

	static readonly identifyUserFlow = (user: IUser, isAdmin: boolean = false): string => {
		// logger.info(user, 'identifyUserFlow==>in1');
		if (!isAdmin && !user.phone.isVerified) {
			return USER_FLOW.PHONE_VERIFICATION;
		}
		return '';
	};

	static readonly identifyAdminUserFlow = (user: IAdmin): string => {
		// logger.info(user, 'identifyAdminUserFlow==>in1');
		if (!user.email.isVerified) {
			return USER_FLOW.EMAIL_VERIFICATION;
		}
		return '';
	};

	static readonly authValidate = async (req: Request, res: Response, next: NextFunction) => {
		let decodedAuthToken: any;
		let decodedListenerAuthToken: any;
		let serviceResponse: any = req.serviceResponse;
		const traceId = serviceResponse.traceId;
		const client = req?.get('User-Agent') ?? '';
		const ip = req?.userIp ?? req?.ip ?? '';
		// logger.info({ ip }, 'ipcheck=>');
		const accessToken: string = req?.headers?.authorization?.split(' ')[1] ?? req?.headers?.authorization ?? '';
		const refreshToken: string =
			((req?.headers?.refreshtoken as string)?.split(' ')[1] || (req?.headers?.refreshtoken as string)) ?? '';
		const isAuthKeyExists = Config.isPhoneVerificationEnabled
			? await RedisClient.keyExists(
					generateRedisKeyFor.authToken(EncryptionService.encryptText(traceId, accessToken)),
			  )
			: false;
		let exception = serviceResponse.authenticationError({
			errorCode: COMMON_ERROR_CODE.UNAUTHORIZED_ACCESSS,
			message: COMMON_ERROR_MESSAGE.UNAUTHORIZED_ACCESS,
		});
		if (!accessToken || (isAuthKeyExists && req.url != '/2fa/authApp/verify')) {
			return res.status(exception.statusCode).json(exception);
		}
		try {
			decodedAuthToken = jwt.verify(accessToken, Config?.jwtAuthentication?.authKeyToSignJWT, {
				...Config?.jwtAuthentication?.signOptions,
			});
			if (!decodedAuthToken?.id) {
				return res.status(exception.statusCode).json(exception);
			}
			// we will check token is valid or not
			let user: any = await UserRepository.findById(decodedAuthToken?.id);
			// logger.info({ user, decodedAuthToken }, 'ck123');
			if (CommonHelper.empty(user) || user?.isBlocked) {
				return res.status(exception.statusCode).json(exception);
			}

			const isMatchingSession = [...(user.authSession ?? [])].some(
				(session: { client: string; token: string }) => {
					// Encrypt the traceId with the session token and compare with accessToken
					return EncryptionService.decryptNormal(traceId, session.token) === accessToken;
				},
			);
			// session.ip === ip && // future we can set ip base auth
			// logger.info({ isMatchingSession }, 'isMatcjomgSessopm');
			if (!isMatchingSession) {
				return res.status(exception.statusCode).json(exception);
			}
			delete user?.password;
			serviceResponse.navigate = this.identifyUserFlow(user) || '';
			if ([USER_FLOW.PHONE_VERIFICATION].includes(serviceResponse.navigate) && req.url != '/update/profile') {
				exception = serviceResponse.forbiddenError({
					errorCode: COMMON_ERROR_CODE.ACCESS_DENIED,
					message: COMMON_ERROR_MESSAGE.ACCESS_DENIED,
				});
				return res.status(exception.statusCode).json(exception);
			}
			req.user = user;
			next();
		} catch (error) {
			if (error instanceof jwt.TokenExpiredError) {
				try {
					const decodedRefreshToken: any = jwt.verify(
						refreshToken,
						Config.jwtAuthentication?.refreshKeyToSignJWT,
						{
							...Config?.jwtAuthentication?.refreshTokenOptions,
						},
					);
					if (!decodedRefreshToken?.id) {
						return res.status(exception.statusCode).json(exception);
					}
					// we will check token is valid or not
					let user: any = await UserRepository.findById(decodedRefreshToken.id);
					if (CommonHelper.empty(user) || user?.isBlocked) {
						return res.status(exception.statusCode).json(exception);
					}
					delete user?.password;
					req.user = user;
					serviceResponse.navigate = this.identifyUserFlow(user) || '';
					// logger.info('check==>');
					serviceResponse.accessToken = this.generateJwtToken({ id: user._id });
					serviceResponse.refreshToken = this.generateJwtToken({ id: user._id }, true);
					next();
				} catch (error) {
					if (error instanceof jwt.TokenExpiredError) {
						logger.error(
							{ traceId, error: { data: error, exception, meta: { accessToken, refreshToken } } },
							`AuthHelper | authValidate | authenticationError -> JWT token has expired`,
						);
						return res.status(exception.statusCode).json(exception);
					} else {
						logger.error(
							{ traceId, error: { data: error, meta: { accessToken, refreshToken } } },
							`AuthHelper : verifyToken : error - refreshToken`,
						);
						/*
						exception = serviceResponse.unhandledError({
							traceId,
							errorCode: COMMON_ERROR_CODE.SOMETHING_WENT_WRONG,
							message: COMMON_ERROR_CODE.SOMETHING_WENT_WRONG,
							meta: error,
						});
						*/
						return res.status(exception?.statusCode || 500).json(exception);
					}
				}
			} else {
				logger.error(
					{ traceId, error: { data: error, meta: { accessToken, refreshToken } } },
					`AuthHelper : verifyToken : error - accessToken`,
				);
				if ((error as any).name == 'JsonWebTokenError') {
					return res.status(exception.statusCode).json(exception);
				} else {
					exception = serviceResponse.unhandledError({
						traceId,
						errorCode: COMMON_ERROR_CODE.SOMETHING_WENT_WRONG,
						message: COMMON_ERROR_CODE.SOMETHING_WENT_WRONG,
						meta: error,
					});
				}
				return res.status(exception?.statusCode || 500).json(exception);
			}
		}
	};

	static readonly adminAuthValidate = async (req: Request, res: Response, next: NextFunction) => {
		let decodedAuthToken: any;
		let serviceResponse: any = req.serviceResponse;
		const traceId = serviceResponse.traceId;
		const client = req?.get('User-Agent') ?? '';
		const ip = req?.userIp ?? req?.ip ?? '';
		// logger.info({ ip }, 'ipcheck=>');
		const accessToken: string = req?.headers?.authorization?.split(' ')[1] ?? req?.headers?.authorization ?? '';
		const refreshToken: string =
			((req?.headers?.refreshtoken as string)?.split(' ')[1] || (req?.headers?.refreshtoken as string)) ?? '';
		const isAuthKeyExists = Config.isPhoneVerificationEnabled
			? await RedisClient.keyExists(
					generateRedisKeyFor.authToken(EncryptionService.encryptText(traceId, accessToken), true),
			  )
			: false;
		let exception = serviceResponse.authenticationError({
			errorCode: COMMON_ERROR_CODE.UNAUTHORIZED_ACCESSS,
			message: COMMON_ERROR_MESSAGE.UNAUTHORIZED_ACCESS,
		});
		// logger.info(accessToken, 'accessToken==>');
		// logger.info(isAuthKeyExists, 'isAuthKeyExists==>');
		// logger.info({ url: req.url, ip }, 'req.url==>');
		if (!accessToken || (isAuthKeyExists && req.url != '/2fa/authApp/verify')) {
			return res.status(exception.statusCode).json(exception);
		}
		try {
			decodedAuthToken = jwt.verify(accessToken, Config?.jwtAuthentication?.authKeyToSignJWT, {
				...Config?.jwtAuthentication?.signOptions,
			});
			// logger.info(decodedAuthToken, 'decodedAuthToken==>');
			if (!decodedAuthToken?.id) {
				return res.status(exception.statusCode).json(exception);
			}
			// we will check token is valid or not
			let user: any = await AdminRepository.findById(decodedAuthToken.id);
			if (CommonHelper.empty(user)) {
				return res.status(exception.statusCode).json(exception);
			}
			const isMatchingSession = [...(user.authSession ?? []), ...(user?.listenerSession?.system ?? [])].some(
				(session: { client: string; token: string }) => {
					// Log details for debugging
					// logger.info(
					// 	{
					// 		accessToken,
					// 		client,
					// 		clientcheck: session.client,
					// 		token: session.token,
					// 		tokenCheck: EncryptionService.decryptNormal(traceId, session.token),
					// 		traceId,
					// 	},
					// 	'checkset12',
					// );

					// Encrypt the traceId with the session token and compare with accessToken
					return EncryptionService.decryptNormal(traceId, session.token) === accessToken;
				},
			);
			// session.ip === ip && // future we can set ip base auth
			// logger.info({ isMatchingSession }, 'isMatcjomgSessopm');
			if (!isMatchingSession) {
				// logger.info('isMatcjomgSessopm reject');
				return res.status(exception.statusCode).json(exception);
			}
			delete user?.password;
			serviceResponse.navigate = this.identifyAdminUserFlow(user) || '';
			req.user = user;
			next();
		} catch (error) {
			logger.error(error, 'error==>');
			if (error instanceof jwt.TokenExpiredError) {
				try {
					const decodedRefreshToken: any = jwt.verify(
						refreshToken,
						Config.jwtAuthentication?.refreshKeyToSignJWT,
						{
							...Config?.jwtAuthentication?.refreshTokenOptions,
						},
					);
					if (!decodedRefreshToken?.id) {
						return res.status(exception.statusCode).json(exception);
					}
					// we will check token is valid or not
					let user: any = await AdminRepository.findById(decodedRefreshToken.id);
					if (CommonHelper.empty(user)) {
						return res.status(exception.statusCode).json(exception);
					}
					delete user?.password;
					req.user = user;
					// logger.info('check==>');
					serviceResponse.navigate = this.identifyAdminUserFlow(user) || '';
					serviceResponse.accessToken = this.generateJwtToken({ id: user._id });
					serviceResponse.refreshToken = this.generateJwtToken({ id: user._id }, true);
					next();
				} catch (error) {
					if (error instanceof jwt.TokenExpiredError) {
						logger.error(
							{ traceId, error: { data: error, exception, meta: { accessToken, refreshToken } } },
							`AuthHelper | adminAuthValidate | authenticationError -> JWT token has expired`,
						);
						return res.status(exception.statusCode).json(exception);
					} else {
						logger.error(
							{ traceId, error: { data: error, meta: { accessToken, refreshToken } } },
							`AuthHelper | adminAuthValidate : verifyToken : error - refreshToken`,
						);
						/*
						exception = serviceResponse.unhandledError({
							traceId,
							errorCode: COMMON_ERROR_CODE.SOMETHING_WENT_WRONG,
							message: COMMON_ERROR_CODE.SOMETHING_WENT_WRONG,
							meta: error,
						});
						*/
						return res.status(exception?.statusCode || 500).json(exception);
					}
				}
			} else {
				logger.error(
					{ traceId, error: { data: error, meta: { accessToken, refreshToken } } },
					`AuthHelper | adminAuthValidate : verifyToken : error - accessToken`,
				);
				if ((error as any).name == 'JsonWebTokenError') {
					return res.status(exception.statusCode).json(exception);
				} else {
					exception = serviceResponse.unhandledError({
						traceId,
						errorCode: COMMON_ERROR_CODE.SOMETHING_WENT_WRONG,
						message: COMMON_ERROR_CODE.SOMETHING_WENT_WRONG,
						meta: error,
					});
				}
				return res.status(exception?.statusCode || 500).json(exception);
			}
		}
	};

	// Generate Jwt Token
	static readonly generateJwtToken = (payload: any, isRefreshType: boolean = false) => {
		if (!isRefreshType)
			return jwt.sign(
				payload,
				Config?.jwtAuthentication?.authKeyToSignJWT,
				Config?.jwtAuthentication?.signOptions,
			);
		return jwt.sign(
			payload,
			Config?.jwtAuthentication?.refreshKeyToSignJWT,
			Config?.jwtAuthentication?.refreshTokenOptions,
		);
	};

	static async generatePasswordHash(plainTextPassword: string) {
		try {
			const hash = await bcrypt.hash(plainTextPassword, Config.encryption.salt);
			return hash;
		} catch (error) {
			throw this.serviceResponse.unhandledError({
				errorCode: COMMON_ERROR_CODE.SOMETHING_WENT_WRONG,
				message: COMMON_ERROR_CODE.SOMETHING_WENT_WRONG,
				meta: error,
			});
		}
	}

	static async comparePasswordToHash(plainTextPassword: string, hash: string) {
		try {
			const match = await bcrypt.compare(plainTextPassword, hash);
			// logger.info(plainTextPassword, 'text');
			// logger.info(hash, 'hash');
			// logger.info(match, 'match');
			return match;
		} catch (error) {
			throw this.serviceResponse.unhandledError({
				errorCode: COMMON_ERROR_CODE.SOMETHING_WENT_WRONG,
				message: COMMON_ERROR_CODE.SOMETHING_WENT_WRONG,
				meta: error,
			});
		}
	}

	static readonly authBasic = async (req: Request, res: Response, next: NextFunction) => {
		let serviceResponse: any = req.serviceResponse;
		const traceId = serviceResponse.traceId;
		const token: string = req?.headers?.authorization?.split(' ')[1] ?? req?.headers?.authorization ?? '';
		let exception = serviceResponse.authenticationError({
			errorCode: COMMON_ERROR_CODE.UNAUTHORIZED_ACCESSS,
			message: COMMON_ERROR_MESSAGE.UNAUTHORIZED_ACCESS,
		});
		try {
			if (token != Config.basicAuth) {
				return res.status(exception.statusCode).json(exception);
			}
			next();
		} catch (error) {
			logger.error(
				{ traceId, error: { data: error, meta: { token } } },
				`AuthHelper : authBasic : error - authorization`,
			);
			exception = serviceResponse.unhandledError({
				traceId,
				errorCode: COMMON_ERROR_CODE.SOMETHING_WENT_WRONG,
				message: COMMON_ERROR_CODE.SOMETHING_WENT_WRONG,
				meta: error,
			});
			return res.status(exception?.statusCode || 500).json(exception);
		}
	};

	static readonly checkAdminPermission = (module: string, type = 'all') => {
		logger.info({ module, type });
		return async (req: any, res: any, next: any) => {
			let serviceResponse: any = req.serviceResponse;
			const traceId = serviceResponse.traceId;
			try {
				// Assuming you have the user permission role stored in req.user.role
				const userRole = req.user.role;
				let ADMIN_ROLE: any = ROLE_PERMISSIONS;
				ADMIN_ROLE = JSON.parse(ADMIN_ROLE);
				if (userRole == ROLE_NAME.SUPER_ADMIN || (ADMIN_ROLE?.[userRole]?.[module]?.[type] ?? false)) next();
				else {
					const exception = serviceResponse.forbiddenError({
						errorCode: COMMON_ERROR_CODE.PERMISSION_DENIED,
						message: COMMON_ERROR_MESSAGE.PERMISSION_DENIED,
					});
					return res.status(exception.statusCode).json(exception);
				}
			} catch (error) {
				logger.error(
					{ traceId, error: { data: error, meta: { module, type } } },
					`AuthHelper : authBasic : error - authorization`,
				);
				const exception = serviceResponse.unhandledError({
					traceId,
					errorCode: COMMON_ERROR_CODE.SOMETHING_WENT_WRONG,
					message: COMMON_ERROR_CODE.SOMETHING_WENT_WRONG,
					meta: error,
				});
				return res.status(exception?.statusCode || 500).json(exception);
			}
		};
	};
}
