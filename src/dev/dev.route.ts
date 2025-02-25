import { Router } from 'express';
import { SeedController } from './seed/seed.controller';
import { DevController } from './dev.controller';
import { AuthHelper } from '../helpers/auth.helper';
import { apiLimiter } from '../middleware/rateLimiter.middleware';
import { Config } from '../config';

const ROUTE_PATH = {
	SEED: '/seed',
	PARAM_MODULE: '/:module',
	MAINTENANCE: '/maintenance',
};

class DevRoutes {
	public seedController: SeedController = new SeedController();
	public devController: DevController = new DevController();
	public router: Router;
	constructor() {
		this.router = Router();
		this.registerMethods();
	}

	registerMethods() {
		// migration routes will be written here
		this.router.get(
			`${ROUTE_PATH.SEED}`,
			apiLimiter(Config.rateLimit.windowMs, Config.rateLimit.CONFIG_MODULE),
			AuthHelper.authBasic,
			this.seedController.index,
		);
		this.router.get(
			`${ROUTE_PATH.SEED}${ROUTE_PATH.PARAM_MODULE}`,
			apiLimiter(Config.rateLimit.windowMs, Config.rateLimit.CONFIG_MODULE),
			AuthHelper.authBasic,
			this.seedController.index,
		);
		this.router.post(
			`${ROUTE_PATH.MAINTENANCE}`,
			apiLimiter(Config.rateLimit.windowMs, Config.rateLimit.CONFIG_MODULE),
			AuthHelper.authBasic,
			this.devController.maintenanceMode,
		);
	}
}

export default new DevRoutes().router;
