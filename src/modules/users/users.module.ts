import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { MockUsersRepository } from './repositories/mock-users.repository';
import { USERS_REPOSITORY } from './interfaces/users-repository.interface';

/**
 * UsersModule
 *
 * Provides the UsersService and the concrete IUsersRepository implementation.
 *
 * --- Migration to Prisma ---
 *  1. Replace the provider class below:
 *       { provide: IUsersRepository, useClass: PrismaUsersRepository }
 *  2. Import PrismaModule so the Prisma service is available.
 */
@Module({
  providers: [
    UsersService,
    {
      provide: USERS_REPOSITORY,
      useClass: MockUsersRepository,
    },
  ],
  exports: [UsersService],
})
export class UsersModule {}
