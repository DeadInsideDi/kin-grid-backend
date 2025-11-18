import { ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import * as cookieParser from 'cookie-parser'
import { AppModule } from './app.module'
import { PrismaClientExceptionFilter } from './filters/prisma-client-exception.filter'

async function bootstrap() {
	const PORT = process.env.PORT || 3000
	const app = await NestFactory.create(AppModule)

	app.getHttpAdapter().getInstance().disable('x-powered-by')
	app.setGlobalPrefix('api')
	app.useGlobalPipes(new ValidationPipe({ transform: true }))
	app.useGlobalFilters(new PrismaClientExceptionFilter())

	app.use(cookieParser())
	app.enableCors({
		origin: process.env.FRONTEND_URL,
		credentials: true,
		methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH', 'HEAD'],
		exposedHeaders: ['Set-Cookie'],
		preflightContinue: false,
		// optionsSuccessStatus: 204,
	})

	const config = new DocumentBuilder()
		.setTitle('KinGrid API')
		.setDescription(
			'It is website for creating user intarective family tree with modern disign, adding relatives. Its all online and anyone can read info about person, application by family names/surnames could predict if the world have same family and suggest to connect.',
		)
		.setVersion('1.1')
		.build()
	const document = SwaggerModule.createDocument(app, config)
	SwaggerModule.setup('api/docs', app, document)

	await app.listen(PORT, async () =>
		console.log(
			`NEST SERVER STARTED AT PORT: ${PORT}, AT HOST: ${await app.getUrl()}`,
		),
	)
}

bootstrap()
