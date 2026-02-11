import type { SupportedLanguages } from 'src/utils/language.utils'
import type { AuthDto } from '../dto/auth.dto'

export interface BaseJwtPayload {
	iat: number
	exp: number
}

export interface SignJwtPayload {
	id: string
}

export type JwtPayload = BaseJwtPayload & SignJwtPayload

export interface SignCodeVerifyJwtPayload {
	dto: AuthDto
	hashedCode: string
	language: SupportedLanguages
}

export type CodeVerifyJwtPayload = BaseJwtPayload & SignCodeVerifyJwtPayload
