import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ChannelsService } from './channels.service';
import { ChannelsController } from './channels.controller';
import { Channel, ChannelSchema } from './entities/channel.entity';
import { EmailModule } from '../email/email.module';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Channel.name, schema: ChannelSchema }]),
    EmailModule,
    forwardRef(() => UsersModule),
    AuthModule,
  ],
  providers: [ChannelsService],
  controllers: [ChannelsController],
  exports: [ChannelsService],
})
export class ChannelsModule {}
