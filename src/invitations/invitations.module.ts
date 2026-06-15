import { Module } from '@nestjs/common';
import { InvitationsService } from './invitations.service';
import { InvitationsController } from './invitations.controller';
import { InvitationRepository } from '../repositories/invitation.repository';
import { UserRepository } from '../repositories/user.repository';
import { WorkspacesRepository } from '../repositories/workspaces.repository';
import { WorkspaceMemberRepository } from '../repositories/workspace-member.repository';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [InvitationsController],
  providers: [
    InvitationsService,
    InvitationRepository,
    UserRepository,
    WorkspacesRepository,
    WorkspaceMemberRepository,
  ],
  exports: [InvitationRepository, InvitationsService],
})
export class InvitationsModule {}
