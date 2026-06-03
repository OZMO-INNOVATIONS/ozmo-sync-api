import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CareersService } from './careers.service';
import { QueryJobsDto } from './dto/query-jobs.dto';
import { ApplyJobDto } from './dto/apply-job.dto';

interface UploadedFileInfo {
  fieldname: string;
  originalname: string;
  mimetype: string;
  size: number;
  buffer?: Buffer;
}

const ALLOWED_RESUME_MIME = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

@Controller({ path: 'careers', version: '1' })
export class CareersController {
  constructor(private readonly careersService: CareersService) {}

  @Get('jobs')
  async listJobs(@Query() query: QueryJobsDto) {
    const data = await this.careersService.listJobs(query);
    return { message: 'Job listings retrieved', data };
  }

  @Post('jobs/:jobId/apply')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('resume', {
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_, file, cb) => {
        if (ALLOWED_RESUME_MIME.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Resume must be a PDF, DOC, or DOCX file'), false);
        }
      },
    }),
  )
  async applyForJob(
    @Param('jobId') jobId: string,
    @Body() dto: ApplyJobDto,
    @UploadedFile() resume?: UploadedFileInfo,
  ) {
    // In production: upload resume buffer to S3 and store the URL
    const resumeUrl = resume
      ? `uploads/resumes/${Date.now()}_${resume.originalname}`
      : undefined;

    const data = await this.careersService.applyForJob(jobId, dto, resumeUrl);
    return { message: 'Application submitted successfully', data };
  }
}
