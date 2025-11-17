import {
	BadRequestException,
	ConflictException,
	Injectable,
	NotFoundException,
	UnauthorizedException,
	UnprocessableEntityException,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { hash, verify } from 'argon2'
import { Response } from 'express'
import { COOKEI } from 'src/config/storage.config'
import { MailerService } from 'src/mailer/mailer.service'
import type { SupportedLanguages } from 'src/utils/language.utils'
import { randomDigits } from 'src/utils/random'
import { UserService } from '../user/user.service'
import { AuthDto, type AuthActivationDto } from './dto/auth.dto'
import {
	JwtPayload,
	SignJwtPayload,
	type CodeVerifyJwtPayload,
	type SignCodeVerifyJwtPayload,
} from './interfaces/jwt-payload.interface'

@Injectable()
export class AuthService {
	constructor(
		private readonly jwt: JwtService,
		private readonly userService: UserService,
		private readonly mailerService: MailerService,
	) {}

	async sendVerificationCode(
		dto: AuthDto,
		language: SupportedLanguages | undefined,
	) {
		if (dto.email) {
			const { code, ...rest } = await this.prepareCodeVerification(
				dto,
				language,
			)
			this.mailerService.sendAccountActivation(dto.email, code, language)
			return rest
		}
		if (dto.phone) {
			// const { code, ...rest } = await this.prepareCodeVerification(dto)
			// THERE ARE NO FREE SERVISES FOR SENDING SMS -> LET USER PASS WITHOUT VERIFY
			// return rest
		}
	}

	async register(dto: AuthDto, language: SupportedLanguages | undefined) {
		const userWithSameData = await this.userService.findFirstByUniqueFields(dto)
		if (userWithSameData)
			throw new ConflictException('User already exists, please try to login')

		if (dto?.email && dto?.phone)
			throw new BadRequestException('Use only email or phone')

		const verificationData = await this.sendVerificationCode(dto, language)
		if (verificationData) return verificationData

		return await this.completeRegister(dto)
	}

	async completeRegister(dto: AuthDto) {
		const { id } = await this.userService.create(dto)
		const tokens = await this.issueTokens(id)
		return { id, ...tokens }
	}

	private async prepareCodeVerification(
		dto: AuthDto,
		language: SupportedLanguages = 'en',
	) {
		const code = randomDigits(4)
		const data: SignCodeVerifyJwtPayload = {
			dto,
			hashedCode: await hash(code),
			language,
		}
		const token = this.jwt.sign(data, { expiresIn: '10m' })
		return { code, id: null, activationToken: token }
	}

	async resendCode(token: string) {
		try {
			const { dto, language } =
				await this.jwt.verifyAsync<CodeVerifyJwtPayload>(token, {
					ignoreExpiration: true,
				})
			const verificationData = await this.sendVerificationCode(dto, language)
			if (!verificationData)
				throw new UnprocessableEntityException('Invalid body')
			return verificationData
		} catch {
			throw new UnauthorizedException('Invalid token')
		}
	}

	async activeAccount({ token, code }: AuthActivationDto) {
		let payload: CodeVerifyJwtPayload

		try {
			payload = await this.jwt.verifyAsync<CodeVerifyJwtPayload>(token)
		} catch {
			throw new UnprocessableEntityException(
				'Expired code, please try resend code',
			)
		}

		const isValid = await verify(payload.hashedCode, code)
		if (!isValid) throw new UnprocessableEntityException('Invalid code')

		return await this.completeRegister(payload.dto)
	}

	async login(dto: AuthDto) {
		const { id } = await this.validateUser(dto)
		const tokens = await this.issueTokens(id)
		return { id, ...tokens }
	}

	private async issueTokens(id: string) {
		const data: SignJwtPayload = { id }

		const accessToken = this.jwt.sign(data, {
			expiresIn: COOKEI.EXPIRE_HOUR_ACCESS_TOKEN + 'h',
		})

		const refreshToken = this.jwt.sign(data, {
			expiresIn: COOKEI.EXPIRE_DAY_REFRESH_TOKEN + 'd',
		})

		return { accessToken, refreshToken }
	}

	async validateUser(dto: AuthDto) {
		const user = await this.userService.findFirstByUniqueFields(dto)
		if (!user) throw new NotFoundException('User not found')

		const isValid = await verify(user.password, dto.password)
		if (!isValid) throw new UnauthorizedException('Invalid password')
		return user
	}

	addRefreshTokenToResponse(res: Response, refreshToken: string) {
		const expiresIn = new Date()
		expiresIn.setDate(expiresIn.getDate() + COOKEI.EXPIRE_DAY_REFRESH_TOKEN)
		res.cookie(COOKEI.REFRESH_TOKEN, refreshToken, {
			...COOKEI.COOKIE_OPTIONS,
			expires: expiresIn,
		})
	}

	removeRefreshTokenFromResponse(res: Response) {
		res.cookie(COOKEI.REFRESH_TOKEN, '', {
			...COOKEI.COOKIE_OPTIONS,
			expires: new Date(0),
		})
	}

	async getNewTokens(refreshToken: string) {
		let payload: JwtPayload

		try {
			payload = await this.jwt.verifyAsync<JwtPayload>(refreshToken)
		} catch {
			throw new UnauthorizedException('Expired refresh token')
		}

		if (!payload) throw new UnauthorizedException('Invalid refresh token')

		const user = await this.userService.findBaseById(payload.id)
		if (!user)
			throw new NotFoundException(
				'User not found, maybe you have deleted your account',
			)

		const tokens = await this.issueTokens(user.id)
		return { id: user.id, ...tokens }
	}

	async unregister(dto: AuthDto) {
		const user = await this.validateUser(dto)
		await this.userService.delete(user.id)
	}
}
