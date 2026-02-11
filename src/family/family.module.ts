import { Module } from '@nestjs/common'
import { FamilyMemberModule } from '../family-member/family-member.module'
import { PrismaService } from '../services/prisma.service'
import { FamilyController } from './family.controller'
import { FamilyService } from './family.service'

@Module({
	imports: [FamilyMemberModule],
	controllers: [FamilyController],
	providers: [FamilyService, PrismaService],
	exports: [FamilyService, FamilyMemberModule],
})
export class FamilyModule {}
