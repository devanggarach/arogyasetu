import path from 'path';
import { retrieveSecrets } from './services/credentials';

// File path
export const BASE_DIR_PATH = path.join(process.cwd(), '/dist');

export let Config: any = {};

export async function setEnvVariables(): Promise<void> {
	const envVariables = await retrieveSecrets();
	// console.log(envVariables, 'envvariable');
	if (!envVariables || typeof envVariables !== 'object') {
		console.error('retrieveSecrets did not return an object.');
		process.exit(0);
	}

	if (
		!envVariables.AUTH_KEY ||
		envVariables.AUTH_KEY === '' ||
		!envVariables.REFRESH_KEY ||
		envVariables.REFRESH_KEY === ''
	) {
		console.error('Please set auth and refresh key for authentication');
		process.exit(0);
	}

	const cleanBase64 = (str: string | undefined) => (str ? str.replace(/(\r\n|\n|\r|\s)/gm, '') : '');

	const authKeyBase64 = cleanBase64(envVariables.AUTH_KEY);
	const refreshKeyBase64 = cleanBase64(envVariables.REFRESH_KEY);

	const authKeyBuff = Buffer.from(authKeyBase64, 'base64');
	const refreshKeyBuff = Buffer.from(refreshKeyBase64, 'base64');
	const authKey = authKeyBuff.toString('utf8');
	const refreshKey = refreshKeyBuff.toString('utf8');
	const appConfig = {
		appName: (envVariables?.APP_NAME ?? '').trim(),
		appNameStatic: (envVariables?.APP_NAME ?? '').trim().replace(/\s+/g, '-').toLowerCase(),
		type: 'dev',
		backendBaseUrl: envVariables?.BACKEND_BASE_URL || 'http://127.0.0.1:3500',
		basicAuth: envVariables?.BASIC_AUTH_KEY,
		jwtAuthentication: {
			authKeyToSignJWT: authKey, // use this to jwt auth token
			refreshKeyToSignJWT: refreshKey, // use this to refresh token if auth token expired
			signOptions: {
				// algorithm: 'RS256',
				expiresIn: '1h', // 1 hour
			},
			refreshTokenOptions: {
				// algorithm: 'RS256',
				expiresIn: '2d', // 2 days
			},
			defaultOptions: {
				algorithm: 'RS256',
			},
		},
		server: {
			port: parseInt(envVariables.PORT, 10),
			mongoDBConnectionUrl: envVariables.DB_URL,
			appMode: envVariables.APP_MODE,
			appType: envVariables.APP_TYPE,
			masterOtp: envVariables.MASTER_OTP,
			masterPassword: envVariables.MASTER_PASSWORD || '',
			socketCors: envVariables?.SOCKET_CORS?.split(',') || '*',
			corsOrigin: envVariables?.CORS_ORIGIN?.split(','),
		},
		redis: {
			host: envVariables.REDIS_HOST || '127.0.0.1',
			port: parseInt(envVariables.REDIS_PORT, 10) || 6379,
			TTL: parseInt(envVariables.REDIS_TTL, 10) || 1, // 24 hr(1 day) other part added in redis helper
			wsTTL: (parseInt(envVariables.REDIS_TTL, 10) || 1) * 24 * 60 * 60, // custom 24 hr(1 day)
			username: envVariables.REDIS_USERNAME || '',
			password: envVariables.REDIS_PASSWORD || '',
		},
		/** Must be 256 bits (32 characters) */
		encryption: {
			key: envVariables.ENCRYPTION_KEY,
			salt: parseInt(envVariables.ENCRYPTION_SALT),
			keyLength: parseInt(envVariables.ENCRYPTION_KEY_LENGTH),
			iv: parseInt(envVariables.ENCRYPTION_IV),
			algorithm: envVariables.ENCRYPTION_ALGORITHM,
		},
		otpExpireTime: 120, // seconds
		twilio: {
			accountSid: envVariables.TWILIO_ACCOUNT_SID,
			authToken: envVariables.TWILIO_AUTH_TOKEN,
			mobileNo: '+12408835210',
			callbackUrl:
				envVariables.TWILIO_CALLBACK_URL || 'https://2ad1-183-87-214-135.ngrok-free.app/communication/message',
		},
		avatar: {
			url: 'https://api.dicebear.com/9.x/fun-emoji/svg?mouth=plain,cute,lilSmile,smileLol,smileTeeth,tongueOut,wideSmile&seed=',
		},
		isPhoneVerificationEnabled: ['1', 'true'].includes(envVariables.PHONE_VERIFICATION),
		allowSession: {
			regular: 30,
			auth: {
				all: 1,
				// mobile: 1,
				// web: 1,
			},
		},
		rateLimit: {
			windowMs: 1 * 60 * 1000, // 1 * 60 * 1000 = 1 minute
			// API wise request will be allowed require to change
			INDEX: envVariables?.DEFAULT_RATE_LIMIT ?? 50,
			USER_NESTED_DEFAULT: envVariables?.DEFAULT_RATE_LIMIT ?? 10,
			USER_CHECK: envVariables?.DEFAULT_RATE_LIMIT ?? 45,
			WELCOME_MODULE: envVariables?.DEFAULT_RATE_LIMIT ?? 10,
			CONFIG_MODULE: envVariables?.DEFAULT_RATE_LIMIT ?? 30,
			DEV_MODULE: envVariables?.DEFAULT_RATE_LIMIT ?? 1,
			ADMIN_NESTED_DEFAULT: envVariables?.DEFAULT_RATE_LIMIT ?? 10,
		},
		copyRightPolicyYear: new Date().getFullYear(),
		uhcDefault: {
			upcomingSlot: 10, // days
			slotDuration: 30,
			slotMaxAppointment: 10,
			openTime: '10:00',
			closeTime: '18:30',
		},
		timezone: envVariables.TZ || 'Asia/Kolkata',
		XFLUTTERAPP: 'x-flutter-app',
	};
	Object.assign(Config, appConfig);
	if (!Config.encryption.key) {
		console.error('Please add ENCRYPTION_KEY environment variable');
		process.exit(0);
	}
}
