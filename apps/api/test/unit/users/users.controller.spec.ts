import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from '../../../src/users/users.controller';
import { UsersService } from '../../../src/users/users.service';
import { EmailService } from '../../../src/email/email.service';
import { MessagesGateway } from '../../../src/messages/messages.gateway';
import { ForbiddenException } from '@nestjs/common';
import { Types } from 'mongoose';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: UsersService;
  let emailService: EmailService;
  let messagesGateway: MessagesGateway;

  const userId = new Types.ObjectId();
  const mockUser = {
    _id: userId,
    username: 'testuser',
    email: 'test@example.com',
    role: 'user',
    banned: false,
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
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
            banUser: jest.fn(),
          },
        },
        {
          provide: EmailService,
          useValue: {
            sendAccountDeletionEmail: jest.fn(),
            sendBanNotification: jest.fn(),
            sendUserBannedNotification: jest.fn(),
          },
        },
        {
          provide: MessagesGateway,
          useValue: {
            server: {
              emit: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    usersService = module.get<UsersService>(UsersService);
    emailService = module.get<EmailService>(EmailService);
    messagesGateway = module.get<MessagesGateway>(MessagesGateway);
  });

  describe('POST /users (create)', () => {
    it('should create a new user', async () => {
      jest.spyOn(usersService, 'create').mockResolvedValue(mockUser as any);

      const result = await controller.create({
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password123!',
      });

      expect(result).toEqual(mockUser);
      expect(usersService.create).toHaveBeenCalled();
    });
  });

  describe('GET /users (findAll)', () => {
    it('should return all users', async () => {
      jest.spyOn(usersService, 'findAll').mockResolvedValue([mockUser] as any);

      const result = await controller.findAll();

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockUser);
    });
  });

  describe('GET /users/:id (findOne)', () => {
    it('should return user profile for owner', async () => {
      jest.spyOn(usersService, 'findOne').mockResolvedValue(mockUser as any);

      const result = await controller.findOne(userId.toString(), mockRequest);

      expect(result).toEqual(mockUser);
    });

    it('should fail to access other user profile', async () => {
      const otherUserId = new Types.ObjectId().toString();
      const userRequest = { user: { ...mockRequest.user, _id: new Types.ObjectId() } };

      await expect(controller.findOne(otherUserId, userRequest)).rejects.toThrow(
        ForbiddenException
      );
    });

    it('should allow admin to access any profile', async () => {
      const adminRequest = { user: { ...mockRequest.user, role: 'admin' } };
      jest.spyOn(usersService, 'findOne').mockResolvedValue(mockUser as any);

      const result = await controller.findOne(userId.toString(), adminRequest);

      expect(result).toEqual(mockUser);
    });
  });

  describe('PATCH /users/:id (update)', () => {
    it('should update own profile', async () => {
      const updated = { ...mockUser, username: 'newusername' };
      jest.spyOn(usersService, 'update').mockResolvedValue(updated as any);

      const result = await controller.update(
        userId.toString(),
        { username: 'newusername' },
        mockRequest
      );

      expect(result.username).toBe('newusername');
    });

    it('should fail to update other user profile', async () => {
      const otherUserId = new Types.ObjectId().toString();
      const userRequest = { user: { ...mockRequest.user, _id: new Types.ObjectId() } };

      await expect(
        controller.update(otherUserId, { username: 'new' }, userRequest)
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('DELETE /users/:id (remove)', () => {
    it('should delete own account', async () => {
      jest.spyOn(usersService, 'remove').mockResolvedValue(true as any);
      jest.spyOn(messagesGateway.server, 'emit').mockReturnValue(true as any);

      const result = await controller.remove(userId.toString(), mockRequest);

      expect(result).toEqual({ deleted: true });
      expect(usersService.remove).toHaveBeenCalledWith(userId.toString());
    });

    it('should fail to delete other account', async () => {
      const otherUserId = new Types.ObjectId().toString();
      const userRequest = { user: { ...mockRequest.user, _id: new Types.ObjectId() } };

      await expect(controller.remove(otherUserId, userRequest)).rejects.toThrow(
        ForbiddenException
      );
    });
  });

  describe('POST /users/:id/ban (ban)', () => {
    it('should ban user as admin', async () => {
      const adminRequest = { user: { ...mockRequest.user, role: 'admin' } };
      const bannedUser = { ...mockUser, banned: true };
      jest.spyOn(usersService, 'banUser').mockResolvedValue(bannedUser as any);
      jest.spyOn(messagesGateway.server, 'emit').mockReturnValue(true as any);

      const result = await controller.ban(
        userId.toString(),
        { reason: 'Spam' },
        adminRequest
      );

      expect(result).toEqual({ banned: true });
      expect(usersService.banUser).toHaveBeenCalled();
    });

    it('should fail to ban as non-admin', async () => {
      await expect(
        controller.ban(userId.toString(), { reason: 'Spam' }, mockRequest)
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
