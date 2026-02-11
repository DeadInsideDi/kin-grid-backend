import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsString } from 'class-validator'

export class AdminCodeDto {
	@ApiProperty({ description: 'Admin code for verification' })
	@IsString()
	@IsNotEmpty()
	readonly admincode: string
}
