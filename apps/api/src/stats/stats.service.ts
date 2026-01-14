import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../users/entities/user.entity';
import { Channel, ChannelDocument } from '../channels/entities/channel.entity';
import { Message, MessageDocument } from '../messages/message.entity';

@Injectable()
export class StatsService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Channel.name) private channelModel: Model<ChannelDocument>,
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
  ) {}

  async getCounts() {
    const users = await this.userModel.countDocuments({}).exec();
    const channels = await this.channelModel.countDocuments({}).exec();
    const totalMessages = await this.messageModel.countDocuments({}).exec();
    const avgMessagesPerUser = users > 0 ? +(totalMessages / users).toFixed(2) : 0;
    return { users, channels, totalMessages, avgMessagesPerUser };
  }
}
