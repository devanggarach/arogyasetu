// express.d.ts
import express, { Request, Response } from 'express';
import { IUser } from '../src/components/user/user.schema';
import { IAdmin } from '../src/components/admin/admin.schema';

declare global {
	namespace Express {
		export interface Request {
			userIp: any;
			user: IUser | IAdmin;
			serviceResponse: any;
			skipLogging: boolean;
		}
	}
}
