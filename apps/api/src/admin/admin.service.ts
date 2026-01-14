import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../users/entities/user.entity';
import { Channel, ChannelDocument } from '../channels/entities/channel.entity';
import { Message, MessageDocument } from '../messages/message.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Channel.name) private channelModel: Model<ChannelDocument>,
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
  ) {}

  async getStats() {
    // Récupérer tous les utilisateurs avec leurs stats
    const users = await this.userModel.find().exec();
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const messageCount = await this.messageModel.countDocuments({ author: user._id }).exec();
        return {
          _id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          banned: user.banned,
          bannedReason: user.bannedReason,
          createdAt: user.createdAt,
          messageCount,
        };
      })
    );

    // Récupérer tous les salons avec leurs stats
    const channels = await this.channelModel.find().populate('createdBy', 'username').exec();
    const channelsWithStats = await Promise.all(
      channels.map(async (channel) => {
        // Utiliser la version string de l'ID car le champ channel dans les messages est une string
        const channelIdStr = channel._id.toString();
        
        // Compter tous les messages du salon
        const allMessages = await this.messageModel
          .find({ channel: channelIdStr })
          .populate('author')
          .exec();
        
        const messageCount = allMessages.length;
        const memberCount = channel.members?.length || 0;
        
        // Compter les messages dont l'auteur a un username commençant par "[supprimé]"
        const deletedMessagesCount = allMessages.filter(msg => 
          !msg.author || (msg.author as any).username?.startsWith('[supprimé]')
        ).length;
        
        // Compter les utilisateurs bannis uniques (username commence par "[supprimé]")
        const bannedUserIds = new Set<string>();
        allMessages.forEach(msg => {
          if (msg.author && (msg.author as any).username?.startsWith('[supprimé]')) {
            bannedUserIds.add((msg.author as any)._id.toString());
          }
        });
        
        return {
          _id: channel._id,
          name: channel.name,
          createdBy: channel.createdBy,
          createdAt: channel.createdAt,
          memberCount,
          messageCount,
          deletedMessagesCount,
          bannedUsersCount: bannedUserIds.size,
        };
      })
    );

    return {
      users: usersWithStats,
      channels: channelsWithStats,
    };
  }
}
