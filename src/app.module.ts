import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ScheduleModule } from '@nestjs/schedule'
import { AuthModule } from './auth/auth.module'
import { FamilyInvitationModule } from './family-invitation/family-invitation.module'
import { FamilyMemberModule } from './family-member/family-member.module'
import { FamilyModule } from './family/family.module'
import { MailerModule } from './mailer/mailer.module'
import { RelationsModule } from './relations/relations.module'
import { UserModule } from './user/user.module'
import { PricingModule } from './pricing/pricing.module';

@Module({
	imports: [
		ConfigModule.forRoot({
			envFilePath: `.env`,
		}),
		ScheduleModule.forRoot(),
		UserModule,
		AuthModule,
		RelationsModule,
		FamilyMemberModule,
		FamilyModule,
		FamilyInvitationModule,
		MailerModule,
		PricingModule,
	],
})
export class AppModule {}
