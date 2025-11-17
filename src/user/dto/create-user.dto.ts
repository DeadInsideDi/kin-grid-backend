import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsOptional, IsString, MaxLength } from 'class-validator'
import { AuthDto } from '../../auth/dto/auth.dto'

export class CreateUserDto extends AuthDto {
	@ApiPropertyOptional({
		example: 'cmcm8atzj0005ukk0e1yuwiji',
		description: 'Family member id',
	})
	@MaxLength(36)
	@IsString()
	@IsOptional()
	readonly familyMemberId?: string
}
