import {
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	HttpStatus,
	Param,
	Patch,
	Post,
	Put,
	Query,
	UploadedFile,
	UploadedFiles,
	UseInterceptors,
} from '@nestjs/common'
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express'
import { ApiTags } from '@nestjs/swagger'
import { Gender } from '@prisma/client'
import { Auth } from '../auth/decorators/auth.decorator'
import { CurrentUser } from '../auth/decorators/user.decorator'
import { CreateFamilyMemberDto } from './dto/create-family-member.dto'
import { UpdateFamilyMemberDto } from './dto/update-family-member.dto'
import { FamilyMemberService } from './family-member.service'

@ApiTags('Family Member Section')
@Controller('family-member')
@Auth()
export class FamilyMemberController {
	constructor(private readonly familyMemberService: FamilyMemberService) {}

	@Get('search')
	async search(
		@Query('fn') firstName?: string,
		@Query('mn') middleName?: string,
		@Query('ln') lastName?: string,
		@Query('b') birthDate?: string,
		@Query('g') gender?: Gender,
		@Query('d') deathDate?: string,

		@Query('p') page?: number,
		@Query('l') limit?: number,
	) {
		const dto: UpdateFamilyMemberDto = {
			firstName,
			middleName,
			lastName,
			birthDate: birthDate ? new Date(birthDate) : undefined,
			deathDate: deathDate ? new Date(deathDate) : undefined,
			gender,
		}
		const pagination = { page, limit }
		const members = await this.familyMemberService.search(dto, pagination)
		return members
	}

	@Post()
	async create(
		@CurrentUser('familyId') familyId: string,
		@Body() dto: CreateFamilyMemberDto,
	) {
		const userId = await this.familyMemberService.create(dto, familyId)
		return userId
	}

	@Get(':id')
	async findById(
		@CurrentUser('familyId') familyId: string,
		@Param('id') id: string,
	) {
		const user = await this.familyMemberService.findById(id, familyId)
		return user
	}

	@HttpCode(HttpStatus.NO_CONTENT)
	@Put(':id')
	async update(
		@CurrentUser('familyId') familyId: string,
		@Body() dto: UpdateFamilyMemberDto,
		@Param('id') id: string,
	) {
		await this.familyMemberService.update(id, dto, familyId)
	}

	@Patch('set-avatar-image/:id')
	@UseInterceptors(FileInterceptor('file'))
	async setAvatarImage(
		@UploadedFile() file: Express.Multer.File,
		@CurrentUser('familyId') familyId: string,
		@Param('id') id: string,
	) {
		const url = await this.familyMemberService.setAvatarImage(
			id,
			file,
			familyId,
		)
		return url
	}

	@Patch('add-images/:id')
	@UseInterceptors(FilesInterceptor('files'))
	async addImages(
		@UploadedFiles() files: Express.Multer.File[],
		@CurrentUser('familyId') familyId: string,
		@Param('id') id: string,
	) {
		const imagesData = await this.familyMemberService.addImages(
			id,
			familyId,
			files,
		)
		return imagesData
	}

	@HttpCode(HttpStatus.NO_CONTENT)
	@Patch('connect-to-user/:id')
	async connectToUser(
		@CurrentUser('id') userId: string,
		@CurrentUser('familyId') familyId: string,
		@Param('id') id: string,
	) {
		await this.familyMemberService.connectToUser(id, userId, familyId)
	}

	@HttpCode(HttpStatus.NO_CONTENT)
	@Delete(':id')
	async delete(
		@CurrentUser('familyId') familyId: string,
		@Param('id') id: string,
	) {
		await this.familyMemberService.delete(id, familyId)
	}
}
