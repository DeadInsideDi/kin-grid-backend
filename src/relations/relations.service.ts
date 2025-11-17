import { Injectable, NotFoundException } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { replaceAllByLang } from 'src/utils/language.utils'
import { FamilyMemberService } from '../family-member/family-member.service'
import { PrismaService } from '../services/prisma.service'
import { intersectArrays } from '../utils/array.utils'

interface CacheDict {
	[key: string]: Awaited<
		ReturnType<typeof RelationsService.prototype.cachedMembersFromFamily>
	>['members'][number]
}

@Injectable()
export class RelationsService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly familyMemberService: FamilyMemberService,
	) {}

	async cachedMembersFromFamily(familyId: string) {
		const cacheDict: CacheDict = {}
		const family = await this.prisma.family.findUnique({
			where: { id: familyId },
			select: {
				familyMembers: {
					select: {
						id: true,
						gender: true,
						firstName: true,
						father: {
							select: {
								id: true,
								father: true,
								fatherChildren: { select: { id: true } },
							},
						},
						mother: {
							select: {
								id: true,
								mother: true,
								motherChildren: { select: { id: true } },
							},
						},
						fatherChildren: { select: { id: true } },
						motherChildren: { select: { id: true } },
						husband: { select: { id: true } },
						wife: { select: { id: true } },
					},
				},
			},
		})
		if (!family) throw new NotFoundException('Family not found')

		const members = family.familyMembers.map(member => {
			const { fatherChildren, motherChildren, ...other } = member
			const childrenIds = fatherChildren
				.concat(motherChildren)
				.map(child => child.id)
			return { childrenIds, ...other }
		})

		members.forEach(member => {
			cacheDict[member.id] = member
		})
		return { members, cacheDict }
	}

	private findInCacheDict(id: string, cacheDict: CacheDict) {
		return cacheDict.hasOwnProperty(id) ? cacheDict[id] : null
	}

	private haveLessRelation(
		currentId: string,
		currentRelation: string,
		relations: Record<string, string>,
	) {
		return (
			relations.hasOwnProperty(currentId) &&
			relations[currentId].split('|').length <=
				currentRelation.split('|').length
		)
	}

	private _getRelations(
		currentId: string,
		currentRelation: string,
		relations: Record<string, string>,
		cacheDict: CacheDict,
	) {
		if (
			!cacheDict.hasOwnProperty(currentId) ||
			this.haveLessRelation(currentId, currentRelation, relations)
		)
			return
		relations[currentId] = currentRelation

		const { father, mother, childrenIds, wife, husband } = this.findInCacheDict(
			currentId,
			cacheDict,
		)!

		childrenIds.forEach(childId => {
			const childGender = this.findInCacheDict(childId, cacheDict)?.gender
			this._getRelations(
				childId,
				currentRelation + `|${childGender === 'MALE' ? 'son' : 'daughter'}`,
				relations,
				cacheDict,
			)
		})

		let fatherChildrenIds: string[] = [],
			motherChildrenIds: string[] = []

		if (father) {
			fatherChildrenIds = father.fatherChildren
				.map(child => child.id)
				.filter(id => id !== currentId)

			this._getRelations(
				father.id,
				currentRelation + '|father',
				relations,
				cacheDict,
			)
		}

		if (mother) {
			motherChildrenIds = mother?.motherChildren
				.map(child => child.id)
				.filter(id => id !== currentId)

			this._getRelations(
				mother.id,
				currentRelation + '|mother',
				relations,
				cacheDict,
			)
		}

		let onlyFatherChildren = fatherChildrenIds,
			onlyMotherChildrenIds = motherChildrenIds

		if (father && mother) {
			const commonChildren = intersectArrays(
				fatherChildrenIds,
				motherChildrenIds,
			)
			onlyFatherChildren = fatherChildrenIds.filter(
				id => !commonChildren.includes(id),
			)
			onlyMotherChildrenIds = motherChildrenIds.filter(
				id => !commonChildren.includes(id),
			)

			commonChildren.forEach(childId => {
				const childGender = this.findInCacheDict(childId, cacheDict)?.gender
				this._getRelations(
					childId,
					currentRelation + `|${childGender === 'MALE' ? 'brother' : 'sister'}`,
					relations,
					cacheDict,
				)
			})
		}

		onlyFatherChildren.forEach(childId => {
			const child = this.findInCacheDict(childId, cacheDict)
			this._getRelations(
				childId,
				currentRelation +
					`|half-${child?.gender === 'MALE' ? 'brother' : 'sister'}`,
				relations,
				cacheDict,
			)
			if (child?.mother?.id)
				this._getRelations(
					child.mother.id,
					currentRelation + '|stepmother',
					relations,
					cacheDict,
				)
		})

		onlyMotherChildrenIds.forEach(childId => {
			const child = this.findInCacheDict(childId, cacheDict)
			this._getRelations(
				childId,
				currentRelation +
					`|half-${child?.gender === 'MALE' ? 'brother' : 'sister'}`,
				relations,
				cacheDict,
			)
			if (child?.father?.id)
				this._getRelations(
					child.father.id,
					currentRelation + '|stepfather',
					relations,
					cacheDict,
				)
		})

		if (husband)
			this._getRelations(
				husband.id,
				currentRelation + '|husband',
				relations,
				cacheDict,
			)
		else if (wife)
			this._getRelations(
				wife.id,
				currentRelation + '|wife',
				relations,
				cacheDict,
			)
	}

	async getRelations(fromId: string, lang: string, familyId: string) {
		const relations: Record<string, string> = {}
		const { cacheDict } = await this.cachedMembersFromFamily(familyId)

		this._getRelations(fromId, '', relations, cacheDict)
		relations[fromId] = '|i'
		return replaceAllByLang(relations, lang)
	}

	async addSpouse(memberId: string, spouseId: string, familyId: string) {
		if (memberId === spouseId)
			throw new NotFoundException('Spouse cannot be you yourself')

		const { gender } = await this.makeSpouseAsFormer(memberId, familyId)
		const maleSpouseId = gender === 'MALE' ? memberId : spouseId
		const femaleSpouseId = gender === 'FEMALE' ? memberId : spouseId

		await this.prisma.familyMember.update({
			where: { id: maleSpouseId },
			data: { wifeId: femaleSpouseId },
			select: { id: true },
		})
	}

	async addFormerSpouse(
		maleSpouseId: string,
		femaleSpouseId: string,
		familyId: string,
	) {
		const data = {
			husbandFormers: { create: { formerWifeId: femaleSpouseId } },
		}
		await this.familyMemberService.baseUpdate(maleSpouseId, data, familyId)
	}

	async makeSpouseAsFormer(memberId: string, familyId: string) {
		let { maleSpouseId, femaleSpouseId, gender } =
			await this.familyMemberService.getSpouseData(memberId, familyId)

		if (maleSpouseId && femaleSpouseId) {
			const data = {
				wifeId: null,
				husbandFormers: { create: { formerWifeId: femaleSpouseId } },
			}
			await this.familyMemberService.baseUpdate(maleSpouseId, data, familyId)
		}

		return { maleSpouseId, femaleSpouseId, gender }
	}

	async makeFormerSpouseAsCurrentById(
		memberId: string,
		familyId: string,
		formerSpouseId: string,
	) {
		const [member, _] = await Promise.all([
			await this.prisma.familyMember.findUnique({
				where: { id: memberId, familyId },
				select: {
					wifeFormers: { select: { formerHusbandId: true } },
					husbandFormers: { select: { formerWifeId: true } },
					gender: true,
				},
			}),
			await this.makeSpouseAsFormer(memberId, familyId),
		])

		if (!member) throw new NotFoundException('Member not found')
		const formerSpouse =
			member.wifeFormers.find(m => m.formerHusbandId === formerSpouseId) ||
			member.husbandFormers.find(m => m.formerWifeId === formerSpouseId)

		if (!formerSpouse) throw new NotFoundException('Former spouse not found')

		const maleSpouseId = member.gender === 'MALE' ? memberId : formerSpouseId

		await this.familyMemberService.baseUpdate(
			maleSpouseId,
			{ wifeId: formerSpouseId },
			familyId,
		)
	}

	async deleteSpouse(memberId: string, familyId: string) {
		const { maleSpouseId } = await this.familyMemberService.getSpouseData(
			memberId,
			familyId,
		)
		if (!maleSpouseId) throw new NotFoundException('Spouse not found')

		await this.prisma.familyMember.update({
			where: { id: maleSpouseId },
			data: { wifeId: null },
			select: { id: true },
		})
	}

	async deleteFormerSpouse(
		memberId: string,
		spouseId: string,
		familyId: string,
	) {
		const gender = await this.familyMemberService.getGender(memberId, familyId)
		const maleSpouseId = gender === 'MALE' ? memberId : spouseId
		const femaleSpouseId = gender === 'FEMALE' ? memberId : spouseId

		await this.prisma.formerSpouses.delete({
			where: {
				formerHusbandId: maleSpouseId,
				formerWifeId: femaleSpouseId,
			},
			select: { id: true },
		})
	}

	async addParent(memberId: string, parentId: string, familyId: string) {
		const gender = await this.familyMemberService.getGender(parentId, familyId)
		const data: Prisma.FamilyMemberUpdateArgs['data'] = {}

		if (gender === 'MALE') data.fatherId = parentId
		else data.motherId = parentId

		await this.familyMemberService.baseUpdate(memberId, data, familyId)
	}

	async deleteParent(memberId: string, parentId: string, familyId: string) {
		const gender = await this.familyMemberService.getGender(parentId!, familyId)
		const dto: Prisma.FamilyMemberUpdateArgs['data'] = {}

		if (gender === 'MALE') dto.fatherId = null
		else dto.motherId = null

		await this.familyMemberService.baseUpdate(memberId, dto, familyId)
	}
}
