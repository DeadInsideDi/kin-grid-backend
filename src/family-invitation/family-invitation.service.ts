import {
	BadRequestException,
	ConflictException,
	ForbiddenException,
	GoneException,
	Injectable,
	NotFoundException,
} from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { User } from '@prisma/client'
import { FamilyService } from '../family/family.service'
import { PrismaService } from '../services/prisma.service'
import { CreateFamilyInvitationDto } from './dto/create-family-invitation.dto'

const DEFAULT_INVITATION_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000 // 1 week
const DAY_MS = 24 * 60 * 60 * 1000
const MAX_INVITATIONS_PER_DAY = 32

@Injectable()
export class FamilyInvitationService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly familyService: FamilyService,
	) {}

	private async validateInvitationLimit(userId: string): Promise<void> {
		const count = await this.prisma.familyInvitation.count({
			where: {
				inviterUserId: userId,
				createdAt: { gt: new Date(Date.now() - DAY_MS) },
			},
		})

		if (count >= MAX_INVITATIONS_PER_DAY)
			throw new BadRequestException(
				`Daily invite limit exceeded (${MAX_INVITATIONS_PER_DAY})`,
			)
	}

	async create(user: User, dto: CreateFamilyInvitationDto) {
		const { id: userId, familyId } = user
		if (!familyId) throw new ForbiddenException('You must belong to a family')

		await this.validateInvitationLimit(userId)

		const { familyMemberId, expiresAt, inviteeUserId } = dto
		const member = await this.prisma.familyMember.findUnique({
			where: { id: familyMemberId },
			select: { familyId: true },
		})

		if (!member || member.familyId !== familyId)
			throw new BadRequestException('Invalid family member')

		const invitation = await this.prisma.familyInvitation.create({
			data: {
				familyId,
				familyMemberId,
				inviterUserId: userId,
				inviteeUserId,
				expiresAt:
					expiresAt || new Date(Date.now() + DEFAULT_INVITATION_EXPIRY_MS),
			},
			select: { id: true },
		})

		return invitation.id
	}

	async accept(id: string, connectFamily: boolean, user: User) {
		const invitation = await this.prisma.familyInvitation.findUnique({
			where: { id },
		})

		if (!invitation)
			throw new NotFoundException('Invitation not found or deleted')
		if (invitation.familyId === user.familyId)
			throw new ConflictException('You already belong to this family')
		if (invitation.inviteeUserId && invitation.inviteeUserId !== user.id)
			throw new ForbiddenException('Invitation not for you')
		if (invitation.status === 'ACCEPTED')
			throw new GoneException('This invitation has already been used')
		if (invitation.status === 'REVOKED')
			throw new GoneException('This invitation has been revoked by the sender')
		if (invitation.status === 'EXPIRED')
			throw new GoneException('This invitation has expired')

		if (connectFamily && user.familyId)
			await this.familyService.unionFamilies(invitation, user)

		const [invite, familyId, userWithId] = await Promise.all([
			this.prisma.familyInvitation.update({
				where: { id },
				data: { status: 'ACCEPTED' },
				select: { id: true },
			}),
			this.familyService.connectUserWithInvitation(invitation, user.id),
			this.prisma.user.update({
				where: { id: user.id },
				data: { familyMemberId: invitation.familyMemberId },
				select: { id: true },
			}),
		])

		return familyId
	}

	async revoke(invitationId: string, userId: string) {
		await this.prisma.familyInvitation.update({
			where: { id: invitationId, inviterUserId: userId },
			data: { status: 'REVOKED' },
		})
	}

	async getSendedInvitations(userId: string) {
		const invitations = await this.prisma.familyInvitation.findMany({
			where: { inviterUserId: userId },
		})
		return invitations
	}

	async getReceivedInvitations(userId: string) {
		const invitations = await this.prisma.familyInvitation.findMany({
			where: { inviteeUserId: userId },
		})
		return invitations
	}

	@Cron(CronExpression.EVERY_6_HOURS)
	async autoExpireInvitations() {
		await this.prisma.familyInvitation.updateMany({
			where: { status: 'PENDING', expiresAt: { lt: new Date() } },
			data: { status: 'EXPIRED' },
		})
	}
}
