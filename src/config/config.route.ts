import { Router } from 'express';
import { ConfigController } from './config.controller';
import { apiLimiter } from '../middleware/rateLimiter.middleware';
import { Config } from '../config';
import { DevController } from '../dev/dev.controller';

const ROUTE_PATH = {
	COUNTRIES: '/countries',
};

class ConfigRoutes {
	public configController: ConfigController = new ConfigController();
	public devController: DevController = new DevController();
	public router: Router;
	constructor() {
		this.router = Router();
		this.registerMethods();
	}

	registerMethods() {
		this.router.get(
			'/',
			apiLimiter(Config.rateLimit.windowMs, Config.rateLimit.CONFIG_MODULE),
			this.configController.index,
		);
		this.router.get(
			`${ROUTE_PATH.COUNTRIES}`,
			apiLimiter(Config.rateLimit.windowMs, Config.rateLimit.CONFIG_MODULE),
			this.configController.countryList,
		);
	}
}

export default new ConfigRoutes().router;
