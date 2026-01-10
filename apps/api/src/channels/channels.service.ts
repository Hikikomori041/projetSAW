import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateChannelDto } from './dto/create-channel.dto';
import { UpdateChannelDto } from './dto/update-channel.dto';
import { Channel, ChannelDocument } from './entities/channel.entity';

@Injectable()
export class ChannelsService {
  constructor(
    @InjectModel(Channel.name) private channelModel: Model<ChannelDocument>,
  ) {}

  async create(createChannelDto: CreateChannelDto, userId: string): Promise<ChannelDocument> {
    const createdChannel = new this.channelModel({
      ...createChannelDto,
      createdBy: userId,
    });
    return createdChannel.save();
  }

  async findAll(): Promise<ChannelDocument[]> {
    return this.channelModel.find().populate('createdBy', 'username').exec();
  }

  async findOne(id: string): Promise<ChannelDocument | null> {
    return this.channelModel.findById(id).populate('createdBy', 'username').exec();
  }

  async update(id: string, updateChannelDto: UpdateChannelDto): Promise<ChannelDocument | null> {
    return this.channelModel.findByIdAndUpdate(id, updateChannelDto, { new: true }).exec();
  }

  async remove(id: string): Promise<ChannelDocument | null> {
    return this.channelModel.findByIdAndDelete(id).exec();
  }
}
