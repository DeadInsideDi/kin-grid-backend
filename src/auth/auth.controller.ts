import {
	Body,
	Controller,
	HttpCode,
	HttpStatus,
	Post,
	Query,
	Req,
	Res,
	UnauthorizedException,
	UseGuards,
} from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { Throttle, ThrottlerGuard } from '@nestjs/throttler'
import { createHash } from 'crypto'
import { Request, Response } from 'express'
import { COOKEI } from 'src/config/storage.config'
import type { SupportedLanguages } from 'src/utils/language.utils'
import { AuthService } from './auth.service'
import { AuthDto, type AuthActivationDto } from './dto/auth.dto'

@UseGuards(ThrottlerGuard)
@ApiTags('Authorization')
@Controller('auth')
export class AuthController {
	constructor(private readonly authService: AuthService) {}

	@Post('register')
	async register(
		@Body() dto: AuthDto,
		@Query('lang') language: SupportedLanguages | undefined,
		@Res({ passthrough: true }) res: Response,
	) {
		const result = await this.authService.register(dto, language)

		if (result.id === null)
			return { id: null, activationToken: result.activationToken }

		this.authService.addRefreshTokenToResponse(res, result.refreshToken)
		return { id: result.id, accessToken: result.accessToken }
	}

	@HttpCode(HttpStatus.OK)
	@Post('resend-code')
	async resendCode(@Query('token') token: string) {
		return await this.authService.resendCode(token)
	}

	@Throttle({
		default: {
			limit: 3,
			ttl: 60000,
			generateKey: context => {
				const req = context.switchToHttp().getRequest()
				return createHash('MD5')
					.update(req.body?.token || req.ip)
					.digest('binary')
			},
		},
	})
	@Post('active-account')
	async activeAccount(
		@Body() dto: AuthActivationDto,
		@Res({ passthrough: true }) res: Response,
	) {
		const { refreshToken, accessToken, id } =
			await this.authService.activeAccount(dto)
		this.authService.addRefreshTokenToResponse(res, refreshToken)
		return { accessToken, id }
	}

	@HttpCode(HttpStatus.OK)
	@Post('login')
	async login(@Body() dto: AuthDto, @Res({ passthrough: true }) res: Response) {
		const { refreshToken, accessToken, id } = await this.authService.login(dto)
		this.authService.addRefreshTokenToResponse(res, refreshToken)
		return { accessToken, id }
	}

	@HttpCode(HttpStatus.OK)
	@Post('login/refresh-token')
	async loginWithRefreshToken(
		@Req() req: Request,
		@Res({ passthrough: true }) res: Response,
	) {
		const refreshTokenFromCookie = req.cookies[COOKEI.REFRESH_TOKEN]

		if (!refreshTokenFromCookie)
			throw new UnauthorizedException('Refresh token not passed')

		const { refreshToken, accessToken, id } =
			await this.authService.getNewTokens(refreshTokenFromCookie)

		this.authService.addRefreshTokenToResponse(res, refreshToken)
		return { accessToken, id }
	}

	@HttpCode(HttpStatus.NO_CONTENT)
	@Post('logout')
	async logout(@Res({ passthrough: true }) res: Response) {
		this.authService.removeRefreshTokenFromResponse(res)
	}

	@HttpCode(HttpStatus.NO_CONTENT)
	@Post('unregister')
	async unregister(@Body() dto: AuthDto) {
		await this.authService.unregister(dto)
	}
}
