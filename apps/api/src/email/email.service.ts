import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter;

  constructor() {
    // Configuration pour un serveur SMTP de test (Ethereal Email)
    // En production, utilisez un vrai serveur SMTP (Gmail, SendGrid, etc.)
    this.transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: 'your-email@ethereal.email',
        pass: 'your-password',
      },
    });

    // Pour les tests, vous pouvez créer un compte sur https://ethereal.email/
    // Ou désactiver l'envoi d'emails en commentant le code ci-dessus
  }

  async sendMessageDeletedNotification(userEmail: string, username: string, messageContent: string, reason: string) {
    try {
      await this.transporter.sendMail({
        from: '"Discord Clone Admin" <admin@discordclone.com>',
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
        from: '"Discord Clone Admin" <admin@discordclone.com>',
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
        from: '"Discord Clone Admin" <admin@discordclone.com>',
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
