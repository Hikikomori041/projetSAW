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
    return this.messageModel.findById(savedMessage._id).populate('author', 'username').exec() as Promise<Message>;
  }

  async findByChannel(channelId: string): Promise<Message[]> {
    return this.messageModel
      .find({ channel: channelId })
      .populate('author', 'username')
      .sort({ createdAt: 1 })
      .exec();
  }

  async findOne(id: string): Promise<Message | null> {
    return this.messageModel.findById(id).populate('author', 'username').exec();
  }

  async update(id: string, content: string): Promise<Message | null> {
    await this.messageModel.findByIdAndUpdate(id, { content }, { new: true }).exec();
    return this.messageModel.findById(id).populate('author', 'username').exec();
  }

  async remove(id: string): Promise<Message | null> {
    return this.messageModel.findByIdAndDelete(id).exec();
  }
}
