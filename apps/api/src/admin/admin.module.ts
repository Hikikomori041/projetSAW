import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { User, UserSchema } from '../users/entities/user.entity';
import { Channel, ChannelSchema } from '../channels/entities/channel.entity';
import { Message, MessageSchema } from '../messages/message.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Channel.name, schema: ChannelSchema },
      { name: Message.name, schema: MessageSchema },
    ]),
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
