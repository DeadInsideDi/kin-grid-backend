import { Module } from '@nestjs/common'
import { FamilyModule } from '../family/family.module'
import { PrismaService } from '../services/prisma.service'
import { FamilyInvitationController } from './family-invitation.controller'
import { FamilyInvitationService } from './family-invitation.service'

@Module({
	imports: [FamilyModule],
	controllers: [FamilyInvitationController],
	providers: [FamilyInvitationService, PrismaService],
	exports: [FamilyInvitationService],
})
export class FamilyInvitationModule {}
