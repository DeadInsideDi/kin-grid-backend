import { ForbiddenException, Injectable } from '@nestjs/common'
import { PrismaService } from '../services/prisma.service'
import { CreatePricingDto } from './dto/create-pricing.dto'
import { UpdatePricingDto } from './dto/update-pricing.dto'

@Injectable()
export class PricingService {
	constructor(private readonly prisma: PrismaService) {}

	private checkAdminCode(admincode: string) {
		if (admincode !== process.env.ADMIN_CODE)
			throw new ForbiddenException('Admin code is invalid')
	}
	async create(dto: CreatePricingDto) {
		const { admincode, ...data } = dto
		this.checkAdminCode(admincode)

		const pricing = await this.prisma.pricing.create({ data })
		return pricing
	}

	async findAll(language: string) {
		const pricings = await this.prisma.pricing.findMany({
			where: { language },
			omit: { createdAt: true, updatedAt: true, language: true },
		})
		return pricings
	}

	async findOne(id: string) {
		const pricing = await this.prisma.pricing.findUnique({
			where: { id },
		})
		return pricing
	}

	async update(id: string, dto: UpdatePricingDto) {
		const { admincode, ...data } = dto
		this.checkAdminCode(admincode)
		const pricing = await this.prisma.pricing.update({
			where: { id },
			data,
		})
		return pricing
	}

	async remove(id: string, admincode: string) {
		this.checkAdminCode(admincode)
		const pricing = await this.prisma.pricing.delete({
			where: { id },
		})
		return pricing
	}
}
