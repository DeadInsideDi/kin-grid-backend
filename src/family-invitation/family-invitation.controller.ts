import {
	Body,
	Controller,
	Get,
	HttpCode,
	HttpStatus,
	Param,
	Patch,
	Post,
	Query,
} from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { User } from '@prisma/client'
import { Auth } from '../auth/decorators/auth.decorator'
import { CurrentUser } from '../auth/decorators/user.decorator'
import { CreateFamilyInvitationDto } from './dto/create-family-invitation.dto'
import { FamilyInvitationService } from './family-invitation.service'

@ApiTags('Family Invitation Section')
@Controller('family-invitation')
@Auth()
export class FamilyInvitationController {
	constructor(
		private readonly familyInvitationService: FamilyInvitationService,
	) {}

	@Post()
	async create(
		@CurrentUser() user: User,
		@Body() dto: CreateFamilyInvitationDto,
	) {
		const inviteId = await this.familyInvitationService.create(user, dto)
		return inviteId
	}

	@Get('sended')
	async getSendedInvitations(@CurrentUser('id') userId: string) {
		return await this.familyInvitationService.getSendedInvitations(userId)
	}

	@Get('received')
	async getReceivedInvitations(@CurrentUser('id') userId: string) {
		return await this.familyInvitationService.getReceivedInvitations(userId)
	}

	@Patch('accept/:id')
	async accept(
		@CurrentUser() user: User,
		@Param('id') id: string,
		@Query('connectFamily') connectFamily: boolean = true,
	) {
		const familyId = await this.familyInvitationService.accept(
			id,
			connectFamily,
			user,
		)
		return familyId
	}

	@HttpCode(HttpStatus.NO_CONTENT)
	@Patch('revoke/:id')
	async revoke(
		@CurrentUser('id') userId: string,
		@Param('id') inviteId: string,
	) {
		await this.familyInvitationService.revoke(inviteId, userId)
	}
}
