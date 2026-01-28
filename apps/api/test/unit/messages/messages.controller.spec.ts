import { Test, TestingModule } from '@nestjs/testing';
import { MessagesController } from '../../../src/messages/messages.controller';
import { MessagesService } from '../../../src/messages/messages.service';
import { MessagesGateway } from '../../../src/messages/messages.gateway';
import { ChannelsService } from '../../../src/channels/channels.service';
import { EmailService } from '../../../src/email/email.service';
import { UsersService } from '../../../src/users/users.service';
import { ForbiddenException } from '@nestjs/common';
import { Types } from 'mongoose';

describe('MessagesController', () => {
  let controller: MessagesController;
  let messagesService: MessagesService;
  let messagesGateway: MessagesGateway;
  let channelsService: ChannelsService;
  let emailService: EmailService;
  let usersService: UsersService;

  const userId = new Types.ObjectId();
  const channelId = new Types.ObjectId().toString();
  const messageId = new Types.ObjectId().toString();

  const mockMessage = {
    _id: messageId,
    content: 'Test message',
    author: userId,
    channel: channelId,
  };

  const mockChannel = {
    _id: channelId,
    name: 'Test',
    createdBy: userId,
    members: [userId],
  };

  const mockRequest = {
    user: {
      _id: userId,
      username: 'testuser',
      role: 'user',
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MessagesController],
      providers: [
        {
          provide: MessagesService,
          useValue: {
            create: jest.fn(),
            findByChannel: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: MessagesGateway,
          useValue: {
            server: {
              to: jest.fn().mockReturnValue({
                emit: jest.fn(),
              }),
            },
          },
        },
        {
          provide: ChannelsService,
          useValue: {
            findOneAuthorized: jest.fn(),
          },
        },
        {
          provide: EmailService,
          useValue: {
            sendMessageNotification: jest.fn(),
          },
        },
        {
          provide: UsersService,
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<MessagesController>(MessagesController);
    messagesService = module.get<MessagesService>(MessagesService);
    messagesGateway = module.get<MessagesGateway>(MessagesGateway);
    channelsService = module.get<ChannelsService>(ChannelsService);
    emailService = module.get<EmailService>(EmailService);
    usersService = module.get<UsersService>(UsersService);
  });

  describe('POST /messages (create)', () => {
    it('should create a message and broadcast via WebSocket', async () => {
      jest.spyOn(channelsService, 'findOneAuthorized').mockResolvedValue(mockChannel as any);
      jest.spyOn(messagesService, 'create').mockResolvedValue(mockMessage as any);

      const result = await controller.create(
        { content: 'Test message', channelId },
        mockRequest
      );

      expect(result).toEqual(mockMessage);
      expect(messagesGateway.server.to).toHaveBeenCalledWith(channelId);
    });

    it('should fail to create message in unauthorized channel', async () => {
      jest
        .spyOn(channelsService, 'findOneAuthorized')
        .mockRejectedValue(new ForbiddenException('Access denied'));

      await expect(
        controller.create({ content: 'Test', channelId }, mockRequest)
      ).rejects.toThrow('Access denied');
    });
  });

  describe('GET /messages/:channelId (findByChannel)', () => {
    it('should return messages from a channel', async () => {
      jest.spyOn(channelsService, 'findOneAuthorized').mockResolvedValue(mockChannel as any);
      jest.spyOn(messagesService, 'findByChannel').mockResolvedValue([mockMessage] as any);

      const result = await controller.findByChannel(channelId, mockRequest);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockMessage);
    });

    it('should fail without channel access', async () => {
      jest
        .spyOn(channelsService, 'findOneAuthorized')
        .mockRejectedValue(new ForbiddenException('Access denied'));

      await expect(controller.findByChannel(channelId, mockRequest)).rejects.toThrow(
        'Access denied'
      );
    });
  });

  describe('PATCH /messages/:id (update)', () => {
    it('should update own message', async () => {
      jest.spyOn(messagesService, 'findOne').mockResolvedValue(mockMessage as any);
      const updated = { ...mockMessage, content: 'Updated' };
      jest.spyOn(messagesService, 'update').mockResolvedValue(updated as any);

      const result = await controller.update(messageId, { content: 'Updated' }, mockRequest);

      expect(result?.content).toBe('Updated');
    });

    it('should fail to update non-existent message', async () => {
      jest.spyOn(messagesService, 'findOne').mockResolvedValue(null);

      await expect(
        controller.update(messageId, { content: 'Updated' }, mockRequest)
      ).rejects.toThrow('Message not found');
    });
  });

  describe('DELETE /messages/:id (remove)', () => {
    it('should delete own message', async () => {
      jest.spyOn(messagesService, 'findOne').mockResolvedValue(mockMessage as any);
      jest.spyOn(messagesService, 'remove').mockResolvedValue(mockMessage as any);

      const result = await controller.remove(messageId, {}, mockRequest);

      expect(result).toEqual({ deleted: true });
      expect(messagesService.remove).toHaveBeenCalledWith(messageId);
    });

    it('should fail to delete message from another user', async () => {
      const otherUserMessage = { ...mockMessage, author: new Types.ObjectId() };
      jest.spyOn(messagesService, 'findOne').mockResolvedValue(otherUserMessage as any);

      await expect(
        controller.remove(messageId, {}, mockRequest)
      ).rejects.toThrow('You can only delete your own messages');
    });
  });
});
