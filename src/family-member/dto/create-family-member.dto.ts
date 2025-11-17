import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Gender } from '@prisma/client'
import { Type } from 'class-transformer'
import {
	IsArray,
	IsDate,
	IsEnum,
	IsNotEmpty,
	IsOptional,
	IsString,
	MaxLength,
} from 'class-validator'

export class FamilyMemberNamesDto {
	@ApiProperty({ example: 'Иван', description: 'First name' })
	@MaxLength(191)
	@IsString()
	@IsNotEmpty()
	readonly firstName: string

	@ApiPropertyOptional({ example: 'Иванов', description: 'Middle name' })
	@MaxLength(191)
	@IsString()
	@IsOptional()
	readonly middleName?: string

	@ApiPropertyOptional({ example: 'Иванович', description: 'Last name' })
	@MaxLength(191)
	@IsString()
	@IsOptional()
	readonly lastName?: string
}

export class CreateFamilyMemberDto extends FamilyMemberNamesDto {
	@ApiPropertyOptional({ example: 'MALE', description: 'Gender' })
	@IsEnum(Gender)
	@IsOptional()
	readonly gender?: Gender

	@ApiPropertyOptional({ example: '2000-01-01', description: 'Birth date' })
	@Type(() => Date)
	@IsDate()
	@IsOptional()
	birthDate?: Date

	@ApiPropertyOptional({
		example: 'Moscow, Russia',
		description: 'Birth place',
	})
	@MaxLength(191)
	@IsString()
	@IsOptional()
	readonly birthPlace?: string

	@ApiPropertyOptional({ example: '2020-01-01', description: 'Death date' })
	@Type(() => Date)
	@IsDate()
	@IsOptional()
	deathDate?: Date

	@ApiPropertyOptional({
		example: "He was good at chess and I'm glad to...",
		description: 'Description',
	})
	@IsString()
	@IsOptional()
	readonly description?: string

	@ApiPropertyOptional({
		example: 'https://i.postimg.cc/QXKGFF7V/135A0753.jpg?dl=1',
		description: 'Avatar image url',
	})
	@MaxLength(191)
	@IsString()
	@IsOptional()
	avatarImageUrl?: string

	@ApiPropertyOptional({
		example: [
			'https://i.postimg.cc/QXKGFF7V/135A0753.jpg?dl=1',
			'https://i.postimg.cc/26YXJ82f/135A0753.jpg',
		],
		description: 'Image urls',
	})
	@MaxLength(191, { each: true })
	@IsString({ each: true })
	@IsArray()
	@IsOptional()
	readonly imageUrls?: string[]

	@ApiPropertyOptional({
		example: 'cmcknqy8x0000ukjw6kv2tqp0',
		description: 'Mother id',
	})
	@MaxLength(36)
	@IsString()
	@IsOptional()
	motherId?: string

	@ApiPropertyOptional({
		example: 'cmcknqu7x1h3oilaw3lv2hjri',
		description: 'Father id',
	})
	@MaxLength(36)
	@IsString()
	@IsOptional()
	fatherId?: string

	@ApiPropertyOptional({
		example: 'cmckqu53jl5494n60d0fmaw3ou',
		description: 'Spouse id',
	})
	@MaxLength(36)
	@IsString()
	@IsOptional()
	readonly wifeId?: string

	@ApiPropertyOptional({
		example: ['q5l4696456r4rwr34f32c43803', 'h973g08634t3dfg233t89l34ki'],
		description: 'Former wife ids (not current wife)',
	})
	@MaxLength(36, { each: true })
	@IsString({ each: true })
	@IsArray()
	@IsOptional()
	readonly formerWifeIds?: string[]

	@ApiPropertyOptional({
		example: 'cmckq5l4u6496u3938w0835d0a',
		description: 'User id',
	})
	@MaxLength(36)
	@IsString()
	@IsOptional()
	readonly personalUserId?: string
}
