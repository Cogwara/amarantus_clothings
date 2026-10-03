import { NextResponse } from 'next/server';
import { query, ensureDiscountColumns } from '@/lib/db';
import { getCurrentUser, logAudit } from '@/lib/auth';
import { z } from 'zod';

const createAccountSchema = z.object({
  bankName: z.string().min(2, 'Bank name is required'),
  accountNumber: z.string().min(5, 'Valid account number is required'),
  accountName: z.string().min(2, 'Account name is required'),
  isPrimary: z.boolean().optional(),
});

const updateAccountSchema = z.object({
  id: z.string().uuid('Invalid account ID'),
  bankName: z.string().min(2).optional(),
  accountNumber: z.string().min(5).optional(),
  accountName: z.string().min(2).optional(),
  isPrimary: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export async function GET() {
  try {
    await ensureDiscountColumns();

    const res = await query(`
      SELECT 
        id, 
        bank_name as "bankName", 
        account_number as "accountNumber", 
        account_name as "accountName", 
        is_primary as "isPrimary", 
        is_active as "isActive", 
        display_order as "displayOrder",
        created_at as "createdAt"
      FROM shop_bank_accounts
      ORDER BY is_primary DESC, display_order ASC, created_at ASC
    `);

    return NextResponse.json({ bankAccounts: res.rows });
  } catch (error: any) {
    console.error('Error fetching bank accounts:', error);
    return NextResponse.json({ error: 'Failed to fetch bank accounts' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role === 'STAFF') {
      return NextResponse.json({ error: 'Unauthorized to add bank accounts' }, { status: 403 });
    }

    await ensureDiscountColumns();

    const body = await request.json();
    const parsed = createAccountSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || 'Invalid bank account data' },
        { status: 400 }
      );
    }

    const { bankName, accountNumber, accountName, isPrimary } = parsed.data;

    // Check count of existing accounts
    const countRes = await query('SELECT COUNT(*) FROM shop_bank_accounts');
    const isFirstAccount = parseInt(countRes.rows[0].count) === 0;
    const shouldBePrimary = Boolean(isPrimary || isFirstAccount);

    if (shouldBePrimary) {
      await query('UPDATE shop_bank_accounts SET is_primary = false');
      // Sync to shops table
      await query(
        `UPDATE shops SET "bankName" = $1, "accountNumber" = $2, "accountName" = $3`,
        [bankName.trim(), accountNumber.trim(), accountName.trim()]
      );
    }

    const insertRes = await query(
      `
      INSERT INTO shop_bank_accounts (bank_name, account_number, account_name, is_primary, is_active)
      VALUES ($1, $2, $3, $4, true)
      RETURNING 
        id, 
        bank_name as "bankName", 
        account_number as "accountNumber", 
        account_name as "accountName", 
        is_primary as "isPrimary", 
        is_active as "isActive"
    `,
      [bankName.trim(), accountNumber.trim(), accountName.trim(), shouldBePrimary]
    );

    await logAudit({
      userId: user.id,
      action: 'ADD_BANK_ACCOUNT',
      entity: 'Shop',
      description: `Added bank account: ${bankName} (${accountNumber})`,
    });

    return NextResponse.json({ success: true, account: insertRes.rows[0] }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating bank account:', error);
    return NextResponse.json({ error: error?.message || 'Failed to create bank account' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role === 'STAFF') {
      return NextResponse.json({ error: 'Unauthorized to update bank accounts' }, { status: 403 });
    }

    await ensureDiscountColumns();

    const body = await request.json();
    const parsed = updateAccountSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || 'Invalid update data' },
        { status: 400 }
      );
    }

    const { id, bankName, accountNumber, accountName, isPrimary, isActive } = parsed.data;

    if (isPrimary === true) {
      await query('UPDATE shop_bank_accounts SET is_primary = false WHERE id != $1', [id]);
    }

    const res = await query(
      `
      UPDATE shop_bank_accounts
      SET 
        bank_name = COALESCE($1, bank_name),
        account_number = COALESCE($2, account_number),
        account_name = COALESCE($3, account_name),
        is_primary = COALESCE($4, is_primary),
        is_active = COALESCE($5, is_active),
        updated_at = NOW()
      WHERE id = $6
      RETURNING 
        id, 
        bank_name as "bankName", 
        account_number as "accountNumber", 
        account_name as "accountName", 
        is_primary as "isPrimary", 
        is_active as "isActive"
    `,
      [
        bankName?.trim() || null,
        accountNumber?.trim() || null,
        accountName?.trim() || null,
        isPrimary !== undefined ? isPrimary : null,
        isActive !== undefined ? isActive : null,
        id,
      ]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Bank account not found' }, { status: 404 });
    }

    const updatedAccount = res.rows[0];

    // If updated account is primary, sync to shops table
    if (updatedAccount.isPrimary) {
      await query(
        `UPDATE shops SET "bankName" = $1, "accountNumber" = $2, "accountName" = $3`,
        [updatedAccount.bankName, updatedAccount.accountNumber, updatedAccount.accountName]
      );
    }

    return NextResponse.json({ success: true, account: updatedAccount });
  } catch (error: any) {
    console.error('Error updating bank account:', error);
    return NextResponse.json({ error: 'Failed to update bank account' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'OWNER') {
      return NextResponse.json({ error: 'Only shop owners can delete bank accounts' }, { status: 403 });
    }

    await ensureDiscountColumns();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Account ID is required' }, { status: 400 });
    }

    // Check total count
    const countRes = await query('SELECT COUNT(*) FROM shop_bank_accounts');
    if (parseInt(countRes.rows[0].count) <= 1) {
      return NextResponse.json(
        { error: 'Cannot delete the only bank account. Add another account first.' },
        { status: 400 }
      );
    }

    // Check if target is primary
    const targetRes = await query('SELECT is_primary, bank_name, account_number FROM shop_bank_accounts WHERE id = $1', [id]);
    if (targetRes.rows.length === 0) {
      return NextResponse.json({ error: 'Bank account not found' }, { status: 404 });
    }

    const wasPrimary = targetRes.rows[0].is_primary;

    await query('DELETE FROM shop_bank_accounts WHERE id = $1', [id]);

    // If it was primary, promote another account to primary
    if (wasPrimary) {
      const nextAcc = await query(
        'SELECT id, bank_name, account_number, account_name FROM shop_bank_accounts WHERE is_active = true ORDER BY created_at ASC LIMIT 1'
      );
      if (nextAcc.rows.length > 0) {
        await query('UPDATE shop_bank_accounts SET is_primary = true WHERE id = $1', [nextAcc.rows[0].id]);
        await query(
          `UPDATE shops SET "bankName" = $1, "accountNumber" = $2, "accountName" = $3`,
          [nextAcc.rows[0].bank_name, nextAcc.rows[0].account_number, nextAcc.rows[0].account_name]
        );
      }
    }

    await logAudit({
      userId: user.id,
      action: 'DELETE_BANK_ACCOUNT',
      entity: 'Shop',
      description: `Deleted bank account: ${targetRes.rows[0].bank_name} (${targetRes.rows[0].account_number})`,
    });

    return NextResponse.json({ success: true, message: 'Bank account deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting bank account:', error);
    return NextResponse.json({ error: 'Failed to delete bank account' }, { status: 500 });
  }
}
