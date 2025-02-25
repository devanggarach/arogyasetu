import { INotificationToken } from 'components/user/user.schema';
import { COMMUNICATION_TYPE, PID_TYPE, PID_VALUE } from '../../config/config.token';
import { logger } from '../../services/logger';
import { ISendSmsInput, sendSmsTwilio } from '../../services/twilio';
import * as SmsTemplate from '../communication/templates/sms/index';
import { Schema } from 'mongoose';

export const sendSms = async (
	traceId: string,
	userId: string | null,
	{ contentType, content, to, from }: ISendSmsInput,
) => {
	try {
		return await sendSmsTwilio(traceId, userId, {
			contentType,
			content,
			to,
			from,
		});
	} catch (error) {
		logger.error(error, 'errror02');
		logger.error(
			{ traceId, error: { error, meta: { userId, contentType, to, from } } },
			`CommunicaitonHelper : sendSms : error - error while sending sms`,
		);
		return;
	}
};

export const generateSmsContent = (pid: number, to: string, meta: any) => {
	switch (pid) {
		case PID_VALUE.DEMO: // demo
			return {
				contentType: PID_TYPE[PID_VALUE.DEMO],
				content: SmsTemplate.demoSmsOtp(meta?.phone?.value),
				to,
			};

		case PID_VALUE.SIGNUP: // signup
			return {
				contentType: PID_TYPE[PID_VALUE.SIGNUP],
				content: SmsTemplate.demoSmsOtp(meta?.phone?.value),
				to,
			};

		case PID_VALUE.FORGOT_PASSWORD: // forgot_password
			return {
				contentType: PID_TYPE[PID_VALUE.FORGOT_PASSWORD],
				content: SmsTemplate.demoSmsOtp(meta?.phone?.value),
				to,
			};
		default:
			logger.info('Invalid sms content found');
			break;
	}
	return {
		contentType: PID_TYPE[PID_VALUE.DEMO],
		content: SmsTemplate.demoSmsOtp(meta?.phone?.value),
		to,
	};
};
