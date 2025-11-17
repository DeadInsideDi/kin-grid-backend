import { CookieOptions } from 'express'

export const COOKEI = {
	COOKIE_OPTIONS: {
		httpOnly: true,
		domain: process.env.FRONTEND_URL,
		secure: true,
		sameSite: 'lax',
	} as CookieOptions,

	ACCESS_TOKEN: 'access_token',
	EXPIRE_HOUR_ACCESS_TOKEN: 6,
	REFRESH_TOKEN: 'refresh_token',
	EXPIRE_DAY_REFRESH_TOKEN: 7,
} as const
