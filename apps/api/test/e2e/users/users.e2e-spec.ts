import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../../../src/app.module';

describe('Users E2E Tests', () => {
  let app: INestApplication<App>;
  let accessToken: string;
  let userId: string;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    // Create a test user and get access token
    const timestamp = Date.now();
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: `testuser${timestamp}@example.com`,
        username: `testuser${timestamp}`,
        password: 'Password123!',
      });

    accessToken = response.body.access_token;
    // Decode JWT to get userId (simple base64 decode of payload)
    const payload = JSON.parse(
      Buffer.from(accessToken.split('.')[1], 'base64').toString()
    );
    userId = payload.sub;
  });

  afterEach(async () => {
    await app.close();
  });

  describe('PATCH /users/:id (update username)', () => {
    it('should update username successfully', () => {
      const timestamp = Date.now();
      return request(app.getHttpServer())
        .patch(`/users/${userId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          username: `newusername${timestamp}`,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.username).toBe(`newusername${timestamp}`);
        });
    });

    it('should fail with username longer than 35 characters', () => {
      const longUsername = 'a'.repeat(36); // 36 caractères
      return request(app.getHttpServer())
        .patch(`/users/${userId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          username: longUsername,
        })
        .expect(400);
    });

    it('should succeed with username of exactly 35 characters', () => {
      const timestamp = Date.now().toString().substring(0, 5); // 5 chiffres
      const maxUsername = 'b'.repeat(30) + timestamp; // 30 + 5 = 35 caractères
      return request(app.getHttpServer())
        .patch(`/users/${userId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          username: maxUsername,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.username).toBe(maxUsername);
          expect(res.body.username.length).toBe(35);
        });
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .patch(`/users/${userId}`)
        .send({
          username: 'newusername',
        })
        .expect(401);
    });
  });
});
