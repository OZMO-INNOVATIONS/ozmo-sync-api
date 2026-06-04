import { Module } from '@nestjs/common';
import { InvitationsController } from './invitations.controller';
import { InvitationsService } from './invitations.service';
import { InvitationRepository } from '../repositories/invitation.repository';
import { UserRepository } from '../repositories/user.repository';
import { WorkspacesRepository } from '../repositories/workspaces.repository';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [InvitationsController],
  providers: [
    InvitationsService,
    InvitationRepository,
    UserRepository,
    WorkspacesRepository,
  ],
  exports: [InvitationRepository],
})
export class InvitationsModule {}
