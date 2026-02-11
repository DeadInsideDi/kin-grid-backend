import {
	ArgumentsHost,
	Catch,
	ExceptionFilter,
	HttpStatus,
} from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { Response } from 'express'

const httpStatusTitles: Record<number, string> = {
	[HttpStatus.CONTINUE]: 'Continue',
	[HttpStatus.SWITCHING_PROTOCOLS]: 'Switching Protocols',
	[HttpStatus.OK]: 'OK',
	[HttpStatus.CREATED]: 'Created',
	[HttpStatus.ACCEPTED]: 'Accepted',
	[HttpStatus.NON_AUTHORITATIVE_INFORMATION]: 'Non-Authoritative Information',
	[HttpStatus.NO_CONTENT]: 'No Content',
	[HttpStatus.RESET_CONTENT]: 'Reset Content',
	[HttpStatus.PARTIAL_CONTENT]: 'Partial Content',
	[HttpStatus.AMBIGUOUS]: 'Ambiguous',
	[HttpStatus.MOVED_PERMANENTLY]: 'Moved Permanently',
	[HttpStatus.FOUND]: 'Found',
	[HttpStatus.SEE_OTHER]: 'See Other',
	[HttpStatus.NOT_MODIFIED]: 'Not Modified',
	[HttpStatus.TEMPORARY_REDIRECT]: 'Temporary Redirect',
	[HttpStatus.PERMANENT_REDIRECT]: 'Permanent Redirect',
	[HttpStatus.BAD_REQUEST]: 'Bad Request',
	[HttpStatus.UNAUTHORIZED]: 'Unauthorized',
	[HttpStatus.PAYMENT_REQUIRED]: 'Payment Required',
	[HttpStatus.FORBIDDEN]: 'Forbidden',
	[HttpStatus.NOT_FOUND]: 'Not Found',
	[HttpStatus.METHOD_NOT_ALLOWED]: 'Method Not Allowed',
	[HttpStatus.NOT_ACCEPTABLE]: 'Not Acceptable',
	[HttpStatus.PROXY_AUTHENTICATION_REQUIRED]: 'Proxy Authentication Required',
	[HttpStatus.REQUEST_TIMEOUT]: 'Request Timeout',
	[HttpStatus.CONFLICT]: 'Conflict',
	[HttpStatus.GONE]: 'Gone',
	[HttpStatus.LENGTH_REQUIRED]: 'Length Required',
	[HttpStatus.PRECONDITION_FAILED]: 'Precondition Failed',
	[HttpStatus.PAYLOAD_TOO_LARGE]: 'Payload Too Large',
	[HttpStatus.URI_TOO_LONG]: 'URI Too Long',
	[HttpStatus.UNSUPPORTED_MEDIA_TYPE]: 'Unsupported Media Type',
	[HttpStatus.REQUESTED_RANGE_NOT_SATISFIABLE]:
		'Requested Range Not Satisfiable',
	[HttpStatus.EXPECTATION_FAILED]: 'Expectation Failed',
	[HttpStatus.I_AM_A_TEAPOT]: "I'm a Teapot",
	[HttpStatus.UNPROCESSABLE_ENTITY]: 'Unprocessable Entity',
	[HttpStatus.FAILED_DEPENDENCY]: 'Failed Dependency',
	[HttpStatus.PRECONDITION_REQUIRED]: 'Precondition Required',
	[HttpStatus.TOO_MANY_REQUESTS]: 'Too Many Requests',
	[HttpStatus.INTERNAL_SERVER_ERROR]: 'Internal Server Error',
	[HttpStatus.NOT_IMPLEMENTED]: 'Not Implemented',
	[HttpStatus.BAD_GATEWAY]: 'Bad Gateway',
	[HttpStatus.SERVICE_UNAVAILABLE]: 'Service Unavailable',
	[HttpStatus.GATEWAY_TIMEOUT]: 'Gateway Timeout',
	[HttpStatus.HTTP_VERSION_NOT_SUPPORTED]: 'HTTP Version Not Supported',
}

type ErrorHandler = (
	response: Response,
	exception?: Prisma.PrismaClientKnownRequestError,
) => void

const createErrorResponseHandler = (statusCode: number): ErrorHandler => {
	return (
		response: Response,
		exception?: Prisma.PrismaClientKnownRequestError,
	) => {
		response.status(statusCode).json({
			message: exception?.meta?.cause || 'Invalid Request To DataBase',
			error: httpStatusTitles[statusCode],
			statusCode,
		})
	}
}

const errorHandlers: Record<string, ErrorHandler> = {
	P2025: createErrorResponseHandler(HttpStatus.NOT_FOUND),
	P2002: createErrorResponseHandler(HttpStatus.CONFLICT),
	P2003: createErrorResponseHandler(HttpStatus.BAD_REQUEST),
	P2016: createErrorResponseHandler(HttpStatus.BAD_REQUEST),
}

@Catch(Prisma.PrismaClientKnownRequestError, Prisma.PrismaClientValidationError)
export class PrismaClientExceptionFilter implements ExceptionFilter {
	catch(
		exception:
			| Prisma.PrismaClientKnownRequestError
			| Prisma.PrismaClientValidationError,
		host: ArgumentsHost,
	) {
		const ctx = host.switchToHttp()
		const response = ctx.getResponse<Response>()
		console.log(exception)
		if (exception instanceof Prisma.PrismaClientValidationError)
			return createErrorResponseHandler(HttpStatus.BAD_REQUEST)(response)

		const handler = errorHandlers[exception.code]
		if (handler) return handler(response, exception)

		return createErrorResponseHandler(HttpStatus.INTERNAL_SERVER_ERROR)(
			response,
			exception,
		)
	}
}
