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
import {
  ApproveDocumentDto,
  RejectDocumentDto,
  ReuploadRequestDto,
  ResolveUpdateRequestDto,
} from './dto/document.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequestUser } from '../common/interfaces/request-user.interface';
import { Role } from '../common/constants/roles.enum';

@Controller({ path: 'admin', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.HR)
export class AdminDocumentController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get('documents')
  @HttpCode(HttpStatus.OK)
  async getAllDocuments(@CurrentUser() user: RequestUser) {
    const data = await this.documentsService.getAllDocumentsAdmin(user.workspaceId || undefined);
    return { success: true, data };
  }

  @Get('document/update-requests')
  @HttpCode(HttpStatus.OK)
  async getUpdateRequests(@CurrentUser() user: RequestUser) {
    const data = await this.documentsService.getUpdateRequests(user.workspaceId || undefined);
    return { success: true, data };
  }

  @Post('document/approve')
  @HttpCode(HttpStatus.OK)
  async approve(@Body() dto: ApproveDocumentDto) {
    const data = await this.documentsService.approveDocument(dto.documentId, dto.remarks);
    return { success: true, message: 'Document approved successfully', data };
  }

  @Post('document/reject')
  @HttpCode(HttpStatus.OK)
  async reject(@Body() dto: RejectDocumentDto) {
    const data = await this.documentsService.rejectDocument(dto.documentId, dto.remarks);
    return { success: true, message: 'Document rejected successfully', data };
  }

  @Post('document/reupload-request')
  @HttpCode(HttpStatus.OK)
  async requestReupload(@Body() dto: ReuploadRequestDto) {
    const data = await this.documentsService.requestReupload(dto.documentId, dto.remarks);
    return { success: true, message: 'Re-upload request sent successfully', data };
  }

  @Post('document/update/approve')
  @HttpCode(HttpStatus.OK)
  async approveUpdate(
    @CurrentUser() user: RequestUser,
    @Body() dto: ResolveUpdateRequestDto,
  ) {
    const data = await this.documentsService.approveUpdateRequest(dto.updateRequestId, user.id);
    return { success: true, message: 'Update request approved successfully', data };
  }

  @Post('document/update/reject')
  @HttpCode(HttpStatus.OK)
  async rejectUpdate(
    @CurrentUser() user: RequestUser,
    @Body() dto: ResolveUpdateRequestDto,
  ) {
    const data = await this.documentsService.rejectUpdateRequest(
      dto.updateRequestId,
      user.id,
      dto.remarks,
    );
    return { success: true, message: 'Update request rejected successfully', data };
  }
}
