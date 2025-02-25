import { Application } from 'express';
import ConfigRoute from './config.route';
import WelcomeRoute from '../components/welcome/welcome.route';
import UserRoute from '../components/user/user.route';
import DevRoute from '../dev/dev.route';
import AdminRoute from '../components/admin/admin.route';
import { isInMaintenance } from '../middleware/inMnaintenance.middleware';

const ROUTE_PATH = {
	WELCOME: `/`,
	USER: `/user`,
	CONFIG: `/config`,
	DEV: `/dev`,
	COMMUNICATION: '/communication',
	ADMIN: `/admin`,
};

export class ApplicationConfig {
	public static registerRoute(app: Application) {
		app.use(ROUTE_PATH.CONFIG, ConfigRoute);
		app.use(ROUTE_PATH.WELCOME, WelcomeRoute);
		app.use(ROUTE_PATH.USER, isInMaintenance, UserRoute);
		app.use(ROUTE_PATH.DEV, DevRoute);
		app.use(ROUTE_PATH.ADMIN, AdminRoute);
	}
}
