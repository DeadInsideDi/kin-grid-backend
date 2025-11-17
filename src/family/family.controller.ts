import {
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	HttpStatus,
	Patch,
	Post,
	Put,
	Query,
} from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { Auth } from '../auth/decorators/auth.decorator'
import { CurrentUser } from '../auth/decorators/user.decorator'
import { AuthFamilyDto } from './dto/auth-family.dto'
import { CreateFamilyDto } from './dto/create-family.dto'
import { UpdateFamilyDto } from './dto/update-family.dto'
import { FamilyService } from './family.service'

@ApiTags('Family Section')
@Controller('family')
export class FamilyController {
	constructor(private readonly familyService: FamilyService) {}

	@Post()
	@Auth()
	async create(
		@CurrentUser('id') userId: string,
		@Body() dto: CreateFamilyDto,
	) {
		const familyId = await this.familyService.create(dto, userId)
		return familyId
	}

	@Get()
	@Auth()
	async get(@CurrentUser('familyId') familyId: string) {
		const family = await this.familyService.get(familyId)
		return family
	}

	@Get('public')
	async getAnotherFamilyByInviteId(@Query('inviteId') inviteId: string) {
		const family = await this.familyService.getAnotherFamilyByInviteId(inviteId)
		return family
	}

	@Patch('connect-user')
	@Auth()
	async connectUser(
		@CurrentUser('id') userId: string,
		@Body() dto: AuthFamilyDto,
	) {
		const familyId = await this.familyService.connectUser(dto, userId)
		return familyId
	}

	@HttpCode(HttpStatus.NO_CONTENT)
	@Put()
	@Auth()
	async update(
		@CurrentUser('familyId') familyId: string,
		@Body() dto: UpdateFamilyDto,
	) {
		await this.familyService.update(dto, familyId)
	}

	@HttpCode(HttpStatus.NO_CONTENT)
	@Delete()
	@Auth()
	async delete(@CurrentUser('familyId') familyId: string) {
		await this.familyService.delete(familyId)
	}
}
