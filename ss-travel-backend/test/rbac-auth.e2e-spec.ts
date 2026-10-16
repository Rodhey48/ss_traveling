import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('RBAC Auth & Menus Verification (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should successfully login as SUPER_ADMIN with password Asd123 and return all menus', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .set('x-device-id', 'test-device-uuid-001')
      .send({
        identifier: 'superadmin@sstravel.com',
        password: 'Asd123',
        deviceId: 'test-device-uuid-001',
      })
      .expect(200);

    expect(res.body.status).toBe(true);
    expect(res.body.data.user.email).toBe('superadmin@sstravel.com');
    expect(res.body.data.user.roles.some((r: any) => r.name === 'SUPER_ADMIN')).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.menus.length).toBeGreaterThan(0);
  });

  it('should successfully login as OPS_ADMIN with password Asd123', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .set('x-device-id', 'test-device-uuid-002')
      .send({
        identifier: 'ops.admin@sstravel.com',
        password: 'Asd123',
        deviceId: 'test-device-uuid-002',
      })
      .expect(200);

    expect(res.body.status).toBe(true);
    expect(res.body.data.user.email).toBe('ops.admin@sstravel.com');
    expect(res.body.data.user.roles.some((r: any) => r.name === 'OPS_ADMIN')).toBe(true);
  });

  it('should successfully login as POOL_CASHIER with password Asd123', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .set('x-device-id', 'test-device-uuid-003')
      .send({
        identifier: 'cashier.ciputat@sstravel.com',
        password: 'Asd123',
        deviceId: 'test-device-uuid-003',
      })
      .expect(200);

    expect(res.body.status).toBe(true);
    expect(res.body.data.user.email).toBe('cashier.ciputat@sstravel.com');
    expect(res.body.data.user.roles.some((r: any) => r.name === 'POOL_CASHIER')).toBe(true);
  });

  it('should successfully login as CREW_STEWARDESS with password Asd123', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .set('x-device-id', 'test-device-uuid-004')
      .send({
        identifier: 'stewardess.siti@sstravel.com',
        password: 'Asd123',
        deviceId: 'test-device-uuid-004',
      })
      .expect(200);

    expect(res.body.status).toBe(true);
    expect(res.body.data.user.email).toBe('stewardess.siti@sstravel.com');
    expect(res.body.data.user.roles.some((r: any) => r.name === 'CREW_STEWARDESS')).toBe(true);
  });

  it('should reject login with wrong password', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .set('x-device-id', 'test-device-uuid-005')
      .send({
        identifier: 'superadmin@sstravel.com',
        password: 'WrongPassword!',
        deviceId: 'test-device-uuid-005',
      })
      .expect(400);

    expect(res.body.status).toBe(false);
  });
});
