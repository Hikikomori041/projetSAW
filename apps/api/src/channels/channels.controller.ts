import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ChannelsService } from './channels.service';
import { CreateChannelDto } from './dto/create-channel.dto';
import { UpdateChannelDto } from './dto/update-channel.dto';
import { EmailService } from '../email/email.service';
import { UsersService } from '../users/users.service';

@Controller('channels')
@UseGuards(JwtAuthGuard)
export class ChannelsController {
  constructor(
    private readonly channelsService: ChannelsService,
    private readonly emailService: EmailService,
    private readonly usersService: UsersService,
  ) {}

  @Post()
  create(@Body() createChannelDto: CreateChannelDto, @Request() req) {
    return this.channelsService.create(createChannelDto, req.user._id);
  }

  @Get()
  findAll(@Request() req) {
    return this.channelsService.findAllForUser(req.user._id, req.user.role);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.channelsService.findOneAuthorized(id, req.user._id, req.user.role);
  }

  @Post(':id/join')
  join(@Param('id') id: string, @Request() req) {
    return this.channelsService.joinChannel(id, req.user._id);
  }

  @Post(':id/leave')
  leave(@Param('id') id: string, @Request() req) {
    return this.channelsService.leaveChannel(id, req.user._id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateChannelDto: UpdateChannelDto) {
    return this.channelsService.update(id, updateChannelDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Body() body: { reason?: string }, @Request() req) {
    // Seul un admin peut supprimer n'importe quel salon
    const channel = await this.channelsService.findOneAuthorized(id, req.user._id, req.user.role);
    
    if (req.user.role === 'admin') {
      const reason = body.reason || 'Violation des règles de la plateforme';
      // Récupérer tous les membres et leur envoyer un email
      const memberIds = channel.members?.map(m => m.toString()) || [];
      for (const memberId of memberIds) {
        const user = await this.usersService.findOne(memberId);
        if (user) {
          await this.emailService.sendChannelDeletedNotification(
            user.email,
            user.username,
            channel.name,
            reason
          );
        }
      }
    }
    
    return this.channelsService.remove(id);
  }

  @Get('admin/stats')
  async getAdminStats(@Request() req) {
    if (req.user.role !== 'admin') {
      throw new Error('Admin access required');
    }
    return this.channelsService.getAdminStats();
  }
}
