import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Message, MessageDocument } from './message.entity';
import { CreateMessageDto } from './dto/create-message.dto';

@Injectable()
export class MessagesService {
  constructor(
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
  ) {}

  async create(createMessageDto: CreateMessageDto, authorId: string): Promise<Message> {
    const message = new this.messageModel({
      content: createMessageDto.content,
      author: authorId,
      channel: createMessageDto.channelId,
    });
    const savedMessage = await message.save();
    return this.messageModel
      .findById(savedMessage._id)
      .populate('author', '_id username banned')
      .exec() as Promise<Message>;
  }

  async findByChannel(channelId: string): Promise<Message[]> {
    return this.messageModel
      .find({ channel: channelId })
      .populate('author', '_id username banned')
      .sort({ createdAt: 1 })
      .exec();
  }

  async findOne(id: string): Promise<Message | null> {
    return this.messageModel.findById(id).populate('author', '_id username banned').exec();
  }

  async update(id: string, content: string): Promise<Message | null> {
    await this.messageModel.findByIdAndUpdate(id, { content }, { new: true }).exec();
    return this.messageModel.findById(id).populate('author', '_id username banned').exec();
  }

  async remove(id: string): Promise<Message | null> {
    return this.messageModel.findByIdAndDelete(id).exec();
  }

  async countByUser(userId: string): Promise<number> {
    return this.messageModel.countDocuments({ author: userId }).exec();
  }

  async countByChannel(channelId: string): Promise<number> {
    return this.messageModel.countDocuments({ channel: channelId }).exec();
  }

  async countBannedUsers(): Promise<any[]> {
    return this.messageModel.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'author',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      { $unwind: '$userInfo' },
      { $match: { 'userInfo.banned': true } },
      {
        $group: {
          _id: '$channel',
          bannedUsersCount: { $addToSet: '$author' }
        }
      },
      {
        $project: {
          channelId: '$_id',
          bannedUsersCount: { $size: '$bannedUsersCount' }
        }
      }
    ]).exec();
  }
}
