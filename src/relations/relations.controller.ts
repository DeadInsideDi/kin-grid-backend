import {
	Controller,
	Get,
	HttpCode,
	HttpStatus,
	Patch,
	Query,
} from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { Auth } from '../auth/decorators/auth.decorator'
import { CurrentUser } from '../auth/decorators/user.decorator'
import { RelationsService } from './relations.service'

@ApiTags('Relations Section')
@Controller('relations')
@Auth()
export class RelationsController {
	constructor(private readonly relationsService: RelationsService) {}

	@Get()
	async getRelations(
		@CurrentUser('familyId') familyId: string,
		@CurrentUser('familyMemberId') userFromId: string,
		@Query('fromId') fromId?: string,
		@Query('lang') lang?: string,
	) {
		return await this.relationsService.getRelations(
			fromId || userFromId,
			lang || '',
			familyId,
		)
	}

	@HttpCode(HttpStatus.NO_CONTENT)
	@Patch('add-parent')
	async addParent(
		@CurrentUser('familyId') familyId: string,
		@Query('id') id: string,
		@Query('parentId') parentId: string,
	) {
		await this.relationsService.addParent(id, parentId, familyId)
	}

	@HttpCode(HttpStatus.NO_CONTENT)
	@Patch('delete-parent')
	async deleteParent(
		@CurrentUser('familyId') familyId: string,
		@Query('id') id: string,
		@Query('parentId') parentId: string,
	) {
		await this.relationsService.deleteParent(id, parentId, familyId)
	}

	@HttpCode(HttpStatus.NO_CONTENT)
	@Patch('add-spouse')
	async addSpouse(
		@CurrentUser('familyId') familyId: string,
		@Query('id') id: string,
		@Query('spouseId') spouseId: string,
	) {
		await this.relationsService.addSpouse(id, spouseId, familyId)
	}

	@HttpCode(HttpStatus.NO_CONTENT)
	@Patch('delete-spouse')
	async deleteSpouse(
		@CurrentUser('familyId') familyId: string,
		@Query('id') id: string,
	) {
		await this.relationsService.deleteSpouse(id, familyId)
	}

	@HttpCode(HttpStatus.NO_CONTENT)
	@Patch('make-spouse-as-former')
	async makeSpouseAsFormer(
		@CurrentUser('familyId') familyId: string,
		@Query('id') id: string,
	) {
		await this.relationsService.makeSpouseAsFormer(id, familyId)
	}

	@HttpCode(HttpStatus.NO_CONTENT)
	@Patch('make-former-spouse-as-current')
	async makeFormerSpouseAsCurrent(
		@CurrentUser('familyId') familyId: string,
		@Query('id') id: string,
		@Query('spouseId') formerSpouseId: string,
	) {
		await this.relationsService.makeFormerSpouseAsCurrentById(
			id,
			familyId,
			formerSpouseId,
		)
	}

	@HttpCode(HttpStatus.NO_CONTENT)
	@Patch('add-former-spouse')
	async addFormerSpouse(
		@CurrentUser('familyId') familyId: string,
		@Query('id') id: string,
		@Query('spouseId') spouseId: string,
	) {
		await this.relationsService.addFormerSpouse(id, spouseId, familyId)
	}

	@HttpCode(HttpStatus.NO_CONTENT)
	@Patch('delete-former-spouse')
	async deleteFormerSpouse(
		@CurrentUser('familyId') familyId: string,
		@Query('id') id: string,
		@Query('spouseId') spouseId: string,
	) {
		await this.relationsService.deleteFormerSpouse(id, spouseId, familyId)
	}
}
