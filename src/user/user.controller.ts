import {
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	HttpStatus,
	Patch,
	Put,
	UploadedFile,
	UseInterceptors,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { ApiTags } from '@nestjs/swagger'
import { Auth } from 'src/auth/decorators/auth.decorator'
import { CurrentUser } from '../auth/decorators/user.decorator'
import { UpdateUserDto } from './dto/update-user.dto'
import { UserService } from './user.service'

@ApiTags('User Section')
@Controller('user')
@Auth()
export class UserController {
	constructor(private readonly userService: UserService) {}

	@Get()
	async findById(@CurrentUser('id') id: string) {
		const user = await this.userService.findById(id)
		return user
	}

	@HttpCode(HttpStatus.NO_CONTENT)
	@Put()
	async update(@CurrentUser('id') id: string, @Body() dto: UpdateUserDto) {
		await this.userService.update(id, dto)
	}

	@Patch('set-avatar-image')
	@UseInterceptors(FileInterceptor('file'))
	async setAvatarImage(
		@UploadedFile() file: Express.Multer.File,
		@CurrentUser('id') id: string,
	) {
		const url = await this.userService.setAvatarImage(id, file)
		return url
	}

	@HttpCode(HttpStatus.NO_CONTENT)
	@Delete()
	async delete(@CurrentUser('id') id: string) {
		await this.userService.delete(id)
	}
}
