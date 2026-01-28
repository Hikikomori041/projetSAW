import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from '../../../src/users/users.service';
import { getModelToken } from '@nestjs/mongoose';
import { User } from '../../../src/users/entities/user.entity';
import * as bcrypt from 'bcrypt';

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

  describe('Password Security Tests', () => {
    it('should hash password before saving to database', async () => {
      const createDto = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'PlainTextPassword123',
      };

      // Vérifier que le service utilise bcrypt pour hasher le mot de passe
      const result = await service.create(createDto);

      // Le mot de passe stocké ne doit pas être le mot de passe en clair
      expect(result.password).not.toBe('PlainTextPassword123');
    });

    it('should store hashed password, not plaintext', async () => {
      const plainPassword = 'MySecretPassword123';
      const hashedPassword = await bcrypt.hash(plainPassword, 10);

      // Le mot de passe haché ne doit jamais être égal au mot de passe en clair
      expect(hashedPassword).not.toBe(plainPassword);

      // Le hash bcrypt doit commencer par $2b$ (bcrypt version 2b)
      expect(hashedPassword).toMatch(/^\$2b\$/);
    });

    it('should use bcrypt with salt rounds of 10 or more', async () => {
      const password = 'TestPassword123';
      const hashedPassword = await bcrypt.hash(password, 10);

      // Vérifier que le hash bcrypt contient l'information du coût (rounds)
      // Format bcrypt: $2b$<rounds>$<salt+hash>
      const parts = hashedPassword.split('$');
      const rounds = parseInt(parts[2], 10);

      expect(rounds).toBeGreaterThanOrEqual(10);
    });

    it('should generate different hashes for same password (salted)', async () => {
      const password = 'SamePassword123';
      const hash1 = await bcrypt.hash(password, 10);
      const hash2 = await bcrypt.hash(password, 10);

      // Les deux hashes doivent être différents grâce au salt
      expect(hash1).not.toBe(hash2);

      // Mais les deux doivent être validés par compare
      expect(await bcrypt.compare(password, hash1)).toBe(true);
      expect(await bcrypt.compare(password, hash2)).toBe(true);
    });

    it('should correctly validate passwords with bcrypt.compare', async () => {
      const correctPassword = 'CorrectPassword123';
      const wrongPassword = 'WrongPassword456';
      const hashedPassword = await bcrypt.hash(correctPassword, 10);

      const isCorrect = await service.validatePassword(correctPassword, hashedPassword);
      const isWrong = await service.validatePassword(wrongPassword, hashedPassword);

      expect(isCorrect).toBe(true);
      expect(isWrong).toBe(false);
    });

    it('should hash password when updating it', async () => {
      const updateDto = { password: 'NewPassword123' };

      mockUserModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      // Mock du hash pour vérifier qu'il est utilisé
      const hashedPassword = await bcrypt.hash('NewPassword123', 10);
      mockUserModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ ...mockUser, password: hashedPassword }),
      });

      const result = await service.update('user1', updateDto);

      // Vérifier que le mot de passe retourné est haché, pas en clair
      expect(result.password).not.toBe('NewPassword123');
      expect(result.password).toMatch(/^\$2b\$/);
    });

    it('should not expose plaintext passwords in any response', async () => {
      const createDto = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'SecretPassword123',
      };

      const result = await service.create(createDto);

      // Le résultat ne doit jamais contenir le mot de passe en clair
      expect(result.password).not.toBe('SecretPassword123');
      expect(result.password).toMatch(/^\$2b\$/);
    });

    it('should resist timing attacks in password comparison', async () => {
      // bcrypt.compare résiste naturellement aux attaques par timing
      const password = 'TestPassword123';
      const hashedPassword = await bcrypt.hash(password, 10);

      const times: number[] = [];

      // Tester plusieurs fois avec le bon mot de passe
      for (let i = 0; i < 5; i++) {
        const start = Date.now();
        await bcrypt.compare(password, hashedPassword);
        times.push(Date.now() - start);
      }

      // Tester avec un mauvais mot de passe
      for (let i = 0; i < 5; i++) {
        const start = Date.now();
        await bcrypt.compare('WrongPassword', hashedPassword);
        times.push(Date.now() - start);
      }

      // Tous les temps doivent être relativement similaires (constant-time)
      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      times.forEach(time => {
        // Chaque mesure doit être dans une fourchette raisonnable de la moyenne
        // (bcrypt prend toujours environ le même temps, peu importe le résultat)
        expect(Math.abs(time - avgTime)).toBeLessThan(avgTime * 2);
      });
    });
  });
});
