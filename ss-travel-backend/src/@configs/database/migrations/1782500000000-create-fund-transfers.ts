import { MigrationInterface, QueryRunner } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

export class CreateFundTransfers1782500000000 implements MigrationInterface {
  name = 'CreateFundTransfers1782500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const isCompanyExists = await queryRunner.query(
      `SELECT id FROM "companies" WHERE code = 'SST' LIMIT 1`,
    );
    if (!isCompanyExists || isCompanyExists.length === 0) {
      console.log('Skipping Fund Transfers Migration because Company SST not found.');
      return;
    }
    const companyId = isCompanyExists[0].id;

    // 1. Create Enums if not exist (FundTransferStatus, FundTransferType)
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."fund_transfer_status_enum" AS ENUM('PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'CANCELLED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."fund_transfer_type_enum" AS ENUM('MAIN_TO_OPS', 'OPS_TO_OPS', 'POOL_TO_MAIN', 'OPS_TO_POOL', 'MAIN_TO_POOL', 'OTHER');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // 2. Create fund_transfers table (tanpa uuid_generate_v4() / gen_random_uuid())
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "fund_transfers" (
        "id" uuid NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        "transfer_no" character varying(50) NOT NULL,
        "company_id" uuid NOT NULL,
        "transfer_type" "public"."fund_transfer_type_enum" NOT NULL,
        "source_bank_account_id" uuid,
        "source_cash_account_id" uuid,
        "target_bank_account_id" uuid,
        "target_cash_account_id" uuid,
        "amount" numeric(20,2) NOT NULL,
        "purpose" character varying(255) NOT NULL,
        "reference_doc" character varying(255),
        "status" "public"."fund_transfer_status_enum" NOT NULL DEFAULT 'PENDING_APPROVAL',
        "requested_by_id" uuid NOT NULL,
        "approved_by_id" uuid,
        "approved_at" TIMESTAMP WITH TIME ZONE,
        "rejection_reason" text,
        "journal_entry_id" uuid,
        CONSTRAINT "UQ_fund_transfers_transfer_no" UNIQUE ("transfer_no"),
        CONSTRAINT "PK_fund_transfers_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_fund_transfers_source_bank" FOREIGN KEY ("source_bank_account_id") REFERENCES "bank_accounts"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_fund_transfers_source_cash" FOREIGN KEY ("source_cash_account_id") REFERENCES "cash_accounts"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_fund_transfers_target_bank" FOREIGN KEY ("target_bank_account_id") REFERENCES "bank_accounts"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_fund_transfers_target_cash" FOREIGN KEY ("target_cash_account_id") REFERENCES "cash_accounts"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_fund_transfers_requested_by" FOREIGN KEY ("requested_by_id") REFERENCES "users"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_fund_transfers_approved_by" FOREIGN KEY ("approved_by_id") REFERENCES "users"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_fund_transfers_journal" FOREIGN KEY ("journal_entry_id") REFERENCES "journal_entries"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_fund_transfers_transfer_no" ON "fund_transfers" ("transfer_no")`,
    );

    // 3. Insert New COA Accounts for 6 Banks
    // 11111: Bank BCA Induk, 11112: Bank Mandiri Induk
    // 11121: Bank BCA Ops AKAP, 11122: Bank BCA Ops Wisata, 11123: Bank Mandiri Ops AKAP, 11124: Bank Mandiri Ops Wisata
    const newAccounts = [
      { code: '11111', name: 'Bank BCA Induk (Pusat Penerimaan)', type: 'ASSET', normalBalance: 'DEBIT', parentCode: '11', isPostable: true, description: 'Rekening induk penerimaan tiket & charter via BCA' },
      { code: '11112', name: 'Bank Mandiri Induk (Pusat Penerimaan)', type: 'ASSET', normalBalance: 'DEBIT', parentCode: '11', isPostable: true, description: 'Rekening induk penerimaan tiket & charter via Mandiri' },
      { code: '11121', name: 'Bank BCA Operasional AKAP', type: 'ASSET', normalBalance: 'DEBIT', parentCode: '11', isPostable: true, description: 'Rekening operasional pengeluaran armada AKAP BCA' },
      { code: '11122', name: 'Bank BCA Operasional Wisata', type: 'ASSET', normalBalance: 'DEBIT', parentCode: '11', isPostable: true, description: 'Rekening operasional pengeluaran armada Wisata BCA' },
      { code: '11123', name: 'Bank Mandiri Operasional AKAP', type: 'ASSET', normalBalance: 'DEBIT', parentCode: '11', isPostable: true, description: 'Rekening operasional pengeluaran armada AKAP Mandiri' },
      { code: '11124', name: 'Bank Mandiri Operasional Wisata', type: 'ASSET', normalBalance: 'DEBIT', parentCode: '11', isPostable: true, description: 'Rekening operasional pengeluaran armada Wisata Mandiri' },
    ];

    for (const acc of newAccounts) {
      const parentQuery = await queryRunner.query(
        `SELECT id FROM "accounts" WHERE code = $1 LIMIT 1`,
        [acc.parentCode],
      );
      const parentId = parentQuery.length > 0 ? parentQuery[0].id : null;
      const accId = uuidv4();

      await queryRunner.query(
        `INSERT INTO "accounts" 
          ("id", "company_id", "code", "name", "type", "normal_balance", "is_postable", "parent_id", "description", "is_active")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true)
         ON CONFLICT ("code") DO NOTHING`,
        [accId, companyId, acc.code, acc.name, acc.type, acc.normalBalance, acc.isPostable, parentId, acc.description],
      );
    }

    // 4. Insert 6 New Bank Accounts (2 Induk, 4 Operasional)
    const bankAccounts = [
      {
        code: 'BANK-BCA-MAIN',
        bankName: 'BCA',
        accountName: 'PT SS Traveling Official (Induk)',
        accountNumber: '8830192801',
        mask: '•••• •••• 2801',
        glCode: '11111',
        desc: 'Rekening Induk Pusat Penerimaan BCA',
      },
      {
        code: 'BANK-MANDIRI-MAIN',
        bankName: 'Bank Mandiri',
        accountName: 'PT SS Traveling Official (Induk)',
        accountNumber: '1560012341112',
        mask: '•••• •••• 1112',
        glCode: '11112',
        desc: 'Rekening Induk Pusat Penerimaan Mandiri',
      },
      {
        code: 'BANK-BCA-OPS-AKAP',
        bankName: 'BCA',
        accountName: 'PT SS Traveling Official (Ops AKAP)',
        accountNumber: '8830192821',
        mask: '•••• •••• 2821',
        glCode: '11121',
        desc: 'Rekening Pengeluaran Operasional Armada Bus AKAP BCA',
      },
      {
        code: 'BANK-BCA-OPS-WIS',
        bankName: 'BCA',
        accountName: 'PT SS Traveling Official (Ops Wisata)',
        accountNumber: '8830192822',
        mask: '•••• •••• 2822',
        glCode: '11122',
        desc: 'Rekening Pengeluaran Operasional Armada Pariwisata BCA',
      },
      {
        code: 'BANK-MANDIRI-OPS-AKAP',
        bankName: 'Bank Mandiri',
        accountName: 'PT SS Traveling Official (Ops AKAP)',
        accountNumber: '1560012341123',
        mask: '•••• •••• 1123',
        glCode: '11123',
        desc: 'Rekening Pengeluaran Operasional Armada Bus AKAP Mandiri',
      },
      {
        code: 'BANK-MANDIRI-OPS-WIS',
        bankName: 'Bank Mandiri',
        accountName: 'PT SS Traveling Official (Ops Wisata)',
        accountNumber: '1560012341124',
        mask: '•••• •••• 1124',
        glCode: '11124',
        desc: 'Rekening Pengeluaran Operasional Armada Pariwisata Mandiri',
      },
    ];

    for (const ba of bankAccounts) {
      const glQuery = await queryRunner.query(
        `SELECT id FROM "accounts" WHERE code = $1 LIMIT 1`,
        [ba.glCode],
      );
      if (glQuery.length > 0) {
        const glId = glQuery[0].id;
        const bankId = uuidv4();
        await queryRunner.query(
          `INSERT INTO "bank_accounts" 
            ("id", "company_id", "code", "bank_name", "account_name", "account_number", "account_number_masked", "account_id", "currency", "description", "is_active")
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'IDR', $9, true)
           ON CONFLICT ("code") DO NOTHING`,
          [bankId, companyId, ba.code, ba.bankName, ba.accountName, ba.accountNumber, ba.mask, glId, ba.desc],
        );
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "fund_transfers" CASCADE`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."fund_transfer_status_enum" CASCADE`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."fund_transfer_type_enum" CASCADE`);
  }
}
