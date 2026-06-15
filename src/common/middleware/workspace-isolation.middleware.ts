import { Injectable, NestMiddleware, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { WorkspaceMemberRepository } from '../../repositories/workspace-member.repository';
import { UserStatus } from '../constants/roles.enum';

@Injectable()
export class WorkspaceIsolationMiddleware implements NestMiddleware {
  constructor(private readonly workspaceMemberRepository: WorkspaceMemberRepository) {}

  async use(req: Request, res: Response, next: NextFunction) {
    // 1. Skip if route is public
    const isPublic = req.path.startsWith('/auth') || req.path.startsWith('/careers') || req.path === '/';
    if (isPublic) {
      return next();
    }

    const user = (req as any).user;
    if (!user) {
      // Let JwtAuthGuard handle the missing authentication later
      return next();
    }

    // 2. Resolve workspace ID from:
    //    a) Header 'x-workspace-id'
    //    b) Query parameter 'workspaceId'
    //    c) The JWT user payload 'workspaceId'
    let workspaceId = req.headers['x-workspace-id'] as string || req.query.workspaceId as string || user.workspaceId;

    if (!workspaceId) {
      // If user is SUPER_ADMIN, they might not be inside a workspace context (e.g. looking at global platform metrics)
      if (user.role === 'SUPER_ADMIN') {
        return next();
      }
      throw new BadRequestException('Workspace context is required. Please provide a workspace header or switch workspace.');
    }

    // 3. Verify user has access to this workspace
    const membership = await this.workspaceMemberRepository.findByWorkspaceAndUser(workspaceId, user.id);
    if (!membership) {
      throw new UnauthorizedException('Access denied: You are not a member of this workspace.');
    }

    if (membership.status !== UserStatus.ACTIVE && membership.status !== UserStatus.INVITED) {
      throw new UnauthorizedException('Access denied: Your membership in this workspace is suspended or inactive.');
    }

    // 4. Attach active workspace context to request object
    (req as any).workspaceId = workspaceId;
    (req as any).workspaceRole = membership.role;
    
    // Also override user object workspace context so guards work seamlessly
    user.workspaceId = workspaceId;
    user.role = membership.role;

    next();
  }
}
