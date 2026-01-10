import { Injectable, ForbiddenException, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateChannelDto } from './dto/create-channel.dto';
import { UpdateChannelDto } from './dto/update-channel.dto';
import { Channel, ChannelDocument } from './entities/channel.entity';

@Injectable()
export class ChannelsService implements OnModuleInit {
  constructor(
    @InjectModel(Channel.name) private channelModel: Model<ChannelDocument>,
  ) {}

  async onModuleInit() {
    // Migration: ensure all channels have proper members array with ObjectIds
    const allChannels = await this.channelModel.find({});
    for (const ch of allChannels) {
      const creatorId = new Types.ObjectId(ch.createdBy.toString());
      const existingMembers = (ch.members ?? []).map(m => new Types.ObjectId(m.toString()));
      const allMembers = [creatorId, ...existingMembers];
      const uniqueIds = Array.from(new Set(allMembers.map(m => m.toString()))).map(id => new Types.ObjectId(id));
      ch.members = uniqueIds;
      await ch.save();
    }
  }

  async create(createChannelDto: CreateChannelDto, userId: any): Promise<ChannelDocument> {
    const createdChannel = new this.channelModel({
      ...createChannelDto,
      createdBy: userId,
      members: [new Types.ObjectId(userId.toString())],
    });
    return createdChannel.save();
  }

  async findAllForUser(userId: any, role: string): Promise<ChannelDocument[]> {
    const userIdStr = userId.toString();
    const filter = role === 'admin'
      ? {}
      : { $or: [ { createdBy: userIdStr }, { members: userIdStr } ] };

    return this.channelModel
      .find(filter)
      .populate('createdBy', '_id username')
      .exec();
  }

  async findOneAuthorized(id: string, userId: any, role: string): Promise<ChannelDocument> {
    const channel = await this.channelModel.findById(id).exec();
    if (!channel) {
      throw new NotFoundException('Channel not found');
    }
    const userIdStr = userId.toString();
    const isMember = channel.members?.some(m => m.toString() === userIdStr);
    const isCreator = channel.createdBy.toString() === userIdStr;
    /*
    console.debug('Access check:', {
      channelId: id,
      userIdStr,
      createdBy: channel.createdBy.toString(),
      members: channel.members?.map(m => m.toString()),
      role,
      isCreator,
      isMember
    });
    */
    if (role !== 'admin' && !isCreator && !isMember) {
      throw new ForbiddenException('Access denied to this channel');
    }
    // Populate after access check
    await channel.populate('createdBy', 'username');
    return channel;
  }

  async update(id: string, updateChannelDto: UpdateChannelDto): Promise<ChannelDocument | null> {
    return this.channelModel.findByIdAndUpdate(id, updateChannelDto, { new: true }).exec();
  }

  async remove(id: string): Promise<ChannelDocument | null> {
    return this.channelModel.findByIdAndDelete(id).exec();
  }

  async joinChannel(channelId: string, userId: any): Promise<ChannelDocument> {
    const channel = await this.channelModel.findById(channelId);
    if (!channel) {
      throw new NotFoundException('Channel not found');
    }
    const userIdStr = userId.toString();
    const uniqueIds = Array.from(new Set([...(channel.members ?? []), channel.createdBy, userIdStr].map(m => m.toString())));
    channel.members = uniqueIds.map(id => new Types.ObjectId(id));
    await channel.save();
    return channel.populate('createdBy', 'username');
  }

  async leaveChannel(channelId: string, userId: any): Promise<ChannelDocument> {
    const channel = await this.channelModel.findById(channelId);
    if (!channel) {
      throw new NotFoundException('Channel not found');
    }
    const userIdStr = userId.toString();
    channel.members = (channel.members ?? []).filter(m => m.toString() !== userIdStr);
    await channel.save();
    return channel.populate('createdBy', 'username');
  }
}
