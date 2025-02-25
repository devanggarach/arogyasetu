import { COMMON_ERROR_CODE, COMMON_ERROR_MESSAGE, ERROR } from '../../helpers/response.status';
import { COMPONENT_NAME } from '../../helpers/common.token';
import { ServiceResponse } from '../../helpers/serviceResponse.helper';
import { logger } from '../../services/logger';
import {
	ADMIN_DASHBOARD_TYPE_DEFINATION,
	ADMIN_USER_RESPONSE_MSG,
	REFERRAL_ADMIN_USER_TYPE_DEFINITION,
	SESSION_TYPE,
} from './admin.token';
import { ERROR_CODE, ERROR_MESSAGE } from './admin.error';

import { CommonHelper } from '../../helpers/common.helper';
import User from '../../components/user/user.schema';
import Uhc from '../../components/setura/schema/uhc.schema';

const LOG_FILENAME = 'AdminHelper :';

export class AdminHelper {
	static readonly serviceResponse = new ServiceResponse();

	static readonly exception = this.serviceResponse.databaseError({
		errorCode: COMMON_ERROR_CODE.SOMETHING_WENT_WRONG,
		message: COMMON_ERROR_MESSAGE.SOMETHING_WENT_WRONG,
		meta: {},
	});

	static readonly exceptionRequestNotAcceptable = this.serviceResponse.unprocessableEntityError({
		errorCode: ERROR_CODE.REQUEST_NOT_ACCEPTABLE,
		message: ERROR_MESSAGE.REQUEST_NOT_ACCEPTABLE,
		meta: {},
	});

	static readonly dashboard = async (traceId: string) => {
		try {
			const [users, uhcs] = await Promise.all([
				User.aggregate([
					{
						$facet: {
							totalUsers: [{ $count: 'count' }],
							vaccineStats: [
								{ $match: { vaccine: { $ne: null } } },
								{
									$group: {
										_id: { vaccine: '$vaccine', status: '$vaccinationStatus' },
										count: { $sum: 1 },
									},
								},
								{
									$group: {
										_id: '$_id.vaccine',
										partiallyVaccinated: {
											$sum: { $cond: [{ $eq: ['$_id.status', 1] }, '$count', 0] },
										},
										fullyVaccinated: {
											$sum: { $cond: [{ $gte: ['$_id.status', 2] }, '$count', 0] },
										},
										totalUsers: { $sum: '$count' },
									},
								},
								{ $sort: { totalUsers: -1 } },
								{
									$project: {
										_id: 0,
										vaccine: '$_id',
										partiallyVaccinated: 1,
										fullyVaccinated: 1,
										totalUsers: 1,
									},
								},
							],
							partiallyVaccinated: [{ $match: { vaccinationStatus: 1 } }, { $count: 'count' }],
							fullyVaccinated: [{ $match: { vaccinationStatus: { $gte: 2 } } }, { $count: 'count' }],
							notVaccinated: [{ $match: { vaccinationStatus: 0 } }, { $count: 'count' }],
							usersByAge: [
								{ $group: { _id: '$age', count: { $sum: 1 } } },
								{ $sort: { count: -1 } },
								{
									$project: {
										_id: 0,
										age: '$_id',
										count: 1,
									},
								},
							],
						},
					},
				]).exec(),
				Uhc.aggregate([
					{
						$facet: {
							totalUhcs: [
								{
									$group: {
										_id: '$vaccine',
										count: { $sum: 1 },
									},
								},
							],
						},
					},
				]),
			]);
			let resultData = {
				totalUsers: users?.[0]?.totalUsers?.[0]?.count ?? 0,
				vaccineStats: users?.[0]?.vaccineStats ?? [],
				partiallyVaccinated: users?.[0]?.partiallyVaccinated?.[0]?.count ?? 0,
				fullyVaccinated: users?.[0]?.fullyVaccinated?.[0]?.count ?? 0,
				notVaccinated: users?.[0]?.notVaccinated?.[0]?.count ?? 0,
				usersByAge: users?.[0]?.usersByAge ?? [],
				uhcStats: uhcs?.[0]?.totalUhcs ?? [],
			};
			resultData = CommonHelper.convertProperties(
				resultData,
				ADMIN_DASHBOARD_TYPE_DEFINATION,
				COMPONENT_NAME.ADMIN,
			);
			return this.serviceResponse.success({
				message: 'Found details of dashbaord',
				data: resultData,
			});
		} catch (error) {
			logger.error(error, `error - traceId: ${traceId} dashboard`);
			throw error;
		}
	};
}
