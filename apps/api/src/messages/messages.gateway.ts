import { SubscribeMessage, WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MessagesService } from './messages.service';

@WebSocketGateway({ 
  cors: {
    origin: '*',
    credentials: true,
  },
  transports: ['websocket', 'polling'],
})
export class MessagesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private messagesService: MessagesService) {}

  handleConnection(client: Socket) {
  //   console.debug(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
  //   console.debug(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinChannel')
  handleJoinChannel(client: Socket, channelId: string) {
    client.join(channelId);
    // console.debug(`Client ${client.id} joined channel ${channelId}`);
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(client: Socket, payload: { content: string; channelId: string; token: string }) {
    // Ici, on pourrait valider le token, mais pour simplifier, on assume que c'est fait côté client
    // Pour production, ajouter validation JWT
    const message = await this.messagesService.create({ content: payload.content, channelId: payload.channelId }, 'userId'); // TODO: get userId from token
    this.server.to(payload.channelId).emit('newMessage', message);
  }
}
