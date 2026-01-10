import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { EmailService } from '../email/email.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MessagesGateway } from '../messages/messages.gateway';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly emailService: EmailService,
    private readonly messagesGateway: MessagesGateway,
  ) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
    if (req.user._id.toString() !== id && req.user.role !== 'admin') {
      throw new ForbiddenException('Vous ne pouvez consulter que votre propre profil');
    }
    return this.usersService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto, @Request() req) {
    if (req.user._id.toString() !== id && req.user.role !== 'admin') {
      throw new ForbiddenException('Vous ne pouvez modifier que votre propre profil');
    }
    return this.usersService.update(id, updateUserDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req) {
    if (req.user._id.toString() !== id && req.user.role !== 'admin') {
      throw new ForbiddenException('Vous ne pouvez supprimer que votre propre compte');
    }
    const deleted = await this.usersService.remove(id);
    // Notifier les clients pour mettre à jour les pseudos affichés
    this.messagesGateway.server.emit('userBanned', { userId: id });
    return { deleted: !!deleted };
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
      // Notifier tous les clients connectés du bannissement
      this.messagesGateway.server.emit('userBanned', { userId: id });
    }
    return { banned: true };
  }
}
