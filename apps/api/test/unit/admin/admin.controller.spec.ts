import { Test, TestingModule } from '@nestjs/testing';
import { AdminController } from '../../../src/admin/admin.controller';
import { AdminService } from '../../../src/admin/admin.service';
import { JwtAuthGuard } from '../../../src/auth/jwt-auth.guard';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';

describe('AdminController (Unit Tests)', () => {
  let controller: AdminController;
  let adminService: AdminService;

  const mockAdminService = {
    getStats: jest.fn(),
  };

  const mockJwtAuthGuard = {
    canActivate: jest.fn().mockReturnValue(true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [
        {
          provide: AdminService,
          useValue: mockAdminService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .compile();

    controller = module.get<AdminController>(AdminController);
    adminService = module.get<AdminService>(AdminService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getStats', () => {
    const mockRequest = {
      user: {
        userId: '123',
        username: 'admin',
        email: 'admin@example.com',
        role: 'admin',
      },
    };

    const mockStats = {
      users: [
        {
          _id: 'user1',
          username: 'testuser',
          email: 'test@example.com',
          role: 'user',
          messageCount: 5,
          banned: false,
          createdAt: new Date(),
        },
      ],
      channels: [
        {
          _id: 'channel1',
          name: 'Test Channel',
          createdBy: { _id: 'user1', username: 'testuser' },
          messageCount: 10,
          memberCount: 3,
          deletedMessagesCount: 2,
          bannedUsersCount: 1,
          createdAt: new Date(),
        },
      ],
    };

    it('should return statistics for admin user', async () => {
      mockAdminService.getStats.mockResolvedValue(mockStats);

      const result = await controller.getStats(mockRequest);

      expect(result).toEqual(mockStats);
      expect(adminService.getStats).toHaveBeenCalled();
    });

    it('should throw ForbiddenException for non-admin user', async () => {
      const nonAdminRequest = {
        user: {
          userId: '456',
          username: 'user',
          email: 'user@example.com',
          role: 'user',
        },
      };

      await expect(controller.getStats(nonAdminRequest)).rejects.toThrow(
        ForbiddenException,
      );
      expect(adminService.getStats).not.toHaveBeenCalled();
    });

    it('should only accept "admin" role (case-sensitive)', async () => {
      const adminRequestUppercase = {
        user: {
          userId: '123',
          username: 'ADMIN',
          email: 'admin@example.com',
          role: 'ADMIN',
        },
      };

      mockAdminService.getStats.mockResolvedValue(mockStats);

      // Le rôle doit être exactement 'admin' en minuscules
      await expect(controller.getStats(adminRequestUppercase)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should reject moderator role', async () => {
      const moderatorRequest = {
        user: {
          userId: '789',
          username: 'moderator',
          email: 'mod@example.com',
          role: 'moderator',
        },
      };

      await expect(controller.getStats(moderatorRequest)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should reject guest user without role', async () => {
      const guestRequest = {
        user: {
          userId: '999',
          username: 'guest',
          email: 'guest@example.com',
        },
      };

      await expect(controller.getStats(guestRequest)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should handle errors from AdminService', async () => {
      mockAdminService.getStats.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(controller.getStats(mockRequest)).rejects.toThrow(
        'Database error',
      );
    });

    it('should return empty arrays if no data exists', async () => {
      const emptyStats = {
        users: [],
        channels: [],
      };

      mockAdminService.getStats.mockResolvedValue(emptyStats);

      const result = await controller.getStats(mockRequest);

      expect(result.users).toHaveLength(0);
      expect(result.channels).toHaveLength(0);
    });
  });
});
