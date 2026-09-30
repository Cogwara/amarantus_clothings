import { NextResponse } from 'next/server';
import { query, withTransaction } from '@/lib/db';
import { getCurrentUser, logAudit } from '@/lib/auth';
import { z } from 'zod';

const createSaleItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  unitSellingPrice: z.number().min(0),
  discount: z.number().min(0).default(0),
  totalAmount: z.number().min(0),
});

const createSaleSchema = z.object({
  customerId: z.string().optional().nullable(),
  items: z.array(createSaleItemSchema).min(1, 'At least one product is required in the cart'),
  discount: z.number().min(0).default(0),
  paymentMethod: z.enum(['CASH', 'TRANSFER', 'POS', 'OTHER']).default('CASH'),
  notes: z.string().optional().nullable(),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const paymentMethod = searchParams.get('paymentMethod') || '';
    const dateRange = searchParams.get('dateRange') || ''; // 'today', 'week', 'month', or all

    let sql = `
      SELECT 
        s.id,
        s."saleNumber",
        s."customerId",
        c.name as "customerName",
        c.phone as "customerPhone",
        s.subtotal,
        s.discount,
        s."totalAmount",
        s."paymentMethod",
        s."saleDate",
        s."soldById",
        u.name as "soldByName",
        s.notes,
        (SELECT COUNT(*) FROM sale_items WHERE "saleId" = s.id)::int as "itemCount",
        COALESCE((SELECT SUM(profit) FROM sale_items WHERE "saleId" = s.id), 0)::float as "totalProfit"
      FROM sales s
      LEFT JOIN customers c ON s."customerId" = c.id
      JOIN users u ON s."soldById" = u.id
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramIndex = 1;

    if (search.trim()) {
      sql += ` AND (s."saleNumber" ILIKE $${paramIndex} OR c.name ILIKE $${paramIndex} OR c.phone ILIKE $${paramIndex})`;
      params.push(`%${search.trim()}%`);
      paramIndex++;
    }

    if (paymentMethod) {
      sql += ` AND s."paymentMethod" = $${paramIndex}`;
      params.push(paymentMethod);
      paramIndex++;
    }

    if (dateRange === 'today') {
      sql += ` AND DATE(s."saleDate") = CURRENT_DATE`;
    } else if (dateRange === 'week') {
      sql += ` AND s."saleDate" >= NOW() - INTERVAL '7 days'`;
    } else if (dateRange === 'month') {
      sql += ` AND s."saleDate" >= NOW() - INTERVAL '30 days'`;
    }

    sql += ` ORDER BY s."saleDate" DESC LIMIT 100`;

    const res = await query(sql, params);
    return NextResponse.json({ sales: res.rows });
  } catch (error: any) {
    console.error('Error fetching sales:', error);
    return NextResponse.json({ error: 'Failed to fetch sales' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createSaleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || 'Invalid sale data' },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Generate readable sale number: SALE-YYYYMMDD-XXXX
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const saleNumber = `SALE-${dateStr}-${randomSuffix}`;
    const saleId = 'sale_' + Math.random().toString(36).substring(2, 9);

    // Atomic transaction for inventory deduction & sale creation
    const saleResult = await withTransaction(async (client) => {
      let subtotal = 0;
      const verifiedItems: any[] = [];

      // 1. Lock and verify stock for all items
      for (const item of data.items) {
        const prodRes = await client.query(
          `SELECT id, name, sku, quantity, "minimumStock", "costPrice", "sellingPrice" 
           FROM products WHERE id = $1 FOR UPDATE`,
          [item.productId]
        );

        if (prodRes.rows.length === 0) {
          throw new Error(`Product with ID ${item.productId} was not found.`);
        }

        const product = prodRes.rows[0];

        // Stock check: Never allow negative inventory
        if (product.quantity < item.quantity) {
          throw new Error(
            `Insufficient stock for "${product.name}". Requested ${item.quantity}, but only ${product.quantity} in stock.`
          );
        }

        const itemTotal = item.totalAmount;
        subtotal += itemTotal;

        // Gross profit = itemTotal - (actual costPrice * quantity)
        const unitCost = product.costPrice;
        const profit = itemTotal - unitCost * item.quantity;

        const newQuantity = product.quantity - item.quantity;
        let newStatus = 'AVAILABLE';
        if (newQuantity === 0) {
          newStatus = 'OUT_OF_STOCK';
        } else if (newQuantity <= product.minimumStock) {
          newStatus = 'LOW_STOCK';
        }

        verifiedItems.push({
          product,
          quantity: item.quantity,
          unitSellingPrice: item.unitSellingPrice,
          unitCostPrice: unitCost,
          discount: item.discount,
          totalAmount: itemTotal,
          profit,
          newQuantity,
          newStatus,
        });
      }

      const totalAmount = Math.max(0, subtotal - data.discount);

      // 2. Insert Sale header
      await client.query(
        `
        INSERT INTO sales (
          id, "saleNumber", "customerId", subtotal, discount, "totalAmount",
          "paymentMethod", "saleDate", "soldById", notes, "createdAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), $8, $9, NOW())
      `,
        [
          saleId,
          saleNumber,
          data.customerId || null,
          subtotal,
          data.discount,
          totalAmount,
          data.paymentMethod,
          user.id,
          data.notes || null,
        ]
      );

      // 3. Insert SaleItems and update Product quantities & record Stock Movements
      for (const vi of verifiedItems) {
        const saleItemId = 'si_' + Math.random().toString(36).substring(2, 9);
        await client.query(
          `
          INSERT INTO sale_items (
            id, "saleId", "productId", quantity, "unitSellingPrice", "unitCostPrice",
            discount, "totalAmount", profit
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `,
          [
            saleItemId,
            saleId,
            vi.product.id,
            vi.quantity,
            vi.unitSellingPrice,
            vi.unitCostPrice,
            vi.discount,
            vi.totalAmount,
            vi.profit,
          ]
        );

        // Deduct inventory
        await client.query(
          `
          UPDATE products
          SET quantity = $1, status = $2, "updatedAt" = NOW()
          WHERE id = $3
        `,
          [vi.newQuantity, vi.newStatus, vi.product.id]
        );

        // Record SALE stock movement
        await client.query(
          `
          INSERT INTO stock_movements (
            id, "productId", type, quantity, "referenceId", notes, "createdById", "createdAt"
          ) VALUES ($1, $2, 'SALE', $3, $4, $5, $6, NOW())
        `,
          [
            'mov_' + Math.random().toString(36).substring(2, 9),
            vi.product.id,
            -vi.quantity,
            saleId,
            `Sale ${saleNumber}`,
            user.id,
          ]
        );
      }

      return {
        saleId,
        saleNumber,
        totalAmount,
        subtotal,
        discount: data.discount,
        paymentMethod: data.paymentMethod,
        itemCount: verifiedItems.length,
      };
    });

    await logAudit({
      userId: user.id,
      action: 'CREATE_SALE',
      entity: 'Sale',
      entityId: saleId,
      description: `Completed sale ${saleNumber} for ₦${saleResult.totalAmount.toLocaleString()} via ${saleResult.paymentMethod}`,
    });

    return NextResponse.json({
      success: true,
      sale: saleResult,
    });
  } catch (error: any) {
    console.error('Sale transaction error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to complete sale transaction' },
      { status: 400 }
    );
  }
}
