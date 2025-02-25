import moment from 'moment';
import { Config } from '../../config';
const getDate = (days: number) => moment().add(days, 'days');

export const defaultConfig = {
	key: Config.appName,
	inMaintenance: false,
	maintenanceNote: '',
};
const defaultPassword = 'gX7#vLq!9bT@zK2mNp$W5dY&Cf';
export const defaultUsers = [
	{
		username: 'deva',
		phone: { code: '+91', cellNo: '8460352521', isVerified: true },
		password: defaultPassword,
		[`authType.phone`]: {
			id: `+918460352521`,
			isEligible: true,
			status: true,
			updatedAt: new Date(),
		},
		[`authType.pw`]: {
			id: null,
			isEligible: true,
			status: false,
			updatedAt: null,
		},
	},
	{
		username: 'devang',
		phone: { code: '+91', cellNo: '8460352525', isVerified: true },
		[`authType.phone`]: {
			id: `+918460352525`,
			isEligible: true,
			status: true,
			updatedAt: new Date(),
		},
		[`authType.pw`]: {
			id: null,
			isEligible: true,
			status: true,
			updatedAt: null,
		},
		password: defaultPassword,
	},
];

export const defaultAdmins = [
	{
		email: { id: 'rutakshi@runo.in' },
		[`authType.email`]: {
			id: 'rutakshi@runo.in',
			isEligible: true,
			status: true,
			updatedAt: new Date(),
		},
		[`authType.pw`]: {
			id: null,
			isEligible: true,
			status: false,
			updatedAt: null,
		},
		password: defaultPassword,
	},
];
