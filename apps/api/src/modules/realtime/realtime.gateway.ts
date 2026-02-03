import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { RealtimeService } from './realtime.service';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  pageId?: string;
}

@WebSocketGateway({
  namespace: '/realtime',
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  },
})
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private jwtService: JwtService,
    private realtimeService: RealtimeService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      // Authenticate via token in query or auth header
      const token = client.handshake.query.token as string || 
                    client.handshake.auth.token;
      
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      client.userId = payload.sub;

      console.log(`Client connected: ${client.id}, User: ${client.userId}`);
    } catch {
      console.log('WebSocket authentication failed');
      client.disconnect();
    }
  }

  async handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId && client.pageId) {
      this.realtimeService.leavePage(client.pageId, client.userId);
      
      // Notify others
      this.server.to(client.pageId).emit('user_left', {
        userId: client.userId,
      });
    }
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join_page')
  async handleJoinPage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { pageId: string },
  ) {
    if (!client.userId) return;

    // Verify access
    const hasAccess = await this.realtimeService.verifyAccess(data.pageId, client.userId);
    if (!hasAccess) {
      client.emit('error', { message: 'Access denied' });
      return;
    }

    // Leave previous page if any
    if (client.pageId) {
      client.leave(client.pageId);
      this.realtimeService.leavePage(client.pageId, client.userId);
    }

    // Join new page room
    client.pageId = data.pageId;
    client.join(data.pageId);

    // Get user info
    const user = await this.realtimeService.getUser(client.userId);
    if (user) {
      this.realtimeService.joinPage(data.pageId, client.userId, {
        userId: client.userId,
        name: user.name || 'Anonymous',
        email: user.email,
        avatarUrl: user.avatarUrl || undefined,
        lastActivity: new Date(),
      });
    }

    // Notify others
    this.server.to(data.pageId).emit('user_joined', {
      userId: client.userId,
      name: user?.name || 'Anonymous',
      avatarUrl: user?.avatarUrl,
    });

    // Send current presence to the joining user
    const presence = this.realtimeService.getPagePresence(data.pageId);
    client.emit('presence_update', presence);
  }

  @SubscribeMessage('leave_page')
  handleLeavePage(@ConnectedSocket() client: AuthenticatedSocket) {
    if (!client.userId || !client.pageId) return;

    client.leave(client.pageId);
    this.realtimeService.leavePage(client.pageId, client.userId);

    this.server.to(client.pageId).emit('user_left', {
      userId: client.userId,
    });

    client.pageId = undefined;
  }

  @SubscribeMessage('doc_update')
  handleDocUpdate(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { update: Uint8Array | number[] },
  ) {
    if (!client.pageId) return;

    // Broadcast Yjs update to other clients in the room
    client.to(client.pageId).emit('doc_update', {
      senderId: client.userId,
      update: data.update,
    });
  }

  @SubscribeMessage('canvas_update')
  handleCanvasUpdate(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { update: Uint8Array | number[] },
  ) {
    if (!client.pageId) return;

    // Broadcast canvas update to other clients
    client.to(client.pageId).emit('canvas_update', {
      senderId: client.userId,
      update: data.update,
    });
  }

  @SubscribeMessage('presence_update')
  handlePresenceUpdate(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { cursor?: { x: number; y: number }; selection?: unknown },
  ) {
    if (!client.userId || !client.pageId) return;

    this.realtimeService.updatePresence(client.pageId, client.userId, data);

    // Broadcast to others
    client.to(client.pageId).emit('presence_update', [{
      userId: client.userId,
      ...data,
    }]);
  }

  @SubscribeMessage('doc_awareness')
  handleDocAwareness(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { awareness: Uint8Array | number[] },
  ) {
    if (!client.pageId) return;

    client.to(client.pageId).emit('doc_awareness', {
      senderId: client.userId,
      awareness: data.awareness,
    });
  }

  @SubscribeMessage('canvas_awareness')
  handleCanvasAwareness(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { awareness: Uint8Array | number[] },
  ) {
    if (!client.pageId) return;

    client.to(client.pageId).emit('canvas_awareness', {
      senderId: client.userId,
      awareness: data.awareness,
    });
  }
}
