import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getCurrentUser, logAudit } from '@/lib/auth';
import { z } from 'zod';

const updateShopSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(5),
  address: z.string().min(5),
  currency: z.string().default('NGN'),
});

export async function GET() {
  try {
    const shopRes = await query(`SELECT * FROM shops LIMIT 1`);
    const shop = shopRes.rows[0] || {
      name: 'Amarantus Clothings',
      phone: '+234 9065043549',
      address: 'Plot 78 Gbazango Kubwa FCT',
      currency: 'NGN',
    };

    // System stats
    const statsRes = await query(`
      SELECT 
        (SELECT COUNT(*) FROM products)::int as "totalProducts",
        (SELECT COUNT(*) FROM sales)::int as "totalSales",
        (SELECT COUNT(*) FROM customers)::int as "totalCustomers",
        (SELECT COUNT(*) FROM purchase_batches)::int as "totalBatches",
        (SELECT COUNT(*) FROM expenses)::int as "totalExpenses",
        (SELECT COUNT(*) FROM users)::int as "totalUsers"
    `);

    return NextResponse.json({
      shop,
      stats: statsRes.rows[0],
    });
  } catch (error: any) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'OWNER') {
      return NextResponse.json({ error: 'Only owners can update shop profile' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = updateShopSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid profile data' }, { status: 400 });
    }

    const data = parsed.data;

    const res = await query(
      `
      UPDATE shops
      SET name = $1, phone = $2, address = $3, currency = $4, "updatedAt" = NOW()
      WHERE id = (SELECT id FROM shops LIMIT 1)
      RETURNING *
    `,
      [data.name, data.phone, data.address, data.currency]
    );

    await logAudit({
      userId: user.id,
      action: 'UPDATE_SHOP_PROFILE',
      entity: 'Shop',
      description: `Updated business information: ${data.name}`,
    });

    return NextResponse.json({ success: true, shop: res.rows[0] });
  } catch (error: any) {
    console.error('Error updating shop settings:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'OWNER') {
      return NextResponse.json({ error: 'Only owners can reset demo data' }, { status: 403 });
    }

    const body = await request.json();
    if (body.action === 'reset_demo') {
      // Re-run seed script dynamically
      const { exec } = await import('child_process');
      const util = await import('util');
      const execPromise = util.promisify(exec);

      await execPromise('npx tsx prisma/seed.ts', {
        cwd: process.cwd(),
      });

      await logAudit({
        userId: user.id,
        action: 'RESET_DEMO_DATA',
        entity: 'System',
        description: 'Re-seeded demo data from settings panel',
      });

      return NextResponse.json({
        success: true,
        message: 'Demo inventory and transactions re-seeded successfully.',
      });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    console.error('Reset demo data error:', error);
    return NextResponse.json({ error: 'Failed to reset demo data' }, { status: 500 });
  }
}
