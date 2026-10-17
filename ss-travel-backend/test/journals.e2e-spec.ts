import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import * as cookieParser from 'cookie-parser';
import { DataSource } from 'typeorm';
import { AppModule } from './../src/app.module';

describe('Accounting Core & Journals E2E Verification', () => {
  let app: INestApplication;
  let accountantToken: string;
  const deviceId = 'test-e2e-device-accountant';
  const userAgent = 'Jest-E2E-Agent';
  let cashAccountId: string;
  let expenseAccountId: string;
  let createdJournalId: string;

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

    // 1. Login as ACCOUNTANT
    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .set('x-device-id', deviceId)
      .set('User-Agent', userAgent)
      .send({
        identifier: 'accountant@sstravel.com',
        password: 'Asd123',
        deviceId,
      })
      .expect(200);

    accountantToken = loginRes.body.data.token;

    // 2. Fetch Accounts to find 11101 and 52101
    const accRes = await request(app.getHttpServer())
      .get('/api/v1/accounts')
      .set('x-device-id', deviceId)
      .set('User-Agent', userAgent)
      .set('Authorization', `Bearer ${accountantToken}`)
      .expect(200);

    const accounts = accRes.body.data;
    const cashAcc = accounts.find((a: any) => a.code === '11101');
    const expAcc = accounts.find((a: any) => a.code === '52101');

    expect(cashAcc).toBeDefined();
    expect(expAcc).toBeDefined();

    cashAccountId = cashAcc.id;
    expenseAccountId = expAcc.id;
  });

  afterAll(async () => {
    // Teardown: Bersihkan data uji coba E2E agar database development tetap bersih
    try {
      if (createdJournalId) {
        const ds = app.get(DataSource);
        await ds.query(
          `DELETE FROM accounting_events WHERE journal_entry_id = $1 OR journal_entry_id IN (SELECT id FROM journal_entries WHERE reversal_of_id = $1)`,
          [createdJournalId],
        );
        await ds.query(
          `DELETE FROM journal_lines WHERE journal_entry_id = $1 OR journal_entry_id IN (SELECT id FROM journal_entries WHERE reversal_of_id = $1)`,
          [createdJournalId],
        );
        await ds.query(
          `DELETE FROM journal_entries WHERE reversal_of_id = $1`,
          [createdJournalId],
        );
        await ds.query(
          `DELETE FROM journal_entries WHERE id = $1`,
          [createdJournalId],
        );
      }
    } catch (err) {
      // Ignore cleanup error
    } finally {
      await app.close();
    }
  });

  it('should reject posting an unbalanced journal (Total Debit != Total Credit)', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/journals/manual')
      .set('x-device-id', deviceId)
      .set('User-Agent', userAgent)
      .set('Authorization', `Bearer ${accountantToken}`)
      .send({
        journalDate: '2026-10-18',
        description: 'Jurnal tidak seimbang E2E',
        lines: [
          { accountId: expenseAccountId, debit: '500000.00', credit: '0.00' },
          { accountId: cashAccountId, debit: '0.00', credit: '400000.00' },
        ],
      })
      .expect(400);

    expect(res.body.message).toMatch(/Jurnal tidak seimbang/);
  });

  it('should successfully post a balanced manual journal entry', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/journals/manual')
      .set('x-device-id', deviceId)
      .set('User-Agent', userAgent)
      .set('Authorization', `Bearer ${accountantToken}`)
      .send({
        journalDate: '2026-10-18',
        description: 'E2E Testing: Pembayaran Kas Tol Cipali',
        lines: [
          {
            accountId: expenseAccountId,
            debit: '350000.00',
            credit: '0.00',
            description: 'Beban Tol Cipali',
          },
          {
            accountId: cashAccountId,
            debit: '0.00',
            credit: '350000.00',
            description: 'Kas Keluar Pool Ciputat',
          },
        ],
      })
      .expect(201);

    expect(res.body.status).toBe(true);
    expect(res.body.data.journalNo).toMatch(/^JV\/\d{4}\/\d{4}$/);
    expect(res.body.data.status).toBe('POSTED');
    expect(Number(res.body.data.totalDebit)).toBe(350000);
    expect(Number(res.body.data.totalCredit)).toBe(350000);
    expect(res.body.data.lines.length).toBe(2);

    createdJournalId = res.body.data.id;
  });

  it('should retrieve the list of journals including the newly created journal', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/journals')
      .set('x-device-id', deviceId)
      .set('User-Agent', userAgent)
      .set('Authorization', `Bearer ${accountantToken}`)
      .expect(200);

    expect(res.body.status).toBe(true);
    expect(res.body.data.total).toBeGreaterThan(0);
    const found = res.body.data.journals.find((j: any) => j.id === createdJournalId);
    expect(found).toBeDefined();
    expect(found.status).toBe('POSTED');
  });

  it('should retrieve a single journal by ID with full lines and accounts', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/journals/${createdJournalId}`)
      .set('x-device-id', deviceId)
      .set('User-Agent', userAgent)
      .set('Authorization', `Bearer ${accountantToken}`)
      .expect(200);

    expect(res.body.status).toBe(true);
    expect(res.body.data.id).toBe(createdJournalId);
    expect(res.body.data.lines.length).toBe(2);
    expect(res.body.data.lines[0].account.code).toBeDefined();
    expect(res.body.data.period).toBeDefined();
  });

  it('should successfully reverse the journal and mark the original as REVERSED', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/v1/journals/${createdJournalId}/reverse`)
      .set('x-device-id', deviceId)
      .set('User-Agent', userAgent)
      .set('Authorization', `Bearer ${accountantToken}`)
      .send({
        reason: 'E2E Test: Koreksi kesalahan pencatatan nomor tol',
        reversalDate: '2026-10-18',
      })
      .expect(201);

    expect(res.body.status).toBe(true);
    expect(res.body.data.reversalOfId).toBe(createdJournalId);
    expect(res.body.data.description).toContain('REVERSAL');
    expect(res.body.data.status).toBe('POSTED');

    // Verify original journal status is now REVERSED
    const origRes = await request(app.getHttpServer())
      .get(`/api/v1/journals/${createdJournalId}`)
      .set('x-device-id', deviceId)
      .set('User-Agent', userAgent)
      .set('Authorization', `Bearer ${accountantToken}`)
      .expect(200);

    expect(origRes.body.data.status).toBe('REVERSED');
  });

  it('should reject reversing an already reversed journal', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/v1/journals/${createdJournalId}/reverse`)
      .set('x-device-id', deviceId)
      .set('User-Agent', userAgent)
      .set('Authorization', `Bearer ${accountantToken}`)
      .send({
        reason: 'Reversal kedua kali',
      })
      .expect(400);

    expect(res.body.message).toMatch(/Hanya jurnal berstatus POSTED yang dapat dibalik/);
  });
});
