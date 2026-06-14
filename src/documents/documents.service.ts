import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  UploadDocumentDto,
  CreateUpdateRequestDto,
  ApproveDocumentDto,
  RejectDocumentDto,
  ReuploadRequestDto,
  ResolveUpdateRequestDto,
} from './dto/document.dto';
import { DocumentStatus, RequestStatus } from '@prisma/client';

@Injectable()
export class DocumentsService {
  constructor(private readonly prisma: PrismaService) {}

  async getEmployeeDocuments(employeeId: string) {
    return this.prisma.employeeDocument.findMany({
      where: { employeeId },
      orderBy: { uploadDate: 'desc' },
      include: {
        updateRequests: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  async getAllDocumentsAdmin(workspaceId?: string) {
    return this.prisma.employeeDocument.findMany({
      where: {
        isCurrent: true,
        employee: workspaceId ? { workspaceId } : undefined,
      },
      orderBy: { uploadDate: 'desc' },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            designation: true,
            department: true,
            profilePhoto: true,
          },
        },
        updateRequests: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  async uploadDocument(employeeId: string, dto: UploadDocumentDto) {
    const { documentType, name, fileUrl, expiryDate } = dto;

    // Look for existing current document of this type
    const existing = await this.prisma.employeeDocument.findFirst({
      where: {
        employeeId,
        documentType,
        isCurrent: true,
      },
    });

    if (existing) {
      // If it is already APPROVED, they should submit an update request instead.
      if (existing.status === DocumentStatus.APPROVED) {
        throw new BadRequestException(
          'This document type is already verified. Please submit an update request to replace it.',
        );
      }

      // If it was PENDING, REJECTED, or REUPLOAD_REQUESTED, we update it in-place to save DB slots
      return this.prisma.employeeDocument.update({
        where: { id: existing.id },
        data: {
          name,
          fileUrl,
          expiryDate: expiryDate ? new Date(expiryDate) : null,
          status: DocumentStatus.PENDING,
          rejectionReason: null,
          version: existing.version + 1,
          uploadDate: new Date(),
        },
      });
    }

    // Otherwise, create a new document
    return this.prisma.employeeDocument.create({
      data: {
        employeeId,
        documentType,
        name,
        fileUrl,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        status: DocumentStatus.PENDING,
        version: 1,
        isCurrent: true,
      },
    });
  }

  async createUpdateRequest(employeeId: string, dto: CreateUpdateRequestDto) {
    const { documentId, reason, newFileName, newFileUrl } = dto;

    const document = await this.prisma.employeeDocument.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    if (document.employeeId !== employeeId) {
      throw new BadRequestException('You do not own this document');
    }

    if (document.status !== DocumentStatus.APPROVED) {
      throw new BadRequestException('You can only request updates on approved documents');
    }

    // Check if there is already a pending update request
    const existingPending = await this.prisma.documentUpdateRequest.findFirst({
      where: {
        documentId,
        status: RequestStatus.PENDING,
      },
    });

    if (existingPending) {
      throw new BadRequestException('There is already a pending update request for this document');
    }

    // Use a transaction to create the update request and mark the document status
    return this.prisma.$transaction(async (tx) => {
      await tx.employeeDocument.update({
        where: { id: documentId },
        data: {
          status: DocumentStatus.UPDATE_REQUESTED,
        },
      });

      return tx.documentUpdateRequest.create({
        data: {
          documentId,
          employeeId,
          reason,
          newFileName,
          newFileUrl,
          status: RequestStatus.PENDING,
        },
      });
    });
  }

  async getUpdateRequests(workspaceId?: string) {
    return this.prisma.documentUpdateRequest.findMany({
      where: {
        document: {
          employee: workspaceId ? { workspaceId } : undefined,
        },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        document: {
          include: {
            employee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                designation: true,
                department: true,
                profilePhoto: true,
              },
            },
          },
        },
      },
    });
  }

  async getEmployeeUpdateStatus(employeeId: string) {
    return this.prisma.documentUpdateRequest.findMany({
      where: { employeeId },
      orderBy: { createdAt: 'desc' },
      include: {
        document: true,
      },
    });
  }

  async approveDocument(documentId: string, remarks?: string) {
    const document = await this.prisma.employeeDocument.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    return this.prisma.employeeDocument.update({
      where: { id: documentId },
      data: {
        status: DocumentStatus.APPROVED,
        approvalDate: new Date(),
        updatedDate: new Date(),
        rejectionReason: remarks || null,
      },
    });
  }

  async rejectDocument(documentId: string, remarks: string) {
    const document = await this.prisma.employeeDocument.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    return this.prisma.employeeDocument.update({
      where: { id: documentId },
      data: {
        status: DocumentStatus.REJECTED,
        rejectionReason: remarks,
        updatedDate: new Date(),
      },
    });
  }

  async requestReupload(documentId: string, remarks: string) {
    const document = await this.prisma.employeeDocument.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    return this.prisma.employeeDocument.update({
      where: { id: documentId },
      data: {
        status: DocumentStatus.REUPLOAD_REQUESTED,
        rejectionReason: remarks,
        updatedDate: new Date(),
      },
    });
  }

  async approveUpdateRequest(updateRequestId: string, adminId: string) {
    const request = await this.prisma.documentUpdateRequest.findUnique({
      where: { id: updateRequestId },
      include: { document: true },
    });

    if (!request) {
      throw new NotFoundException('Update request not found');
    }

    if (request.status !== RequestStatus.PENDING) {
      throw new BadRequestException('This update request is already resolved');
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Mark the old document as no longer current
      await tx.employeeDocument.update({
        where: { id: request.documentId },
        data: {
          isCurrent: false,
          updatedDate: new Date(),
        },
      });

      // 2. Create the new version of the document, marked as APPROVED
      const newDoc = await tx.employeeDocument.create({
        data: {
          employeeId: request.employeeId,
          documentType: request.document.documentType,
          name: request.newFileName,
          fileUrl: request.newFileUrl,
          expiryDate: request.document.expiryDate, // inherit expiry
          status: DocumentStatus.APPROVED,
          version: request.document.version + 1,
          parentId: request.document.parentId || request.document.id,
          isCurrent: true,
          approvalDate: new Date(),
        },
      });

      // 3. Mark the update request as APPROVED
      await tx.documentUpdateRequest.update({
        where: { id: updateRequestId },
        data: {
          status: RequestStatus.APPROVED,
          resolvedAt: new Date(),
          resolvedBy: adminId,
        },
      });

      return newDoc;
    });
  }

  async rejectUpdateRequest(updateRequestId: string, adminId: string, remarks?: string) {
    const request = await this.prisma.documentUpdateRequest.findUnique({
      where: { id: updateRequestId },
    });

    if (!request) {
      throw new NotFoundException('Update request not found');
    }

    if (request.status !== RequestStatus.PENDING) {
      throw new BadRequestException('This update request is already resolved');
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Revert the document status back to APPROVED since update request was rejected
      await tx.employeeDocument.update({
        where: { id: request.documentId },
        data: {
          status: DocumentStatus.APPROVED,
          rejectionReason: remarks || null,
          updatedDate: new Date(),
        },
      });

      // 2. Mark the update request as REJECTED
      return tx.documentUpdateRequest.update({
        where: { id: updateRequestId },
        data: {
          status: RequestStatus.REJECTED,
          resolvedAt: new Date(),
          resolvedBy: adminId,
        },
      });
    });
  }
}
