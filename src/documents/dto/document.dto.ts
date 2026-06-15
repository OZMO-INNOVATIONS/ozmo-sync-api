import { IsString, IsNotEmpty, IsOptional, IsDateString, IsUUID } from 'class-validator';

export class UploadDocumentDto {
  @IsString()
  @IsNotEmpty()
  documentType: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  fileUrl: string;

  @IsDateString()
  @IsOptional()
  expiryDate?: string;
}

export class CreateUpdateRequestDto {
  @IsUUID()
  @IsNotEmpty()
  documentId: string;

  @IsString()
  @IsNotEmpty()
  reason: string;

  @IsString()
  @IsNotEmpty()
  newFileName: string;

  @IsString()
  @IsNotEmpty()
  newFileUrl: string;
}

export class ApproveDocumentDto {
  @IsUUID()
  @IsNotEmpty()
  documentId: string;

  @IsString()
  @IsOptional()
  remarks?: string;
}

export class RejectDocumentDto {
  @IsUUID()
  @IsNotEmpty()
  documentId: string;

  @IsString()
  @IsNotEmpty()
  remarks: string;
}

export class ReuploadRequestDto {
  @IsUUID()
  @IsNotEmpty()
  documentId: string;

  @IsString()
  @IsNotEmpty()
  remarks: string;
}

export class ResolveUpdateRequestDto {
  @IsUUID()
  @IsNotEmpty()
  updateRequestId: string;

  @IsString()
  @IsOptional()
  remarks?: string;
}
