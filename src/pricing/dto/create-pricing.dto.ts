import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
	IsArray,
	IsNotEmpty,
	IsOptional,
	IsString,
	MaxLength,
} from 'class-validator'
import { AdminCodeDto } from './admin-code.dto'

export class CreatePricingDto extends AdminCodeDto {
	@ApiPropertyOptional({ example: 'en', description: 'Language' })
	@MaxLength(2)
	@IsString()
	@IsOptional()
	readonly language: string

	@ApiProperty({ example: 'Basic Plan', description: 'Title' })
	@MaxLength(32)
	@IsString()
	@IsNotEmpty()
	readonly title: string

	@ApiProperty({ example: '$100', description: 'Monthly price' })
	@IsString()
	@IsNotEmpty()
	readonly monthlyPrice: string

	@ApiProperty({ example: '$1000', description: 'Annual price' })
	@IsString()
	@IsNotEmpty()
	readonly annualPrice: string

	@ApiProperty({
		example: ['Full access', 'Customizable'],
		description: 'Key features',
	})
	@MaxLength(36, { each: true })
	@IsString({ each: true })
	@IsArray()
	@IsNotEmpty()
	readonly keyFeatures: string[]
}
