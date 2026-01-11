import { Injectable, UnauthorizedException, ConflictException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UserDocument } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto): Promise<{ access_token: string }> {
    // Vérifier si l'email existe déjà
    const existingEmail = await this.usersService.findByEmail(registerDto.email);
    if (existingEmail) {
      throw new ConflictException('Email déjà utilisé');
    }
    
    // Vérifier si le username existe déjà
    const existingUsername = await this.usersService.findByUsername(registerDto.username);
    if (existingUsername) {
      throw new ConflictException('Nom d\'utilisateur déjà utilisé');
    }
    
    const user = await this.usersService.create(registerDto);
    const payload = { username: user.username, sub: user._id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async login(loginDto: LoginDto): Promise<{ access_token: string }> {
    const user = await this.usersService.findByEmail(loginDto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (user.banned) {
      throw new ForbiddenException(`Compte banni: ${user.bannedReason || 'Contactez le support'}`);
    }
    const isPasswordValid = await this.usersService.validatePassword(loginDto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const payload = { username: user.username, sub: user._id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async validateUser(payload: any): Promise<UserDocument> {
    const user = await this.usersService.findOne(payload.sub);
    if (!user || user.banned) {
      throw new UnauthorizedException('User not found or inactive');
    }
    return user;
  }
}
