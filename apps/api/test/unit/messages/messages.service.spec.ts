import { Test, TestingModule } from '@nestjs/testing';
import { MessagesService } from '../../../src/messages/messages.service';
import { getModelToken } from '@nestjs/mongoose';
import { Message } from '../../../src/messages/message.entity';

describe('MessagesService (Unit Tests)', () => {
  let service: MessagesService;
  let mockMessageModel: any;

  const mockMessage = {
    _id: 'msg1',
    content: 'Hello World',
    author: { _id: 'user1', username: 'testuser', banned: false },
    channel: 'channel1',
    createdAt: new Date(),
    updatedAt: new Date(),
    save: jest.fn(),
    populate: jest.fn(),
  };

  beforeEach(async () => {
    mockMessageModel = jest.fn().mockImplementation((data) => ({
      ...data,
      save: jest.fn().mockResolvedValue(mockMessage),
    }));

    mockMessageModel.find = jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          exec: jest.fn(),
        }),
      }),
    });

    mockMessageModel.findById = jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockMessage),
      }),
    });

    mockMessageModel.findByIdAndUpdate = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockMessage),
    });

    mockMessageModel.findByIdAndDelete = jest.fn().mockReturnValue({
      exec: jest.fn(),
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessagesService,
        {
          provide: getModelToken(Message.name),
          useValue: mockMessageModel,
        },
      ],
    }).compile();

    service = module.get<MessagesService>(MessagesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new message', async () => {
      const createDto = { content: 'Hello World', channelId: 'channel1' };
      const userId = 'user1';

      const result = await service.create(createDto, userId);

      expect(result).toEqual(mockMessage);
    });
  });

  describe('findByChannel', () => {
    it('should return all messages in a channel', async () => {
      mockMessageModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue([mockMessage]),
          }),
        }),
      });

      const result = await service.findByChannel('channel1');

      expect(result).toEqual([mockMessage]);
    });

    it('should return empty array if no messages', async () => {
      mockMessageModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      const result = await service.findByChannel('channel2');

      expect(result).toEqual([]);
    });
  });

  describe('update', () => {
    it('should update a message by id', async () => {
      const updatedMessage = { ...mockMessage, content: 'Updated message' };

      mockMessageModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(updatedMessage),
      });

      mockMessageModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(updatedMessage),
        }),
      });

      const result = await service.update('msg1', 'Updated message');

      expect(result).toEqual(updatedMessage);
    });

    it('should handle null result', async () => {
      mockMessageModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      mockMessageModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(null),
        }),
      });

      const result = await service.update('nonexistent', 'test');

      expect(result).toBeNull();
    });
  });

  describe('remove', () => {
    it('should delete a message', async () => {
      mockMessageModel.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockMessage),
      });

      const result = await service.remove('msg1');

      expect(result).toEqual(mockMessage);
    });
  });
});
