import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Injectable, Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
@Injectable()
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  // Keep track of connected users mapping: userId -> socketId[]
  private activeUsers = new Map<string, string[]>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = this.extractToken(client);
      if (!token) {
        this.logger.warn(`Disconnecting client ${client.id}: No token provided`);
        client.disconnect();
        return;
      }

      const secret = this.configService.get<string>('JWT_SECRET') || 'dev-jwt-secret-key-do-not-use-in-production-123456789';
      const payload = await this.jwtService.verifyAsync(token, { secret });
      
      client.data.user = payload;
      const userId = payload.sub;

      const userSockets = this.activeUsers.get(userId) || [];
      userSockets.push(client.id);
      this.activeUsers.set(userId, userSockets);

      this.logger.log(`Client connected: ${client.id} (User: ${userId})`);

      this.server.emit('user:status', { userId, status: 'online' });
    } catch (err) {
      this.logger.error(`Connection verification failed: ${err.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const user = client.data.user;
    if (user) {
      const userId = user.sub;
      const userSockets = this.activeUsers.get(userId) || [];
      const index = userSockets.indexOf(client.id);
      if (index !== -1) {
        userSockets.splice(index, 1);
      }
      if (userSockets.length === 0) {
        this.activeUsers.delete(userId);
        this.server.emit('user:status', { userId, status: 'offline' });
      } else {
        this.activeUsers.set(userId, userSockets);
      }
      this.logger.log(`Client disconnected: ${client.id} (User: ${userId})`);
    }
  }

  private extractToken(client: Socket): string | null {
    const authHeader = client.handshake.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.split(' ')[1];
    }
    const queryToken = client.handshake.query['token'];
    if (typeof queryToken === 'string') {
      return queryToken;
    }
    const authObjToken = client.handshake.auth?.token;
    if (typeof authObjToken === 'string') {
      return authObjToken.startsWith('Bearer ') ? authObjToken.split(' ')[1] : authObjToken;
    }
    return null;
  }

  @SubscribeMessage('chat:join')
  handleJoinChannel(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { channelId: string },
  ) {
    if (!data?.channelId) return;
    const roomName = `channel_${data.channelId}`;
    client.join(roomName);
    this.logger.log(`Socket ${client.id} joined room ${roomName}`);
  }

  @SubscribeMessage('chat:leave')
  handleLeaveChannel(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { channelId: string },
  ) {
    if (!data?.channelId) return;
    const roomName = `channel_${data.channelId}`;
    client.leave(roomName);
    this.logger.log(`Socket ${client.id} left room ${roomName}`);
  }

  @SubscribeMessage('chat:typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { channelId: string; isTyping: boolean },
  ) {
    const user = client.data.user;
    if (!user || !data?.channelId) return;
    const roomName = `channel_${data.channelId}`;
    client.to(roomName).emit('chat:typing', {
      channelId: data.channelId,
      userId: user.sub,
      isTyping: data.isTyping,
    });
  }

  broadcastNewMessage(channelId: string, message: any) {
    const roomName = `channel_${channelId}`;
    this.server.to(roomName).emit('chat:message', message);
  }

  broadcastUpdatedMessage(channelId: string, message: any) {
    const roomName = `channel_${channelId}`;
    this.server.to(roomName).emit('chat:message_updated', message);
  }

  broadcastDeletedMessage(channelId: string, messageId: string) {
    const roomName = `channel_${channelId}`;
    this.server.to(roomName).emit('chat:message_deleted', { channelId, messageId });
  }

  broadcastReadReceipt(channelId: string, messageId: string, userId: string) {
    const roomName = `channel_${channelId}`;
    this.server.to(roomName).emit('chat:read', { channelId, messageId, userId });
  }
}
