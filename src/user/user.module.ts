import { Module } from '@nestjs/common'
import { ImgbbService } from 'src/services/imgbb.service'
import { PrismaService } from '../services/prisma.service'
import { UserController } from './user.controller'
import { UserService } from './user.service'

@Module({
	controllers: [UserController],
	providers: [UserService, PrismaService, ImgbbService],
	exports: [UserService],
})
export class UserModule {}
