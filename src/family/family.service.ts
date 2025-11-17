import {
	BadRequestException,
	Injectable,
	NotFoundException,
	UnauthorizedException,
} from '@nestjs/common'
import { FamilyInvitation, User, type Prisma } from '@prisma/client'
import { hash, verify } from 'argon2'
import {
	$familyMemberInclude,
	FamilyMemberService,
} from '../family-member/family-member.service'
import { PrismaService } from '../services/prisma.service'
import { $baseUserSelect } from '../user/user.service'
import { AuthFamilyDto } from './dto/auth-family.dto'
import { CreateFamilyDto } from './dto/create-family.dto'
import { UpdateFamilyDto } from './dto/update-family.dto'

const familyUnionSelect = {
	id: true,
	familyMembers: {
		include: {
			husbandFormers: {
				select: {
					formerWifeId: true,
				},
			},
			wifeFormers: {
				select: {
					formerHusbandId: true,
				},
			},
		},
	},
} as const

@Injectable()
export class FamilyService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly familyMemberService: FamilyMemberService,
	) {}

	private async checkIsExistById(id: string) {
		const family = await this.prisma.family.findUnique({
			where: { id },
			select: { id: true },
		})
		return !!family
	}

	async create(dto: CreateFamilyDto, userId: string) {
		const { name, password } = dto

		const [sameNameFamily, userOldFamily] = await Promise.all([
			this.prisma.family.findUnique({
				where: { name },
				select: { id: true },
			}),
			this.prisma.family.findUnique({
				where: { ownerId: userId },
				select: { id: true },
			}),
		])

		const errorMessages: string[] = []
		if (sameNameFamily)
			errorMessages.push('Family with this name already exists')
		if (userOldFamily) errorMessages.push('You already have a family')
		if (errorMessages.length) throw new BadRequestException(errorMessages)

		await this.prisma.family.create({
			data: {
				name,
				password: await hash(password),
				ownerId: userId,
			},
			select: { id: true },
		})

		const [familyId, user] = await Promise.all([
			this.connectUser(dto, userId, false),
			this.prisma.user.findUnique({
				where: { id: userId },
				select: { username: true, avatarImageUrl: true },
			}),
		])

		if (!user) throw new NotFoundException('User not found')

		const firstName = user.username.replace(/[\s\d]/g, '')
		await this.familyMemberService.create(
			{
				firstName,
				gender: 'MALE',
				birthDate: new Date(),
				avatarImageUrl: user.avatarImageUrl || undefined,
				personalUserId: userId,
			},
			familyId,
		)

		return familyId
	}

	private async checkAuth({ name, password }: AuthFamilyDto) {
		const family = await this.prisma.family.findUnique({
			where: { name },
			select: { password: true },
		})
		if (!family) throw new NotFoundException('Family not found')

		const isValid = await verify(family.password, password)
		if (!isValid) throw new UnauthorizedException('Invalid password')
	}

	async connectUser(dto: AuthFamilyDto, userId: string, check = true) {
		if (check) await this.checkAuth(dto)

		const family = await this.prisma.family.update({
			where: { name: dto.name },
			data: { users: { connect: { id: userId } } },
			select: { id: true },
		})

		return family.id
	}

	async connectUserWithInvitation(invite: FamilyInvitation, userId: string) {
		if (!this.checkIsExistById(invite.familyId))
			throw new NotFoundException('Family not found')

		const family = await this.prisma.family.update({
			where: { id: invite.familyId },
			data: { users: { connect: { id: userId } } },
			select: { id: true },
		})

		return family.id
	}

	async unionFamilies(
		invite: FamilyInvitation,
		inviteeUser: User,
	): Promise<void> {
		if (!inviteeUser.familyId)
			throw new NotFoundException('Invitee user has no family')
		if (!inviteeUser.familyMemberId)
			throw new NotFoundException('Invitee user has no family member profile')

		const [fromFamily, toFamily] = await Promise.all([
			this.prisma.family.findUnique({
				where: { id: inviteeUser.familyId },
				select: familyUnionSelect,
			}),
			this.prisma.family.findUnique({
				where: { id: invite.familyId },
				select: familyUnionSelect,
			}),
		])

		if (!fromFamily) throw new NotFoundException('Invitee family not found')
		if (!toFamily) throw new NotFoundException('Target family not found')

		const { familyMembers: fromFamilyMembers } = fromFamily
		const { familyMembers: toFamilyMembers } = toFamily

		const fromFamilyMember = fromFamilyMembers.find(
			member => member.id === inviteeUser.familyMemberId,
		)
		const toFamilyMember = toFamilyMembers.find(
			member => member.id === invite.familyMemberId,
		)

		if (!fromFamilyMember)
			throw new NotFoundException('Invitee family member not found')
		if (!toFamilyMember)
			throw new NotFoundException('Invite family member not found')

		const fromMemberId = fromFamilyMember.id
		const toMemberId = toFamilyMember.id
		const isMale = fromFamilyMember.gender === 'MALE'
		const batch: Promise<unknown>[] = []
		const updateData: Prisma.FamilyMemberUpdateArgs['data'] = {
			firstName: fromFamilyMember.firstName,
			middleName: fromFamilyMember.middleName,
			lastName: fromFamilyMember.lastName,
			firstNameTransliteration: fromFamilyMember.firstNameTransliteration,
			middleNameTransliteration: fromFamilyMember.middleNameTransliteration,
			lastNameTransliteration: fromFamilyMember.lastNameTransliteration,
			avatarImageUrl: fromFamilyMember.avatarImageUrl,
			description: fromFamilyMember.description,
			birthDate: fromFamilyMember.birthDate,
			birthPlace: fromFamilyMember.birthPlace,
			deathDate: fromFamilyMember.deathDate,
		}

		if (fromFamilyMember.fatherId) {
			if (toFamilyMember.fatherId) {
				this.familyMemberService.delete(
					fromFamilyMember.fatherId,
					fromFamily.id,
				)
			} else {
				updateData.fatherId = fromFamilyMember.fatherId
			}
		}

		if (fromFamilyMember.motherId) {
			if (toFamilyMember.motherId) {
				this.familyMemberService.delete(
					fromFamilyMember.motherId,
					fromFamily.id,
				)
			} else {
				updateData.motherId = fromFamilyMember.motherId
			}
		}

		if (fromFamilyMember.wifeId) {
			if (toFamilyMember.wifeId) {
				this.familyMemberService.delete(fromFamilyMember.wifeId, fromFamily.id)
			} else {
				await this.prisma.familyMember.update({
					where: { id: fromMemberId },
					data: { wifeId: null },
					select: { id: true },
				})
				updateData.wifeId = fromFamilyMember.wifeId
			}
		}

		batch.push(
			this.prisma.familyMember.update({
				where: { id: toMemberId },
				data: updateData,
				select: { id: true },
			}),
		)

		if (!isMale) {
			const fromHusband = fromFamilyMembers.find(m => m.wifeId === fromMemberId)
			if (fromHusband) {
				const toHusband = toFamilyMembers.find(m => m.wifeId === toMemberId)
				if (toHusband) {
					this.familyMemberService.delete(fromHusband.id, fromFamily.id)
				} else {
					batch.push(
						this.prisma.familyMember.update({
							where: { id: fromHusband.id },
							data: { wifeId: toMemberId },
							select: { id: true },
						}),
					)
				}
			}
		}

		const children = isMale
			? fromFamilyMembers.filter(m => m.fatherId === fromMemberId)
			: fromFamilyMembers.filter(m => m.motherId === fromMemberId)
		const parentTypeId = isMale ? 'fatherId' : 'motherId'

		batch.push(
			...children.map(({ id }) =>
				this.prisma.familyMember.update({
					where: { id },
					data: { [parentTypeId]: toMemberId },
					select: { id: true },
				}),
			),
		)

		batch.push(
			isMale
				? this.prisma.formerSpouses.updateMany({
						where: { formerHusbandId: fromMemberId },
						data: { formerHusbandId: toMemberId },
					})
				: this.prisma.formerSpouses.updateMany({
						where: { formerWifeId: fromMemberId },
						data: { formerWifeId: toMemberId },
					}),
		)

		batch.push(
			this.prisma.familyMember.updateMany({
				where: { familyId: fromFamily.id },
				data: { familyId: toFamily.id },
			}),
			this.familyMemberService.delete(fromMemberId, fromFamily.id),
		)

		await Promise.all(batch)
	}

	async get(id?: string) {
		if (!id) throw new BadRequestException('You have no family')

		const family = await this.prisma.family.findUnique({
			where: { id },
			include: {
				familyMembers: {
					include: $familyMemberInclude,
					omit: { wifeId: true },
				},
				users: { select: $baseUserSelect },
				owner: { select: $baseUserSelect },
			},
			omit: { password: true },
		})

		if (!family) throw new NotFoundException('Family not found')
		return family
	}

	async getAnotherFamilyByInviteId(inviteId: string) {
		const invite = await this.prisma.familyInvitation.findUnique({
			where: { id: inviteId },
			select: { familyId: true, status: true },
		})

		if (!invite) throw new NotFoundException('Invite not found')
		if (invite.status === 'REVOKED')
			throw new BadRequestException('Invite already revoked')

		const family = await this.prisma.family.findUnique({
			where: { id: invite.familyId },
			select: {
				name: true,
				_count: { select: { users: true, familyMembers: true } },
				owner: { select: { username: true, avatarImageUrl: true } },
			},
		})

		if (!family) throw new NotFoundException('Family not found')

		return family
	}

	async update(dto: UpdateFamilyDto, id?: string) {
		if (!id) throw new BadRequestException('You have no family')
		if (dto.password) dto.password = await hash(dto.password)

		await this.prisma.family.update({
			where: { id },
			data: dto,
			select: { id: true },
		})
	}

	async delete(id?: string) {
		if (!id) throw new BadRequestException('You have no family')

		const members = await this.prisma.familyMember.findMany({
			where: { familyId: id },
			select: { id: true },
		})

		if (members.length > 10)
			throw new BadRequestException(
				`Too many family members: ${members.length}>10`,
			)

		await Promise.all(
			members.map(member => this.familyMemberService.delete(member.id, id)),
		)

		await this.prisma.family.delete({
			where: { id },
			select: { id: true },
		})
	}
}
