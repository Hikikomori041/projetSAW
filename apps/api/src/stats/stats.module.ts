import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StatsService } from './stats.service';
import { StatsController } from './stats.controller';
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
  providers: [StatsService],
  controllers: [StatsController],
})
export class StatsModule {}
