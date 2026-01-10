import { Test, TestingModule } from '@nestjs/testing';
import { MessagesGateway } from '../../../src/messages/messages.gateway';
import { MessagesService } from '../../../src/messages/messages.service';
import { Socket } from 'socket.io';

describe('MessagesGateway', () => {
  let gateway: MessagesGateway;
  let messagesService: MessagesService;
  let mockServer: any;
  let mockClient: any;

  beforeEach(async () => {
    mockServer = {
      to: jest.fn().mockReturnValue({
        emit: jest.fn(),
      }),
    };

    mockClient = {
      id: 'socket-123',
      join: jest.fn(),
      leave: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessagesGateway,
        {
          provide: MessagesService,
          useValue: {
            create: jest.fn(),
          },
        },
      ],
    }).compile();

    gateway = module.get<MessagesGateway>(MessagesGateway);
    messagesService = module.get<MessagesService>(MessagesService);
    gateway.server = mockServer;
  });

  describe('handleConnection', () => {
    it('should log client connection', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      gateway.handleConnection(mockClient as Socket);

      expect(consoleSpy).toHaveBeenCalledWith(`Client connected: socket-123`);
      consoleSpy.mockRestore();
    });
  });

  describe('handleDisconnect', () => {
    it('should log client disconnection', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      gateway.handleDisconnect(mockClient as Socket);

      expect(consoleSpy).toHaveBeenCalledWith(`Client disconnected: socket-123`);
      consoleSpy.mockRestore();
    });
  });

  describe('handleJoinChannel', () => {
    it('should join client to channel room', () => {
      const channelId = 'channel-123';

      gateway.handleJoinChannel(mockClient as Socket, channelId);

      expect(mockClient.join).toHaveBeenCalledWith(channelId);
    });
  });

  describe('handleSendMessage', () => {
    it('should create message and broadcast to channel', async () => {
      const mockMessage = {
        _id: 'msg-123',
        content: 'Test message',
        author: 'user-123',
        channel: 'channel-123',
      };

      jest.spyOn(messagesService, 'create').mockResolvedValue(mockMessage as any);

      const payload = {
        content: 'Test message',
        channelId: 'channel-123',
        token: 'token-123',
      };

      await gateway.handleSendMessage(mockClient as Socket, payload);

      expect(messagesService.create).toHaveBeenCalled();
      expect(mockServer.to).toHaveBeenCalledWith('channel-123');
    });

    it('should emit message to all clients in channel', async () => {
      const mockMessage = {
        _id: 'msg-123',
        content: 'Broadcast test',
        author: 'user-123',
        channel: 'channel-456',
      };

      jest.spyOn(messagesService, 'create').mockResolvedValue(mockMessage as any);

      const payload = {
        content: 'Broadcast test',
        channelId: 'channel-456',
        token: 'token-456',
      };

      await gateway.handleSendMessage(mockClient as Socket, payload);

      const emitter = mockServer.to().emit;
      expect(emitter).toHaveBeenCalledWith('newMessage', mockMessage);
    });
  });
});
