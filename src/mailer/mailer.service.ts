import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as nodemailer from 'nodemailer'
import type { SupportedLanguages } from 'src/utils/language.utils'

@Injectable()
export class MailerService {
	private transporter: nodemailer.Transporter

	private templateIcons = {
		logo: `<img src="https://raw.githubusercontent.com/b392/0/refs/heads/main/0.jpg" alt="KinGrid Logo">`,
	}

	private templates = {
		account_activation: (
			{
				greeting,
				message,
				ignore,
				rights,
			}: { greeting: string; message: string; ignore: string; rights: string },
			code: string,
		) => `<table style="margin:auto;text-align:center;font-size:16px">
						<tbody>
							<tr>
								${this.templateIcons.logo}
							</tr>
							<tr>
								<h1>${greeting}</h1>
							</tr>
							<tr>
								<p>${message}</p>
							</tr>
							<tr>
								<span style="padding:16px;border:2px solid #000;font:700 3rem system-ui;line-height:2;">${code}</span>
							</tr>
							<tr>
								<p>${ignore}</p>
							</tr>
							<tr>
								<p>KinGrid. ${rights}</p>
							</tr>
						</tbody>
					</table>`,
	}

	private translations = {
		en: {
			account_activation: {
				subject: 'Activate Your Account',
				greeting: "Here's your KinGrid launch code",
				message: 'Continue signing up for KinGrid by entering the code below:',
				ignore: 'If you did not request this code, please ignore this email.',
				rights: 'All rights reserved.',
			},
		},
		ru: {
			account_activation: {
				subject: 'Активируйте свою учетную запись',
				greeting: 'Здесь ваш код активации KinGrid',
				message:
					'Введите код ниже, чтобы подтвердить свою регистрацию в KinGrid:',
				ignore:
					'Если вы не запрашивали этот код, пожалуйста, проигнорируйте это письмо.',
				rights: 'Все права защищены.',
			},
		},
	} as const

	constructor(private readonly configService: ConfigService) {
		this.initializeTransporter()
	}

	private initializeTransporter() {
		this.transporter = nodemailer.createTransport({
			service: 'gmail',
			auth: {
				user: this.configService.get<string>('MAIL_USER'),
				pass: this.configService.get<string>('MAIL_PASSWORD'),
			},
			from: this.configService.get<string>('MAIL_USER'),
		})
	}

	private async sendMail(options: nodemailer.SendMailOptions) {
		try {
			const result = await this.transporter.sendMail(options)
			return result
		} catch (error) {
			throw new Error(`Failed to send email: ${error.message}`)
		}
	}

	async sendAccountActivation(
		email: string,
		code: string,
		language: SupportedLanguages = 'en',
	) {
		const { subject, ...rest } = this.translations[language].account_activation
		return await this.sendMail({
			to: email,
			subject,
			html: this.templates.account_activation(rest, code),
		})
	}
}
