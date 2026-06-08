import { Module } from '@nestjs/common';
import { InvitationsService } from './invitations.service';
import { InvitationRepository } from '../repositories/invitation.repository';
import { UserRepository } from '../repositories/user.repository';
import { WorkspacesRepository } from '../repositories/workspaces.repository';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [],
  providers: [
    InvitationsService,
    InvitationRepository,
    UserRepository,
    WorkspacesRepository,
  ],
  exports: [InvitationRepository, InvitationsService],
})
export class InvitationsModule {}
