import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../services/logger';
import Admin from '../../components/admin/admin.schema';
import { Config as ConfigSchema, IConfig } from './../../config/config.schema';
import User from '../../components/user/user.schema';
import { AuthHelper } from '../../helpers/auth.helper';
import { CommonHelper } from '../../helpers/common.helper';
import { COMPONENT_NAME } from '../../helpers/common.token';
import { SEED_RESPONSE_MESSAGE } from './seed.token';
import { defaultAdmins, defaultConfig, defaultUsers } from './dataset';
import { COMMON_ERROR_CODE, COMMON_ERROR_MESSAGE } from '../../helpers/response.status';
import { generateRedisKeyFor, RedisClient } from '../../helpers/redis.helper';
import { faker } from '@faker-js/faker';
import Uhc from '../../components/setura/schema/uhc.schema';

const COMPONENT_NAME_ARRAY = Object.values(COMPONENT_NAME);
const OTHER_SWTICH_CASE = {};
const OTHER_SWTICH_CASE_ARRAY = Object.values(OTHER_SWTICH_CASE);

const ALL_CASE_KEY = [...COMPONENT_NAME_ARRAY, ...OTHER_SWTICH_CASE_ARRAY];

const LOG_FILENAME = 'SeedController :';
const defaultPassword = '123456';

const generateUniqueAadhar = new Set<string>();
const generateUniquePhone = new Set<string>();

const metroCities = [
	{ city: 'mumbai', state: 'maharashtra', pincodeRange: [400001, 400104] },
	{ city: 'delhi', state: 'delhi', pincodeRange: [110001, 110096] },
	{ city: 'bangalore', state: 'karnataka', pincodeRange: [560001, 560103] },
	{ city: 'chennai', state: 'tamilnadu', pincodeRange: [600001, 600117] },
	{ city: 'kolkata', state: 'westbengal', pincodeRange: [700001, 700104] },
	{ city: 'hyderabad', state: 'telangana', pincodeRange: [500001, 500090] },
	{ city: 'pune', state: 'maharashtra', pincodeRange: [411001, 411057] },
	{ city: 'ahmedabad', state: 'gujarat', pincodeRange: [380001, 380060] },
];

const getRandomCityState = () => {
	const selected = faker.helpers.arrayElement(metroCities);
	const pincode = faker.number.int({ min: selected.pincodeRange[0], max: selected.pincodeRange[1] });
	return { city: selected.city, state: selected.state, pincode: pincode.toString() };
};

const generateFakeUhc = () => {
	const { city, state, pincode } = getRandomCityState();

	return {
		name: faker.company.name(),
		pincode,
		address: faker.location.streetAddress(),
		city,
		state,
		vaccine: faker.helpers.arrayElement(['covaxin', 'covishield', 'covovax']),
		isActive: true,
		slotDuration: 30,
		slotMaxAppointment: 10,
		openTime: '10:00',
		closeTime: '18:00',
		createdAt: new Date(),
	};
};

const generateFakeUser = () => {
	let aadharNo: string;
	let cellNo: string;

	do {
		aadharNo = faker.string.numeric(12);
	} while (generateUniqueAadhar.has(aadharNo));
	generateUniqueAadhar.add(aadharNo);

	do {
		cellNo = faker.string.numeric(10);
	} while (generateUniquePhone.has(cellNo));
	generateUniquePhone.add(cellNo);

	return {
		id: uuidv4(),
		name: {
			first: faker.person.firstName(),
			middle: faker.person.middleName(),
			last: faker.person.lastName(),
		},
		age: faker.number.int({ min: 18, max: 80 }),
		pincode: faker.location.zipCode('######'),
		aadharNo,
		phone: {
			code: '+91',
			cellNo,
			isVerified: faker.datatype.boolean(),
		},
		password: faker.internet.password(),
		session: [],
		isArchived: false,
		authType: {
			phone: {
				id: `+91${cellNo}`,
				isEligible: true,
				status: true,
				updatedAt: new Date(),
			},
			pw: {
				id: null,
				isEligible: true,
				status: false,
				updatedAt: new Date(),
			},
		},
		isRestricted: false,
		isBlocked: false,
		timezone: 'Asia/Kolkata',
		vaccinationStatus: faker.number.int({ min: 0, max: 6 }),
		vaccine: faker.helpers.arrayElement(['covacin', 'covishield', 'covovax']),
		createdAt: new Date(),
		updatedAt: new Date(),
	};
};
export class SeedController {
	/** Request body verification */
	index = async (req: Request, res: Response) => {
		let { serviceResponse } = req;
		try {
			let module = req?.params?.module;
			if (CommonHelper.empty(module)) {
				return res.status(200).json({
					status: 'SUCCESS',
					message: SEED_RESPONSE_MESSAGE.LIST_OF_SEEDER_PORT_MODULE_NAMES,
					modules: ALL_CASE_KEY,
				});
			}
			module = module.toLowerCase();
			switch (module) {
				case COMPONENT_NAME.ADMIN:
					for (const user of defaultAdmins) {
						user.password = await AuthHelper.generatePasswordHash(user.password);
						await Admin.create(user);
					}
					break;
				case COMPONENT_NAME.CONFIG:
					let configDetails: IConfig = await ConfigSchema.findOneAndUpdate(
						{ key: 'main' },
						{ $set: defaultConfig },
						{ upsert: true, returnDocument: 'after' },
					).exec();
					configDetails = configDetails.toObject();
					const key = generateRedisKeyFor.adminConfig();
					await RedisClient.set({ key, value: JSON.stringify(configDetails) });
					break;
				case COMPONENT_NAME.USER:
					for (const user of defaultUsers) {
						user.password = await AuthHelper.generatePasswordHash(user.password);
						await User.create(user);
					}
					break;
				// case 'users':
				// 	try {
				// 		const count = Number(req.query.count) || 1000;
				// 		const batchSize = 100;
				// 		let inserted = 0;

				// 		while (inserted < count) {
				// 			const remaining = count - inserted;
				// 			const currentBatchSize = Math.min(batchSize, remaining);

				// 			const users = Array.from({ length: currentBatchSize }, generateFakeUhc);
				// 			await Uhc.insertMany(users);

				// 			inserted += currentBatchSize;
				// 			logger.info(`Inserted ${inserted}/${count} users...`);
				// 		}

				// 		res.status(201).json({ message: `${count} fake users inserted successfully` });
				// 		return;
				// 	} catch (error) {
				// 		logger.error('Error inserting fake users:', error);
				// 		throw new Error('user insert error');
				// 	}
				// 	break;
				// case 'uhc':
				// 	try {
				// 		const count = Number(req.query.count) || 1000;
				// 		const batchSize = 100;
				// 		let inserted = 0;

				// 		while (inserted < count) {
				// 			const remaining = count - inserted;
				// 			const currentBatchSize = Math.min(batchSize, remaining);

				// 			const uhcs = Array.from({ length: currentBatchSize }, generateFakeUhc);
				// 			logger.info({ uhcs }, 'uhcs');
				// 			for (const uhc of uhcs) {
				// 				logger.info({ uhc }, 'uhc');
				// 				try {
				// 					await Uhc.create(uhc);
				// 				} catch (error: any) {
				// 					logger.error(error);
				// 				}
				// 			}

				// 			inserted += currentBatchSize;
				// 			logger.info(`Inserted ${inserted}/${count} uhcs...`);
				// 		}

				// 		res.status(201).json({ message: `${count} fake uhcs inserted successfully` });
				// 		return;
				// 	} catch (error) {
				// 		logger.error('Error inserting fake uhcs:', error);
				// 		throw new Error('something went wrong');
				// 	}
				// 	break;

				default:
					return res.status(200).json({
						status: 'SUCCESS',
						message: SEED_RESPONSE_MESSAGE.PLEASE_ENTER_CORRECT_MODULE,
						modules: ALL_CASE_KEY,
					});
			}
			const response = serviceResponse.created({
				data: { module },
				message: SEED_RESPONSE_MESSAGE.SEED_SUCCESS,
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
}
