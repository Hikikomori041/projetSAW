import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { EncryptionUtil } from '../utils/encryption.util';

export type MessageDocument = Message & Document;

@Schema()
export class Message {
  @Prop({ required: true })
  content: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  author: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Channel', required: true })
  channel: Types.ObjectId;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const MessageSchema = SchemaFactory.createForClass(Message);

// Fonction pour obtenir la clé de chiffrement
const getEncryptionKey = () => {
  return process.env.ENCRYPTION_KEY || 'default-key-change-in-production';
};

// Fonction helper pour déchiffrer un message
const decryptMessageContent = (doc: MessageDocument) => {
  if (doc && doc.content) {
    const key = getEncryptionKey();
    try {
      doc.content = EncryptionUtil.decrypt(doc.content, key);
    } catch (error) {
      doc.content = '[message chiffré avec une ancienne clé]';
    }
  }
};

// Hook avant la sauvegarde : chiffrer le contenu
MessageSchema.pre('save', async function() {
  if (this.isModified('content') && this.content) {
    try {
      const key = getEncryptionKey();
      // Chiffrer le contenu si ce n'est pas déjà chiffré
      // On détecte si c'est déjà chiffré en vérifiant le format (salt:iv:tag:data)
      if (!this.content.includes(':') || this.content.split(':').length !== 4) {
        this.content = EncryptionUtil.encrypt(this.content, key);
      }
    } catch (error) {
      console.error('Encryption error:', error);
      throw error;
    }
  }
});

// Hook avant l'update : chiffrer le contenu
MessageSchema.pre('findOneAndUpdate', function() {
  const update = this.getUpdate() as any;
  if (update && update.content) {
    try {
      const key = getEncryptionKey();
      // Chiffrer le contenu si ce n'est pas déjà chiffré
      if (!update.content.includes(':') || update.content.split(':').length !== 4) {
        update.content = EncryptionUtil.encrypt(update.content, key);
      }
    } catch (error) {
      console.error('Encryption error:', error);
      throw error;
    }
  }
});

// Hook après la lecture : déchiffrer le contenu
MessageSchema.post('find', function(docs: MessageDocument[]) {
  if (docs && Array.isArray(docs)) {
    docs.forEach(decryptMessageContent);
  }
});

MessageSchema.post('findOne', function(doc: MessageDocument) {
  decryptMessageContent(doc);
});

MessageSchema.post('findOneAndUpdate', function(doc: MessageDocument) {
  decryptMessageContent(doc);
});