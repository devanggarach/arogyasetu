import { Request, Response } from 'express';
import { logger } from '../../services/logger';

const LOG_FILENAME = 'WelcomeController :';

export class WelcomeController {
	/** Request body verification */
	index = (req: Request, res: Response): void => {
		res.status(200).json({
			status: 'SUCCESS',
			message: '🚀 Health Check 🚀',
		});
	};
}
