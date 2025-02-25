import { Router } from 'express';
import { AdminController } from './admin.controller';
import * as validate from './admin.validate';
import { AuthHelper } from '../../helpers/auth.helper';
import { MODULE_NAME, PERMISSION_TYPES } from '../../helpers/common.token';
import { apiLimiter } from '../../middleware/rateLimiter.middleware';
import { Config } from '../../config';

const ROUTE_PATH = {
	DASHBOARD: '/dashboard',
	LOGIN: '/login',
	DEFAULT: '/default',
	PARAM_TYPE: '/:type',
	ACCOUNT: '/account',
	INFO: '/info',
	ADD: '/add',
	UHC: '/uhc',
	VACCINATED: '/vaccinated',
	PATIENT: '/patient',
	LIST: '/list',
};

class AdminRoutes {
	public router: Router;
	public adminController = new AdminController();
	constructor() {
		this.router = Router();
		this.registerMethods();
	}

	registerMethods() {
		this.router.get(
			`${ROUTE_PATH.DASHBOARD}`,
			apiLimiter(Config.rateLimit.windowMs, Config.rateLimit.ADMIN_NESTED_DEFAULT),
			AuthHelper.adminAuthValidate,
			this.adminController.dashboard,
		);
		this.router.get(
			`${ROUTE_PATH.ACCOUNT}${ROUTE_PATH.INFO}`,
			apiLimiter(Config.rateLimit.windowMs, Config.rateLimit.ADMIN_NESTED_DEFAULT),
			AuthHelper.adminAuthValidate,
			this.adminController.getUserInfo,
		);
		this.router.post(
			`${ROUTE_PATH.LOGIN}`,
			apiLimiter(Config.rateLimit.windowMs, Config.rateLimit.ADMIN_NESTED_DEFAULT),
			validate.login,
			this.adminController.userLogin,
		);
		this.router.post(
			`${ROUTE_PATH.ADD}${ROUTE_PATH.UHC}`,
			AuthHelper.adminAuthValidate,
			apiLimiter(Config.rateLimit.windowMs, Config.rateLimit.ADMIN_NESTED_DEFAULT),
			validate.validateAddUhc,
			this.adminController.addUhc,
		);
		this.router.post(
			`${ROUTE_PATH.ADD}${ROUTE_PATH.VACCINATED}`,
			apiLimiter(Config.rateLimit.windowMs, Config.rateLimit.ADMIN_NESTED_DEFAULT),
			AuthHelper.adminAuthValidate,
			this.adminController.addVaccinated,
		);
		this.router.post(
			`${ROUTE_PATH.PATIENT}${ROUTE_PATH.LIST}`,
			apiLimiter(Config.rateLimit.windowMs, Config.rateLimit.ADMIN_NESTED_DEFAULT),
			AuthHelper.adminAuthValidate,
			this.adminController.getUserList,
		);
		this.router.post(
			`${ROUTE_PATH.UHC}${ROUTE_PATH.LIST}`,
			apiLimiter(Config.rateLimit.windowMs, Config.rateLimit.ADMIN_NESTED_DEFAULT),
			AuthHelper.adminAuthValidate,
			this.adminController.getUhcList,
		);
	}
}

export default new AdminRoutes().router;
