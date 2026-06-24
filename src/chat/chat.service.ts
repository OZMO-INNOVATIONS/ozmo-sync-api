import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ChannelType } from '@prisma/client';

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) { }

  // ─── Channels ──────────────────────────────────────────────────────────────

  async createChannel(
    userId: string,
    workspaceId: string,
    data: {
      channelName: string;
      description?: string;
      channelType: ChannelType;
      memberIds?: string[];
    },
  ) {
    const channelNameFormatted = data.channelName.toLowerCase().replace(/[^a-z0-9-_]/g, '');

    // Check if channel already exists in workspace
    const existing = await this.prisma.chatChannel.findFirst({
      where: {
        workspaceId,
        channelName: channelNameFormatted,
      },
    });
    if (existing) {
      throw new ForbiddenException(`Channel #${channelNameFormatted} already exists in this workspace`);
    }

    // Create channel
    const channel = await this.prisma.chatChannel.create({
      data: {
        workspaceId,
        channelName: channelNameFormatted,
        description: data.description,
        channelType: data.channelType,
        createdBy: userId,
      },
    });

    // Add creator as admin member
    await this.prisma.channelMember.create({
      data: {
        channelId: channel.id,
        userId,
        role: 'admin',
      },
    });

    // Add other members if provided (and if private, or optional for public)
    if (data.memberIds && data.memberIds.length > 0) {
      const memberData = data.memberIds
        .filter((id) => id !== userId)
        .map((id) => ({
          channelId: channel.id,
          userId: id,
          role: 'member',
        }));

      if (memberData.length > 0) {
        await this.prisma.channelMember.createMany({
          data: memberData,
          skipDuplicates: true,
        });
      }
    }

    return this.getChannelDetails(channel.id, userId);
  }

  async updateChannel(
    userId: string,
    channelId: string,
    data: {
      channelName?: string;
      description?: string;
      channelType?: ChannelType;
    },
  ) {
    // Check if channel exists
    const channel = await this.prisma.chatChannel.findUnique({
      where: { id: channelId },
      include: { members: true },
    });
    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    // Verify creator or admin rights
    const member = channel.members.find((m) => m.userId === userId);
    if (!member || (member.role !== 'admin' && channel.createdBy !== userId)) {
      throw new ForbiddenException('Only channel admins can edit this channel');
    }

    const updateData: any = {};
    if (data.channelName) {
      updateData.channelName = data.channelName.toLowerCase().replace(/[^a-z0-9-_]/g, '');
    }
    if (data.description !== undefined) {
      updateData.description = data.description;
    }
    if (data.channelType) {
      updateData.channelType = data.channelType;
    }

    const updated = await this.prisma.chatChannel.update({
      where: { id: channelId },
      data: updateData,
    });

    return this.getChannelDetails(updated.id, userId);
  }

  async deleteChannel(userId: string, channelId: string) {
    const channel = await this.prisma.chatChannel.findUnique({
      where: { id: channelId },
      include: { members: true },
    });
    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    // Verify rights (only creator or admin can delete)
    const member = channel.members.find((m) => m.userId === userId);
    if (!member || (member.role !== 'admin' && channel.createdBy !== userId)) {
      throw new ForbiddenException('Only channel admins can delete this channel');
    }

    await this.prisma.chatChannel.delete({
      where: { id: channelId },
    });

    return { success: true, message: 'Channel deleted successfully' };
  }

  async getChannels(userId: string, workspaceId: string) {
    // Retrieve:
    // 1. All PUBLIC channels in workspace
    // 2. PRIVATE channels in workspace where user is a member
    return this.prisma.chatChannel.findMany({
      where: {
        workspaceId,
        OR: [
          { channelType: ChannelType.PUBLIC },
          {
            channelType: ChannelType.PRIVATE,
            members: {
              some: { userId },
            },
          },
        ],
      },
      include: {
        members: {
          select: {
            userId: true,
            role: true,
          },
        },
        _count: {
          select: { messages: true },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            sender: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                profilePhoto: true,
              },
            },
          },
        },
      },
      orderBy: { channelName: 'asc' },
    });
  }

  async getChannelDetails(channelId: string, userId: string) {
    const channel = await this.prisma.chatChannel.findUnique({
      where: { id: channelId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                profilePhoto: true,
                status: true,
              },
            },
          },
        },
      },
    });

    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    // If private, ensure user is a member
    if (channel.channelType === ChannelType.PRIVATE) {
      const isMember = channel.members.some((m) => m.userId === userId);
      if (!isMember) {
        throw new ForbiddenException('You do not have access to this private channel');
      }
    }

    return channel;
  }

  async addMembers(channelId: string, userId: string, memberIds: string[]) {
    const channel = await this.prisma.chatChannel.findUnique({
      where: { id: channelId },
      include: { members: true },
    });
    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    // Verify creator or admin rights
    const member = channel.members.find((m) => m.userId === userId);
    if (!member || (member.role !== 'admin' && channel.createdBy !== userId)) {
      throw new ForbiddenException('Only channel admins can add members');
    }

    const memberData = memberIds.map((id) => ({
      channelId,
      userId: id,
      role: 'member',
    }));

    await this.prisma.channelMember.createMany({
      data: memberData,
      skipDuplicates: true,
    });

    return this.getChannelDetails(channelId, userId);
  }

  async removeMember(channelId: string, adminId: string, targetUserId: string) {
    const channel = await this.prisma.chatChannel.findUnique({
      where: { id: channelId },
      include: { members: true },
    });
    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    // Verify rights (admin can remove anyone, member can remove themselves/leave)
    const isAdmin = channel.members.some((m) => m.userId === adminId && m.role === 'admin') || channel.createdBy === adminId;
    if (!isAdmin && adminId !== targetUserId) {
      throw new ForbiddenException('Only admins can remove other members');
    }

    await this.prisma.channelMember.delete({
      where: {
        channelId_userId: {
          channelId,
          userId: targetUserId,
        },
      },
    });

    return this.getChannelDetails(channelId, adminId);
  }

  // ─── Messages ──────────────────────────────────────────────────────────────

  async sendMessage(
    userId: string,
    data: {
      channelId: string;
      message: string;
      messageType?: string;
      fileUrl?: string;
      fileName?: string;
    },
  ) {
    // Check access
    const channel = await this.prisma.chatChannel.findUnique({
      where: { id: data.channelId },
      include: { members: true },
    });
    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    if (channel.channelType === ChannelType.PRIVATE) {
      const isMember = channel.members.some((m) => m.userId === userId);
      if (!isMember) {
        throw new ForbiddenException('You are not a member of this private channel');
      }
    }

    // Create message
    const msg = await this.prisma.chatMessage.create({
      data: {
        channelId: data.channelId,
        senderId: userId,
        message: data.message,
        messageType: data.messageType || 'text',
        fileUrl: data.fileUrl,
        fileName: data.fileName,
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePhoto: true,
          },
        },
        reads: true,
      },
    });

    // Mark it as read by the sender
    await this.prisma.messageRead.create({
      data: {
        messageId: msg.id,
        userId,
      },
    });

    return msg;
  }

  async updateMessage(userId: string, messageId: string, messageText: string) {
    const msg = await this.prisma.chatMessage.findUnique({
      where: { id: messageId },
    });
    if (!msg) {
      throw new NotFoundException('Message not found');
    }

    if (msg.senderId !== userId) {
      throw new ForbiddenException('You can only edit your own messages');
    }

    return this.prisma.chatMessage.update({
      where: { id: messageId },
      data: {
        message: messageText,
        isEdited: true,
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePhoto: true,
          },
        },
        reads: true,
      },
    });
  }

  async deleteMessage(userId: string, messageId: string) {
    const msg = await this.prisma.chatMessage.findUnique({
      where: { id: messageId },
    });
    if (!msg) {
      throw new NotFoundException('Message not found');
    }

    if (msg.senderId !== userId) {
      throw new ForbiddenException('You can only delete your own messages');
    }

    await this.prisma.chatMessage.delete({
      where: { id: messageId },
    });

    return { success: true, message: 'Message deleted successfully' };
  }

  async getMessages(channelId: string, userId: string, page = 1, limit = 50) {
    const channel = await this.prisma.chatChannel.findUnique({
      where: { id: channelId },
      include: { members: true },
    });
    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    if (channel.channelType === ChannelType.PRIVATE) {
      const isMember = channel.members.some((m) => m.userId === userId);
      if (!isMember) {
        throw new ForbiddenException('You do not have access to this private channel');
      }
    }

    const offset = (page - 1) * limit;

    const messages = await this.prisma.chatMessage.findMany({
      where: { channelId },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePhoto: true,
          },
        },
        reads: {
          select: {
            userId: true,
            readAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
    });

    // We return chronologically (reversed list from page query)
    return messages.reverse();
  }

  async markAsRead(userId: string, messageId: string) {
    const existingRead = await this.prisma.messageRead.findUnique({
      where: {
        messageId_userId: {
          messageId,
          userId,
        },
      },
    });

    if (existingRead) {
      return existingRead;
    }

    return this.prisma.messageRead.create({
      data: {
        messageId,
        userId,
      },
    });
  }

  async getUnreadCount(userId: string, workspaceId: string) {
    // Find all channels user belongs to in workspace
    const channels = await this.prisma.chatChannel.findMany({
      where: {
        workspaceId,
        OR: [
          { channelType: ChannelType.PUBLIC },
          {
            channelType: ChannelType.PRIVATE,
            members: {
              some: { userId },
            },
          },
        ],
      },
      select: { id: true },
    });

    const channelIds = channels.map((c) => c.id);

    // Count messages in these channels where user has not read them
    // i.e., chatMessage.senderId != userId AND there is no messageRead record for this user
    const unreadMessages = await this.prisma.chatMessage.count({
      where: {
        channelId: { in: channelIds },
        senderId: { not: userId },
        reads: {
          none: { userId },
        },
      },
    });

    return { unreadCount: unreadMessages };
  }

  async searchMessages(userId: string, workspaceId: string, query: string, filter?: string) {
    // Find channels user has access to
    const channels = await this.prisma.chatChannel.findMany({
      where: {
        workspaceId,
        OR: [
          { channelType: ChannelType.PUBLIC },
          {
            channelType: ChannelType.PRIVATE,
            members: {
              some: { userId },
            },
          },
        ],
      },
      select: { id: true },
    });

    const channelIds = channels.map((c) => c.id);

    const dateFilter: any = {};
    if (filter === 'today') {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      dateFilter.createdAt = { gte: startOfDay };
    } else if (filter === 'week') {
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);
      dateFilter.createdAt = { gte: lastWeek };
    }

    const typeFilter: any = {};
    if (filter === 'images') {
      typeFilter.messageType = 'image';
    } else if (filter === 'documents') {
      typeFilter.messageType = { in: ['pdf', 'file', 'doc'] };
    }

    return this.prisma.chatMessage.findMany({
      where: {
        channelId: { in: channelIds },
        message: {
          contains: query,
          mode: 'insensitive',
        },
        ...dateFilter,
        ...typeFilter,
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePhoto: true,
          },
        },
        channel: {
          select: {
            id: true,
            channelName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async getChatNotifications(userId: string) {
    // Return unread notifications for this user
    return this.prisma.notification.findMany({
      where: {
        userId,
        isRead: false,
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }
}
