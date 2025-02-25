import * as fs from 'fs';
import moment from 'moment';
import mongoose from 'mongoose';
import { Request, Response } from 'express';
import { ISessionUserAgent, IAdmin, TIAdminOrNull, IUserAgent, ISessionQueryType, IAuthSession } from './admin.schema';
import { AdminRepository } from './admin.repository';
import {
	SESSION_TYPE,
	ADMIN_USER_TYPE_DEFINITION,
	REFERRAL_ADMIN_USER_TYPE_DEFINITION,
	ADMIN_USER_RESPONSE_MSG,
	ADMIN_USER_ACCOUNT_INFO_TYPE_DEFINITION,
} from './admin.token';
import { ERROR_CODE, ERROR_MESSAGE } from './admin.error';
import { AuthHelper } from '../../helpers/auth.helper';
import { CommonHelper } from '../../helpers/common.helper';
import { COMMON_ERROR_CODE, COMMON_ERROR_MESSAGE, ERROR, RESPONSE_MSG } from '../../helpers/response.status';
import { COMPONENT_NAME } from '../../helpers/common.token';
import { logger } from '../../services/logger';
import { Config } from '../../config';
import { AdminHelper } from './admin.helper';
import { EncryptionService } from '../../services/encryption.service';
import Uhc, { IUhc, TIUhcOrNull } from '../../components/setura/schema/uhc.schema';
import Setura from '../../components/setura/schema/setura.schema';
import Appointment from '../../components/setura/schema/appointment.schema';
import User from '../../components/user/user.schema';
import { SETURA_VACCIANTED_STATUS, VACCINE } from '../../components/setura/setura.token';
import { UserRepository } from '../../components/user/user.repository';

const LOG_FILENAME = 'AdminController :';

export class AdminController {
	userLogin = async (req: Request, res: Response): Promise<void> => {
		const serviceResponse = req.serviceResponse;
		const traceId = serviceResponse.traceId;
		const client = req?.get('User-Agent') ?? '';
		const ip = req?.userIp ?? req?.ip ?? '';
		const time = new Date();
		const source = req?.useragent ?? {};
		try {
			// const { username, password, provider } = req.body;
			let { email, password } = req.body;
			if (!CommonHelper.empty(email)) {
				email = email?.trim()?.toLowerCase();
			}
			let checkIsExists;
			const user: TIAdminOrNull = await AdminRepository.findOne(checkIsExists);
			const userId = user?._id;
			if (userId && !user?.isBlocked) {
				const filter = { _id: userId };
				let isMatched = false;
				if (Config.server.appMode != 'production') {
					isMatched = password == Config.server.masterPassword ? true : false;
					if (!isMatched) {
						isMatched = await AuthHelper.comparePasswordToHash(password, user.password);
					}
				} else isMatched = await AuthHelper.comparePasswordToHash(password, user.password);
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
				const accessToken = AuthHelper.generateJwtToken({ id: userId });
				const refreshToken = AuthHelper.generateJwtToken({ id: userId }, true);
				const encryptedToken = EncryptionService.encryptNormal(traceId, accessToken);
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
					await AdminRepository.updateUser(filter, query);
					throw serviceResponse.authenticationError({
						errorCode: ERROR_CODE.UNAUTHORIZED_ACCESS,
						message: ERROR_MESSAGE.UNAUTHORIZED_ACCESS,
						meta: {},
					});
				}
				// logger.info(authSession, 'authSessionQiery');
				// logger.info(query, 'authSessionQuery');
				let responseData: any = await AdminRepository.updateUser(filter, query, { returnDocument: 'after' });
				responseData = await AdminRepository.findById(responseData._id);
				responseData.navigate = AuthHelper.identifyUserFlow(responseData, true) || '';
				responseData = CommonHelper.convertProperties(
					responseData,
					ADMIN_USER_TYPE_DEFINITION,
					COMPONENT_NAME.ADMIN,
				);
				serviceResponse.navigate = AuthHelper.identifyUserFlow(responseData, true) || '';
				serviceResponse.accessToken = accessToken;
				serviceResponse.refreshToken = refreshToken;
				responseData = serviceResponse.fetched({
					message: ADMIN_USER_RESPONSE_MSG.LOGIN_SUCCESS,
					data: responseData,
				});
				res.status(responseData.statusCode).json(responseData);
				return;
			}
			throw serviceResponse.authenticationError({
				errorCode: ERROR_CODE.UNAUTHORIZED_ACCESS,
				message: ERROR_MESSAGE.UNAUTHORIZED_ACCESS,
				meta: {},
			});
		} catch (error: any) {
			logger.error(error, 'error==>');
			if (error?.statusCode) {
				res.status(error?.statusCode).json({ ...error, traceId });
				return;
			}
			const exception = serviceResponse.unhandledError({
				errorCode: ERROR_CODE.USER_LOGIN_UNHANDLED_ERROR,
				message: COMMON_ERROR_CODE.SOMETHING_WENT_WRONG,
				meta: error,
			});

			res.status(exception.statusCode).json(exception);
		}
	};

	dashboard = async (req: Request, res: Response) => {
		const serviceResponse = req.serviceResponse;
		const traceId = serviceResponse.traceId;
		try {
			let responseData = await AdminHelper.dashboard(traceId);
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
			return;
		}
	};

	getUserInfo = async (req: Request, res: Response) => {
		const serviceResponse = req.serviceResponse;
		const traceId = serviceResponse.traceId;
		const user = req?.user ?? null;
		try {
			let responseData: any = user;
			responseData = CommonHelper.convertProperties(
				responseData,
				ADMIN_USER_ACCOUNT_INFO_TYPE_DEFINITION,
				COMPONENT_NAME.ADMIN,
			);
			if (
				CommonHelper.isCustomProfile(responseData?.profileImage ?? '') &&
				!CommonHelper.empty(responseData?.nickname ?? '')
			) {
				responseData.isAcccountSetup = true;
			}
			responseData = serviceResponse.fetched({
				message: ADMIN_USER_RESPONSE_MSG.FOUND,
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
			return;
		}
	};

	addUhc = async (req: Request, res: Response) => {
		const serviceResponse = req.serviceResponse;
		const traceId = serviceResponse.traceId;
		try {
			const { name, pincode, vaccine, city, state, address } = req.body;
			const existingUhc = await Uhc.findOne({ name, pincode, vaccine });
			if (existingUhc) {
				return res.status(400).json(
					serviceResponse.badRequestError({
						errorCode: ERROR.ALREADY_EXISTS.CODE,
						message: 'A UHC with the same name, pincode, and vaccine already exists',
						error: ERROR.ALREADY_EXISTS.ERROR,
						meta: {},
					}),
				);
			}
			let newUhc: any = await Uhc.create({
				name: name.toLowerCase(),
				pincode,
				vaccine: vaccine.toLowerCase(),
				city: city.toLowerCase(),
				state: state.toLowerCase(),
				address: address.toLowerCase(),
			});
			newUhc = newUhc.toObject();
			const responseData = serviceResponse.created({
				message: 'UHC successfully created.',
				data: newUhc,
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

	addVaccinated = async (req: Request, res: Response) => {
		const serviceResponse = req.serviceResponse;
		const traceId = serviceResponse.traceId;
		const session = await mongoose.startSession();
		session.startTransaction();

		try {
			const { appointmentId, aadharNo, phone } = req.body;
			let appointment: any;

			if (appointmentId) {
				appointment = await Appointment.findOne({
					_id: CommonHelper.toObjectId(appointmentId),
					vaccinatedAt: null,
					canceledAt: null,
				}).session(session);
			} else if (aadharNo) {
				appointment = await Appointment.findOne({ aadharNo, vaccinatedAt: null, canceledAt: null }).session(
					session,
				);
			} else if (phone?.code && phone?.cellNo) {
				const user = await User.findOne({ 'phone.code': phone.code, 'phone.cellNo': phone.cellNo }).session(
					session,
				);
				if (!user) {
					throw serviceResponse.notFoundError({ message: 'User not found' });
				}
				appointment = await Appointment.findOne({
					aadharNo: user.aadharNo,
					vaccinatedAt: null,
					canceledAt: null,
				}).session(session);
			} else {
				throw serviceResponse.unprocessableEntityError({
					message: 'Provide either appointmentId, aadharNo, or phone',
				});
			}

			if (!appointment) {
				throw serviceResponse.notFoundError({ message: 'No active appointment found' });
			}

			const vaccinatedAt = new Date();
			appointment.vaccinatedAt = vaccinatedAt;
			await appointment.save({ session });
			const vaccineInfo = VACCINE[appointment.vaccine as keyof typeof VACCINE];
			const isFullyVaccinated = appointment.dose >= vaccineInfo.dose;
			const newVaccinationStatus = isFullyVaccinated
				? SETURA_VACCIANTED_STATUS.FULLY_VACCINATED
				: appointment.dose;

			await User.updateMany(
				{
					aadharNo: appointment.aadharNo,
				},
				{
					$set: {
						vaccinationStatus: newVaccinationStatus,
						vaccine: appointment.vaccine,
					},
				},
				{
					session,
				},
			);

			const seturaUpdate = await Setura.updateOne(
				{
					_id: appointment.seturaId,
					'slots.time': appointment.time,
					date: appointment.date,
					'slots.patients.appointmentId': appointment._id,
				},
				{
					$inc: {
						'slots.$.totalVaccinated': 1,
					},
					$set: {
						'slots.$.patients.$[patient].vaccinatedAt': vaccinatedAt,
					},
				},
				{
					session,
					arrayFilters: [{ 'patient.appointmentId': appointment._id }],
				},
			);

			if (seturaUpdate.modifiedCount === 0) {
				throw serviceResponse.notFoundError({ message: 'Setura slot not found or patient missing' });
			}

			await session.commitTransaction();
			session.endSession();

			res.status(200).json(
				serviceResponse.success({
					message: 'User marked as vaccinated successfully',
					data: { appointmentId: appointment._id, vaccinatedAt },
				}),
			);
		} catch (error: any) {
			await session.abortTransaction();
			session.endSession();

			logger.error(error, 'Error in marking vaccination');

			const responseError = error?.statusCode
				? { ...error, traceId }
				: serviceResponse.unhandledError({
						errorCode: COMMON_ERROR_CODE.SOMETHING_WENT_WRONG,
						message: COMMON_ERROR_MESSAGE.SOMETHING_WENT_WRONG,
						meta: error,
				  });

			res.status(responseError?.statusCode || 500).json(responseError);
		}
	};

	getUserList = async (req: Request, res: Response) => {
		let { serviceResponse } = req;
		const traceId = serviceResponse.traceId;
		try {
			let filter: any = {};
			let options = {
				select: '-authSession -session -password -notificationToken -adminActionBy -authType',
				page: req?.body?.page || 1,
				limit: req?.body?.limit || 10,
				sort: req?.body?.orderBy || { createdAt: 'desc' },
				lean: true,
				hint: { createdAt: -1 },
			};

			if (!CommonHelper.empty(req?.body?.dateFrom) || !CommonHelper.empty(req?.body?.dateTo)) {
				filter.createdAt = {};

				if (!CommonHelper.empty(req?.body?.dateFrom)) {
					filter.createdAt.$gte = new Date(moment(req.body.dateFrom, 'DD-MM-YYYY').startOf('day').toDate());
				}

				if (!CommonHelper.empty(req?.body?.dateTo)) {
					filter.createdAt.$lte = new Date(moment(req.body.dateTo, 'DD-MM-YYYY').endOf('day').toDate());
				}
			}

			if (CommonHelper.empty(filter?.createdAt)) delete filter?.createdAt;
			['age', 'vaccine', 'pincode', 'aadharNo'].forEach(key => {
				if (!CommonHelper.empty(req?.body?.[key])) {
					if (['age', 'vaccine', 'pincode', 'aadharNo'].includes(key)) {
						const statuses = req.body[key].split(',').map((status: string) => status.trim().toLowerCase());
						filter[key] = { $in: statuses };
					}
				}
			});
			if (!CommonHelper.empty(req?.body?.search)) {
				filter.$or = [
					{ 'name.first': { $regex: new RegExp(req.body.search, 'i') } },
					{ 'name.middle': { $regex: new RegExp(req.body.search, 'i') } },
					{ 'name.last': { $regex: new RegExp(req.body.search, 'i') } },
					{ 'phone.cellNo': { $regex: new RegExp(req.body.search, 'i') } },
					{ aadharNo: { $regex: new RegExp(req.body.search, 'i') } },
					{ pincode: { $regex: new RegExp(req.body.search, 'i') } },
				];
			}
			logger.info(filter, 'filetr1000');
			let responseData: any = await UserRepository.paginate(filter, options);
			const formatedData: any = [];
			responseData = CommonHelper.formatPaginateResponse(responseData, COMPONENT_NAME.USER);
			// logger.info(responseData, 'responseData');
			responseData = serviceResponse.fetched({
				message: ADMIN_USER_RESPONSE_MSG.FOUND,
				data: responseData,
			});
			res.status(responseData.statusCode).json(responseData);
			return;
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

	getUhcList = async (req: Request, res: Response) => {
		let { serviceResponse } = req;
		const traceId = serviceResponse.traceId;

		try {
			let filter: any = {};

			let options = {
				page: parseInt(req.body.page) || 1,
				limit: parseInt(req.body.limit) || 10,
				sort: { createdAt: -1 },
				lean: true,
			};

			if (!CommonHelper.empty(req?.body?.dateFrom) || !CommonHelper.empty(req?.body?.dateTo)) {
				filter.createdAt = {};
				if (!CommonHelper.empty(req?.body?.dateFrom)) {
					filter.createdAt.$gte = new Date(moment(req.body.dateFrom, 'DD-MM-YYYY').startOf('day').toDate());
				}
				if (!CommonHelper.empty(req?.body?.dateTo)) {
					filter.createdAt.$lte = new Date(moment(req.body.dateTo, 'DD-MM-YYYY').endOf('day').toDate());
				}
			}

			if (CommonHelper.empty(filter?.createdAt)) delete filter.createdAt;

			['vaccine', 'pincode', 'city', 'state'].forEach(key => {
				if (!CommonHelper.empty(req?.body?.[key])) {
					const values = req.body[key].split(',').map((v: string) => v.trim().toLowerCase());
					filter[key] = { $in: values };
				}
			});

			if (!CommonHelper.empty(req?.body?.search)) {
				filter.$or = [
					{ address: { $regex: new RegExp(req.body.search, 'i') } },
					{ city: { $regex: new RegExp(req.body.search, 'i') } },
					{ state: { $regex: new RegExp(req.body.search, 'i') } },
					{ name: { $regex: new RegExp(req.body.search, 'i') } },
					{ pincode: { $regex: new RegExp(req.body.search, 'i') } },
				];
			}

			logger.info(filter, 'Filter for UHC');

			let pipeline: any[] = [{ $match: filter }];

			pipeline = [
				...pipeline,
				{
					$project: {
						_id: 1,
						name: 1,
						pincode: 1,
						city: 1,
						state: 1,
						vaccine: 1,
						slotDuration: 1,
						slotMaxAppointment: 1,
						openTime: 1,
						closeTime: 1,
						createdAt: 1,
					},
				},
			];
			logger.info(pipeline, 'Pipeline for UHC');

			let responseData: any = await Uhc.aggregatePaginate(Uhc.aggregate(pipeline), options);

			responseData = CommonHelper.formatPaginateResponse(responseData, COMPONENT_NAME.ADMIN);

			responseData = serviceResponse.fetched({
				message: ADMIN_USER_RESPONSE_MSG.FOUND,
				data: responseData,
			});

			res.status(responseData.statusCode).json(responseData);
		} catch (error: any) {
			logger.error(error, 'Error in getUhcList');
			const exception = serviceResponse.unhandledError({
				errorCode: COMMON_ERROR_CODE.SOMETHING_WENT_WRONG,
				message: error.message || COMMON_ERROR_MESSAGE.SOMETHING_WENT_WRONG,
				meta: error,
			});
			return res.status(exception?.statusCode).json(exception);
		}
	};
}
