import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from '../../../src/users/users.service';
import { getModelToken } from '@nestjs/mongoose';
import { User } from '../../../src/users/entities/user.entity';

describe('UsersService (Unit Tests)', () => {
  let service: UsersService;
  let mockUserModel: any;

  const mockUser = {
    _id: 'user1',
    username: 'testuser',
    email: 'test@example.com',
    password: '$2b$10$hashedpassword',
    role: 'user',
    banned: false,
    save: jest.fn(),
  };

  beforeEach(async () => {
    mockUserModel = jest.fn().mockImplementation((data) => ({
      ...data,
      save: jest.fn().mockResolvedValue(mockUser),
    }));

    mockUserModel.create = jest.fn();
    mockUserModel.find = jest.fn().mockReturnValue({
      exec: jest.fn(),
    });
    mockUserModel.findById = jest.fn().mockReturnValue({
      exec: jest.fn(),
    });
    mockUserModel.findOne = jest.fn().mockReturnValue({
      exec: jest.fn(),
    });
    mockUserModel.findByIdAndDelete = jest.fn().mockReturnValue({
      exec: jest.fn(),
    });
    mockUserModel.findByIdAndUpdate = jest.fn().mockReturnValue({
      exec: jest.fn(),
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const createDto = {
        email: 'newuser@example.com',
        username: 'newuser',
        password: 'password123',
      };

      const result = await service.create(createDto);

      expect(result).toEqual(mockUser);
    });
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      const users = [mockUser];
      mockUserModel.find().exec.mockResolvedValue(users);

      const result = await service.findAll();

      expect(result).toEqual(users);
    });

    it('should return empty array if no users', async () => {
      mockUserModel.find().exec.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      mockUserModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUser),
      });

      const result = await service.findOne('user1');

      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found', async () => {
      mockUserModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const result = await service.findOne('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should return a user by email', async () => {
      mockUserModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUser),
      });

      const result = await service.findByEmail('test@example.com');

      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found', async () => {
      mockUserModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const result = await service.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update a user', async () => {
      const updateDto = { username: 'updateduser' };
      const updatedUser = { ...mockUser, username: 'updateduser' };

      mockUserModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(updatedUser),
      });

      const result = await service.update('user1', updateDto);

      expect(result).toEqual(updatedUser);
    });
  });

  describe('remove', () => {
    it('should delete a user', async () => {
      mockUserModel.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUser),
      });

      const result = await service.remove('user1');

      expect(result).toEqual(mockUser);
    });
  });

  describe('banUser', () => {
    it('should ban a user with unique username', async () => {
      const bannedUser = {
        ...mockUser,
        username: '[supprimé]-user1',
        banned: true,
        bannedReason: 'Spam',
      };

      mockUserModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(bannedUser),
      });

      const result = await service.banUser('user1', 'Spam');

      expect(result).toEqual(bannedUser);
      expect(result.banned).toBe(true);
      expect(result.username).toContain('[supprimé]');
    });
  });
});
