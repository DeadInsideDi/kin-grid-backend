import {
	BadRequestException,
	ConflictException,
	Injectable,
} from '@nestjs/common'
import { hash } from 'argon2'
import { PostimgService } from 'src/services/postimg.service'
import { UserUniqueFieldsDto } from '../auth/dto/auth.dto'
import { PrismaService } from '../services/prisma.service'
import { DEFAULT_NAME } from './constants'
import { CreateUserDto } from './dto/create-user.dto'
import { UpdateUserDto } from './dto/update-user.dto'

export const $baseUserSelect = {
	id: true,
	username: true,
	familyMemberId: true,
}

@Injectable()
export class UserService {
	userIndex: number = 0

	constructor(
		private readonly prisma: PrismaService,
		private readonly postimgService: PostimgService,
	) {
		this.prisma.user
			.count({
				where: { username: { startsWith: DEFAULT_NAME } },
			})
			.then(count => {
				this.userIndex = count
			})
	}

	private async findByUsername(username: string) {
		const user = await this.prisma.user.findFirst({
			where: { username },
			select: { id: true },
		})
		return user
	}

	private async getDefaultUniqueUsername(dto: CreateUserDto) {
		let username: string, user: unknown

		// if email is provided, try to extract a username
		username = dto.email?.split('@')[0] || ''
		if (username) user = await this.findByUsername(username)
		if (!user) return username

		while (true) {
			this.userIndex++
			username = `${DEFAULT_NAME}${this.userIndex}`
			user = await this.findByUsername(username)
			if (!user) break
		}
		return username
	}
	async create(dto: CreateUserDto) {
		const username = dto.username || (await this.getDefaultUniqueUsername(dto))
		const user = await this.prisma.user.create({
			data: {
				...dto,
				password: await hash(dto.password),
				username,
			},
			select: { id: true },
		})
		return user
	}

	async findBaseById(id: string) {
		const user = await this.prisma.user.findUnique({
			where: { id },
			select: $baseUserSelect,
		})
		return user
	}

	async findById(id: string) {
		const user = await this.prisma.user.findUnique({
			where: { id },
			omit: { password: true },
		})
		return user
	}

	private haveUniqueFields(dto: UserUniqueFieldsDto) {
		return !!(dto.email || dto.username || dto.phone)
	}

	async findFirstByUniqueFields(dto: UserUniqueFieldsDto) {
		if (!this.haveUniqueFields(dto))
			throw new BadRequestException('email or username or phone is required')

		const users = await this.prisma.user.findFirst({
			where: {
				OR: [
					{ email: dto.email },
					{ phone: dto.phone },
					{ username: dto.username },
				],
			},
			select: { ...$baseUserSelect, password: true },
		})
		return users
	}

	async update(id: string, dto: UpdateUserDto) {
		const userHaveUniqueFields = this.haveUniqueFields(dto)

		if (userHaveUniqueFields) {
			const anotherUserWithSameData = await this.findFirstByUniqueFields(dto)

			if (anotherUserWithSameData) {
				const errorMessage =
					anotherUserWithSameData.username === dto.username
						? `username: ${dto.username}`
						: `contact: ${[dto.email, dto.phone].filter(Boolean).join(' or ')}`

				throw new ConflictException(
					`User with ${errorMessage} - already exists`,
				)
			}
		}

		if (dto.password) dto.password = await hash(dto.password)

		await this.prisma.user.update({
			where: { id },
			data: dto,
			select: { id: true },
		})
	}

	async setAvatarImage(id: string, file: Express.Multer.File) {
		const imageUrl = await this.postimgService.uploadFile(file)
		if (!imageUrl) throw new BadRequestException('Image upload failed')

		await this.prisma.user.update({
			where: { id },
			data: { avatarImageUrl: imageUrl },
			select: { id: true },
		})

		return imageUrl
	}

	async delete(id: string) {
		await this.prisma.user.delete({
			where: { id },
			select: { id: true },
		})
	}
}
