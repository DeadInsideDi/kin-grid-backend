import { Module } from '@nestjs/common'
import { ImgbbService } from '../services/imgbb.service'
import { PrismaService } from '../services/prisma.service'
import { FamilyMemberController } from './family-member.controller'
import { FamilyMemberService } from './family-member.service'

@Module({
	controllers: [FamilyMemberController],
	providers: [FamilyMemberService, PrismaService, ImgbbService],
	exports: [FamilyMemberService, ImgbbService],
})
export class FamilyMemberModule {}
