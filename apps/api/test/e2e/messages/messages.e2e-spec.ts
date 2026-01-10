import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../../../src/app.module';

describe('Messages E2E Tests', () => {
  let app: INestApplication<App>;
  let accessToken: string;
  let userId: string;
  let channelId: string;
  let messageId: string;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    const timestamp = Date.now();

    // Register user
    const registerRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: `message-test${timestamp}@example.com`,
        username: `messageuser${timestamp}`,
        password: 'Password123!',
      });

    const timestamp = Date.now();
    accessToken = registerRes.body.access_token;
    userId = registerRes.body._id || 'temp-user-id';

    // Create channel
    const channelRes = await request(app.getHttpServer())
      .post('/channels')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'message-test-channel' });

    channelId = channelRes.body._id;
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /messages/channel/:channelId', () => {
    it('should get messages from channel', () => {
      return request(app.getHttpServer())
        .get(`/messages/channel/${channelId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .get(`/messages/channel/${channelId}`)
        .expect(401);
    });
  });

  describe('POST /messages (create via HTTP)', () => {
    it('should create a message', () => {
      return request(app.getHttpServer())
        .post('/messages')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          content: 'Test message',
          channelId: channelId,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('_id');
          expect(res.body.content).toBe('Test message');
          expect(res.body.author._id).toBe(userId);
          messageId = res.body._id;
        });
    });

    it('should fail with empty content', () => {
      return request(app.getHttpServer())
        .post('/messages')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          content: '',
          channelId: channelId,
        })
        .expect(400);
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .post('/messages')
        .send({
          content: 'Test message',
          channelId: channelId,
        })
        .expect(401);
    });
  });

  describe('PATCH /messages/:id (update)', () => {
    beforeEach(async () => {
      const res = await request(app.getHttpServer())
        .post('/messages')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          content: 'Original message',
          channelId: channelId,
        });

      messageId = res.body._id;
    });

    it('should update own message', () => {
      return request(app.getHttpServer())
        .patch(`/messages/${messageId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ content: 'Updated message' })
        .expect(200)
        .expect((res) => {
          expect(res.body.content).toBe('Updated message');
        });
    });

    it('should fail to update message from another user', async () => {
      const otherRes = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'other-msg@example.com',
          username: 'otheruser',
          password: 'Password123!',
        });

      return request(app.getHttpServer())
        .patch(`/messages/${messageId}`)
        .set('Authorization', `Bearer ${otherRes.body.accessToken}`)
        .send({ content: 'Hacked message' })
        .expect(403);
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .patch(`/messages/${messageId}`)
        .send({ content: 'Updated message' })
        .expect(401);
    });
  });

  describe('DELETE /messages/:id', () => {
    beforeEach(async () => {
      const res = await request(app.getHttpServer())
        .post('/messages')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          content: 'Message to delete',
          channelId: channelId,
        });

      messageId = res.body._id;
    });

    it('should delete own message', () => {
      return request(app.getHttpServer())
        .delete(`/messages/${messageId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
    });

    it('should fail to delete message from another user', async () => {
      const otherRes = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'other-del@example.com',
          username: 'otheruser2',
          password: 'Password123!',
        });

      return request(app.getHttpServer())
        .delete(`/messages/${messageId}`)
        .set('Authorization', `Bearer ${otherRes.body.accessToken}`)
        .expect(403);
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .delete(`/messages/${messageId}`)
        .expect(401);
    });
  });
});
