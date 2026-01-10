import { Controller, Post, Get, Body, Param, UseGuards, Request } from '@nestjs/common';
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
}
