import {
	BadRequestException,
	Injectable,
	NotFoundException,
} from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PostimgService } from '../services/postimg.service'
import { PrismaService } from '../services/prisma.service'
import { $baseUserSelect } from '../user/user.service'
import { transliterateToEn } from '../utils/language.utils'
import { CreateFamilyMemberDto } from './dto/create-family-member.dto'
import { UpdateFamilyMemberDto } from './dto/update-family-member.dto'

export const $familyMemberInclude = {
	user: { select: $baseUserSelect },
	husband: { select: { id: true } },
	wife: { select: { id: true } },
	husbandFormers: { select: { formerWifeId: true } },
	wifeFormers: { select: { formerHusbandId: true } },
} as const

@Injectable()
export class FamilyMemberService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly postimgService: PostimgService,
	) {}

	private async familyCheck(familyId: string) {
		const family = await this.prisma.family.findUnique({
			where: { id: familyId },
			select: { id: true },
		})
		if (!family) throw new NotFoundException('Family not found')
	}

	private transliterateNames(data: Prisma.FamilyMemberUpdateArgs['data']) {
		if (typeof data.firstName === 'string')
			data.firstNameTransliteration = transliterateToEn(data.firstName)
		if (typeof data.middleName === 'string')
			data.middleNameTransliteration = transliterateToEn(data.middleName)
		if (typeof data.lastName === 'string')
			data.lastNameTransliteration = transliterateToEn(data.lastName)
	}

	private addPersonalUserId(
		data: Prisma.FamilyMemberUpdateArgs['data'],
		personalUserId: string | undefined,
	) {
		if (personalUserId) data.user = { connect: { id: personalUserId } }
	}

	private addFormerWives(
		data: Prisma.FamilyMemberUpdateArgs['data'],
		formerWifeIds: string[] | undefined,
	) {
		if (formerWifeIds?.length)
			data.husbandFormers = {
				create: formerWifeIds.map(id => ({ formerWifeId: id })),
			}
	}

	async create(dto: CreateFamilyMemberDto, familyId: string) {
		await this.familyCheck(familyId)

		const { personalUserId, formerWifeIds, ...rest } = dto
		const data: Prisma.FamilyMemberCreateArgs['data'] = {
			...rest,
			familyId,
		}
		this.transliterateNames(data)
		this.addPersonalUserId(data, personalUserId)
		this.addFormerWives(data, formerWifeIds)

		const member = await this.prisma.familyMember.create({
			data,
			select: { id: true },
		})

		return member.id
	}

	async findById(memberId: string, familyId: string) {
		const member = await this.prisma.familyMember.findUnique({
			where: { familyId, id: memberId },
			include: $familyMemberInclude,
			omit: { wifeId: true },
		})
		if (!member) throw new NotFoundException('Member not found')
		return member
	}

	async baseUpdate(
		memberId: string,
		data: Prisma.FamilyMemberUpdateArgs['data'],
		familyId: string,
	) {
		const member = await this.prisma.familyMember.update({
			where: { familyId, id: memberId },
			data,
			select: { id: true },
		})

		if (!member) throw new NotFoundException('Family member not found')
	}

	async update(
		memberId: string,
		dto: Prisma.FamilyMemberUpdateArgs['data'],
		familyId: string,
	) {
		this.transliterateNames(dto)
		await this.baseUpdate(memberId, dto, familyId)
	}

	async delete(memberId: string, familyId: string) {
		const member = await this.findById(memberId, familyId)
		if (!member) throw new NotFoundException('Family member not found')
		const isMale = member.gender === 'MALE'

		const promises: Prisma.PrismaPromise<unknown>[] = [
			this.prisma.familyMember.updateMany({
				where: { familyId, fatherId: memberId },
				data: { fatherId: null },
			}),
			this.prisma.familyMember.updateMany({
				where: { familyId, motherId: memberId },
				data: { motherId: null },
			}),
		]

		if (isMale) {
			if (member.husbandFormers.length)
				promises.push(
					this.prisma.formerSpouses.deleteMany({
						where: { formerHusbandId: memberId },
					}),
				)
		} else {
			if (member.wifeFormers.length)
				promises.push(
					this.prisma.formerSpouses.deleteMany({
						where: { formerWifeId: memberId },
					}),
				)
			if (member.husband)
				promises.push(
					this.prisma.familyMember.update({
						where: { familyId, id: member.husband.id },
						data: { wifeId: null },
						select: { id: true },
					}),
				)
		}

		if (member.user)
			promises.push(
				this.prisma.user.update({
					where: { id: member.user.id },
					data: { familyMemberId: null },
					select: { id: true },
				}),
			)

		await Promise.all(promises)
		await this.prisma.familyMember.deleteMany({
			where: { familyId, id: memberId },
		})
	}

	async getGender(memberId: string, familyId: string) {
		const member = await this.prisma.familyMember.findUnique({
			where: { familyId, id: memberId },
			select: { gender: true },
		})

		if (!member) throw new NotFoundException('Member not found')
		return member.gender
	}

	async getSpouseData(memberId: string, familyId: string) {
		const member = await this.prisma.familyMember.findUnique({
			where: { familyId, id: memberId },
			select: { wife: true, husband: true, gender: true },
		})
		if (!member) throw new NotFoundException('Family member not found')

		const { gender } = member
		const haveSpouse = member.husband || member.wife
		const maleSpouseId = haveSpouse
			? gender === 'MALE'
				? memberId
				: member.husband!.id
			: null
		const femaleSpouseId = haveSpouse
			? gender === 'FEMALE'
				? memberId
				: member.wife!.id
			: null
		return { maleSpouseId, femaleSpouseId, gender }
	}

	async publishImage(file: Express.Multer.File) {
		const imageUrl = await this.postimgService.uploadFile(file)
		return imageUrl
	}

	async setAvatarImage(
		memberId: string,
		file: Express.Multer.File,
		familyId: string,
	) {
		const imageUrl = await this.publishImage(file)
		if (!imageUrl) throw new BadRequestException('Image upload failed')

		await this.prisma.familyMember.update({
			where: { familyId, id: memberId },
			data: { avatarImageUrl: imageUrl },
			select: { id: true },
		})

		return imageUrl
	}

	async addImages(
		memberId: string,
		familyId: string,
		files: Express.Multer.File[],
	) {
		const imageUrls = await Promise.all(
			files.map(file => this.publishImage(file)),
		)

		const successfulImageUrls = imageUrls.filter(imageUrl => imageUrl !== null)

		if (!successfulImageUrls.length)
			throw new BadRequestException('All image uploads failed')

		const member = await this.prisma.familyMember.update({
			where: { familyId, id: memberId },
			data: {
				imageUrls: {
					push: successfulImageUrls,
				},
			},
			select: { id: true },
		})

		if (!member) throw new NotFoundException('Family member not found')

		return {
			successfulImageUrls,
			failedImagesCount: imageUrls.length - successfulImageUrls.length,
		}
	}

	async connectToUser(memberId: string, userId: string, familyId: string) {
		await this.prisma.familyMember.update({
			where: { familyId, id: memberId },
			data: { user: { connect: { id: userId } } },
			select: { id: true },
		})
	}

	async search(
		dto: UpdateFamilyMemberDto,
		pagination: { page?: number; limit?: number },
	) {
		const { firstName, middleName, lastName, birthDate, deathDate, gender } =
			dto
		const where: Prisma.FamilyMemberWhereInput = { gender }
		if (firstName)
			where.firstNameTransliteration = {
				contains: transliterateToEn(firstName),
			}
		if (middleName)
			where.middleNameTransliteration = {
				contains: transliterateToEn(middleName),
			}
		if (lastName)
			where.lastNameTransliteration = {
				contains: transliterateToEn(lastName),
			}
		if (birthDate)
			where.birthDate = {
				gte: new Date(birthDate),
			}
		if (deathDate)
			where.deathDate = {
				lte: new Date(deathDate),
			}

		let { page = 1, limit = 10 } = pagination
		if (limit > 10) limit = 10

		console.log(where)
		const members = await this.prisma.familyMember.findMany({
			skip: (page - 1) * limit,
			take: limit,
			where,
			omit: {
				description: true,
				imageUrls: true,
			},
			include: { user: { select: $baseUserSelect } },
		})

		return members
	}
}
