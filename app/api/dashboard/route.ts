import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    // Allow OWNER, MANAGER, and STAFF to view dashboard
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Today's Sales & Profit
    const todayStatsRes = await query(`
      SELECT 
        COALESCE(SUM(s."totalAmount"), 0)::float as "todaySales",
        COALESCE(COUNT(s.id), 0)::int as "todaySalesCount"
      FROM sales s
      WHERE DATE(s."saleDate") = CURRENT_DATE
    `);

    const todayProfitRes = await query(`
      SELECT 
        COALESCE(SUM(si.profit), 0)::float as "todayProfit"
      FROM sale_items si
      JOIN sales s ON si."saleId" = s.id
      WHERE DATE(s."saleDate") = CURRENT_DATE
    `);

    // 2. Stock Value (Cost value & Retail value)
    const stockValueRes = await query(`
      SELECT 
        COALESCE(SUM(p.quantity * p."costPrice"), 0)::float as "totalStockCostValue",
        COALESCE(SUM(p.quantity * p."sellingPrice"), 0)::float as "totalStockRetailValue",
        COALESCE(SUM(p.quantity), 0)::int as "totalItemsInStock",
        COALESCE(COUNT(p.id), 0)::int as "totalProductCount"
      FROM products p
      WHERE p.status != 'INACTIVE'
    `);

    // 3. Monthly Expenses
    const monthlyExpensesRes = await query(`
      SELECT 
        COALESCE(SUM(amount), 0)::float as "monthlyExpenses",
        COALESCE(COUNT(id), 0)::int as "expenseCount"
      FROM expenses
      WHERE DATE_TRUNC('month', "expenseDate") = DATE_TRUNC('month', CURRENT_DATE)
    `);

    // 4. Sales Trend (Last 7 Days)
    const trendRes = await query(`
      SELECT 
        TO_CHAR(d.date, 'Mon DD') as date,
        TO_CHAR(d.date, 'Dy') as day,
        COALESCE(SUM(s."totalAmount"), 0)::float as sales,
        COALESCE(SUM(si.profit), 0)::float as profit
      FROM (
        SELECT (CURRENT_DATE - INTERVAL '6 days' + (n || ' days')::interval)::date as date
        FROM generate_series(0, 6) n
      ) d
      LEFT JOIN sales s ON DATE(s."saleDate") = d.date
      LEFT JOIN sale_items si ON si."saleId" = s.id
      GROUP BY d.date
      ORDER BY d.date ASC
    `);

    // 5. Top Selling Categories (Last 30 Days)
    const topCategoriesRes = await query(`
      SELECT 
        c.name as category,
        COALESCE(SUM(si.quantity), 0)::int as "unitsSold",
        COALESCE(SUM(si."totalAmount"), 0)::float as revenue
      FROM categories c
      JOIN products p ON p."categoryId" = c.id
      JOIN sale_items si ON si."productId" = p.id
      JOIN sales s ON si."saleId" = s.id
      WHERE s."saleDate" >= NOW() - INTERVAL '30 days'
      GROUP BY c.id, c.name
      ORDER BY "unitsSold" DESC
      LIMIT 5
    `);

    // 6. Fast Moving Products (Last 30 Days)
    const fastMovingRes = await query(`
      SELECT 
        p.id,
        p.name,
        p.sku,
        p.size,
        p.condition,
        p."sellingPrice",
        p.quantity as "currentStock",
        c.name as "categoryName",
        pi.url as "imageUrl",
        COALESCE(SUM(si.quantity), 0)::int as "unitsSold",
        COALESCE(SUM(si."totalAmount"), 0)::float as revenue
      FROM products p
      JOIN categories c ON p."categoryId" = c.id
      LEFT JOIN product_images pi ON pi."productId" = p.id AND pi."isPrimary" = true
      JOIN sale_items si ON si."productId" = p.id
      JOIN sales s ON si."saleId" = s.id
      WHERE s."saleDate" >= NOW() - INTERVAL '30 days'
      GROUP BY p.id, c.name, pi.url
      ORDER BY "unitsSold" DESC
      LIMIT 5
    `);

    // 7. Slow Moving Products / Clearance (Days in stock > 45, low sales)
    const slowMovingRes = await query(`
      SELECT 
        p.id,
        p.name,
        p.sku,
        p.size,
        p.condition,
        p."costPrice",
        p."sellingPrice",
        p.quantity,
        c.name as "categoryName",
        pi.url as "imageUrl",
        EXTRACT(DAY FROM NOW() - p."dateAdded")::int as "daysInStock",
        COALESCE((
          SELECT SUM(si.quantity) 
          FROM sale_items si 
          JOIN sales s ON si."saleId" = s.id 
          WHERE si."productId" = p.id
        ), 0)::int as "totalSold"
      FROM products p
      JOIN categories c ON p."categoryId" = c.id
      LEFT JOIN product_images pi ON pi."productId" = p.id AND pi."isPrimary" = true
      WHERE p.quantity > 0 
        AND p.status != 'INACTIVE'
        AND p."dateAdded" < NOW() - INTERVAL '45 days'
      ORDER BY "daysInStock" DESC
      LIMIT 5
    `);

    // 8. Low Stock Alerts (quantity <= minimumStock)
    const lowStockRes = await query(`
      SELECT 
        p.id,
        p.name,
        p.sku,
        p.size,
        p.quantity,
        p."minimumStock",
        p."sellingPrice",
        c.name as "categoryName",
        pi.url as "imageUrl"
      FROM products p
      JOIN categories c ON p."categoryId" = c.id
      LEFT JOIN product_images pi ON pi."productId" = p.id AND pi."isPrimary" = true
      WHERE p.quantity <= p."minimumStock"
        AND p.status != 'INACTIVE'
      ORDER BY p.quantity ASC
      LIMIT 6
    `);

    // 9. Recent Sales
    const recentSalesRes = await query(`
      SELECT 
        s.id,
        s."saleNumber",
        s."totalAmount",
        s."paymentMethod",
        s."saleDate",
        COALESCE(c.name, 'Walk-in Customer') as "customerName",
        u.name as "soldByName",
        (SELECT COUNT(*) FROM sale_items WHERE "saleId" = s.id)::int as "itemCount"
      FROM sales s
      LEFT JOIN customers c ON s."customerId" = c.id
      JOIN users u ON s."soldById" = u.id
      ORDER BY s."saleDate" DESC
      LIMIT 5
    `);

    // 10. Recent Purchases
    const recentPurchasesRes = await query(`
      SELECT 
        b.id,
        b."batchNumber",
        b."purchaseDate",
        b."totalCost",
        b.notes,
        COALESCE(sup.name, 'Independent Market Seller') as "supplierName",
        COALESCE(sup.market, 'Katangua Market') as market,
        u.name as "createdByName",
        (SELECT COUNT(*) FROM purchase_items WHERE "purchaseBatchId" = b.id)::int as "itemCount"
      FROM purchase_batches b
      LEFT JOIN suppliers sup ON b."supplierId" = sup.id
      JOIN users u ON b."createdById" = u.id
      ORDER BY b."purchaseDate" DESC
      LIMIT 4
    `);

    // 11. Thursday Purchasing Plan Status
    const thursdayPlanRes = await query(`
      SELECT 
        p.id,
        p."planDate",
        p.status,
        (SELECT COUNT(*) FROM purchasing_plan_items WHERE "planId" = p.id)::int as "categoryCount",
        COALESCE((SELECT SUM("recommendedQuantity") FROM purchasing_plan_items WHERE "planId" = p.id), 0)::int as "totalRecommendedPieces"
      FROM purchasing_plans p
      ORDER BY p."planDate" DESC
      LIMIT 1
    `);

    return NextResponse.json({
      metrics: {
        todaySales: todayStatsRes.rows[0]?.todaySales || 0,
        todaySalesCount: todayStatsRes.rows[0]?.todaySalesCount || 0,
        todayProfit: todayProfitRes.rows[0]?.todayProfit || 0,
        stockCostValue: stockValueRes.rows[0]?.totalStockCostValue || 0,
        stockRetailValue: stockValueRes.rows[0]?.totalStockRetailValue || 0,
        totalItemsInStock: stockValueRes.rows[0]?.totalItemsInStock || 0,
        totalProductCount: stockValueRes.rows[0]?.totalProductCount || 0,
        monthlyExpenses: monthlyExpensesRes.rows[0]?.monthlyExpenses || 0,
      },
      salesTrend: trendRes.rows,
      topCategories: topCategoriesRes.rows,
      fastMoving: fastMovingRes.rows,
      slowMoving: slowMovingRes.rows,
      lowStock: lowStockRes.rows,
      recentSales: recentSalesRes.rows,
      recentPurchases: recentPurchasesRes.rows,
      thursdayPlan: thursdayPlanRes.rows[0] || null,
    });
  } catch (error: any) {
    console.error('Dashboard data error:', error);
    return NextResponse.json(
      { error: 'Failed to load dashboard data' },
      { status: 500 }
    );
  }
}
