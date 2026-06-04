import { Module } from '@nestjs/common';
import { WorkspacesController } from './workspaces.controller';
import { WorkspacesService } from './workspaces.service';
import { WorkspacesRepository } from '../repositories/workspaces.repository';
import { UserRepository } from '../repositories/user.repository';
import { AttendanceRepository } from '../repositories/attendance.repository';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [WorkspacesController],
  providers: [
    WorkspacesService,
    WorkspacesRepository,
    UserRepository,
    AttendanceRepository,
  ],
})
export class WorkspacesModule {}
