import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Config } from '../config';

const RESPONSE_TYPE = {
	SUCCESS: 'success',
	ERROR: 'error',
};

type ResponseStatus = (typeof RESPONSE_TYPE)[keyof typeof RESPONSE_TYPE];

export interface ISuccessResponse {
	status: string;
	traceId: string;
	successCode: string;
	statusCode: number;
	data: any;
	navigate?: string;
	accessToken?: string;
	refreshToken?: string;
	meta: any;
}

export interface IErrorResponse {
	status: string;
	traceId: string;
	error: string;
	errorCode: string;
	message: string;
	meta: any;
	statusCode: number;
	navigate?: string;
	accessToken?: string;
	refreshToken?: string;
}

export class ServiceResponse {
	public traceId: string;
	public accessToken: string | null;
	public refreshToken: string | null;
	public navigate: string;

	constructor(req?: Request, res?: Response) {
		this.traceId = uuidv4();
		this.accessToken = req?.headers?.[`${Config.XFLUTTERAPP}`] ? '' : null;
		this.refreshToken = req?.headers?.[`${Config.XFLUTTERAPP}`] ? '' : null;
		this.navigate = '';
	}

	private buildResponse<T>(
		status: ResponseStatus,
		code: number,
		responseObj: T,
		responseCode?: string,
		includeOptionalFields: boolean = true,
	): ISuccessResponse | IErrorResponse {
		const baseResponse = {
			status,
			traceId: this.traceId,
			statusCode: code,
			...responseObj,
		};

		if (status === RESPONSE_TYPE.SUCCESS) {
			const resData: ISuccessResponse = {
				...baseResponse,
				successCode: responseCode ?? '',
				data: (responseObj as any)?.data ?? {},
				meta: (responseObj as any)?.meta ?? {},
			};
			if (includeOptionalFields) {
				this.addOptionalFields(resData);
			}
			return resData;
		} else {
			const errorResponse = responseObj as { errorCode: string; message?: string; error?: string; meta: any };
			const resData: IErrorResponse = {
				...baseResponse,
				error: errorResponse?.error ?? responseCode ?? '',
				errorCode: errorResponse.errorCode,
				message: errorResponse.message ?? 'An error occurred',
				meta: errorResponse.meta,
			};
			if (includeOptionalFields) {
				this.addOptionalFields(resData);
			}
			return resData;
		}
	}

	private addOptionalFields(response: ISuccessResponse | IErrorResponse) {
		if (this.accessToken != null) response.accessToken = this.accessToken;
		if (this.refreshToken != null) response.refreshToken = this.refreshToken;
		if (this.navigate) response.navigate = this.navigate;
	}

	fetched(
		responseObj: { traceId?: string; message: string; data: any },
		code: number = 200,
		includeOptionalFields: boolean = true,
	) {
		return this.buildResponse(RESPONSE_TYPE.SUCCESS, code, responseObj, 'FETCHED', includeOptionalFields);
	}

	created(
		responseObj: { traceId?: string; message: string; data: any },
		code: number = 201,
		includeOptionalFields: boolean = true,
	) {
		return this.buildResponse(RESPONSE_TYPE.SUCCESS, code, responseObj, 'CREATED', includeOptionalFields);
	}

	updated(
		responseObj: { traceId?: string; message: string; data: any },
		code: number = 200,
		includeOptionalFields: boolean = true,
	) {
		return this.buildResponse(RESPONSE_TYPE.SUCCESS, code, responseObj, 'UPDATED', includeOptionalFields);
	}

	deleted(
		responseObj: { traceId?: string; message: string; data: any },
		code: number = 204,
		includeOptionalFields: boolean = true,
	) {
		return this.buildResponse(RESPONSE_TYPE.SUCCESS, code, responseObj, 'DELETED', includeOptionalFields);
	}

	uploaded(
		responseObj: { traceId?: string; message: string; data: any },
		code: number = 200,
		includeOptionalFields: boolean = true,
	) {
		return this.buildResponse(RESPONSE_TYPE.SUCCESS, code, responseObj, 'UPLOADED', includeOptionalFields);
	}

	successApi(
		responseObj: { traceId?: string; message: string; data: any },
		code: number = 200,
		includeOptionalFields: boolean = true,
	) {
		return this.buildResponse(RESPONSE_TYPE.SUCCESS, code, responseObj, 'API DEPENDENCY', includeOptionalFields);
	}

	// generalized success
	success(
		responseObj: { traceId?: string; message: string; data: any },
		code: number = 200,
		includeOptionalFields: boolean = true,
	) {
		return this.buildResponse(RESPONSE_TYPE.SUCCESS, code, responseObj, 'SUCCESS', includeOptionalFields);
	}

	// generalized error
	error(
		errorObj: { traceId?: string; errorCode: string; message?: string; meta: any },
		code: number = 500,
		includeOptionalFields: boolean = true,
	) {
		return this.buildResponse(RESPONSE_TYPE.ERROR, code, errorObj, 'ERROR', includeOptionalFields);
	}

	unhandledError(
		responseObj: { traceId?: string; errorCode: any; message?: string; error?: string; meta: any },
		code: number = 500,
		includeOptionalFields: boolean = true,
	) {
		return this.buildResponse(RESPONSE_TYPE.ERROR, code, responseObj, 'UNHANDLED_ERROR', includeOptionalFields);
	}

	serviceUnavailableError(
		responseObj: { traceId?: string; errorCode: any; message?: string; error?: string; meta: any },
		code: number = 503,
		includeOptionalFields: boolean = true,
	) {
		return this.buildResponse(RESPONSE_TYPE.ERROR, code, responseObj, 'SERVICE_UNAVAILABLE', includeOptionalFields);
	}

	databaseError(
		responseObj: { traceId?: string; errorCode: any; message?: string; error?: string; meta: any },
		code: number = 500,
		includeOptionalFields: boolean = true,
	) {
		return this.buildResponse(
			RESPONSE_TYPE.ERROR,
			code,
			responseObj,
			'UNHANDLED_ERROR_AT_DB',
			includeOptionalFields,
		);
	}

	badRequestError(
		responseObj: { traceId?: string; errorCode: any; message?: string; error?: string; meta: any },
		code: number = 400,
		includeOptionalFields: boolean = true,
	) {
		return this.buildResponse(RESPONSE_TYPE.ERROR, code, responseObj, 'BAD_REQUEST_ERROR', includeOptionalFields);
	}

	conflictError(
		responseObj: { traceId?: string; errorCode: any; message?: string; error?: string; meta: any },
		code: number = 409,
		includeOptionalFields: boolean = true,
	) {
		return this.buildResponse(RESPONSE_TYPE.ERROR, code, responseObj, 'CONFLICT', includeOptionalFields);
	}

	rateLimitError(
		responseObj: { traceId?: string; errorCode: any; message?: string; error?: string; meta: any },
		code: number = 429,
		includeOptionalFields: boolean = true,
	) {
		return this.buildResponse(
			RESPONSE_TYPE.ERROR,
			code,
			responseObj,
			'REQUEST_LIMIT_EXCEEDED',
			includeOptionalFields,
		);
	}

	largeEntityError(
		responseObj: { traceId?: string; errorCode: any; message?: string; error?: string; meta: any },
		code: number = 413,
		includeOptionalFields: boolean = true,
	) {
		return this.buildResponse(RESPONSE_TYPE.ERROR, code, responseObj, 'LARGE_ENTITY', includeOptionalFields);
	}

	unsupportedMediaError(
		responseObj: { traceId?: string; errorCode: any; message?: string; error?: string; meta: any },
		code: number = 415,
		includeOptionalFields: boolean = true,
	) {
		return this.buildResponse(RESPONSE_TYPE.ERROR, code, responseObj, 'UNSUPPORTED_MEDIA', includeOptionalFields);
	}

	unprocessableEntityError(
		responseObj: { traceId?: string; errorCode: any; message?: string; error?: string; meta: any },
		code: number = 422,
		includeOptionalFields: boolean = true,
	) {
		return this.buildResponse(
			RESPONSE_TYPE.ERROR,
			code,
			responseObj,
			'UNPROCESSABLE_ENTITY',
			includeOptionalFields,
		);
	}

	notFoundError(
		responseObj: { traceId?: string; errorCode: any; message?: string; error?: string; meta: any },
		code: number = 404,
		includeOptionalFields: boolean = true,
	) {
		return this.buildResponse(RESPONSE_TYPE.ERROR, code, responseObj, 'NOT_FOUND', includeOptionalFields);
	}

	authenticationError(
		responseObj: { traceId?: string; errorCode: any; message?: string; error?: string; meta: any },
		code: number = 401,
		includeOptionalFields: boolean = true,
	) {
		return this.buildResponse(RESPONSE_TYPE.ERROR, code, responseObj, 'UNAUTHORIZED', includeOptionalFields);
	}

	forbiddenError(
		responseObj: { traceId?: string; errorCode: any; message?: string; error?: string; meta: any },
		code: number = 403,
		includeOptionalFields: boolean = true,
	) {
		return this.buildResponse(RESPONSE_TYPE.ERROR, code, responseObj, 'FORBIDDEN', includeOptionalFields);
	}
}
