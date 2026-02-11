import { Module } from '@nestjs/common'
import { ThrottlerModule } from '@nestjs/throttler'
import { PrismaService } from '../services/prisma.service'
import { PricingController } from './pricing.controller'
import { PricingService } from './pricing.service'

@Module({
	imports: [
		ThrottlerModule.forRoot({
			throttlers: [{ ttl: 10000, limit: 10 }],
		}),
	],
	controllers: [PricingController],
	providers: [PricingService, PrismaService],
})
export class PricingModule {}
