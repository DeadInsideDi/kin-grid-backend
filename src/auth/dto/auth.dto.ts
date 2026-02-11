import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import {
	IsEmail,
	IsNotEmpty,
	IsOptional,
	IsString,
	Length,
	MaxLength,
} from 'class-validator'

export class UserUniqueFieldsDto {
	@ApiPropertyOptional({ example: 'Matvei1337', description: 'Username' })
	@MaxLength(191)
	@IsString()
	@IsOptional()
	username?: string

	@ApiPropertyOptional({ example: 'test@gmail.com', description: 'Email' })
	@MaxLength(191)
	@IsEmail()
	@IsOptional()
	readonly email?: string

	@ApiPropertyOptional({ example: '88005553535', description: 'Phone number' })
	@MaxLength(15)
	@Transform(phone => phone.value.replace(/[^\d+]/g, ''))
	@IsString()
	@IsOptional()
	readonly phone?: string
}

export class AuthDto extends UserUniqueFieldsDto {
	@ApiProperty({ example: '123456', description: 'Password' })
	@Length(6, 191)
	@IsString()
	@IsNotEmpty()
	password: string
}

export class AuthActivationDto {
	@ApiProperty({
		example: 'eyJhbGciOiJ...IUJ9.eyImV4cCI6MT1M...Tg2NX0.eQ7GG...dhrI',
		description: 'Email',
	})
	@IsString()
	@IsNotEmpty()
	readonly token: string

	@ApiProperty({
		example: '3281',
		description: 'Verification Code',
	})
	@Length(4, 4)
	@IsString()
	@IsNotEmpty()
	readonly code: string
}
