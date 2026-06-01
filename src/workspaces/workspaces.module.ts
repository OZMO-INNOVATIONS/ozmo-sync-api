import { Module } from '@nestjs/common';
import { WorkspacesController } from './workspaces.controller';
import { WorkspacesService } from './workspaces.service';
import { WorkspacesRepository } from '../repositories/workspaces.repository';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [WorkspacesController],
  providers: [WorkspacesService, WorkspacesRepository],
})
export class WorkspacesModule {}
