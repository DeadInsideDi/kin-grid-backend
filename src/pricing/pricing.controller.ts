import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	Post,
	Put,
	Query,
} from '@nestjs/common'
import { AdminCodeDto } from './dto/admin-code.dto'
import { CreatePricingDto } from './dto/create-pricing.dto'
import { UpdatePricingDto } from './dto/update-pricing.dto'
import { PricingService } from './pricing.service'

@Controller('pricing')
export class PricingController {
	constructor(private readonly pricingService: PricingService) {}

	@Post()
	async create(@Body() dto: CreatePricingDto) {
		return await this.pricingService.create(dto)
	}

	@Get()
	async findAll(@Query('language') language: string = 'en') {
		return await this.pricingService.findAll(language)
	}

	@Get(':id')
	async findOne(@Param('id') id: string) {
		return await this.pricingService.findOne(id)
	}

	@Put(':id')
	async update(@Param('id') id: string, @Body() dto: UpdatePricingDto) {
		return await this.pricingService.update(id, dto)
	}

	@Delete(':id')
	async remove(@Param('id') id: string, @Body() dto: AdminCodeDto) {
		return await this.pricingService.remove(id, dto.admincode)
	}
}
