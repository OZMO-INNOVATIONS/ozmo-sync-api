import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { UploadDocumentDto, CreateUpdateRequestDto } from './dto/document.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequestUser } from '../common/interfaces/request-user.interface';
import { Role } from '../common/constants/roles.enum';

@Controller({ path: 'employee', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
export class EmployeeDocumentController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post('document/upload')
  @HttpCode(HttpStatus.CREATED)
  @Roles(Role.STAFF, Role.TEAM_LEAD, Role.ADMIN, Role.HR)
  async upload(
    @CurrentUser() user: RequestUser,
    @Body() dto: UploadDocumentDto,
  ) {
    const data = await this.documentsService.uploadDocument(user.id, dto);
    return { success: true, message: 'Document uploaded successfully', data };
  }

  @Get('documents')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.STAFF, Role.TEAM_LEAD, Role.ADMIN, Role.HR)
  async getMyDocuments(@CurrentUser() user: RequestUser) {
    const data = await this.documentsService.getEmployeeDocuments(user.id);
    return { success: true, data };
  }

  @Post('document/update-request')
  @HttpCode(HttpStatus.CREATED)
  @Roles(Role.STAFF, Role.TEAM_LEAD, Role.ADMIN, Role.HR)
  async updateRequest(
    @CurrentUser() user: RequestUser,
    @Body() dto: CreateUpdateRequestDto,
  ) {
    const data = await this.documentsService.createUpdateRequest(user.id, dto);
    return { success: true, message: 'Update request submitted successfully', data };
  }

  @Get('document/update-status')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.STAFF, Role.TEAM_LEAD, Role.ADMIN, Role.HR)
  async getMyUpdateRequests(@CurrentUser() user: RequestUser) {
    const data = await this.documentsService.getEmployeeUpdateStatus(user.id);
    return { success: true, data };
  }
}
