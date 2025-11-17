import { Module } from '@nestjs/common'
import { PostimgService } from '../services/postimg.service'
import { PrismaService } from '../services/prisma.service'
import { FamilyMemberController } from './family-member.controller'
import { FamilyMemberService } from './family-member.service'

@Module({
	controllers: [FamilyMemberController],
	providers: [FamilyMemberService, PrismaService, PostimgService],
	exports: [FamilyMemberService, PostimgService],
})
export class FamilyMemberModule {}
