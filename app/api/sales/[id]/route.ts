import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Fetch sale header
    const saleRes = await query(
      `
      SELECT 
        s.*,
        c.name as "customerName",
        c.phone as "customerPhone",
        c.address as "customerAddress",
        u.name as "soldByName",
        u.email as "soldByEmail"
      FROM sales s
      LEFT JOIN customers c ON s."customerId" = c.id
      JOIN users u ON s."soldById" = u.id
      WHERE s.id = $1 OR s."saleNumber" = $1
    `,
      [id]
    );

    if (saleRes.rows.length === 0) {
      return NextResponse.json({ error: 'Sale record not found' }, { status: 404 });
    }

    const sale = saleRes.rows[0];

    // Fetch items
    const itemsRes = await query(
      `
      SELECT 
        si.*,
        p.name as "productName",
        p.sku as "productSku",
        p.size,
        p.condition
      FROM sale_items si
      JOIN products p ON si."productId" = p.id
      WHERE si."saleId" = $1
    `,
      [sale.id]
    );

    // Fetch shop settings
    const shopRes = await query(`SELECT * FROM shops LIMIT 1`);
    const shop = shopRes.rows[0] || {
      name: 'Amarantus Clothings',
      phone: '+234 9065043549',
      address: 'Plot 78 Gbazango Kubwa FCT',
      currency: 'NGN',
    };

    return NextResponse.json({
      sale,
      items: itemsRes.rows,
      shop,
    });
  } catch (error: any) {
    console.error('Error fetching sale details:', error);
    return NextResponse.json({ error: 'Failed to fetch sale details' }, { status: 500 });
  }
}
