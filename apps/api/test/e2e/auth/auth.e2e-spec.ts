import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../../../src/app.module';

describe('Authentication E2E Tests', () => {
  let app: INestApplication<App>;
  let accessToken: string;
  let userId: string;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /auth/register', () => {
    it('should register a new user', () => {
      const timestamp = Date.now();
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: `newuser${timestamp}@example.com`,
          username: `newuser${timestamp}`,
          password: 'Password123!',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('access_token');
          expect(typeof res.body.access_token).toBe('string');
        });
    });

    it('should fail with invalid email', () => {
      const timestamp = Date.now();
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'invalid-email',
          username: `testuser${timestamp}`,
          password: 'Password123!',
        })
        .expect(400);
    });

    it('should fail with weak password', () => {
      const timestamp = Date.now();
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: `test${timestamp}@example.com`,
          username: `testuser${timestamp}`,
          password: 'weak',
        })
        .expect(400);
    });
  });

  describe('POST /auth/login', () => {
    beforeEach(async () => {
      const timestamp = Date.now();
      global['testEmail'] = `login${timestamp}@example.com`;
      global['testUsername'] = `loginuser${timestamp}`;
      // Create a user first
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: global['testEmail'],
          username: global['testUsername'],
          password: 'Password123!',
        });
    });

    it('should login with valid credentials', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username: global['testUsername'],
          password: 'Password123!',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('access_token');
          accessToken = res.body.access_token;
        });
    });

    it('should fail with incorrect password', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username: global['testUsername'],
          password: 'WrongPassword123!',
        })
        .expect(401);
    });

    it('should fail with non-existent email', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username: 'nonexistentuser',
          password: 'Password123!',
        })
        .expect(401);
    });
  });

});
