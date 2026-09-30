import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role === 'STAFF') {
      return NextResponse.json(
        { error: 'Staff members are not authorized to view financial reports' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30days'; // 'today', 'yesterday', '7days', '30days', 'this_month', 'last_month', 'custom'
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    let dateConditionSales = `s."saleDate" >= NOW() - INTERVAL '30 days'`;
    let dateConditionExpenses = `e."expenseDate" >= NOW() - INTERVAL '30 days'`;

    if (period === 'today') {
      dateConditionSales = `DATE(s."saleDate") = CURRENT_DATE`;
      dateConditionExpenses = `DATE(e."expenseDate") = CURRENT_DATE`;
    } else if (period === 'yesterday') {
      dateConditionSales = `DATE(s."saleDate") = CURRENT_DATE - INTERVAL '1 day'`;
      dateConditionExpenses = `DATE(e."expenseDate") = CURRENT_DATE - INTERVAL '1 day'`;
    } else if (period === '7days') {
      dateConditionSales = `s."saleDate" >= NOW() - INTERVAL '7 days'`;
      dateConditionExpenses = `e."expenseDate" >= NOW() - INTERVAL '7 days'`;
    } else if (period === 'this_month') {
      dateConditionSales = `DATE_TRUNC('month', s."saleDate") = DATE_TRUNC('month', CURRENT_DATE)`;
      dateConditionExpenses = `DATE_TRUNC('month', e."expenseDate") = DATE_TRUNC('month', CURRENT_DATE)`;
    } else if (period === 'last_month') {
      dateConditionSales = `DATE_TRUNC('month', s."saleDate") = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')`;
      dateConditionExpenses = `DATE_TRUNC('month', e."expenseDate") = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')`;
    } else if (period === 'custom' && startDateParam && endDateParam) {
      dateConditionSales = `s."saleDate" >= '${startDateParam}'::date AND s."saleDate" <= ('${endDateParam}'::date + INTERVAL '1 day')`;
      dateConditionExpenses = `e."expenseDate" >= '${startDateParam}'::date AND e."expenseDate" <= ('${endDateParam}'::date + INTERVAL '1 day')`;
    }

    // 1. Total Sales, COGS & Gross Profit
    const salesMetricsRes = await query(`
      SELECT 
        COALESCE(SUM(s."totalAmount"), 0)::float as "totalSales",
        COALESCE(COUNT(s.id), 0)::int as "totalSalesCount",
        COALESCE(SUM(si.quantity), 0)::int as "totalUnitsSold",
        COALESCE(SUM(si."unitCostPrice" * si.quantity), 0)::float as "costOfGoodsSold",
        COALESCE(SUM(si.profit), 0)::float as "grossProfit"
      FROM sales s
      JOIN sale_items si ON si."saleId" = s.id
      WHERE ${dateConditionSales}
    `);

    // 2. Total Expenses
    const expensesRes = await query(`
      SELECT 
        COALESCE(SUM(e.amount), 0)::float as "totalExpenses",
        COALESCE(COUNT(e.id), 0)::int as "expenseCount"
      FROM expenses e
      WHERE ${dateConditionExpenses}
    `);

    const metrics = salesMetricsRes.rows[0];
    const totalSales = metrics.totalSales || 0;
    const cogs = metrics.costOfGoodsSold || 0;
    const grossProfit = metrics.grossProfit || 0;
    const totalExpenses = expensesRes.rows[0]?.totalExpenses || 0;
    const netProfit = grossProfit - totalExpenses;
    const grossMarginPercent = totalSales > 0 ? (grossProfit / totalSales) * 100 : 0;
    const netMarginPercent = totalSales > 0 ? (netProfit / totalSales) * 100 : 0;

    // 3. Sales & Profit Breakdown over time
    const timelineRes = await query(`
      SELECT 
        TO_CHAR(DATE(s."saleDate"), 'YYYY-MM-DD') as date,
        TO_CHAR(DATE(s."saleDate"), 'Mon DD') as formattedDate,
        COALESCE(SUM(s."totalAmount"), 0)::float as sales,
        COALESCE(SUM(si."unitCostPrice" * si.quantity), 0)::float as cogs,
        COALESCE(SUM(si.profit), 0)::float as profit
      FROM sales s
      JOIN sale_items si ON si."saleId" = s.id
      WHERE ${dateConditionSales}
      GROUP BY DATE(s."saleDate")
      ORDER BY DATE(s."saleDate") ASC
    `);

    // 4. Sales by Category
    const categorySalesRes = await query(`
      SELECT 
        c.name as category,
        COALESCE(SUM(si."totalAmount"), 0)::float as revenue,
        COALESCE(SUM(si.quantity), 0)::int as "unitsSold",
        COALESCE(SUM(si.profit), 0)::float as profit
      FROM categories c
      JOIN products p ON p."categoryId" = c.id
      JOIN sale_items si ON si."productId" = p.id
      JOIN sales s ON si."saleId" = s.id
      WHERE ${dateConditionSales}
      GROUP BY c.id, c.name
      ORDER BY revenue DESC
    `);

    // 5. Expenses by Category
    const categoryExpensesRes = await query(`
      SELECT 
        category,
        COALESCE(SUM(amount), 0)::float as amount,
        COUNT(id)::int as count
      FROM expenses e
      WHERE ${dateConditionExpenses}
      GROUP BY category
      ORDER BY amount DESC
    `);

    // 6. Payment Methods Breakdown
    const paymentMethodsRes = await query(`
      SELECT 
        "paymentMethod",
        COALESCE(SUM("totalAmount"), 0)::float as total,
        COUNT(id)::int as count
      FROM sales s
      WHERE ${dateConditionSales}
      GROUP BY "paymentMethod"
      ORDER BY total DESC
    `);

    // 7. Top 5 Best Selling Products
    const topProductsRes = await query(`
      SELECT 
        p.id,
        p.name,
        p.sku,
        p.size,
        c.name as "categoryName",
        COALESCE(SUM(si.quantity), 0)::int as "unitsSold",
        COALESCE(SUM(si."totalAmount"), 0)::float as revenue,
        COALESCE(SUM(si.profit), 0)::float as profit
      FROM products p
      JOIN categories c ON p."categoryId" = c.id
      JOIN sale_items si ON si."productId" = p.id
      JOIN sales s ON si."saleId" = s.id
      WHERE ${dateConditionSales}
      GROUP BY p.id, c.name
      ORDER BY revenue DESC
      LIMIT 8
    `);

    return NextResponse.json({
      summary: {
        totalSales,
        costOfGoodsSold: cogs,
        grossProfit,
        totalExpenses,
        netProfit,
        grossMarginPercent: Math.round(grossMarginPercent * 10) / 10,
        netMarginPercent: Math.round(netMarginPercent * 10) / 10,
        totalSalesCount: metrics.totalSalesCount || 0,
        totalUnitsSold: metrics.totalUnitsSold || 0,
        expenseCount: expensesRes.rows[0]?.expenseCount || 0,
      },
      timeline: timelineRes.rows,
      categorySales: categorySalesRes.rows,
      categoryExpenses: categoryExpensesRes.rows,
      paymentMethods: paymentMethodsRes.rows,
      topProducts: topProductsRes.rows,
    });
  } catch (error: any) {
    console.error('Reports calculation error:', error);
    return NextResponse.json({ error: 'Failed to calculate reports' }, { status: 500 });
  }
}
