import { NextResponse } from 'next/server';
import { query, withTransaction } from '@/lib/db';
import { getCurrentUser, logAudit } from '@/lib/auth';
import { z } from 'zod';
import { calculateThursdayPurchaseRecommendation } from '@/lib/calculations';

const updatePlanItemSchema = z.object({
  categoryId: z.string(),
  recommendedQuantity: z.number().int().min(0),
  actualQuantityPurchased: z.number().int().min(0).optional(),
  notes: z.string().optional().nullable(),
});

const savePlanSchema = z.object({
  status: z.enum(['DRAFT', 'READY', 'COMPLETED']).default('READY'),
  items: z.array(updatePlanItemSchema),
});

export async function GET() {
  try {
    // 1. Fetch current active or latest plan
    const planRes = await query(`
      SELECT * FROM purchasing_plans 
      ORDER BY "planDate" DESC 
      LIMIT 1
    `);

    let plan = planRes.rows[0];

    // If no plan exists, auto-generate one for next Thursday
    if (!plan) {
      const now = new Date();
      // Find next Thursday (day 4)
      const day = now.getDay();
      const diff = (4 - day + 7) % 7 || 7;
      const nextThursday = new Date(now.getTime() + diff * 24 * 60 * 60 * 1000);
      const planId = 'plan_' + Math.random().toString(36).substring(2, 9);

      const newPlanRes = await query(
        `
        INSERT INTO purchasing_plans (id, "planDate", status, "createdAt", "updatedAt")
        VALUES ($1, $2, 'READY', NOW(), NOW())
        RETURNING *
      `,
        [planId, nextThursday]
      );
      plan = newPlanRes.rows[0];
    }

    // 2. Calculate category metrics using the 30-day sales window formula
    const categoriesCalcRes = await query(`
      SELECT 
        c.id as "categoryId",
        c.name as "categoryName",
        COALESCE(SUM(p.quantity), 0)::int as "currentStock",
        COALESCE((
          SELECT SUM(si.quantity)
          FROM sale_items si
          JOIN products prod ON si."productId" = prod.id
          JOIN sales s ON si."saleId" = s.id
          WHERE prod."categoryId" = c.id
            AND s."saleDate" >= NOW() - INTERVAL '30 days'
        ), 0)::int as "unitsSold30Days"
      FROM categories c
      LEFT JOIN products p ON p."categoryId" = c.id AND p.status != 'INACTIVE'
      WHERE c."isActive" = true
      GROUP BY c.id, c.name
      ORDER BY "unitsSold30Days" DESC, c.name ASC
    `);

    // 3. Fetch existing saved plan items if any
    const savedItemsRes = await query(
      `
      SELECT * FROM purchasing_plan_items WHERE "planId" = $1
    `,
      [plan.id]
    );

    const savedMap = new Map();
    for (const item of savedItemsRes.rows) {
      savedMap.set(item.categoryId, item);
    }

    // Combine calculations with overrides
    const computedItems = categoriesCalcRes.rows.map((cat: any) => {
      const saved = savedMap.get(cat.categoryId);
      const rec = calculateThursdayPurchaseRecommendation(
        cat.currentStock,
        cat.unitsSold30Days,
        2.5 // 2.5 weeks stock coverage
      );

      return {
        id: saved?.id || 'pi_' + cat.categoryId,
        planId: plan.id,
        categoryId: cat.categoryId,
        categoryName: cat.categoryName,
        currentStock: cat.currentStock,
        unitsSold30Days: cat.unitsSold30Days,
        averageWeeklySales: rec.averageWeeklySales,
        recommendedQuantity:
          saved !== undefined && saved.recommendedQuantity !== undefined
            ? saved.recommendedQuantity
            : rec.recommendedQuantity,
        actualQuantityPurchased: saved?.actualQuantityPurchased || 0,
        notes: saved?.notes || null,
      };
    });

    return NextResponse.json({
      plan,
      items: computedItems,
    });
  } catch (error: any) {
    console.error('Error fetching Thursday plan:', error);
    return NextResponse.json({ error: 'Failed to fetch Thursday plan' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role === 'STAFF') {
      return NextResponse.json(
        { error: 'Staff members are not authorized to edit Thursday purchasing plans' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = savePlanSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid plan data' }, { status: 400 });
    }

    const { status, items } = parsed.data;

    await withTransaction(async (client) => {
      // Find latest plan or create one
      let planRes = await client.query(`
        SELECT id FROM purchasing_plans ORDER BY "planDate" DESC LIMIT 1
      `);

      let planId: string;
      if (planRes.rows.length === 0) {
        planId = 'plan_' + Math.random().toString(36).substring(2, 9);
        await client.query(
          `INSERT INTO purchasing_plans (id, "planDate", status, "createdAt", "updatedAt")
           VALUES ($1, NOW() + INTERVAL '1 day', $2, NOW(), NOW())`,
          [planId, status]
        );
      } else {
        planId = planRes.rows[0].id;
        await client.query(
          `UPDATE purchasing_plans SET status = $1, "updatedAt" = NOW() WHERE id = $2`,
          [status, planId]
        );
      }

      // Upsert plan items
      for (const item of items) {
        const id = 'pi_' + item.categoryId;
        await client.query(
          `
          INSERT INTO purchasing_plan_items (
            id, "planId", "categoryId", "recommendedQuantity", "actualQuantityPurchased", notes
          ) VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (id) DO UPDATE SET
            "recommendedQuantity" = EXCLUDED."recommendedQuantity",
            "actualQuantityPurchased" = EXCLUDED."actualQuantityPurchased",
            notes = EXCLUDED.notes
        `,
          [
            id,
            planId,
            item.categoryId,
            item.recommendedQuantity,
            item.actualQuantityPurchased || 0,
            item.notes || null,
          ]
        );
      }
    });

    await logAudit({
      userId: user.id,
      action: 'UPDATE_THURSDAY_PLAN',
      entity: 'PurchasingPlan',
      description: `Saved Thursday purchasing plan with status "${status}"`,
    });

    return NextResponse.json({ success: true, message: 'Thursday plan saved successfully' });
  } catch (error: any) {
    console.error('Error saving Thursday plan:', error);
    return NextResponse.json({ error: 'Failed to save Thursday plan' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Only business owners can reset or clear Thursday purchasing plans' },
        { status: 403 }
      );
    }

    await withTransaction(async (client) => {
      const planRes = await client.query(
        `SELECT id FROM purchasing_plans ORDER BY "planDate" DESC LIMIT 1`
      );
      if (planRes.rows.length > 0) {
        const planId = planRes.rows[0].id;
        await client.query(`DELETE FROM purchasing_plan_items WHERE "planId" = $1`, [planId]);
        await client.query(
          `UPDATE purchasing_plans SET status = 'DRAFT', "updatedAt" = NOW() WHERE id = $1`,
          [planId]
        );
      }
    });

    await logAudit({
      userId: user.id,
      action: 'RESET_THURSDAY_PLAN',
      entity: 'PurchasingPlan',
      description:
        'Owner cleared and reset Thursday purchasing plan overrides back to automatic calculation defaults',
    });

    return NextResponse.json({
      success: true,
      message: 'Thursday plan items reset to fresh automatic calculations.',
    });
  } catch (error: any) {
    console.error('Error resetting Thursday plan:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to reset Thursday plan' },
      { status: 500 }
    );
  }
}

