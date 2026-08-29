import { MigrationInterface, QueryRunner } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

export class SeedTransaction1787975969899 implements MigrationInterface {
  name = 'SeedTransaction1787975969899';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Skip if seeding was already applied
    const existing = await queryRunner.manager.count('transaction');
    if (existing > 0) {
      return;
    }

    // Ambil user sebagai pemilik transaksi
    const users = await queryRunner.query(
      `SELECT id FROM "users" WHERE "email" = 'superadmin@sstravel.com' LIMIT 1`,
    );
    const userId = users[0]?.id;
    if (!userId) {
      return;
    }

    const transactions = [
      {
        id: uuidv4(),
        is_active: true,
        date: '2026-08-01',
        transaction_detail: 'Setoran penjualan tiket bus rute Jakarta-Bandung',
        category: 'income',
        sub_category: 'Penjualan Tiket',
        amount: 5250000,
        payment_method: 'Transfer Bank',
        source_account: 'BCA 1234567890',
        status: 'completed',
        reference_number: 'TRX-INC-0001',
        tax: '0',
        transaction_receipt: null,
        note: 'Pemasukan dari penjualan tiket reguler',
        userId,
      },
      {
        id: uuidv4(),
        is_active: true,
        date: '2026-08-05',
        transaction_detail: 'Pembelian sparepart ban bus',
        category: 'expenses',
        sub_category: 'Operasional',
        amount: 1850000,
        payment_method: 'Transfer Bank',
        source_account: 'BCA 1234567890',
        status: 'completed',
        reference_number: 'TRX-EXP-0001',
        tax: '185000',
        transaction_receipt: null,
        note: 'Penggantian ban bus nomor polisi B 1234 XX',
        userId,
      },
      {
        id: uuidv4(),
        is_active: true,
        date: '2026-08-10',
        transaction_detail: 'Gaji sopir dan kernet',
        category: 'expenses',
        sub_category: 'Sumber Daya Manusia',
        amount: 4200000,
        payment_method: 'Cash',
        source_account: 'Kas Kecil',
        status: 'completed',
        reference_number: 'TRX-EXP-0002',
        tax: '0',
        transaction_receipt: null,
        note: 'Gaji bulan Agustus 3 sopir',
        userId,
      },
      {
        id: uuidv4(),
        is_active: true,
        date: '2026-08-15',
        transaction_detail: 'Setoran penjualan tiket bus rute Surabaya-Jogja',
        category: 'income',
        sub_category: 'Penjualan Tiket',
        amount: 3100000,
        payment_method: 'Transfer Bank',
        source_account: 'Mandiri 0987654321',
        status: 'completed',
        reference_number: 'TRX-INC-0002',
        tax: '0',
        transaction_receipt: null,
        note: 'Pemasukan tiket charter',
        userId,
      },
      {
        id: uuidv4(),
        is_active: true,
        date: '2026-08-20',
        transaction_detail: 'Perawatan rutin armada (servis berkala)',
        category: 'expenses',
        sub_category: 'Perawatan',
        amount: 950000,
        payment_method: 'Kartu Kredit',
        source_account: 'Mandiri 0987654321',
        status: 'pending',
        reference_number: 'TRX-EXP-0003',
        tax: '95000',
        transaction_receipt: null,
        note: 'Servis berkala 2 unit bus',
        userId,
      },
    ];

    for (const trx of transactions) {
      await queryRunner.manager.insert('transaction', trx);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "transaction" WHERE "reference_number" IN ('TRX-INC-0001','TRX-EXP-0001','TRX-EXP-0002','TRX-INC-0002','TRX-EXP-0003')`,
    );
  }
}
