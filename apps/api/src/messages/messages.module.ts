import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MessagesService } from './messages.service';
import { MessagesController } from './messages.controller';
import { Message, MessageSchema } from './message.entity';
import { MessagesGateway } from './messages.gateway';
import { ChannelsModule } from '../channels/channels.module';
import { EmailModule } from '../email/email.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [MongooseModule.forFeature([{ name: Message.name, schema: MessageSchema }]), ChannelsModule, EmailModule, UsersModule],
  providers: [MessagesService, MessagesGateway],
  controllers: [MessagesController]
})
export class MessagesModule {}
