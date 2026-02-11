import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { JwtModule } from '@nestjs/jwt'
import { ThrottlerModule } from '@nestjs/throttler'
import { MailerModule } from 'src/mailer/mailer.module'
import { MailerService } from 'src/mailer/mailer.service'
import { getJwtConfig } from '../config/jwt.config'
import { PrismaService } from '../services/prisma.service'
import { UserModule } from '../user/user.module'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { JwtStrategy } from './strategies/jwt.strategy'

@Module({
	imports: [
		UserModule,
		ConfigModule,
		MailerModule,
		JwtModule.registerAsync({
			imports: [ConfigModule],
			inject: [ConfigService],
			useFactory: getJwtConfig,
		}),
		ThrottlerModule.forRoot({
			throttlers: [{ ttl: 10000, limit: 10 }],
			errorMessage(context) {
				const url: string = context.switchToHttp().getRequest().url
				const specialAnswer = url.includes('active-account')
					? 'in minute or resend code'
					: 'later'
				return 'Too many requests, please try again ' + specialAnswer
			},
		}),
	],
	controllers: [AuthController],
	providers: [AuthService, JwtStrategy, PrismaService, MailerService],
})
export class AuthModule {}
