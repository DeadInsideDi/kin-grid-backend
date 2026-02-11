import { PartialType } from '@nestjs/swagger'
import { CreateFamilyMemberDto } from '../../family-member/dto/create-family-member.dto'

export class UpdateFamilyMemberDto extends PartialType(CreateFamilyMemberDto) {}
