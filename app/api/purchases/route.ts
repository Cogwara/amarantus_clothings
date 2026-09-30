import { NextResponse } from 'next/server';
import { query, withTransaction } from '@/lib/db';
import { getCurrentUser, logAudit } from '@/lib/auth';
import { z } from 'zod';

const createPurchaseItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  unitCost: z.number().min(0, 'Unit cost must be positive'),
  sellingPrice: z.number().min(0).optional(), // option to update selling price
});

const createPurchaseBatchSchema = z.object({
  supplierId: z.string().optional().nullable(),
  purchaseDate: z.string().optional(),
  purchaseAmount: z.number().min(0).default(0),
  transportCost: z.number().min(0).default(0),
  otherCosts: z.number().min(0).default(0),
  notes: z.string().optional().nullable(),
  items: z.array(createPurchaseItemSchema).min(1, 'At least one item must be in the purchase batch'),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    let sql = `
      SELECT 
        b.id,
        b."batchNumber",
        b."supplierId",
        sup.name as "supplierName",
        sup.market,
        b."purchaseDate",
        b."purchaseAmount",
        b."transportCost",
        b."otherCosts",
        b."totalCost",
        b.notes,
        b."createdById",
        u.name as "createdByName",
        b."createdAt",
        (SELECT COUNT(*) FROM purchase_items WHERE "purchaseBatchId" = b.id)::int as "itemCount",
        (SELECT COALESCE(SUM(quantity), 0) FROM purchase_items WHERE "purchaseBatchId" = b.id)::int as "totalPieces"
      FROM purchase_batches b
      LEFT JOIN suppliers sup ON b."supplierId" = sup.id
      JOIN users u ON b."createdById" = u.id
      WHERE 1=1
    `;

    const params: any[] = [];
    if (search.trim()) {
      sql += ` AND (b."batchNumber" ILIKE $1 OR sup.name ILIKE $1 OR sup.market ILIKE $1 OR b.notes ILIKE $1)`;
      params.push(`%${search.trim()}%`);
    }

    sql += ` ORDER BY b."purchaseDate" DESC LIMIT 100`;

    const res = await query(sql, params);
    return NextResponse.json({ batches: res.rows });
  } catch (error: any) {
    console.error('Error fetching purchases:', error);
    return NextResponse.json({ error: 'Failed to fetch purchases' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role === 'STAFF') {
      return NextResponse.json(
        { error: 'Staff members are not authorized to record purchasing batches' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = createPurchaseBatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || 'Invalid purchase batch data' },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Generate batch number: BATCH-YYYYMMDD-XX
    const dateObj = data.purchaseDate ? new Date(data.purchaseDate) : new Date();
    const dateStr = dateObj.toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(10 + Math.random() * 90);
    const batchNumber = `BATCH-${dateStr}-${randomSuffix}`;
    const batchId = 'batch_' + Math.random().toString(36).substring(2, 9);

    // Calculate item costs sum
    let calculatedItemsCost = 0;
    for (const item of data.items) {
      calculatedItemsCost += item.unitCost * item.quantity;
    }

    const purchaseAmount = data.purchaseAmount > 0 ? data.purchaseAmount : calculatedItemsCost;
    const totalCost = purchaseAmount + data.transportCost + data.otherCosts;

    // Transaction for creating batch, items, updating stock and recording movements
    const result = await withTransaction(async (client) => {
      // 1. Create PurchaseBatch
      await client.query(
        `
        INSERT INTO purchase_batches (
          id, "batchNumber", "supplierId", "purchaseDate", "purchaseAmount",
          "transportCost", "otherCosts", "totalCost", notes, "createdById",
          "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
      `,
        [
          batchId,
          batchNumber,
          data.supplierId || null,
          dateObj,
          purchaseAmount,
          data.transportCost,
          data.otherCosts,
          totalCost,
          data.notes || null,
          user.id,
        ]
      );

      // 2. Insert items and update products
      for (const item of data.items) {
        const itemTotal = item.unitCost * item.quantity;
        const purchaseItemId = 'pi_' + Math.random().toString(36).substring(2, 9);

        await client.query(
          `
          INSERT INTO purchase_items (
            id, "purchaseBatchId", "productId", quantity, "unitCost", "totalCost"
          ) VALUES ($1, $2, $3, $4, $5, $6)
        `,
          [purchaseItemId, batchId, item.productId, item.quantity, item.unitCost, itemTotal]
        );

        // Lock & update product: increase quantity, update costPrice, and status
        const prodRes = await client.query(
          `SELECT id, name, quantity, "costPrice" FROM products WHERE id = $1 FOR UPDATE`,
          [item.productId]
        );

        if (prodRes.rows.length > 0) {
          const prod = prodRes.rows[0];
          const newQty = prod.quantity + item.quantity;

          let updateSql = `
            UPDATE products 
            SET quantity = $1, "costPrice" = $2, status = 'AVAILABLE', "updatedAt" = NOW()
          `;
          const updateParams: any[] = [newQty, item.unitCost];

          if (item.sellingPrice && item.sellingPrice > 0) {
            updateSql += `, "sellingPrice" = $3 WHERE id = $4`;
            updateParams.push(item.sellingPrice, item.productId);
          } else {
            updateSql += ` WHERE id = $3`;
            updateParams.push(item.productId);
          }

          await client.query(updateSql, updateParams);

          // Record PURCHASE stock movement
          await client.query(
            `
            INSERT INTO stock_movements (
              id, "productId", type, quantity, "referenceId", notes, "createdById", "createdAt"
            ) VALUES ($1, $2, 'PURCHASE', $3, $4, $5, $6, NOW())
          `,
            [
              'mov_' + Math.random().toString(36).substring(2, 9),
              item.productId,
              item.quantity,
              batchId,
              `Received from batch ${batchNumber}`,
              user.id,
            ]
          );
        }
      }

      return {
        batchId,
        batchNumber,
        totalCost,
        itemCount: data.items.length,
      };
    });

    await logAudit({
      userId: user.id,
      action: 'CREATE_PURCHASE_BATCH',
      entity: 'PurchaseBatch',
      entityId: batchId,
      description: `Created purchase batch ${batchNumber} for total ₦${totalCost.toLocaleString()}`,
    });

    return NextResponse.json({
      success: true,
      batch: result,
    });
  } catch (error: any) {
    console.error('Purchase batch creation error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to create purchase batch' },
      { status: 500 }
    );
  }
}
