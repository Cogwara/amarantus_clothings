import { NextResponse } from 'next/server';
import { query, withTransaction, ensureDiscountColumns } from '@/lib/db';
import { logAudit } from '@/lib/auth';
import { z } from 'zod';

const publicOrderSchema = z
  .object({
    customerName: z.string().min(2, 'Name is required'),
    customerPhone: z.string().min(8, 'Valid phone number is required'),
    customerEmail: z.string().email().optional().nullable(),
    deliveryAddress: z.string().optional().nullable(),
    customerAddress: z.string().optional().nullable(),
    deliveryNotes: z.string().optional().nullable(),
    paymentMethod: z.enum(['TRANSFER', 'CASH']).default('TRANSFER'),
    items: z
      .array(
        z.object({
          productId: z.string().min(1),
          quantity: z.number().int().min(1),
        })
      )
      .min(1, 'Cart cannot be empty'),
  })
  .refine((d) => Boolean(d.deliveryAddress?.trim() || d.customerAddress?.trim()), {
    message: 'Delivery address or location is required',
    path: ['deliveryAddress'],
  });

export async function POST(request: Request) {
  try {
    await ensureDiscountColumns();
    const body = await request.json();
    const parsed = publicOrderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || 'Invalid order data' },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const finalAddress = (data.deliveryAddress || data.customerAddress || '').trim();

    // Retrieve default staff / owner user to attribute public sale
    const defaultUserRes = await query(`
      SELECT id FROM users WHERE role = 'OWNER' LIMIT 1
    `);
    const soldById = defaultUserRes.rows[0]?.id || 'usr_owner';

    // Order number generation
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const saleNumber = `WEB-${dateStr}-${randomSuffix}`;
    const saleId = 'sale_' + Math.random().toString(36).substring(2, 9);

    const result = await withTransaction(async (client) => {
      // 1. Find or create Customer record
      let customerId: string;
      const existingCust = await client.query(
        `SELECT id FROM customers WHERE phone = $1 OR (email IS NOT NULL AND email = $2) LIMIT 1`,
        [data.customerPhone.trim(), data.customerEmail?.trim() || '']
      );

      if (existingCust.rows.length > 0) {
        customerId = existingCust.rows[0].id;
        // Update customer address if provided
        await client.query(
          `UPDATE customers SET address = COALESCE($1, address), "updatedAt" = NOW() WHERE id = $2`,
          [finalAddress || null, customerId]
        );
      } else {
        customerId = 'cust_' + Math.random().toString(36).substring(2, 9);
        await client.query(
          `
          INSERT INTO customers (id, name, phone, email, address, notes, "createdAt", "updatedAt")
          VALUES ($1, $2, $3, $4, $5, 'Order placed via Front Shop', NOW(), NOW())
        `,
          [
            customerId,
            data.customerName.trim(),
            data.customerPhone.trim(),
            data.customerEmail?.trim() || null,
            finalAddress,
          ]
        );
      }

      // 2. Lock & verify stock for each item
      let subtotal = 0;
      const verifiedItems: any[] = [];

      for (const item of data.items) {
        const prodRes = await client.query(
          `SELECT id, name, sku, quantity, "minimumStock", "costPrice", "sellingPrice" 
           FROM products WHERE id = $1 FOR UPDATE`,
          [item.productId]
        );

        if (prodRes.rows.length === 0) {
          throw new Error(`Product ID ${item.productId} was not found.`);
        }

        const product = prodRes.rows[0];

        if (product.quantity < item.quantity) {
          throw new Error(
            `"${product.name}" only has ${product.quantity} piece(s) available. Please adjust your order.`
          );
        }

        const itemTotal = product.sellingPrice * item.quantity;
        subtotal += itemTotal;
        const profit = itemTotal - product.costPrice * item.quantity;

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
          unitSellingPrice: product.sellingPrice,
          unitCostPrice: product.costPrice,
          totalAmount: itemTotal,
          profit,
          newQuantity,
          newStatus,
        });
      }

      // 3. Create Sale record
      const fullNotes = `Online Storefront Order. Delivery Address: ${finalAddress}. Notes: ${
        data.deliveryNotes || 'None'
      }`;

      await client.query(
        `
        INSERT INTO sales (
          id, "saleNumber", "customerId", subtotal, discount, "totalAmount",
          "paymentMethod", "saleDate", "soldById", notes, "createdAt"
        ) VALUES ($1, $2, $3, $4, 0, $5, $6, NOW(), $7, $8, NOW())
      `,
        [
          saleId,
          saleNumber,
          customerId,
          subtotal,
          subtotal,
          data.paymentMethod,
          soldById,
          fullNotes,
        ]
      );

      // 4. Insert SaleItems, deduct inventory, and record stock movements
      for (const vi of verifiedItems) {
        const saleItemId = 'si_' + Math.random().toString(36).substring(2, 9);
        await client.query(
          `
          INSERT INTO sale_items (
            id, "saleId", "productId", quantity, "unitSellingPrice", "unitCostPrice",
            discount, "totalAmount", profit
          ) VALUES ($1, $2, $3, $4, $5, $6, 0, $7, $8)
        `,
          [
            saleItemId,
            saleId,
            vi.product.id,
            vi.quantity,
            vi.unitSellingPrice,
            vi.unitCostPrice,
            vi.totalAmount,
            vi.profit,
          ]
        );

        // Deduct inventory
        await client.query(
          `UPDATE products SET quantity = $1, status = $2, "updatedAt" = NOW() WHERE id = $3`,
          [vi.newQuantity, vi.newStatus, vi.product.id]
        );

        // Record stock movement
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
            `Online Store Order ${saleNumber}`,
            soldById,
          ]
        );
      }

      return {
        saleId,
        saleNumber,
        totalAmount: subtotal,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        paymentMethod: data.paymentMethod,
        items: verifiedItems.map((vi) => ({
          name: vi.product.name,
          quantity: vi.quantity,
          unitPrice: vi.unitSellingPrice,
          total: vi.totalAmount,
        })),
      };
    });

    await logAudit({
      userId: soldById,
      action: 'PUBLIC_ORDER_PLACED',
      entity: 'Sale',
      entityId: saleId,
      description: `Front shop order ${saleNumber} placed by ${data.customerName} (₦${result.totalAmount.toLocaleString()})`,
    });

    // Fetch shop details for bank transfer info
    let shop;
    try {
      const shopRes = await query(
        `SELECT name, phone, address, "bankName", "accountNumber", "accountName" FROM shops LIMIT 1`
      );
      shop = shopRes.rows[0];
    } catch {
      const fallbackRes = await query(`SELECT name, phone, address FROM shops LIMIT 1`);
      shop = fallbackRes.rows[0];
    }

    const shopProfile = shop || {
      name: 'Amarantus Clothings',
      phone: '+234 9065043549',
      address: 'Plot 78 Gbazango Kubwa FCT',
    };

    const bankDetails = {
      bankName: shop?.bankName || 'OPAY',
      accountNumber: shop?.accountNumber || '6542969118',
      accountName: shop?.accountName || 'Amarachi Jane Awa',
    };

    return NextResponse.json({
      success: true,
      saleNumber: result.saleNumber,
      totalAmount: result.totalAmount,
      order: result,
      shop: shopProfile,
      bankDetails,
    });
  } catch (error: any) {
    console.error('Front shop order error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to place order. Please try again.' },
      { status: 400 }
    );
  }
}
