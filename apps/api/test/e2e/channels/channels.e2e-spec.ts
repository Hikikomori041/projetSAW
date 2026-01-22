import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../../../src/app.module';

describe('Channels E2E Tests', () => {
  let app: INestApplication<App>;
  let accessToken: string;
  let userId: string;
  let channelId: string;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    const timestamp = Date.now();

    // Register and login
    const registerRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: `channel-test${timestamp}@example.com`,
        username: `channeluser${timestamp}`,
        password: 'Password123!',
      });

    accessToken = registerRes.body.access_token;
    userId = registerRes.body._id || 'temp-user-id';
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /channels (create)', () => {
    it('should create a new channel', () => {
      return request(app.getHttpServer())
        .post('/channels')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'test-channel' })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('_id');
          expect(res.body.name).toBe('test-channel');
          expect(res.body.createdBy._id).toBe(userId);
          channelId = res.body._id;
        });
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .post('/channels')
        .send({ name: 'test-channel' })
        .expect(401);
    });

    it('should fail with empty name', () => {
      return request(app.getHttpServer())
        .post('/channels')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: '' })
        .expect(400);
    });
  });

  describe('GET /channels (list)', () => {
    it('should return user channels', () => {
      return request(app.getHttpServer())
        .get('/channels')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .get('/channels')
        .expect(401);
    });
  });

  describe('GET /channels/:id (details)', () => {
    beforeEach(async () => {
      const res = await request(app.getHttpServer())
        .post('/channels')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'detail-test-channel' });

      channelId = res.body._id;
    });

    it('should get channel details', () => {
      return request(app.getHttpServer())
        .get(`/channels/${channelId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body._id).toBe(channelId);
          expect(res.body.name).toBe('detail-test-channel');
        });
    });

    it('should fail with non-existent channel id', () => {
      return request(app.getHttpServer())
        .get('/channels/invalid_id')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(400);
    });
  });

  describe('POST /channels/:id/join', () => {
    let otherUserToken: string;
    let creatorChannelId: string;

    beforeEach(async () => {
      // Create channel as first user
      const channelRes = await request(app.getHttpServer())
        .post('/channels')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'join-test-channel' });

      creatorChannelId = channelRes.body._id;

      // Register another user
      const otherRes = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'other@example.com',
          username: 'otheruser',
          password: 'Password123!',
        });

      otherUserToken = otherRes.body.accessToken;
    });

    it('should join a channel as another user', () => {
      return request(app.getHttpServer())
        .post(`/channels/${creatorChannelId}/join`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .send({})
        .expect(201)
        .expect((res) => {
          expect(res.body.members).toContain(expect.objectContaining({ username: 'otheruser' }));
        });
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .post(`/channels/${creatorChannelId}/join`)
        .send({})
        .expect(401);
    });
  });

  describe('POST /channels/:id/leave', () => {
    let memberToken: string;
    let leaveChannelId: string;

    beforeEach(async () => {
      // Create channel
      const channelRes = await request(app.getHttpServer())
        .post('/channels')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'leave-test-channel' });

      leaveChannelId = channelRes.body._id;

      // Register member
      const memberRes = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'member@example.com',
          username: 'memberuser',
          password: 'Password123!',
        });

      memberToken = memberRes.body.accessToken;

      // Join channel
      await request(app.getHttpServer())
        .post(`/channels/${leaveChannelId}/join`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({});
    });

    it('should leave a channel', () => {
      return request(app.getHttpServer())
        .post(`/channels/${leaveChannelId}/leave`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({})
        .expect(201);
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .post(`/channels/${leaveChannelId}/leave`)
        .send({})
        .expect(401);
    });
  });

  describe('DELETE /channels/:id', () => {
    let deleteChannelId: string;

    beforeEach(async () => {
      const res = await request(app.getHttpServer())
        .post('/channels')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'delete-test-channel' });

      deleteChannelId = res.body._id;
    });

    it('should delete own channel', () => {
      return request(app.getHttpServer())
        .delete(`/channels/${deleteChannelId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ reason: 'Testing deletion' })
        .expect(200);
    });

    it('should fail to delete channel not owned', async () => {
      const otherRes = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'other2@example.com',
          username: 'otheruser2',
          password: 'Password123!',
        });

      return request(app.getHttpServer())
        .delete(`/channels/${deleteChannelId}`)
        .set('Authorization', `Bearer ${otherRes.body.accessToken}`)
        .send({ reason: 'Testing deletion' })
        .expect(403);
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .delete(`/channels/${deleteChannelId}`)
        .send({ reason: 'Testing deletion' })
        .expect(401);
    });
  });
});
