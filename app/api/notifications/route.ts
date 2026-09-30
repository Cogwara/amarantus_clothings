import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    // 1. Low stock count: quantity <= minimumStock AND quantity > 0
    const lowStockRes = await query(`
      SELECT COUNT(*)::int as count FROM products 
      WHERE quantity <= "minimumStock" AND quantity > 0 AND status != 'INACTIVE'
    `);

    // 2. Clearance candidates: dateAdded > 45 days ago AND quantity > 0
    const clearanceRes = await query(`
      SELECT COUNT(*)::int as count FROM products 
      WHERE "dateAdded" < NOW() - INTERVAL '45 days' AND quantity > 0 AND status != 'INACTIVE'
    `);

    // 3. Has active Thursday plan
    const planRes = await query(`
      SELECT COUNT(*)::int as count FROM purchasing_plans 
      WHERE status IN ('DRAFT', 'READY')
    `);

    // 4. Today sales count
    const todaySalesRes = await query(`
      SELECT COUNT(*)::int as count FROM sales 
      WHERE DATE("saleDate") = CURRENT_DATE
    `);

    return NextResponse.json({
      lowStockCount: lowStockRes.rows[0]?.count || 0,
      clearanceCount: clearanceRes.rows[0]?.count || 0,
      hasThursdayPlan: (planRes.rows[0]?.count || 0) > 0,
      todaySalesCount: todaySalesRes.rows[0]?.count || 0,
    });
  } catch (error) {
    console.error('Notifications error:', error);
    return NextResponse.json(
      { lowStockCount: 0, clearanceCount: 0, hasThursdayPlan: false, todaySalesCount: 0 },
      { status: 500 }
    );
  }
}
