import { Module } from '@nestjs/common'
import { FamilyMemberModule } from '../family-member/family-member.module'
import { PrismaService } from '../services/prisma.service'
import { RelationsController } from './relations.controller'
import { RelationsService } from './relations.service'

@Module({
	imports: [FamilyMemberModule],
	controllers: [RelationsController],
	providers: [RelationsService, PrismaService],
})
export class RelationsModule {}
