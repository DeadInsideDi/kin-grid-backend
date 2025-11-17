import { Module } from '@nestjs/common'
import { PostimgService } from 'src/services/postimg.service'
import { PrismaService } from '../services/prisma.service'
import { UserController } from './user.controller'
import { UserService } from './user.service'

@Module({
	controllers: [UserController],
	providers: [UserService, PrismaService, PostimgService],
	exports: [UserService],
})
export class UserModule {}
