import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../../../src/auth/auth.controller';
import { AuthService } from '../../../src/auth/auth.service';

describe('AuthController (Unit Tests)', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should call authService.register and return result', async () => {
      const registerDto = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123',
      };

      const expected = { access_token: 'token' };
      mockAuthService.register.mockResolvedValue(expected);

      const result = await controller.register(registerDto);

      expect(result).toEqual(expected);
      expect(authService.register).toHaveBeenCalledWith(registerDto);
    });

    it('should accept username with exactly 35 characters', async () => {
      const registerDto = {
        email: 'test@example.com',
        username: 'a'.repeat(35), // Exactement 35 caractères
        password: 'password123',
      };

      const expected = { access_token: 'token' };
      mockAuthService.register.mockResolvedValue(expected);

      const result = await controller.register(registerDto);

      expect(result).toEqual(expected);
      expect(authService.register).toHaveBeenCalledWith(registerDto);
    });
  });

  describe('login', () => {
    it('should call authService.login and return access_token', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const expected = { access_token: 'token' };
      mockAuthService.login.mockResolvedValue(expected);

      const result = await controller.login(loginDto);

      expect(result).toEqual(expected);
      expect(authService.login).toHaveBeenCalledWith(loginDto);
    });
  });
});
