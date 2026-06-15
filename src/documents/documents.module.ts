import { Module } from '@nestjs/common';
import { EmployeeDocumentController } from './employee-document.controller';
import { AdminDocumentController } from './admin-document.controller';
import { DocumentsService } from './documents.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [EmployeeDocumentController, AdminDocumentController],
  providers: [DocumentsService],
  exports: [DocumentsService],
})
export class DocumentsModule {}
