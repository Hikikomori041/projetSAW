import { Controller, Post, Get, Body, Param, UseGuards, Request, Patch, Delete, ForbiddenException } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MessagesGateway } from './messages.gateway';
import { ChannelsService } from '../channels/channels.service';

@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(
    private readonly messagesService: MessagesService,
    private readonly messagesGateway: MessagesGateway,
    private readonly channelsService: ChannelsService,
  ) {}

  @Post()
  async create(@Body() createMessageDto: CreateMessageDto, @Request() req) {
    await this.channelsService.findOneAuthorized(createMessageDto.channelId, req.user._id, req.user.role);
    const message = await this.messagesService.create(createMessageDto, req.user._id);
    this.messagesGateway.server.to(createMessageDto.channelId).emit('newMessage', message);
    return message;
  }

  @Get(':channelId')
  async findByChannel(@Param('channelId') channelId: string, @Request() req) {
    await this.channelsService.findOneAuthorized(channelId, req.user._id, req.user.role);
    return this.messagesService.findByChannel(channelId);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: { content: string }, @Request() req) {
    const message = await this.messagesService.findOne(id);
    if (!message) {
      throw new ForbiddenException('Message not found');
    }
    const authorId = (message.author as any)._id?.toString() || message.author.toString();
    if (authorId !== req.user._id.toString() && req.user.role !== 'admin') {
      throw new ForbiddenException('You can only edit your own messages');
    }
    const updated = await this.messagesService.update(id, body.content);
    this.messagesGateway.server.to(message.channel.toString()).emit('messageUpdated', updated);
    return updated;
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req) {
    const message = await this.messagesService.findOne(id);
    if (!message) {
      throw new ForbiddenException('Message not found');
    }
    const authorId = (message.author as any)._id?.toString() || message.author.toString();
    if (authorId !== req.user._id.toString() && req.user.role !== 'admin') {
      throw new ForbiddenException('You can only delete your own messages');
    }
    await this.messagesService.remove(id);
    this.messagesGateway.server.to(message.channel.toString()).emit('messageDeleted', id);
    return { deleted: true };
  }
}
