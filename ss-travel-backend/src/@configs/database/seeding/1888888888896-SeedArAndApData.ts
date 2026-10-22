import { MigrationInterface, QueryRunner } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

export class SeedArAndApData1888888888896 implements MigrationInterface {
  name = 'SeedArAndApData1888888888896';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const spj01Id = 'f0000000-0000-0000-0000-000000000001'; // Skenario 1: AKAP Normal Bus SS-01
    const spj02Id = 'f0000000-0000-0000-0000-000000000002'; // Skenario 2: Sewa Wisata Bus SS-02

    const spjs = await queryRunner.query(
      `SELECT id, company_id, vehicle_id, business_unit_id, profit_center_id FROM "spjs" WHERE "id" = '${spj01Id}' LIMIT 1`,
    );
    if (spjs.length === 0) return;

    const companyId = spjs[0].company_id;
    const vehicleSS01Id = spjs[0].vehicle_id;
    const businessUnitId = spjs[0].business_unit_id;
    const profitCenterId = spjs[0].profit_center_id;

    // Ambil vehicle SS-02
    const vehicleSS02 = await queryRunner.query(
      `SELECT vehicle_id FROM "spjs" WHERE "id" = '${spj02Id}' LIMIT 1`,
    );
    const vehicleSS02Id = vehicleSS02.length > 0 ? vehicleSS02[0].vehicle_id : vehicleSS01Id;

    // Ambil Rekening Bank BCA
    const bcaAccounts = await queryRunner.query(
      `SELECT id, account_id FROM "bank_accounts" WHERE "bank_name" = 'BCA' LIMIT 1`,
    );
    const bcaBankId = bcaAccounts.length > 0 ? bcaAccounts[0].id : null;
    const bcaGlAccountId = bcaAccounts.length > 0 ? bcaAccounts[0].account_id : null;

    // Ambil Periode Fiskal
    const periods = await queryRunner.query(
      `SELECT id FROM "fiscal_periods" WHERE "status" = 'OPEN' LIMIT 1`,
    );
    const periodId = periods.length > 0 ? periods[0].id : null;

    // Ambil User Admin/Finance
    const financeUsers = await queryRunner.query(
      `SELECT id FROM "users" WHERE "email" = 'finance.manager@sstravel.com' OR "email" = 'admin@sstravel.com' LIMIT 1`,
    );
    const financeUserId = financeUsers.length > 0 ? financeUsers[0].id : null;

    // Ambil Akun-Akun Terkait
    const acc21101 = (await queryRunner.query(`SELECT id FROM "accounts" WHERE "code" = '21101' LIMIT 1`))[0]?.id;
    const acc21102 = (await queryRunner.query(`SELECT id FROM "accounts" WHERE "code" = '21102' LIMIT 1`))[0]?.id;
    const acc51102 = (await queryRunner.query(`SELECT id FROM "accounts" WHERE "code" = '51102' LIMIT 1`))[0]?.id;
    const acc55101 = (await queryRunner.query(`SELECT id FROM "accounts" WHERE "code" = '55101' LIMIT 1`))[0]?.id;
    const acc12101 = (await queryRunner.query(`SELECT id FROM "accounts" WHERE "code" = '12101' LIMIT 1`))[0]?.id;
    const acc24101 = (await queryRunner.query(`SELECT id FROM "accounts" WHERE "code" = '24101' LIMIT 1`))[0]?.id;

    // Ambil Data Restoran Mitra (RM Taman Selera)
    const rm = await queryRunner.query(
      `SELECT id, name FROM "restaurants" WHERE "code" = 'RM-01' OR "name" ILIKE '%Taman Selera%' LIMIT 1`,
    );
    const rmId = rm.length > 0 ? rm[0].id : null;
    const rmName = rm.length > 0 ? rm[0].name : 'RM Taman Selera Subang';

    // Ambil Customer Wisata (PT Mitra Sejahtera Abadi)
    const cust = await queryRunner.query(
      `SELECT id, institution_name FROM "customers" WHERE "code" = 'CUST-0001' LIMIT 1`,
    );
    const custId = cust.length > 0 ? cust[0].id : null;
    const custName = cust.length > 0 ? cust[0].institution_name : 'PT Mitra Sejahtera Abadi';

    // =========================================================================
    // 1. SKENARIO 1: Tagihan AP Servis Makan Restoran Mitra (Rp 1.050.000)
    // =========================================================================
    const apBill01Id = 'b1000000-0000-0000-0000-000000000001';
    const apLine01Id = 'b2000000-0000-0000-0000-000000000001';
    const apLine02Id = 'b2000000-0000-0000-0000-000000000002';
    const apJournal01Id = 'b3000000-0000-0000-0000-000000000001';

    if (acc21101 && acc51102 && periodId) {
      // 1.1 Jurnal Pengakuan Tagihan RM Taman Selera
      await queryRunner.query(`
        INSERT INTO "journal_entries" (
          "id", "journal_no", "journal_date", "period_id", "source_type", "source_id",
          "description", "status", "company_id", "total_debit", "total_credit", "posted_at", "posted_by"
        ) VALUES (
          '${apJournal01Id}', 'JRN/2610/0101', '2026-10-22 00:00:00+00', '${periodId}', 'AP_INVOICE', '${apBill01Id}',
          'Pengakuan Tagihan Vendor: RM Taman Selera Subang (BILL/2610/0001)', 'POSTED', '${companyId}', 1050000.00, 1050000.00, CURRENT_TIMESTAMP, ${financeUserId ? `'${financeUserId}'` : 'NULL'}
        ) ON CONFLICT ("id") DO NOTHING;
      `);

      // Debit 51102 (Line 1 SS-01 Rp 550rb)
      await queryRunner.query(`
        INSERT INTO "journal_lines" (
          "id", "journal_entry_id", "line_no", "account_id", "debit", "credit",
          "description", "trip_id", "vehicle_id", "business_unit_id", "profit_center_id"
        ) VALUES (
          '${uuidv4()}', '${apJournal01Id}', 1, '${acc51102}', 550000.00, 0.00,
          'Servis Makan Penumpang RM Taman Selera - SPJ Bus SS-01', '${spj01Id}', '${vehicleSS01Id}', ${businessUnitId ? `'${businessUnitId}'` : 'NULL'}, ${profitCenterId ? `'${profitCenterId}'` : 'NULL'}
        );
      `);

      // Debit 51102 (Line 2 SS-02 Rp 500rb)
      await queryRunner.query(`
        INSERT INTO "journal_lines" (
          "id", "journal_entry_id", "line_no", "account_id", "debit", "credit",
          "description", "trip_id", "vehicle_id", "business_unit_id", "profit_center_id"
        ) VALUES (
          '${uuidv4()}', '${apJournal01Id}', 2, '${acc51102}', 500000.00, 0.00,
          'Servis Makan Penumpang RM Taman Selera - SPJ Bus SS-02', '${spj02Id}', '${vehicleSS02Id}', ${businessUnitId ? `'${businessUnitId}'` : 'NULL'}, ${profitCenterId ? `'${profitCenterId}'` : 'NULL'}
        );
      `);

      // Kredit 21101 (Utang Vendor RM Taman Selera Rp 1.050.000)
      await queryRunner.query(`
        INSERT INTO "journal_lines" (
          "id", "journal_entry_id", "line_no", "account_id", "debit", "credit",
          "description", "business_unit_id", "profit_center_id"
        ) VALUES (
          '${uuidv4()}', '${apJournal01Id}', 3, '${acc21101}', 0.00, 1050000.00,
          'Utang RM Taman Selera Subang (INV-RMTS-2026/10/012)', ${businessUnitId ? `'${businessUnitId}'` : 'NULL'}, ${profitCenterId ? `'${profitCenterId}'` : 'NULL'}
        );
      `);

      // 1.2 Insert Header AP Invoice
      await queryRunner.query(`
        INSERT INTO "ap_invoices" (
          "id", "company_id", "bill_no", "vendor_invoice_no", "vendor_type", "vendor_id", "vendor_name",
          "invoice_date", "due_date", "status", "currency", "subtotal", "tax_amount", "total_amount", "paid_amount",
          "source_type", "ap_account_id", "notes", "journal_entry_id"
        ) VALUES (
          '${apBill01Id}', '${companyId}', 'BILL/2610/0001', 'INV-RMTS-2026/10/012', 'RESTAURANT', ${rmId ? `'${rmId}'` : 'NULL'}, '${rmName}',
          '2026-10-22 00:00:00+00', '2026-10-29 00:00:00+00', 'APPROVED', 'IDR', 1050000.00, 0.00, 1050000.00, 0.00,
          'RESTAURANT_PERIODIC', '${acc21101}', 'Tagihan servis makan berkala 2x seminggu periode 15-21 Okt 2026', '${apJournal01Id}'
        ) ON CONFLICT ("id") DO NOTHING;
      `);

      // 1.3 Insert Lines AP Invoice
      await queryRunner.query(`
        INSERT INTO "ap_invoice_lines" (
          "id", "invoice_id", "line_no", "description", "account_id", "qty", "unit_price", "amount",
          "trip_id", "vehicle_id", "manifest_pax_count", "coupon_count", "discrepancy_notes"
        ) VALUES (
          '${apLine01Id}', '${apBill01Id}', 1, 'Servis Makan Penumpang RM Taman Selera - SPJ/AKP/2610/0001', '${acc51102}',
          22.00, 25000.00, 550000.00, '${spj01Id}', '${vehicleSS01Id}', 24, 22, '2 penumpang tidur/puasa'
        ) ON CONFLICT ("id") DO NOTHING;

        INSERT INTO "ap_invoice_lines" (
          "id", "invoice_id", "line_no", "description", "account_id", "qty", "unit_price", "amount",
          "trip_id", "vehicle_id", "manifest_pax_count", "coupon_count", "discrepancy_notes"
        ) VALUES (
          '${apLine02Id}', '${apBill01Id}', 2, 'Servis Makan Penumpang RM Taman Selera - SPJ/AKP/2610/0002', '${acc51102}',
          20.00, 25000.00, 500000.00, '${spj02Id}', '${vehicleSS02Id}', 24, 20, '4 penumpang tidak tukar kupon'
        ) ON CONFLICT ("id") DO NOTHING;
      `);
    }

    // =========================================================================
    // 2. SKENARIO 3: Tagihan AP Bengkel Rekanan Radiator Bus SS-01 (Rp 2.500.000)
    // =========================================================================
    const apBill02Id = 'b1000000-0000-0000-0000-000000000002';
    const apJournal02Id = 'b3000000-0000-0000-0000-000000000002';

    if (acc21102 && acc55101 && periodId) {
      await queryRunner.query(`
        INSERT INTO "journal_entries" (
          "id", "journal_no", "journal_date", "period_id", "source_type", "source_id",
          "description", "status", "company_id", "total_debit", "total_credit", "posted_at"
        ) VALUES (
          '${apJournal02Id}', 'JRN/2610/0102', '2026-10-22 00:00:00+00', '${periodId}', 'AP_INVOICE', '${apBill02Id}',
          'Pengakuan Tagihan Servis Radiator Bengkel Cirebon Diesel Motor (Bus SS-01)', 'POSTED', '${companyId}', 2500000.00, 2500000.00, CURRENT_TIMESTAMP
        ) ON CONFLICT ("id") DO NOTHING;

        INSERT INTO "journal_lines" (
          "id", "journal_entry_id", "line_no", "account_id", "debit", "credit", "description", "vehicle_id"
        ) VALUES (
          '${uuidv4()}', '${apJournal02Id}', 1, '${acc55101}', 2500000.00, 0.00,
          'Beban Servis Radiator & Perbaikan Mesin Bus SS-01 di Tol Cipali KM 214', '${vehicleSS01Id}'
        );

        INSERT INTO "journal_lines" (
          "id", "journal_entry_id", "line_no", "account_id", "debit", "credit", "description"
        ) VALUES (
          '${uuidv4()}', '${apJournal02Id}', 2, '${acc21102}', 0.00, 2500000.00,
          'Utang Vendor Bengkel Cirebon Diesel Motor (NOTA-CDM-8821)'
        );

        INSERT INTO "ap_invoices" (
          "id", "company_id", "bill_no", "vendor_invoice_no", "vendor_type", "vendor_name",
          "invoice_date", "due_date", "status", "currency", "subtotal", "tax_amount", "total_amount", "paid_amount",
          "source_type", "ap_account_id", "notes", "journal_entry_id"
        ) VALUES (
          '${apBill02Id}', '${companyId}', 'BILL/2610/0002', 'NOTA-CDM-8821', 'WORKSHOP', 'Cirebon Diesel Motor',
          '2026-10-22 00:00:00+00', '2026-11-05 00:00:00+00', 'APPROVED', 'IDR', 2500000.00, 0.00, 2500000.00, 0.00,
          'WORKSHOP_REPAIR', '${acc21102}', 'Penggantian kisi radiator tembaga & overhaul ringan pendingin Bus SS-01', '${apJournal02Id}'
        ) ON CONFLICT ("id") DO NOTHING;

        INSERT INTO "ap_invoice_lines" (
          "id", "invoice_id", "line_no", "description", "account_id", "qty", "unit_price", "amount", "vehicle_id"
        ) VALUES (
          '${uuidv4()}', '${apBill02Id}', 1, 'Perbaikan Radiator & Komponen Pendingin SS-01', '${acc55101}',
          1.00, 2500000.00, 2500000.00, '${vehicleSS01Id}'
        ) ON CONFLICT ("id") DO NOTHING;
      `);
    }

    // =========================================================================
    // 3. SKENARIO 2: AR DP Sewa Wisata 30% & Invoice Pelunasan 70%
    // =========================================================================
    const arRct01Id = 'c1000000-0000-0000-0000-000000000001';
    const arJournalDpId = 'c3000000-0000-0000-0000-000000000001';
    const arInv01Id = 'c4000000-0000-0000-0000-000000000001';

    if (acc24101 && acc12101 && bcaGlAccountId && periodId) {
      // 3.1 Penerimaan DP 30% (Rp 5.250.000)
      await queryRunner.query(`
        INSERT INTO "journal_entries" (
          "id", "journal_no", "journal_date", "period_id", "source_type", "source_id",
          "description", "status", "company_id", "total_debit", "total_credit", "posted_at"
        ) VALUES (
          '${arJournalDpId}', 'JRN/2610/0103', '2026-10-15 00:00:00+00', '${periodId}', 'BANK_TRANSACTION', '${arRct01Id}',
          'Penerimaan DP Sewa Wisata 30%: ${custName} (RCT/AR/2610/0001)', 'POSTED', '${companyId}', 5250000.00, 5250000.00, CURRENT_TIMESTAMP
        ) ON CONFLICT ("id") DO NOTHING;

        INSERT INTO "journal_lines" (
          "id", "journal_entry_id", "line_no", "account_id", "debit", "credit", "description", "trip_id"
        ) VALUES (
          '${uuidv4()}', '${arJournalDpId}', 1, '${bcaGlAccountId}', 5250000.00, 0.00,
          'Mutasi Bank BCA Masuk DP Sewa PT Mitra Sejahtera', '${spj02Id}'
        );

        INSERT INTO "journal_lines" (
          "id", "journal_entry_id", "line_no", "account_id", "debit", "credit", "description", "trip_id"
        ) VALUES (
          '${uuidv4()}', '${arJournalDpId}', 2, '${acc24101}', 0.00, 5250000.00,
          'Titipan Liabilitas DP Sewa Wisata SS-02 (5 Hari Solo-Yogya)', '${spj02Id}'
        );

        INSERT INTO "ar_receipts" (
          "id", "company_id", "receipt_no", "customer_id", "customer_name", "receipt_date",
          "payment_method", "bank_account_id", "amount", "status", "reference", "is_down_payment",
          "down_payment_trip_id", "notes", "journal_entry_id"
        ) VALUES (
          '${arRct01Id}', '${companyId}', 'RCT/AR/2610/0001', ${custId ? `'${custId}'` : 'NULL'}, '${custName}',
          '2026-10-15 00:00:00+00', 'BANK_TRANSFER', ${bcaBankId ? `'${bcaBankId}'` : 'NULL'}, 5250000.00, 'CONFIRMED',
          'TRF-BCA-DP-MITRA', true, '${spj02Id}', 'DP Sewa 30% Bus Wisata SS-02 tour 5 hari', '${arJournalDpId}'
        ) ON CONFLICT ("id") DO NOTHING;
      `);

      // 3.2 Invoice Pelunasan 70% (Rp 12.250.000)
      await queryRunner.query(`
        INSERT INTO "ar_invoices" (
          "id", "company_id", "invoice_no", "customer_id", "customer_name", "invoice_date", "due_date",
          "status", "currency", "subtotal", "tax_amount", "total_amount", "paid_amount", "source_type",
          "trip_id", "ar_account_id", "is_down_payment", "notes"
        ) VALUES (
          '${arInv01Id}', '${companyId}', 'INV/WIS/2610/0001', ${custId ? `'${custId}'` : 'NULL'}, '${custName}',
          '2026-10-21 00:00:00+00', '2026-10-24 00:00:00+00', 'APPROVED', 'IDR', 12250000.00, 0.00, 12250000.00, 0.00,
          'CHARTER_CONTRACT', '${spj02Id}', '${acc12101}', false, 'Pelunasan sisa 70% sewa bus pariwisata 5 hari tour Jawa Tengah'
        ) ON CONFLICT ("id") DO NOTHING;

        INSERT INTO "ar_invoice_lines" (
          "id", "invoice_id", "line_no", "description", "account_id", "qty", "unit_price", "amount", "trip_id", "vehicle_id"
        ) VALUES (
          '${uuidv4()}', '${arInv01Id}', 1, 'Pelunasan 70% Sewa Bus Wisata SS-02 (5 Hari Solo-Yogya)', '${acc12101}',
          1.00, 12250000.00, 12250000.00, '${spj02Id}', '${vehicleSS02Id}'
        ) ON CONFLICT ("id") DO NOTHING;
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "ap_invoices" WHERE "bill_no" IN ('BILL/2610/0001', 'BILL/2610/0002')`);
    await queryRunner.query(`DELETE FROM "ar_receipts" WHERE "receipt_no" = 'RCT/AR/2610/0001'`);
    await queryRunner.query(`DELETE FROM "ar_invoices" WHERE "invoice_no" = 'INV/WIS/2610/0001'`);
  }
}
