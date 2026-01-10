import { Test, TestingModule } from '@nestjs/testing';
import { ChannelsService } from '../../../src/channels/channels.service';
import { getModelToken } from '@nestjs/mongoose';
import { Channel } from '../../../src/channels/entities/channel.entity';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';

describe('ChannelsService', () => {
  let service: ChannelsService;
  let mockChannelModel: any;

  const userId = new Types.ObjectId();
  const channelId = new Types.ObjectId();
  const userIdStr = userId.toString();
  const channelIdStr = channelId.toString();

  const mockChannel = {
    _id: channelId,
    name: 'Test Channel',
    description: 'Test Description',
    createdBy: userId,
    members: [userId],
    createdAt: new Date(),
    updatedAt: new Date(),
    save: jest.fn(),
    populate: jest.fn(),
    toString: jest.fn().mockReturnValue(channelIdStr),
  };

  beforeEach(async () => {
    mockChannelModel = jest.fn().mockImplementation((data) => ({
      ...data,
      save: jest.fn().mockResolvedValue(mockChannel),
      populate: jest.fn().mockResolvedValue(mockChannel),
    }));

    mockChannelModel.find = jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnValue({
        exec: jest.fn(),
      }),
    });

    mockChannelModel.findById = jest.fn().mockReturnValue({
      exec: jest.fn(),
    });

    mockChannelModel.findByIdAndUpdate = jest.fn().mockReturnValue({
      exec: jest.fn(),
    });

    mockChannelModel.findByIdAndDelete = jest.fn().mockReturnValue({
      exec: jest.fn(),
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChannelsService,
        {
          provide: getModelToken(Channel.name),
          useValue: mockChannelModel,
        },
      ],
    }).compile();

    service = module.get<ChannelsService>(ChannelsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a channel', async () => {
      const createDto = { name: 'Test Channel', description: 'Test' };
      const newChannel = { ...mockChannel, name: createDto.name };

      mockChannelModel.mockImplementation((data) => ({
        ...data,
        save: jest.fn().mockResolvedValue(newChannel),
      }));

      const result = await service.create(createDto, userId);

      expect(result.name).toBe('Test Channel');
    });
  });

  describe('findAllForUser', () => {
    it('should return all channels for admin', async () => {
      mockChannelModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([mockChannel]),
        }),
      });

      const result = await service.findAllForUser(userId, 'admin');

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Test Channel');
    });

    it('should return only user channels for non-admin', async () => {
      mockChannelModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([mockChannel]),
        }),
      });

      const result = await service.findAllForUser(userId, 'user');

      expect(result).toHaveLength(1);
    });
  });

  describe('findOneAuthorized', () => {
    it('should throw NotFoundException if channel not found', async () => {
      mockChannelModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.findOneAuthorized(channelIdStr, userId, 'user')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return channel for creator', async () => {
      mockChannelModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockChannel),
      });

      mockChannel.populate = jest.fn().mockResolvedValue(mockChannel);

      const result = await service.findOneAuthorized(channelIdStr, userId, 'user');

      expect(result).toBeDefined();
    });
  });

  describe('update', () => {
    it('should update a channel', async () => {
      const updateDto = { name: 'Updated Channel' };
      const updatedChannel = { ...mockChannel, name: 'Updated Channel' };

      mockChannelModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(updatedChannel),
      });

      const result = await service.update(channelIdStr, updateDto);

      expect(result.name).toBe('Updated Channel');
    });
  });

  describe('remove', () => {
    it('should delete a channel', async () => {
      mockChannelModel.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockChannel),
      });

      const result = await service.remove(channelIdStr);

      expect(result._id).toEqual(channelId);
    });
  });

  describe('joinChannel', () => {
    it('should add user to channel members', async () => {
      const newUserId = new Types.ObjectId();
      const channelWithUser = {
        ...mockChannel,
        members: [userId, newUserId],
        save: jest.fn().mockResolvedValue({
          ...mockChannel,
          members: [userId, newUserId],
        }),
        populate: jest.fn().mockResolvedValue({
          ...mockChannel,
          members: [userId, newUserId],
        }),
      };

      mockChannelModel.findById.mockResolvedValue(channelWithUser);

      const result = await service.joinChannel(channelIdStr, newUserId);

      expect(result.members).toHaveLength(2);
    });

    it('should throw NotFoundException if channel not found', async () => {
      mockChannelModel.findById.mockResolvedValue(null);

      await expect(service.joinChannel(channelIdStr, userId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('leaveChannel', () => {
    it('should remove user from channel members', async () => {
      const anotherUserId = new Types.ObjectId();
      const channelWithoutUser = {
        ...mockChannel,
        members: [userId, anotherUserId],
        save: jest.fn().mockResolvedValue({
          ...mockChannel,
          members: [anotherUserId],
        }),
        populate: jest.fn().mockResolvedValue({
          ...mockChannel,
          members: [anotherUserId],
        }),
      };

      mockChannelModel.findById.mockResolvedValue(channelWithoutUser);

      const result = await service.leaveChannel(channelIdStr, userId);

      expect(result.members).toHaveLength(1);
    });

    it('should throw NotFoundException if channel not found', async () => {
      mockChannelModel.findById.mockResolvedValue(null);

      await expect(service.leaveChannel(channelIdStr, userId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
