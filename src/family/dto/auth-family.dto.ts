import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsString, Length, MaxLength } from 'class-validator'

export class AuthFamilyDto {
	@ApiProperty({
		example: 'Great Family',
		description: 'Family name',
	})
	@MaxLength(191)
	@IsString()
	@IsNotEmpty()
	readonly name: string

	@ApiProperty({
		example: 'VERY_Hard P@ssw0rd',
		description: 'Family password',
	})
	@Length(12, 191)
	@IsString()
	@IsNotEmpty()
	password: string
}
