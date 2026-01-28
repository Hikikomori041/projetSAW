import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../../../src/auth/auth.service';
import { UsersService } from '../../../src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException, ConflictException, ForbiddenException } from '@nestjs/common';

describe('AuthService (Unit Tests)', () => {
  let service: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;

  const mockUser = {
    _id: '1',
    username: 'testuser',
    email: 'test@example.com',
    password: '$2b$10$hashedpassword',
    role: 'user',
    banned: false,
  };

  const mockUsersService = {
    findByEmail: jest.fn(),
    findByUsername: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    validatePassword: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should create a new user and return access_token', async () => {
      const registerDto = {
        email: 'newuser@example.com',
        username: 'newuser',
        password: 'password123',
      };

      mockUsersService.findByEmail.mockResolvedValue(null);
      mockUsersService.findByUsername.mockResolvedValue(null);
      mockUsersService.create.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue('access_token');

      const result = await service.register(registerDto);

      expect(result).toHaveProperty('access_token');
      expect(usersService.findByEmail).toHaveBeenCalledWith(registerDto.email);
      expect(usersService.findByUsername).toHaveBeenCalledWith(registerDto.username);
      expect(usersService.create).toHaveBeenCalledWith(registerDto);
    });
    
    it('should throw ConflictException if email already exists', async () => {
      const registerDto = {
        email: 'existing@example.com',
        username: 'newuser',
        password: 'password123',
      };

      mockUsersService.findByEmail.mockResolvedValue(mockUser);

      await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
      await expect(service.register(registerDto)).rejects.toThrow('Email déjà utilisé');
    });
    
    it('should throw ConflictException if username already exists', async () => {
      const registerDto = {
        email: 'newuser@example.com',
        username: 'existinguser',
        password: 'password123',
      };

      mockUsersService.findByEmail.mockResolvedValue(null);
      mockUsersService.findByUsername.mockResolvedValue(mockUser);

      await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
      await expect(service.register(registerDto)).rejects.toThrow('Nom d\'utilisateur déjà utilisé');
    });
  });

  describe('login', () => {
    it('should return access_token for valid credentials', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      mockUsersService.validatePassword.mockResolvedValue(true);
      mockJwtService.sign.mockReturnValue('access_token');

      const result = await service.login(loginDto);

      expect(result).toHaveProperty('access_token');
      expect(usersService.findByEmail).toHaveBeenCalledWith(loginDto.email);
    });

    it('should throw error for invalid email', async () => {
      const loginDto = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      mockUsersService.findByEmail.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw error if user is banned', async () => {
      const bannedUser = { ...mockUser, banned: true, bannedReason: 'Spam' };
      const loginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      mockUsersService.findByEmail.mockResolvedValue(bannedUser);

      await expect(service.login(loginDto)).rejects.toThrow(ForbiddenException);
    });

    it('should throw error for invalid password', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      mockUsersService.validatePassword.mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('validateUser', () => {
    it('should return user data if token is valid', async () => {
      const payload = { sub: '1', username: 'testuser', role: 'user' };

      mockUsersService.findOne.mockResolvedValue(mockUser);

      const result = await service.validateUser(payload);

      expect(result).toEqual(mockUser);
      expect(usersService.findOne).toHaveBeenCalledWith(payload.sub);
    });

    it('should throw error if user not found', async () => {
      const payload = { sub: '999', username: 'nonexistent', role: 'user' };

      mockUsersService.findOne.mockResolvedValue(null);

      await expect(service.validateUser(payload)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw error if user is banned', async () => {
      const payload = { sub: '1', username: 'testuser', role: 'user' };
      const bannedUser = { ...mockUser, banned: true };

      mockUsersService.findOne.mockResolvedValue(bannedUser);

      await expect(service.validateUser(payload)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('Security Tests for Banned Users', () => {
    it('should include ban reason in ForbiddenException', async () => {
      const bannedUser = { 
        ...mockUser, 
        banned: true, 
        bannedReason: 'Violation des règles' 
      };
      const loginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      mockUsersService.findByEmail.mockResolvedValue(bannedUser);

      await expect(service.login(loginDto)).rejects.toThrow(ForbiddenException);
      await expect(service.login(loginDto)).rejects.toThrow('Violation des règles');
    });

    it('should show generic message if no ban reason provided', async () => {
      const bannedUser = { 
        ...mockUser, 
        banned: true, 
        bannedReason: undefined 
      };
      const loginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      mockUsersService.findByEmail.mockResolvedValue(bannedUser);

      await expect(service.login(loginDto)).rejects.toThrow(ForbiddenException);
      await expect(service.login(loginDto)).rejects.toThrow('Contactez le support');
    });

    it('should check ban status before password validation (prevent timing attacks)', async () => {
      const bannedUser = { ...mockUser, banned: true, bannedReason: 'Spam' };
      const loginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      mockUsersService.findByEmail.mockResolvedValue(bannedUser);

      await expect(service.login(loginDto)).rejects.toThrow(ForbiddenException);
      
      // validatePassword ne doit PAS être appelé pour un utilisateur banni
      // Cela empêche les attaques par timing qui pourraient révéler si le mot de passe est correct
      expect(mockUsersService.validatePassword).not.toHaveBeenCalled();
    });

    it('should reject banned user even with valid token in validateUser', async () => {
      const payload = { sub: '1', username: 'testuser', role: 'user' };
      const bannedUser = { ...mockUser, banned: true, bannedReason: 'Test' };

      mockUsersService.findOne.mockResolvedValue(bannedUser);

      // Même avec un token JWT valide, un utilisateur banni ne doit pas passer
      await expect(service.validateUser(payload)).rejects.toThrow(UnauthorizedException);
      await expect(service.validateUser(payload)).rejects.toThrow('User not found or inactive');
    });

    it('should not reveal user existence through different error messages', async () => {
      const loginDtoNonExistent = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      const loginDtoWrongPassword = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      mockUsersService.findByEmail.mockResolvedValueOnce(null);
      mockUsersService.findByEmail.mockResolvedValueOnce(mockUser);
      mockUsersService.validatePassword.mockResolvedValue(false);

      // Les deux cas doivent donner la même erreur générique
      let error1, error2;
      try {
        await service.login(loginDtoNonExistent);
      } catch (e) {
        error1 = e;
      }

      try {
        await service.login(loginDtoWrongPassword);
      } catch (e) {
        error2 = e;
      }

      // Les deux erreurs doivent être du même type et avoir le même message
      expect(error1).toBeInstanceOf(UnauthorizedException);
      expect(error2).toBeInstanceOf(UnauthorizedException);
      expect(error1.message).toBe(error2.message);
    });
  });
});
