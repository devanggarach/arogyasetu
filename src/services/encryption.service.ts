import crypto from 'crypto';
import { COMMON_ERROR_CODE } from '../helpers/response.status';
import { Config } from './../config';
import { ServiceResponse } from './../helpers/serviceResponse.helper';
import { logger } from './logger';

const serviceResponse = new ServiceResponse();

export class EncryptionService {
	private static readonly algorithm = Config.encryption.algorithm;
	private static readonly key = Buffer.from(Config.encryption.key, 'hex'); // Ensure this is 32 bytes for AES-256
	private static readonly ivLength = Config.encryption.iv; // For AES, the IV length is always 16 bytes

	static readonly encryptNormal = (traceId: string, text: string): string => {
		try {
			// logger.info(`got ${this.key.length} bytes typeof ${typeof this.key}.`);
			if (this.key.length != Config.encryption.keyLength) {
				throw new Error(`Invalid key length. Expected 32 bytes but got ${this.key.length} bytes.`);
			}
			const iv = crypto.randomBytes(this.ivLength);
			const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
			let encrypted = cipher.update(text, 'utf8', 'hex');
			encrypted += cipher.final('hex');
			// Return IV and encrypted data separated by a colon
			return iv.toString('hex') + ':' + encrypted;
		} catch (error) {
			logger.info(error, 'error');
			const exception = serviceResponse.unhandledError({
				traceId,
				errorCode: COMMON_ERROR_CODE.SOMETHING_WENT_WRONG,
				message: COMMON_ERROR_CODE.SOMETHING_WENT_WRONG,
				meta: error,
			});
			logger.error(exception, 'error-at-EncryptionService:encryptNormal');
			throw exception;
		}
	};

	static readonly decryptNormal = (traceId: string, cipherText: string): string => {
		try {
			if (this.key.length != Config.encryption.keyLength) {
				throw new Error(`Invalid key length. Expected 32 bytes but got ${this.key.length} bytes.`);
			}
			const textParts = cipherText.split(':');
			// logger.info(textParts, 'testParts');
			if (textParts.length !== 2) {
				throw new Error('Invalid cipherText format.');
			}
			const iv = Buffer.from(textParts.shift()!, 'hex');
			const encryptedText = textParts.join(':');
			const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
			let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
			decrypted += decipher.final('utf8');
			return decrypted;
		} catch (error) {
			logger.info(error, 'error');
			const exception = serviceResponse.unhandledError({
				traceId,
				errorCode: COMMON_ERROR_CODE.SOMETHING_WENT_WRONG,
				message: COMMON_ERROR_CODE.SOMETHING_WENT_WRONG,
				meta: error,
			});
			logger.error(exception, 'error-at-EncryptionService:decryptNormal');
			throw exception;
		}
	};

	static readonly encryptText = (traceId: string, text: string): string => {
		try {
			if (this.key.length != Config.encryption.keyLength) {
				throw new Error(`Invalid key length. Expected 32 bytes but got ${this.key.length} bytes.`);
			}
			const iv = Buffer.alloc(this.ivLength, 0);
			const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
			let encrypted = cipher.update(text, 'utf8', 'hex');
			encrypted += cipher.final('hex');
			return encrypted;
		} catch (error) {
			logger.info(error, 'error');
			const exception = serviceResponse.unhandledError({
				traceId,
				errorCode: COMMON_ERROR_CODE.SOMETHING_WENT_WRONG,
				message: COMMON_ERROR_CODE.SOMETHING_WENT_WRONG,
				meta: error,
			});
			logger.error(exception, 'error-at-EncryptionService:encryptText');
			throw exception;
		}
	};

	static readonly decryptText = (traceId: string, cipherText: string): string => {
		try {
			if (this.key.length !== Config.encryption.keyLength) {
				throw new Error(`Invalid key length. Expected 32 bytes but got ${this.key.length} bytes.`);
			}
			const iv = Buffer.alloc(this.ivLength, 0);
			const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
			let decrypted = decipher.update(cipherText, 'hex', 'utf8');
			decrypted += decipher.final('utf8');
			return decrypted;
		} catch (error) {
			logger.info(error, 'error');
			const exception = serviceResponse.unhandledError({
				traceId,
				errorCode: COMMON_ERROR_CODE.SOMETHING_WENT_WRONG,
				message: COMMON_ERROR_CODE.SOMETHING_WENT_WRONG,
				meta: error,
			});
			logger.error(exception, 'error-at-EncryptionService:decryptText');
			throw exception;
		}
	};
}
