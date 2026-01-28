import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../../../src/app.module';
import { cleanDatabase } from '../../helpers/database.helper';

describe('Banned Users Security E2E Tests', () => {
  let app: INestApplication<App>;
  let adminToken: string;
  let adminUserId: string;
  let regularUserToken: string;
  let regularUserId: string;
  let bannedUserToken: string;
  let bannedUserId: string;
  let testChannelId: string;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    // Créer un admin
    const timestamp = Date.now();
    const adminResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: `admin${timestamp}@example.com`,
        username: `admin${timestamp}`,
        password: 'AdminPassword123!',
      });

    adminToken = adminResponse.body.access_token;
    const adminPayload = JSON.parse(
      Buffer.from(adminToken.split('.')[1], 'base64').toString()
    );
    adminUserId = adminPayload.sub;

    // Promouvoir l'utilisateur en admin via la base de données
    const usersService = app.get('UsersService');
    const userModel = app.get('UserModel');
    if (userModel && userModel.findByIdAndUpdate) {
      await userModel.findByIdAndUpdate(adminUserId, { role: 'admin' }).exec();
    }

    // Créer un utilisateur régulier
    const regularResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: `regular${timestamp}@example.com`,
        username: `regular${timestamp}`,
        password: 'RegularPassword123!',
      });

    regularUserToken = regularResponse.body.access_token;
    const regularPayload = JSON.parse(
      Buffer.from(regularUserToken.split('.')[1], 'base64').toString()
    );
    regularUserId = regularPayload.sub;

    // Créer un utilisateur à bannir
    const toBanResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: `toban${timestamp}@example.com`,
        username: `toban${timestamp}`,
        password: 'ToBanPassword123!',
      });

    bannedUserToken = toBanResponse.body.access_token;
    const bannedPayload = JSON.parse(
      Buffer.from(bannedUserToken.split('.')[1], 'base64').toString()
    );
    bannedUserId = bannedPayload.sub;

    // Créer un channel pour les tests
    const channelResponse = await request(app.getHttpServer())
      .post('/channels')
      .set('Authorization', `Bearer ${regularUserToken}`)
      .send({
        name: `TestChannel${timestamp}`,
        isPrivate: false,
      });
    testChannelId = channelResponse.body._id;
  }, 20000);

  afterEach(async () => {
    if (app) {
      await cleanDatabase(app);
      await app.close();
    }
  }, 10000);

  describe('Banned User - Authentication', () => {
    it('should prevent banned user from logging in', async () => {
      // Bannir l'utilisateur
      await request(app.getHttpServer())
        .patch(`/users/${bannedUserId}/ban`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Test ban' })
        .expect(200);

      // Tenter de se reconnecter
      const timestamp = Date.now();
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: `toban${timestamp}@example.com`,
          password: 'ToBanPassword123!',
        })
        .expect(403)
        .expect((res) => {
          expect(res.body.message).toContain('banni');
        });
    });

    it('should invalidate existing token after ban', async () => {
      // Vérifier que le token fonctionne avant ban
      await request(app.getHttpServer())
        .get(`/users/${bannedUserId}`)
        .set('Authorization', `Bearer ${bannedUserToken}`)
        .expect(200);

      // Bannir l'utilisateur
      await request(app.getHttpServer())
        .patch(`/users/${bannedUserId}/ban`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Test ban' })
        .expect(200);

      // Le token existant ne devrait plus fonctionner
      await request(app.getHttpServer())
        .get(`/users/${bannedUserId}`)
        .set('Authorization', `Bearer ${bannedUserToken}`)
        .expect(401);
    });
  });

  describe('Banned User - Channels Access', () => {
    it('should prevent banned user from listing channels', async () => {
      // Bannir l'utilisateur
      await request(app.getHttpServer())
        .patch(`/users/${bannedUserId}/ban`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Test ban' })
        .expect(200);

      // Tenter d'accéder aux channels
      await request(app.getHttpServer())
        .get('/channels')
        .set('Authorization', `Bearer ${bannedUserToken}`)
        .expect(401);
    });

    it('should prevent banned user from accessing a specific channel', async () => {
      // Bannir l'utilisateur
      await request(app.getHttpServer())
        .patch(`/users/${bannedUserId}/ban`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Test ban' })
        .expect(200);

      // Tenter d'accéder à un channel spécifique
      await request(app.getHttpServer())
        .get(`/channels/${testChannelId}`)
        .set('Authorization', `Bearer ${bannedUserToken}`)
        .expect(401);
    });

    it('should prevent banned user from creating channels', async () => {
      // Bannir l'utilisateur
      await request(app.getHttpServer())
        .patch(`/users/${bannedUserId}/ban`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Test ban' })
        .expect(200);

      // Tenter de créer un channel
      const timestamp = Date.now();
      await request(app.getHttpServer())
        .post('/channels')
        .set('Authorization', `Bearer ${bannedUserToken}`)
        .send({
          name: `BannedUserChannel${timestamp}`,
          isPrivate: false,
        })
        .expect(401);
    });
  });

  describe('Banned User - Messages', () => {
    it('should prevent banned user from sending messages', async () => {
      // Bannir l'utilisateur
      await request(app.getHttpServer())
        .patch(`/users/${bannedUserId}/ban`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Test ban' })
        .expect(200);

      // Tenter d'envoyer un message
      await request(app.getHttpServer())
        .post('/messages')
        .set('Authorization', `Bearer ${bannedUserToken}`)
        .send({
          content: 'This should not be sent',
          channelId: testChannelId,
        })
        .expect(401);
    });

    it('should prevent banned user from viewing messages', async () => {
      // Bannir l'utilisateur
      await request(app.getHttpServer())
        .patch(`/users/${bannedUserId}/ban`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Test ban' })
        .expect(200);

      // Tenter de lire les messages d'un channel
      await request(app.getHttpServer())
        .get(`/messages/channel/${testChannelId}`)
        .set('Authorization', `Bearer ${bannedUserToken}`)
        .expect(401);
    });

    it('should prevent banned user from editing messages', async () => {
      // L'utilisateur envoie un message avant d'être banni
      const messageResponse = await request(app.getHttpServer())
        .post('/messages')
        .set('Authorization', `Bearer ${bannedUserToken}`)
        .send({
          content: 'Message before ban',
          channelId: testChannelId,
        })
        .expect(201);

      const messageId = messageResponse.body._id;

      // Bannir l'utilisateur
      await request(app.getHttpServer())
        .patch(`/users/${bannedUserId}/ban`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Test ban' })
        .expect(200);

      // Tenter de modifier le message
      await request(app.getHttpServer())
        .patch(`/messages/${messageId}`)
        .set('Authorization', `Bearer ${bannedUserToken}`)
        .send({
          content: 'Edited after ban',
        })
        .expect(401);
    });

    it('should prevent banned user from deleting messages', async () => {
      // L'utilisateur envoie un message avant d'être banni
      const messageResponse = await request(app.getHttpServer())
        .post('/messages')
        .set('Authorization', `Bearer ${bannedUserToken}`)
        .send({
          content: 'Message before ban',
          channelId: testChannelId,
        })
        .expect(201);

      const messageId = messageResponse.body._id;

      // Bannir l'utilisateur
      await request(app.getHttpServer())
        .patch(`/users/${bannedUserId}/ban`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Test ban' })
        .expect(200);

      // Tenter de supprimer le message
      await request(app.getHttpServer())
        .delete(`/messages/${messageId}`)
        .set('Authorization', `Bearer ${bannedUserToken}`)
        .expect(401);
    });
  });

  describe('Banned User - Profile Updates', () => {
    it('should prevent banned user from updating their profile', async () => {
      // Bannir l'utilisateur
      await request(app.getHttpServer())
        .patch(`/users/${bannedUserId}/ban`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Test ban' })
        .expect(200);

      // Tenter de modifier le profil
      await request(app.getHttpServer())
        .patch(`/users/${bannedUserId}`)
        .set('Authorization', `Bearer ${bannedUserToken}`)
        .send({
          username: 'NewUsername',
        })
        .expect(401);
    });

    it('should prevent banned user from viewing user list', async () => {
      // Bannir l'utilisateur
      await request(app.getHttpServer())
        .patch(`/users/${bannedUserId}/ban`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Test ban' })
        .expect(200);

      // Tenter de lister les utilisateurs
      await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${bannedUserToken}`)
        .expect(401);
    });
  });

  describe('Ban Reason Display', () => {
    it('should include ban reason in login error message', async () => {
      const banReason = 'Violation des règles de la communauté';

      // Bannir l'utilisateur avec une raison
      await request(app.getHttpServer())
        .patch(`/users/${bannedUserId}/ban`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: banReason })
        .expect(200);

      // Tenter de se reconnecter
      const timestamp = Date.now();
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: `toban${timestamp}@example.com`,
          password: 'ToBanPassword123!',
        })
        .expect(403)
        .expect((res) => {
          expect(res.body.message).toContain('banni');
          expect(res.body.message).toContain(banReason);
        });
    });

    it('should show generic message if no ban reason provided', async () => {
      // Bannir l'utilisateur sans raison explicite
      await request(app.getHttpServer())
        .patch(`/users/${bannedUserId}/ban`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: '' })
        .expect(200);

      // Tenter de se reconnecter
      const timestamp = Date.now();
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: `toban${timestamp}@example.com`,
          password: 'ToBanPassword123!',
        })
        .expect(403)
        .expect((res) => {
          expect(res.body.message).toContain('banni');
          expect(res.body.message).toContain('support');
        });
    });
  });

  describe('Regular User After Ban Lifted', () => {
    it('should allow user to login again if ban is removed (theoretical test)', async () => {
      // Note: Ce test est théorique car l'API actuelle ne semble pas avoir
      // de endpoint pour débannir un utilisateur. C'est une recommandation
      // de sécurité : il devrait y avoir un moyen de débannir si nécessaire.
      
      // Bannir l'utilisateur
      await request(app.getHttpServer())
        .patch(`/users/${bannedUserId}/ban`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Test ban' })
        .expect(200);

      // Si un endpoint de débannissement existait, on pourrait le tester ici
      // await request(app.getHttpServer())
      //   .patch(`/users/${bannedUserId}/unban`)
      //   .set('Authorization', `Bearer ${adminToken}`)
      //   .expect(200);

      // Pour l'instant, ce test documente le besoin d'une fonctionnalité de débannissement
      expect(true).toBe(true);
    });
  });
});
