import { Controller, Post, Get, Body, Param, UseGuards, Request } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MessagesGateway } from './messages.gateway';

@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(
    private readonly messagesService: MessagesService,
    private readonly messagesGateway: MessagesGateway,
  ) {}

  @Post()
  async create(@Body() createMessageDto: CreateMessageDto, @Request() req) {
    const message = await this.messagesService.create(createMessageDto, req.user._id);
    this.messagesGateway.server.to(createMessageDto.channelId).emit('newMessage', message);
    return message;
  }

  @Get(':channelId')
  findByChannel(@Param('channelId') channelId: string) {
    return this.messagesService.findByChannel(channelId);
  }
}
