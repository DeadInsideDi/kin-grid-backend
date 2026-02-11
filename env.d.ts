declare namespace NodeJS {
	interface ProcessEnv {
		PORT: string
		FRONTEND_URL: string
		DATABASE_URL: string
		JWT_SECRET: string
		ADMIN_CODE: string

		MAIL_USER: string
		MAIL_PASSWORD: string
	}
}
