import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter;

  constructor() {
    // Configuration SMTP depuis les variables d'environnement
    // Pour les tests, utilisez Ethereal Email (https://ethereal.email/)
    // En production, utilisez un vrai serveur SMTP (Gmail, SendGrid, etc.)
    this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.ethereal.email',
        port: parseInt(process.env.SMTP_PORT || '587'),
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });
  }

  async sendMessageDeletedNotification(userEmail: string, username: string, messageContent: string, reason: string) {
    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM || '"Discord Clone Admin" <admin@discordclone.com>',
        to: userEmail,
        subject: 'Votre message a été supprimé',
        html: `
          <h2>Bonjour ${username},</h2>
          <p>Votre message a été supprimé par un administrateur.</p>
          <p><strong>Contenu du message :</strong> "${messageContent}"</p>
          <p><strong>Raison :</strong> ${reason}</p>
          <hr>
          <p>Si vous pensez qu'il s'agit d'une erreur, contactez l'équipe de modération.</p>
        `,
      });
      console.log(`Email sent to ${userEmail} for message deletion`);
    } catch (error) {
      console.error('Failed to send email:', error);
    }
  }

  async sendChannelDeletedNotification(userEmail: string, username: string, channelName: string, reason: string) {
    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM || '"Discord Clone Admin" <admin@discordclone.com>',
        to: userEmail,
        subject: 'Un salon a été supprimé',
        html: `
          <h2>Bonjour ${username},</h2>
          <p>Le salon "<strong>${channelName}</strong>" dont vous étiez membre a été supprimé par un administrateur.</p>
          <p><strong>Raison :</strong> ${reason}</p>
          <hr>
          <p>Si vous pensez qu'il s'agit d'une erreur, contactez l'équipe de modération.</p>
        `,
      });
      console.log(`Email sent to ${userEmail} for channel deletion`);
    } catch (error) {
      console.error('Failed to send email:', error);
    }
  }

  async sendUserBannedNotification(userEmail: string, username: string, reason: string) {
    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM || '"Discord Clone Admin" <admin@discordclone.com>',
        to: userEmail,
        subject: 'Votre compte a été banni',
        html: `
          <h2>Bonjour ${username},</h2>
          <p>Votre compte a été banni par un administrateur.</p>
          <p><strong>Raison :</strong> ${reason}</p>
          <hr>
          <p>Pour toute réclamation, contactez l'équipe de modération.</p>
        `,
      });
      console.log(`Email sent to ${userEmail} for account ban`);
    } catch (error) {
      console.error('Failed to send email:', error);
    }
  }
}
