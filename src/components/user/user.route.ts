import { Router } from 'express';
import { UserController } from './user.controller';
import * as validate from './user.validate';
import { AuthHelper } from '../../helpers/auth.helper';
import { apiLimiter } from '../../middleware/rateLimiter.middleware';
import { Config } from '../../config';
// import userAccountRoute from './account/account.route';

const ROUTE_PATH = {
	CREATE: '/create',
	LOGIN: '/login',
	LOGOUT: '/logout',
	UPDATE: '/update/:type', // type: profile
	FORM: '/form',
	ACCESS: '/access',
	UPLOAD: '/upload/:type',
	SEND_OTP: '/send-otp', // type: phone
	VERIFY_OTP: '/verify-otp', // type: phone
	CHECK: '/check',
	AUTH: '/auth',
	FORGOT_PASSWORD: '/forgot-password',
	CHANGE_PASSWORD: '/change-password',
	DASHBOARD: '/dashboard',
	DEFAULT: '/default',
	PARAM_TYPE: '/:type',
	PARAM_AUTH_TYPE: '/:authType',
	VACCINE_SLOTS: '/vaccine-slots',
	BOOK_SLOT: '/book-slot',
	CANCEL_SLOT: '/cancel-slot',
	APPOINTMENT: '/appointment',
	LIST: '/list',
};

class UserRoutes {
	public router: Router;
	public userController = new UserController();
	constructor() {
		this.router = Router();
		this.registerMethods();
	}

	registerMethods() {
		this.router.get(
			ROUTE_PATH.FORM,
			apiLimiter(Config.rateLimit.windowMs, Config.rateLimit.USER_CHECK),
			this.userController.getSignupFields,
		);
		this.router.post(
			ROUTE_PATH.CREATE,
			apiLimiter(Config.rateLimit.windowMs, Config.rateLimit.USER_NESTED_DEFAULT),
			validate.create,
			this.userController.create,
		);
		this.router.post(
			ROUTE_PATH.LOGIN,
			validate.login,
			apiLimiter(Config.rateLimit.windowMs, Config.rateLimit.USER_NESTED_DEFAULT),
			this.userController.login,
		);
		this.router.post(
			ROUTE_PATH.LOGOUT,
			apiLimiter(Config.rateLimit.windowMs, Config.rateLimit.USER_NESTED_DEFAULT),
			AuthHelper.authValidate,
			validate.logout,
			this.userController.logout,
		);
		this.router.put(
			ROUTE_PATH.UPDATE,
			apiLimiter(Config.rateLimit.windowMs, Config.rateLimit.USER_NESTED_DEFAULT),
			AuthHelper.authValidate,
			this.userController.update,
		);

		this.router.post(
			`${ROUTE_PATH.DASHBOARD}`,
			apiLimiter(Config.rateLimit.windowMs, Config.rateLimit.USER_NESTED_DEFAULT),
			AuthHelper.authValidate,
			this.userController.dashboard,
		);

		this.router.post(
			ROUTE_PATH.SEND_OTP,
			apiLimiter(Config.rateLimit.windowMs, Config.rateLimit.USER_NESTED_DEFAULT),
			this.userController.sendOtp,
		);
		this.router.post(
			ROUTE_PATH.VERIFY_OTP,
			apiLimiter(Config.rateLimit.windowMs, Config.rateLimit.USER_NESTED_DEFAULT),
			this.userController.verifyOtp,
		);

		this.router.post(
			ROUTE_PATH.CHECK,
			apiLimiter(Config.rateLimit.windowMs, Config.rateLimit.USER_CHECK),
			this.userController.checkAvailability,
		);
		this.router.post(
			ROUTE_PATH.FORGOT_PASSWORD,
			apiLimiter(Config.rateLimit.windowMs, Config.rateLimit.USER_NESTED_DEFAULT),
			this.userController.forgotPassword,
		);

		this.router.post(
			ROUTE_PATH.CHANGE_PASSWORD,
			apiLimiter(Config.rateLimit.windowMs, Config.rateLimit.USER_NESTED_DEFAULT),
			AuthHelper.authValidate,
			this.userController.changePassword,
		);
		this.router.post(
			ROUTE_PATH.VACCINE_SLOTS,
			apiLimiter(Config.rateLimit.windowMs, Config.rateLimit.USER_NESTED_DEFAULT),
			AuthHelper.authValidate,
			this.userController.vaccineSlots,
		);
		this.router.post(
			ROUTE_PATH.BOOK_SLOT,
			apiLimiter(Config.rateLimit.windowMs, Config.rateLimit.USER_NESTED_DEFAULT),
			AuthHelper.authValidate,
			this.userController.bookAppointment,
		);
		this.router.post(
			`${ROUTE_PATH.APPOINTMENT}${ROUTE_PATH.LIST}`,
			apiLimiter(Config.rateLimit.windowMs, Config.rateLimit.USER_NESTED_DEFAULT),
			AuthHelper.authValidate,
			this.userController.listAppointments,
		);
		this.router.post(
			ROUTE_PATH.CANCEL_SLOT,
			apiLimiter(Config.rateLimit.windowMs, Config.rateLimit.USER_NESTED_DEFAULT),
			AuthHelper.authValidate,
			this.userController.cancelAppointment,
		);
	}
}

export default new UserRoutes().router;
