import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { EmailService } from '../email/email.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly emailService: EmailService,
  ) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  @Post(':id/ban')
  @UseGuards(JwtAuthGuard)
  async ban(@Param('id') id: string, @Body() body: { reason?: string }, @Request() req) {
    if (req.user.role !== 'admin') {
      throw new ForbiddenException('Only admins can ban users');
    }
    const reason = body.reason || 'Violation des règles de la plateforme';
    const bannedUser = await this.usersService.banUser(id, reason);
    if (bannedUser) {
      await this.emailService.sendUserBannedNotification(
        bannedUser.email,
        bannedUser.username,
        reason
      );
    }
    return { banned: true };
  }
}
