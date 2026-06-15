import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequestUser } from '../common/interfaces/request-user.interface';
import { ChannelType } from '@prisma/client';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsArray,
} from 'class-validator';

// ─── DTOs ────────────────────────────────────────────────────────────────────

export class CreateChannelDto {
  @IsString()
  @IsNotEmpty()
  channelName: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(ChannelType)
  @IsNotEmpty()
  channelType: ChannelType;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  memberIds?: string[];
}

export class UpdateChannelDto {
  @IsString()
  @IsOptional()
  channelName?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(ChannelType)
  @IsOptional()
  channelType?: ChannelType;
}

export class AddMembersDto {
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  memberIds: string[];
}

export class SendMessageDto {
  @IsString()
  @IsNotEmpty()
  channelId: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsString()
  @IsOptional()
  messageType?: string;

  @IsString()
  @IsOptional()
  fileUrl?: string;

  @IsString()
  @IsOptional()
  fileName?: string;
}

export class UpdateMessageDto {
  @IsString()
  @IsNotEmpty()
  message: string;
}

// ─── Controller ──────────────────────────────────────────────────────────────

@Controller({ path: 'chat', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly chatGateway: ChatGateway,
    private readonly prisma: PrismaService,
  ) {}

  // ─── Channels Endpoints ────────────────────────────────────────────────────

  @Post('channels')
  @HttpCode(HttpStatus.CREATED)
  async createChannel(
    @CurrentUser() user: RequestUser,
    @Body() dto: CreateChannelDto,
  ) {
    if (!user.workspaceId) {
      throw new NotFoundException('Workspace context is required');
    }
    const data = await this.chatService.createChannel(user.id, user.workspaceId, dto);
    return { message: 'Channel created successfully', data };
  }

  @Get('channels')
  async getChannels(@CurrentUser() user: RequestUser) {
    if (!user.workspaceId) {
      throw new NotFoundException('Workspace context is required');
    }
    const data = await this.chatService.getChannels(user.id, user.workspaceId);
    return { message: 'Channels retrieved successfully', data };
  }

  @Get('channels/:channelId')
  async getChannelDetails(
    @Param('channelId') channelId: string,
    @CurrentUser() user: RequestUser,
  ) {
    const data = await this.chatService.getChannelDetails(channelId, user.id);
    return { message: 'Channel details retrieved successfully', data };
  }

  @Patch('channels/:channelId')
  async updateChannel(
    @Param('channelId') channelId: string,
    @CurrentUser() user: RequestUser,
    @Body() dto: UpdateChannelDto,
  ) {
    const data = await this.chatService.updateChannel(user.id, channelId, dto);
    return { message: 'Channel updated successfully', data };
  }

  @Delete('channels/:channelId')
  async deleteChannel(
    @Param('channelId') channelId: string,
    @CurrentUser() user: RequestUser,
  ) {
    const data = await this.chatService.deleteChannel(user.id, channelId);
    return data;
  }

  @Post('channels/:channelId/members')
  async addMembers(
    @Param('channelId') channelId: string,
    @CurrentUser() user: RequestUser,
    @Body() dto: AddMembersDto,
  ) {
    const data = await this.chatService.addMembers(channelId, user.id, dto.memberIds);
    return { message: 'Members added successfully', data };
  }

  @Delete('channels/:channelId/members/:targetUserId')
  async removeMember(
    @Param('channelId') channelId: string,
    @Param('targetUserId') targetUserId: string,
    @CurrentUser() user: RequestUser,
  ) {
    const data = await this.chatService.removeMember(channelId, user.id, targetUserId);
    return { message: 'Member removed successfully', data };
  }

  // ─── Messages Endpoints ────────────────────────────────────────────────────

  @Post('messages')
  @HttpCode(HttpStatus.CREATED)
  async sendMessage(
    @CurrentUser() user: RequestUser,
    @Body() dto: SendMessageDto,
  ) {
    const data = await this.chatService.sendMessage(user.id, dto);
    // Real-time broadcast
    this.chatGateway.broadcastNewMessage(dto.channelId, data);
    return { message: 'Message sent successfully', data };
  }

  @Patch('messages/:messageId')
  async updateMessage(
    @Param('messageId') messageId: string,
    @CurrentUser() user: RequestUser,
    @Body() dto: UpdateMessageDto,
  ) {
    const data = await this.chatService.updateMessage(user.id, messageId, dto.message);
    // Real-time broadcast
    this.chatGateway.broadcastUpdatedMessage(data.channelId, data);
    return { message: 'Message updated successfully', data };
  }

  @Delete('messages/:messageId')
  async deleteMessage(
    @Param('messageId') messageId: string,
    @CurrentUser() user: RequestUser,
  ) {
    const msg = await this.prisma.chatMessage.findUnique({
      where: { id: messageId },
    });
    if (!msg) {
      throw new NotFoundException('Message not found');
    }
    const data = await this.chatService.deleteMessage(user.id, messageId);
    // Real-time broadcast
    this.chatGateway.broadcastDeletedMessage(msg.channelId, messageId);
    return data;
  }

  @Get('channels/:channelId/messages')
  async getMessages(
    @Param('channelId') channelId: string,
    @CurrentUser() user: RequestUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const data = await this.chatService.getMessages(
      channelId,
      user.id,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 50,
    );
    return { message: 'Messages retrieved successfully', data };
  }

  @Post('messages/:messageId/read')
  @HttpCode(HttpStatus.OK)
  async markAsRead(
    @Param('messageId') messageId: string,
    @CurrentUser() user: RequestUser,
  ) {
    const data = await this.chatService.markAsRead(user.id, messageId);
    // Find channelId to broadcast
    const msg = await this.prisma.chatMessage.findUnique({
      where: { id: messageId },
    });
    if (msg) {
      this.chatGateway.broadcastReadReceipt(msg.channelId, messageId, user.id);
    }
    return { message: 'Message marked as read', data };
  }

  @Get('unread')
  async getUnreadCount(@CurrentUser() user: RequestUser) {
    if (!user.workspaceId) {
      throw new NotFoundException('Workspace context is required');
    }
    const data = await this.chatService.getUnreadCount(user.id, user.workspaceId);
    return { message: 'Unread count retrieved successfully', data };
  }

  @Get('search')
  async searchMessages(
    @CurrentUser() user: RequestUser,
    @Query('query') query: string,
    @Query('filter') filter?: string,
  ) {
    if (!user.workspaceId) {
      throw new NotFoundException('Workspace context is required');
    }
    const data = await this.chatService.searchMessages(user.id, user.workspaceId, query || '', filter);
    return { message: 'Search results retrieved successfully', data };
  }

  @Get('notifications')
  async getChatNotifications(@CurrentUser() user: RequestUser) {
    const data = await this.chatService.getChatNotifications(user.id);
    return { message: 'Notifications retrieved successfully', data };
  }
}
