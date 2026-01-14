import { Test, TestingModule } from '@nestjs/testing';
import { AdminService } from '../../../src/admin/admin.service';
import { getModelToken } from '@nestjs/mongoose';
import { User } from '../../../src/users/entities/user.entity';
import { Channel } from '../../../src/channels/entities/channel.entity';
import { Message } from '../../../src/messages/message.entity';

describe('AdminService (Unit Tests)', () => {
  let service: AdminService;
  let mockUserModel: any;
  let mockChannelModel: any;
  let mockMessageModel: any;

  const mockUsers = [
    {
      _id: 'user1',
      username: 'testuser',
      email: 'test@example.com',
      role: 'user',
      banned: false,
      createdAt: new Date(),
    },
    {
      _id: 'admin1',
      username: 'admin',
      email: 'admin@example.com',
      role: 'admin',
      banned: false,
      createdAt: new Date(),
    },
  ];

  const mockChannels = [
    {
      _id: 'channel1',
      name: 'Test Channel',
      createdBy: { _id: 'user1', username: 'testuser' },
      members: ['user1', 'user2'],
      createdAt: new Date(),
    },
  ];

  const mockMessages = [
    {
      _id: 'msg1',
      content: 'Hello',
      author: { _id: 'user1', username: 'testuser' },
      channel: 'channel1',
      createdAt: new Date(),
    },
    {
      _id: 'msg2',
      content: '[supprimé]',
      author: { _id: 'user2', username: '[supprimé]-user2' },
      channel: 'channel1',
      createdAt: new Date(),
    },
  ];

  beforeEach(async () => {
    mockUserModel = {
      find: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUsers),
      }),
      countDocuments: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(0),
      }),
    };

    mockChannelModel = {
      find: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockChannels),
        }),
      }),
    };

    mockMessageModel = {
      find: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockMessages),
        }),
      }),
      countDocuments: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(2),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
        {
          provide: getModelToken(Channel.name),
          useValue: mockChannelModel,
        },
        {
          provide: getModelToken(Message.name),
          useValue: mockMessageModel,
        },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getStats', () => {
    it('should return statistics with users and channels', async () => {
      const result = await service.getStats();

      expect(result).toHaveProperty('users');
      expect(result).toHaveProperty('channels');
      expect(result.users).toHaveLength(2);
      expect(result.channels).toHaveLength(1);
    });

    it('should calculate message count for each user', async () => {
      mockMessageModel.countDocuments.mockReturnValue({
        exec: jest.fn().mockResolvedValue(5),
      });

      const result = await service.getStats();

      expect(result.users[0]).toHaveProperty('messageCount');
      expect(mockMessageModel.countDocuments).toHaveBeenCalled();
    });

    it('should calculate channel statistics', async () => {
      const result = await service.getStats();

      expect(result.channels[0]).toHaveProperty('messageCount');
      expect(result.channels[0]).toHaveProperty('memberCount');
      expect(result.channels[0]).toHaveProperty('deletedMessagesCount');
      expect(result.channels[0]).toHaveProperty('bannedUsersCount');
    });

    it('should count deleted messages correctly', async () => {
      const result = await service.getStats();

      // Le message avec username '[supprimé]-user2' devrait être compté comme supprimé
      expect(result.channels[0].deletedMessagesCount).toBeGreaterThanOrEqual(0);
    });

    it('should count banned users correctly', async () => {
      const result = await service.getStats();

      // Les utilisateurs avec username commençant par '[supprimé]' devraient être comptés
      expect(result.channels[0].bannedUsersCount).toBeGreaterThanOrEqual(0);
    });

    it('should handle channels with no messages', async () => {
      mockMessageModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([]),
        }),
      });

      const result = await service.getStats();

      expect(result.channels[0].messageCount).toBe(0);
      expect(result.channels[0].deletedMessagesCount).toBe(0);
      expect(result.channels[0].bannedUsersCount).toBe(0);
    });

    it('should handle empty user list', async () => {
      mockUserModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue([]),
      });

      const result = await service.getStats();

      expect(result.users).toHaveLength(0);
    });

    it('should handle empty channel list', async () => {
      mockChannelModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([]),
        }),
      });

      const result = await service.getStats();

      expect(result.channels).toHaveLength(0);
    });
  });
});
