import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserDocument } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<UserDocument> {
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const createdUser = new this.userModel({
      ...createUserDto,
      password: hashedPassword,
    });
    return createdUser.save();
  }

  async findAll(): Promise<UserDocument[]> {
    return this.userModel.find().exec();
  }

  async findOne(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }

  async findByUsername(username: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ username }).exec();
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserDocument | null> {
    // On limite les champs modifiables pour éviter qu'un utilisateur ne s'auto-promouvoie admin/banned
    const payload: Partial<User> = {};
    if (updateUserDto.username) {
      payload.username = updateUserDto.username;
    }
    if (updateUserDto.password) {
      payload.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    return this.userModel.findByIdAndUpdate(id, payload, { new: true }).exec();
  }

  async remove(id: string): Promise<UserDocument | null> {
    // Suppression réelle du document utilisateur
    return this.userModel.findByIdAndDelete(id).exec();
  }

  async banUser(id: string, reason: string): Promise<UserDocument | null> {
    // Assure un username unique pour éviter les collisions sur l'index unique
    const anonymizedUsername = `[supprimé]-${id}`;
    return this.userModel.findByIdAndUpdate(
      id,
      { banned: true, bannedReason: reason, username: anonymizedUsername },
      { new: true }
    ).exec();
  }

  async validatePassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  async getAdminStats() {
    const users = await this.userModel.find().exec();
    return users;
  }
}
