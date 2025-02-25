import twilio from 'twilio';
import { logger } from './logger';
import { Config } from '../config';
import { COMMUNICATION_TYPE, PID_TYPE, PID_VALUE } from '../config/config.token';
import Communication from '../components/communication/communication.schema';

export interface ISendSmsInput {
	contentType: string;
	content: string;
	to: string;
	from?: string;
}

export async function sendSmsTwilio(
	traceId: string,
	userId: string | null,
	{ contentType = PID_TYPE[PID_VALUE.DEMO], content, to, from = Config.twilio.mobileNo }: ISendSmsInput,
): Promise<any> {
	try {
		const client = twilio(Config.twilio.accountSid, Config.twilio.authToken);
		const message = await client.messages.create({
			body: content,
			from: Config.twilio.mobileNo,
			to,
			statusCallback: Config.twilio.callbackUrl,
		});
		logger.info(message, 'twilio sent');
		await Communication.create({
			userId,
			contentType,
			to,
			from,
			snsContent: { content },
			actionId: message?.sid,
			status: message?.status,
			type: COMMUNICATION_TYPE.SMS,
		});
	} catch (error) {
		console.error('Error sending message:', error);
		logger.error(error, 'error01');
		logger.error(
			{ traceId, error: { error, meta: { userId, contentType, to, from } } },
			`twilio : sendSmsTwilio : error - DB entry error`,
		);
	}
}
