import { Types } from 'mongoose';
import crypto from 'crypto';
import { IUserAgent } from '../components/user/user.schema';
import moment from 'moment';
import { Config } from '../config';
import { COMPONENT_NAME, PAGINATE_RECORD_TYPE_DEFINATION, ROLE_PERMISSIONS } from './common.token';
import { logger } from '../services/logger';
import { COMMON_ERROR_CODE, COMMON_ERROR_MESSAGE } from './response.status';
import { ServiceResponse } from './serviceResponse.helper';
import { generateRedisKeyFor, RedisClient } from './redis.helper';

const verhoeffTableD = [
	[0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
	[1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
	[2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
	[3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
	[4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
	[5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
	[6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
	[7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
	[8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
	[9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
];

const verhoeffTableP = [
	[0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
	[1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
	[2, 8, 6, 7, 1, 9, 4, 3, 0, 5],
	[3, 9, 8, 0, 5, 2, 7, 6, 4, 1],
	[4, 3, 0, 9, 7, 6, 1, 5, 2, 8],
	[5, 4, 3, 8, 9, 7, 0, 2, 1, 6],
	[6, 2, 1, 4, 3, 0, 8, 9, 5, 7],
	[7, 6, 5, 2, 0, 4, 9, 8, 3, 1],
	[8, 7, 9, 5, 6, 1, 2, 4, 8, 0],
	[9, 0, 4, 1, 8, 3, 5, 7, 6, 2],
];

const verhoeffTableInv = [0, 4, 3, 2, 1, 5, 6, 7, 8, 9];

export class CommonHelper {
	static readonly serviceResponse = new ServiceResponse();

	static readonly getTrim = (data: any) => {
		return !this.empty(data) && typeof data === 'string' ? data.trim() : data;
	};

	static readonly empty = (data: any) => {
		if (
			[undefined, 'undefined', null, 'null', ''].includes(data) ||
			(typeof data === 'object' && Object?.keys(data)?.length === 0)
		)
			return true;
		return typeof data === 'string' && !data.trim().length;
	};

	static readonly getNaturalNo = (value: any) => {
		return this.empty(value) || value < 0 ? 0 : value;
	};

	static readonly getPercent = (amount: number | string, percent: number | string = 0) => {
		amount = this.getNum(amount);
		percent = this.getNum(percent);
		if (percent == 0 || amount == 0) return 0;
		return this.getFixedDecimal((amount * this.getNaturalNo(percent)) / 100);
	};

	static readonly getBool = (value: any, defaultValue = false) => {
		value = this.getTrim(value);
		if (this.empty(value)) value = defaultValue;
		if (['false', false, 0, '0'].includes(value)) return false;
		if (['true', true, 1, '1'].includes(value)) return true;
		return defaultValue;
	};

	static readonly getFixedDecimal = (value: any, fractionDigits: number = 6): number => {
		if (typeof value === 'object') value = Number(value);
		if (typeof value === 'string') value = Number(value);
		return (value || 0).toFixed(fractionDigits);
	};

	static readonly getOTPExpireBool = (otp: any, defaultValue = false) => {
		if (!otp?.email?.value && !otp?.phone?.value) return defaultValue;
		if (otp?.email?.timestamp || otp?.phone?.timestamp) {
			return !this.isOTPExpired(otp?.email?.timestamp ?? otp?.phone?.timestamp, Config.otpExpireTime);
		}
		return defaultValue;
	};

	// Get Str (convert value into string return default value string)
	static readonly getStr = (value: any, defaultValue = '') => {
		value = this.getTrim(value);
		if (this.empty(value)) value = defaultValue;
		if (typeof value !== 'object') return value + '';
		return defaultValue;
	};

	static readonly getBigIntToStr = (value: any, defaultValue = '') => {
		value = this.getTrim(value);

		if (this.empty(value)) value = defaultValue;

		if (typeof value === 'number') {
			return value.toFixed(18).replace(/\.?0+$/, '');
		}

		if (typeof value !== 'object') return value + '';

		return defaultValue;
	};

	// Get mongo objectId to string
	static readonly getObjectIdStr = (value: Types.ObjectId | string | null, defaultValue = '') => {
		return value == null ? defaultValue : value?.toString();
	};

	// Get Num
	static readonly getNum = (value: any, defaultVal = 0) => {
		return isFinite(value) ? +value : defaultVal;
	};

	// Get Date format
	static readonly getDateFormat = (
		date: Date | string,
		component: string = '',
		format = 'DD MMM YYYY HH:mm [IST]',
	) => {
		try {
			const validDate = moment(new Date(date));
			if (date == null || !validDate.isValid()) return '';
			switch (component) {
				case COMPONENT_NAME.USER:
					return validDate.format('DD-MM-YYYY');
				default:
					return validDate.format(format);
			}
		} catch (e) {
			return '';
		}
	};

	static readonly getTimeSince = (date: Date | string, component: string = '') => {
		try {
			const validDate = moment(new Date(date));
			if (date == null || !validDate.isValid()) return '';
			switch (component) {
				case COMPONENT_NAME.USER:
					return CommonHelper.timeSince(date);
				default:
					return CommonHelper.timeSince(date);
			}
		} catch (e) {
			return '';
		}
	};

	static readonly getDateTimeFormat = (
		date: Date | string | number,
		component: string = '',
		format = 'DD MMM YYYY HH:mm [IST]',
	) => {
		// logger.info({ typ: typeof date, date, component }, 'datetypeofocom');
		date = typeof date == 'number' ? new Date(date) : date;
		try {
			switch (component) {
				case COMPONENT_NAME.USER:
				default:
					return this.empty(date.toString()) ? '' : moment(date, 'YYYY-MM-DDTHH:mm:ss.SSS').format(format);
			}
		} catch (e) {
			return '';
		}
	};

	static readonly getUtcDate = (value: any) => {
		return !this.empty(value) ? `${this.getDateFormat(value, '', 'YYYY-MM-DD')}T00:00` : null;
	};

	// Check Value is number or not
	static readonly isNumber = (value: unknown): boolean => {
		return typeof value === 'number' && !isNaN(value);
	};

	static readonly isObjectId = (value: any): boolean => {
		return Types.ObjectId.isValid(value);
	};

	static readonly convertArrayOfObjectProperties = (
		key: any,
		inputObj: any,
		typeDefinition: any,
		component: string,
	) => {
		// If the type definition is an array and the input is an array
		let output = [];
		for (const element of inputObj[key]) {
			if (typeof typeDefinition[0] === 'object') {
				// If the type definition is an object, recursively convert properties
				output.push(this.convertProperties(element, typeDefinition[0], component));
			} else {
				// Use the specified type for each element
				output.push(this.convertValue(key, element, typeDefinition[0], component));
			}
		}
		return output;
	};

	static convertObjectProperties(inputObj: any, typeDefinitions: any, component: string): any {
		let outputObj: any = {};

		for (const key in inputObj) {
			const typeDefinition = typeDefinitions[key];
			if (key === 'password' || this.empty(typeDefinition)) continue;
			if (Array.isArray(typeDefinition) && Array.isArray(inputObj[key])) {
				// If the type definition is an array and the input is an array
				outputObj[key] = this.convertArrayOfObjectProperties(key, inputObj, typeDefinition, component);
			} else if (typeof typeDefinition === 'object') {
				// If the type definition is an object, recursively convert properties
				outputObj[key] = this.convertProperties(inputObj[key], typeDefinition, component);
			} else {
				// Use the specified type for the current property
				outputObj[key] =
					key == 'profileImage' && inputObj[key]?.startsWith('http')
						? inputObj[key]
						: key == 'profileImage' && inputObj[key] == null
						? `${Config.avatar.url}${outputObj['username'] || 'happy'}`
						: this.convertValue(key, inputObj[key], typeDefinition, component);
			}
		}
		return outputObj;
	}

	static convertProperties(inputObj: any, typeDefinitions: any, component: string): any {
		if (Array.isArray(inputObj)) {
			// If the inputObj is an array, recursively process each element
			const outputArray = [];
			for (const item of inputObj) {
				outputArray.push(this.convertProperties(item, typeDefinitions, component));
			}
			return outputArray;
		} else if (typeof inputObj === 'object') {
			if (inputObj == null) return this.convertObjectProperties(typeDefinitions, typeDefinitions, component);
			return this.convertObjectProperties(inputObj, typeDefinitions, component);
		} else {
			return inputObj;
		}
	}

	static readonly convertValue = (key: string, value: any, type: string, component: string) => {
		if (type == value) return '';
		switch (type) {
			case 'string':
				return this.getStr(value);
			case 'number':
				return this.getNum(value);
			case 'numberFormat':
				return (this.getFixedDecimal(value) || 0).toString();
			case 'boolean':
				return this.getBool(value);
			case 'date':
				return this.getDateFormat(value, component);
			case 'timesince':
				return this.getTimeSince(value, component);
			case 'time':
				return this.getDateTimeFormat(value, component);
			case 'objectId':
				return this.getObjectIdStr(value);
			case 'otp':
				logger.info(value, 'otp value and timestamp');
				return this.getOTPExpireBool(value);
			default:
				return value;
		}
	};

	// To Object Id
	static readonly toObjectId = (id: string) => {
		return new Types.ObjectId(id);
	};

	// To List
	static readonly toList = (value: any, isObjectId: boolean = false) => {
		if (this.empty(value)) return [];
		value = value.trim().split(',');
		let newList: any = [];
		value.forEach((v: any) => {
			if (!this.empty(v) && !this.empty(v.trim())) newList.push(isObjectId ? this.toObjectId(v) : v);
		});
		return newList;
	};

	// Format Req Files
	static readonly formatReqFiles = (req: any) => {
		let files = req?.files;
		if (!this.empty(files)) {
			if (Array.isArray(files)) {
				files.forEach((r, i) => {
					if (this.empty(files[i].filename) && this.empty(r.src)) files[i].filename = r.key;
					// if (empty(r.src)) files[i].filename = r.key;
				});
			} else {
				let keys = Object.keys(files);
				keys.forEach(k => {
					if (!this.empty(files[k])) {
						files[k].forEach((r: any, i: any) => {
							if (this.empty(files[k][i].filename) && this.empty(r.filename))
								files[k][i].filename = r.key;
							// if (empty(r.filename)) files[k][i].filename = r.key;
						});
					}
				});
			}
		}
		req.files = files;

		let file = req.file;
		if (!this.empty(file)) {
			if (this.empty(file.filename)) file.filename = file.key;
		}
		req.file = file;

		return req;
	};

	// Flip On Key
	static readonly flipOnKey = (record: any, keyName: any = '_id') => {
		if (this.empty(record)) return {};
		let newRecord: any = {};
		record.forEach((r: any) => {
			if (r) newRecord[r[keyName]] = r;
		});
		return newRecord;
	};

	static generateOTP() {
		if (Config.server.appMode != 'production') {
			return Config.server.masterOtp;
		}
		const otp = (crypto.randomBytes(3).readUInt16BE(0) % 1000000).toString().padStart(6, '0');
		logger.info(otp, 'Generated OTP');
		return otp;
	}

	static isOTPExpired(timestamp: Date, expirationTimeInMinutes: number) {
		const otpTimestamp = moment(timestamp);
		const currentTime = moment();
		const secondDifference = currentTime.diff(otpTimestamp, 'seconds');
		return secondDifference > expirationTimeInMinutes; // it returns true if otp is expired
	}

	static calculateExpiryInSeconds(expiryDate: Date | string) {
		// Parse the expiry date string into a Date object
		const expiryDateTime: Date = new Date(expiryDate);

		// Get the current time
		const currentTime: Date = new Date();

		// Calculate the time difference in milliseconds
		const timeDifference: number = expiryDateTime.getTime() - currentTime.getTime();

		// Convert the time difference to seconds
		const expiryInSeconds: number = Math.floor(timeDifference / 1000);

		return expiryInSeconds;
	}

	static readonly filterObjectValuesToString = (obj: any): any => {
		const filteredValues: any = {};

		for (const [key, value] of Object.entries(obj)) {
			filteredValues[key] = value !== undefined && value !== null ? String(value) : '';
		}

		return filteredValues;
	};

	static readonly filterUserAgentDetails = (userAgent: Partial<IUserAgent>): IUserAgent => {
		const details: IUserAgent = {
			version: userAgent?.version ?? '',
			browser: userAgent?.browser ?? '',
			os: userAgent?.os ?? '',
			source: userAgent?.source ?? '',
			geoIp: userAgent?.geoIp ?? {},
			device: 'Desktop',
		};
		const trueValues = Object.entries(userAgent)
			.filter(([key, value]) => value === true)
			.map(([key]) => key.replace(/^is/, ''));
		details.device = trueValues.length > 0 ? trueValues.join(', ') : 'Desktop';
		return details;
	};

	static readonly mergePropertiesTakeKeyFromObj = <T extends Record<string, any>>(
		resultFromObj: T,
		takeKeyFromObj: Partial<T>,
	): Partial<T> => {
		const mergedObj: Partial<T> = {};
		for (const key in takeKeyFromObj) {
			if (resultFromObj.hasOwnProperty(key)) {
				mergedObj[key] = resultFromObj[key];
			}
		}
		return mergedObj;
	};

	static readonly convertValuesToStringify = (obj: Record<string, any>): Record<string, string> => {
		const result: Record<string, string> = {};
		for (const key in obj) {
			if (obj.hasOwnProperty(key)) {
				const value = obj[key];
				if (Types.ObjectId.isValid(value) && value instanceof Types.ObjectId) {
					result[key] = value.toString();
				} else if (value instanceof Date) {
					result[key] = value.toISOString();
				} else if (typeof value === 'boolean') {
					result[key] = value ? '1' : '0';
				} else if (value !== null && typeof value === 'object') {
					result[key] = JSON.stringify(value);
				} else {
					result[key] = String(value);
				}
			}
		}
		return result;
	};

	static readonly validateStep = (amount: string, step: string | number): boolean => {
		logger.info({ amount, step }, 'validateStep');
		const stepValue = typeof step === 'string' ? parseFloat(step) : step;
		if (stepValue <= 0 || isNaN(stepValue)) return false;
		const stepPrecision = stepValue.toString().includes('.') ? stepValue.toString().split('.')[1]?.length || 0 : 0;
		const amountPrecision = amount.toString().includes('.') ? amount.split('.')[1]?.length || 0 : 0;
		if (amountPrecision > stepPrecision) {
			const trimmedAmount = parseFloat(parseFloat(amount).toFixed(stepPrecision)); // Ensure toFixed is applied on a valid number
			if (trimmedAmount != parseFloat(amount)) {
				logger.error({ amount, step, reason: 'Exceeds step precision' }, 'validateStep');
				return false;
			}
		}

		const scaledAmount = Math.round(parseFloat(amount) * Math.pow(10, stepPrecision));
		const scaledStep = Math.round(stepValue * Math.pow(10, stepPrecision));

		const isDivisible = scaledAmount % scaledStep === 0;

		logger.info(
			{ amount, step, stepPrecision, amountPrecision, scaledAmount, scaledStep, isDivisible },
			'validateStep',
		);
		return isDivisible;
	};

	static readonly addPercentage = (amount: number, percent: number): number => {
		if (amount == 0) return 0;
		if (percent == 0) return amount;
		const percentageValue = (amount * percent) / 100;
		return amount + percentageValue;
	};

	static readonly isCustomProfile = (profileImage: string) => {
		if (profileImage && profileImage.startsWith(Config.avatar.url)) {
			return false;
		}
		return true;
	};

	static readonly parseJSON = (data: string): any => {
		return JSON.parse(data ?? '{}');
	};

	static readonly getDecimalPlaces = (num: number): number => {
		if (num % 1 !== 0) {
			return num.toString().split('.')[1].length;
		}
		return 0;
	};

	static readonly formatPaginateResponse = (data: any, component: string) => {
		const formatedData = {
			data: data.docs,
			total: data.totalDocs,
			pages: data.totalPages,
			limit: data.limit,
			page: data.page,
		};

		const result = CommonHelper.convertProperties(formatedData, PAGINATE_RECORD_TYPE_DEFINATION, component);
		return result;
	};

	static readonly toDateObject = (input: string | Date): Date => {
		const date = input instanceof Date ? input : new Date(input);
		if (isNaN(date.getTime())) {
			logger.error(`CommonHelper::toDateObject:Invalid date: ${input}`);
			return new Date();
		}
		return date;
	};

	static readonly isValidUrl = (path: string): boolean => {
		try {
			new URL(path);
			return true;
		} catch (error) {
			return false;
		}
	};

	static readonly convertUtcToIstUnix = (utcTimestamp: number): number => {
		const utcDate = new Date(utcTimestamp * 1000);
		const localTime = new Date(utcDate.toLocaleString());
		return Math.floor(localTime.getTime() / 1000);
	};

	static readonly timeSince = (date: Date | string): string => {
		if (!date) return '';

		const parsedDate = typeof date === 'string' ? new Date(date) : date;

		if (isNaN(parsedDate.getTime())) return '';

		const now = new Date();
		const diffInSeconds = Math.floor((now.getTime() - parsedDate.getTime()) / 1000);

		const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

		const timeUnits: { unit: 'year' | 'month' | 'day' | 'hour' | 'minute' | 'second'; seconds: number }[] = [
			{ unit: 'year', seconds: 31536000 },
			{ unit: 'month', seconds: 2592000 },
			{ unit: 'day', seconds: 86400 },
			{ unit: 'hour', seconds: 3600 },
			{ unit: 'minute', seconds: 60 },
			{ unit: 'second', seconds: 1 },
		];

		if (diffInSeconds < 0) {
			const futureDiffInSeconds = Math.abs(diffInSeconds);

			for (const { unit, seconds } of timeUnits) {
				const interval = futureDiffInSeconds / seconds;
				if (interval >= 1) {
					return `in ${Math.floor(interval)} ${unit}${Math.floor(interval) > 1 ? 's' : ''}`;
				}
			}
		}

		for (const { unit, seconds } of timeUnits) {
			const interval = diffInSeconds / seconds;
			if (interval >= 1) {
				return rtf.format(-Math.floor(interval), unit as Intl.RelativeTimeFormatUnit);
			}
		}

		return rtf.format(0, 'second');
	};

	static readonly convertToNumber = (value: any) => {
		if (typeof value === 'string' && !isNaN(parseFloat(value))) {
			return parseFloat(value);
		}
		if (typeof value === 'number') {
			return value;
		}
		return value;
	};

	static readonly validateAndConvertObjectToNumber = (obj: any) => {
		if (typeof obj === 'object' && obj !== null) {
			const result: any = {};
			for (const key in obj) {
				result[key] = this.convertToNumber(obj[key]);
			}
			return result;
		}
		return obj;
	};

	static readonly validateVerhoeff = (num: string): boolean => {
		let c = 0;
		const numArr = num.split('').reverse().map(Number);

		for (let i = 0; i < numArr.length; i++) {
			c = verhoeffTableD[c][verhoeffTableP[i % 8][numArr[i]]];
		}

		return c === 0;
	};

	static readonly isValidAadhaar = (aadhaar: string): boolean => {
		const aadhaarRegex = /^\d{12}$/;
		if (!aadhaarRegex.test(aadhaar)) {
			return false;
		}
		return !this.validateVerhoeff(aadhaar); // check verhoeff algo
	};

	static readonly pincodeRegex = /^[1-9][0-9]{5}$/;
}
