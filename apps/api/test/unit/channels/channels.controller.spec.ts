import { Test, TestingModule } from '@nestjs/testing';
import { ChannelsController } from '../../../src/channels/channels.controller';
import { ChannelsService } from '../../../src/channels/channels.service';
import { EmailService } from '../../../src/email/email.service';
import { UsersService } from '../../../src/users/users.service';
import { Types } from 'mongoose';

describe('ChannelsController', () => {
  let controller: ChannelsController;
  let channelsService: ChannelsService;
  let emailService: EmailService;
  let usersService: UsersService;

  const userId = new Types.ObjectId();
  const channelId = new Types.ObjectId();

  const mockChannel = {
    _id: channelId,
    name: 'Test Channel',
    description: 'Test',
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
      controllers: [ChannelsController],
      providers: [
        {
          provide: ChannelsService,
          useValue: {
            create: jest.fn(),
            findAllForUser: jest.fn(),
            findOneAuthorized: jest.fn(),
            joinChannel: jest.fn(),
            leaveChannel: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: EmailService,
          useValue: {
            sendChannelDeletedNotification: jest.fn(),
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

    controller = module.get<ChannelsController>(ChannelsController);
    channelsService = module.get<ChannelsService>(ChannelsService);
    emailService = module.get<EmailService>(EmailService);
    usersService = module.get<UsersService>(UsersService);
  });

  describe('POST /channels (create)', () => {
    it('should create a channel', async () => {
      jest.spyOn(channelsService, 'create').mockResolvedValue(mockChannel as any);

      const result = await controller.create(
        { name: 'Test Channel', description: 'Test' },
        mockRequest
      );

      expect(result).toEqual(mockChannel);
      expect(channelsService.create).toHaveBeenCalled();
    });
  });

  describe('GET /channels (findAll)', () => {
    it('should return all channels for user', async () => {
      jest.spyOn(channelsService, 'findAllForUser').mockResolvedValue([mockChannel] as any);

      const result = await controller.findAll(mockRequest);

      expect(result).toHaveLength(1);
      expect(channelsService.findAllForUser).toHaveBeenCalledWith(userId, 'user');
    });
  });

  describe('GET /channels/:id (findOne)', () => {
    it('should return channel details', async () => {
      jest.spyOn(channelsService, 'findOneAuthorized').mockResolvedValue(mockChannel as any);

      const result = await controller.findOne(channelId.toString(), mockRequest);

      expect(result).toEqual(mockChannel);
      expect(channelsService.findOneAuthorized).toHaveBeenCalled();
    });
  });

  describe('POST /channels/:id/join', () => {
    it('should join a channel', async () => {
      const channelWithUser = { ...mockChannel, members: [userId, new Types.ObjectId()] };
      jest.spyOn(channelsService, 'joinChannel').mockResolvedValue(channelWithUser as any);

      const result = await controller.join(channelId.toString(), mockRequest);

      expect(result.members).toHaveLength(2);
      expect(channelsService.joinChannel).toHaveBeenCalled();
    });
  });

  describe('POST /channels/:id/leave', () => {
    it('should leave a channel', async () => {
      jest.spyOn(channelsService, 'leaveChannel').mockResolvedValue(mockChannel as any);

      const result = await controller.leave(channelId.toString(), mockRequest);

      expect(result).toEqual(mockChannel);
      expect(channelsService.leaveChannel).toHaveBeenCalled();
    });
  });

  describe('PATCH /channels/:id (update)', () => {
    it('should update a channel', async () => {
      const updated = { ...mockChannel, name: 'Updated' };
      jest.spyOn(channelsService, 'update').mockResolvedValue(updated as any);

      const result = await controller.update(channelId.toString(), { name: 'Updated' });

      expect(result.name).toBe('Updated');
      expect(channelsService.update).toHaveBeenCalled();
    });
  });

  describe('DELETE /channels/:id (remove)', () => {
    it('should remove a channel as admin', async () => {
      const adminRequest = { user: { ...mockRequest.user, role: 'admin' } };
      const user = { _id: userId, email: 'test@example.com', username: 'testuser' };

      jest.spyOn(channelsService, 'findOneAuthorized').mockResolvedValue(mockChannel as any);
      jest.spyOn(usersService, 'findOne').mockResolvedValue(user as any);
      jest.spyOn(channelsService, 'remove').mockResolvedValue(mockChannel as any);
      jest.spyOn(emailService, 'sendChannelDeletedNotification').mockResolvedValue(undefined);

      const result = await controller.remove(channelId.toString(), {}, adminRequest);

      expect(result).toEqual(mockChannel);
      expect(channelsService.remove).toHaveBeenCalled();
    });

    it('should fail to remove channel as non-owner', async () => {
      jest
        .spyOn(channelsService, 'findOneAuthorized')
        .mockRejectedValue(new Error('Access denied'));

      await expect(
        controller.remove(channelId.toString(), {}, mockRequest)
      ).rejects.toThrow('Access denied');
    });
  });
});
