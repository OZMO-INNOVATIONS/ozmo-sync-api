import { Module } from '@nestjs/common';
import { CareersController } from './careers.controller';
import { CareersService } from './careers.service';
import { JobsRepository } from '../repositories/jobs.repository';
import { CandidatesRepository } from '../repositories/candidates.repository';

@Module({
  controllers: [CareersController],
  providers: [CareersService, JobsRepository, CandidatesRepository],
  exports: [JobsRepository, CandidatesRepository],
})
export class CareersModule {}
