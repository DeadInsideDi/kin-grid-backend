import { ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import {
	IsDate,
	IsNotEmpty,
	IsOptional,
	IsString,
	MaxLength,
} from 'class-validator'

export class CreateFamilyInvitationDto {
	@ApiPropertyOptional({
		example: 'cmdknqy8x4234ukfjw6kv2tl6f',
		description: 'Family member id',
	})
	@MaxLength(36)
	@IsString()
	@IsNotEmpty()
	readonly familyMemberId: string

	@ApiPropertyOptional({
		example: 'cmdknqy8x45345ukjw6kv2ty4d',
		description: 'Invitee user id',
	})
	@MaxLength(36)
	@IsString()
	@IsOptional()
	readonly inviteeUserId?: string

	@ApiPropertyOptional({
		example: '2019-02-16T13:12:19.657Z',
		description: 'Expires at',
	})
	@Type(() => Date)
	@IsDate()
	@IsOptional()
	readonly expiresAt?: Date
}
