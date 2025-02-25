import { Router } from 'express';
import { WelcomeController } from './welcome.controller';
import { apiLimiter } from '../../middleware/rateLimiter.middleware';
import { Config } from '../../config';

class WelcomeRoutes {
	public welcomeController: WelcomeController = new WelcomeController();
	public router: Router;
	constructor() {
		this.router = Router();
		this.registerMethods();
	}

	registerMethods() {
		this.router.get(
			'/',
			apiLimiter(Config.rateLimit.windowMs, Config.rateLimit.WELCOME_MODULE),
			this.welcomeController.index,
		);
	}
}

export default new WelcomeRoutes().router;
