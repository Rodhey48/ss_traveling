import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import * as cookieParser from 'cookie-parser';
import { AppModule } from '../src/app.module';

describe('Coordinators & Field Fee Rework (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let createdCoordinatorId: string;
  const deviceId = 'test-device-uuid-001';
  const userAgent = 'Jest-E2E-Agent';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    // Login as Superadmin to get auth token
    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .set('x-device-id', deviceId)
      .set('User-Agent', userAgent)
      .send({
        identifier: 'superadmin@sstravel.com',
        password: 'Asd123',
        deviceId,
      })
      .expect(200);

    authToken = loginRes.body.data.token;
  });

  afterAll(async () => {
    await app.close();
  });

  it('1. GET /api/v1/partners/coordinators - harus mengembalikan daftar master koordinator seeded dengan data bank', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/partners/coordinators')
      .set('x-device-id', deviceId)
      .set('User-Agent', userAgent)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(res.body.status).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(2);

    const barat = res.body.data.find((c: any) => c.code === 'KOR-BRT-01');
    expect(barat).toBeDefined();
    expect(barat.name).toBe('H. Ahmad Sodik');
    expect(barat.bankName).toBe('BCA');
    expect(barat.bankAccountNumber).toBe('8830192847');
    expect(barat.phone).toBe('081298765432');
  });

  it('2. POST /api/v1/partners/coordinators - harus berhasil mendaftarkan koordinator lapangan eksternal baru lengkap dengan rekening', async () => {
    const testCode = `KOR-TEST-${Date.now().toString().slice(-4)}`;
    const res = await request(app.getHttpServer())
      .post('/api/v1/partners/coordinators')
      .set('x-device-id', deviceId)
      .set('User-Agent', userAgent)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        code: testCode,
        name: 'Sutrisno Hadi',
        type: 'ORGANIZATION',
        organizationName: 'Paguyuban Jalur Tengah',
        phone: '081234567899',
        area: 'MAGELANG - TERMINAL TIDAR',
        bankName: 'BRI',
        bankAccountNumber: '002901998877665',
        bankAccountHolder: 'Sutrisno Hadi',
        notes: 'Uji coba E2E master korlap',
      })
      .expect(201);

    expect(res.body.status).toBe(true);
    expect(res.body.data.code).toBe(testCode);
    expect(res.body.data.bankName).toBe('BRI');
    expect(res.body.data.bankAccountNumber).toBe('002901998877665');
    createdCoordinatorId = res.body.data.id;
  });

  it('3. PUT /api/v1/partners/coordinators/:id - harus berhasil memperbarui nomor rekening dan WhatsApp koordinator', async () => {
    const res = await request(app.getHttpServer())
      .put(`/api/v1/partners/coordinators/${createdCoordinatorId}`)
      .set('x-device-id', deviceId)
      .set('User-Agent', userAgent)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        bankAccountNumber: '002901998877999',
        phone: '081299998888',
        notes: 'Rekening diperbarui via E2E test',
      })
      .expect(200);

    expect(res.body.status).toBe(true);
    expect(res.body.data.bankAccountNumber).toBe('002901998877999');
    expect(res.body.data.phone).toBe('081299998888');
  });

  it('4. GET /api/v1/partners/coordinator-fees/by-route - harus mengkalkulasi fee dan menyertakan snapshot data rekening koordinator', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/partners/coordinator-fees/by-route')
      .query({
        origin: 'JAKARTA',
        destination: 'YOGYAKARTA',
        paxCount: 24,
      })
      .set('x-device-id', deviceId)
      .set('User-Agent', userAgent)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(res.body.status).toBe(true);
    expect(res.body.data.paxCount).toBe(24);
    expect(res.body.data.totalFee).toBe(res.body.data.feePerPax * 24);
    expect(res.body.data.coordinatorName).toBeDefined();
  });

  it('5. GET /api/v1/finance/coordination-fees/pending - harus mengembalikan tagihan dengan relasi koordinator & info rekening', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/finance/coordination-fees/pending')
      .set('x-device-id', deviceId)
      .set('User-Agent', userAgent)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(res.body.status).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('6. DELETE /api/v1/partners/coordinators/:id - harus berhasil menghapus data master koordinator uji', async () => {
    const res = await request(app.getHttpServer())
      .delete(`/api/v1/partners/coordinators/${createdCoordinatorId}`)
      .set('x-device-id', deviceId)
      .set('User-Agent', userAgent)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(res.body.status).toBe(true);
  });
});
