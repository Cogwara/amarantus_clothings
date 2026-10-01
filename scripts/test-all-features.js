const http = require('http');

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3001';

async function request(path, options = {}) {
  const url = new URL(path, BASE_URL);
  return new Promise((resolve, reject) => {
    const req = http.request(
      url,
      {
        method: options.method || 'GET',
        headers: options.headers || {},
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          let json = null;
          try {
            json = JSON.parse(body);
          } catch (e) {}
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body,
            json,
          });
        });
      }
    );
    req.on('error', reject);
    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Starting End-to-End Verification for ClothShop Manager...');
  let passed = 0;
  let failed = 0;

  function assert(condition, name) {
    if (condition) {
      console.log(`  ✅ ${name}`);
      passed++;
    } else {
      console.error(`  ❌ ${name}`);
      failed++;
    }
  }

  try {
    // 1. Check Login Page
    console.log('\n--- Test 1: Web Pages Rendering ---');
    const loginPage = await request('/login');
    assert(loginPage.status === 200 && loginPage.body.includes('Amarantus Clothings Manager'), 'Login page renders HTML with brand title');

    const dashPage = await request('/dashboard');
    assert(dashPage.status === 200, 'Dashboard page route responds 200 OK');

    const salesPage = await request('/sales');
    assert(salesPage.status === 200, 'Sales POS page route responds 200 OK');

    const invPage = await request('/inventory');
    assert(invPage.status === 200, 'Inventory page route responds 200 OK');

    const thursdayPage = await request('/thursday-plan');
    assert(thursdayPage.status === 200, 'Thursday Plan page route responds 200 OK');

    const clearancePage = await request('/clearance');
    assert(clearancePage.status === 200, 'Clearance page route responds 200 OK');

    // 2. Authentication
    console.log('\n--- Test 2: Authentication & Sessions ---');
    const loginRes = await request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { email: 'amarantus@gmail.com', password: 'Amarantus@123' },
    });

    assert(loginRes.status === 200 && loginRes.json?.success === true, 'Owner login successful');
    assert(loginRes.json?.user?.role === 'OWNER', 'Owner role returned in login payload');

    const cookieHeader = loginRes.headers['set-cookie'];
    const sessionCookie = cookieHeader ? cookieHeader[0].split(';')[0] : '';
    assert(sessionCookie.includes('clothshop_session='), 'Session JWT cookie issued securely');

    const authMe = await request('/api/auth/me', {
      headers: { Cookie: sessionCookie },
    });
    assert(authMe.status === 200 && authMe.json?.user?.email === 'amarantus@gmail.com', 'Session verified via /api/auth/me');

    // 3. Notifications API
    console.log('\n--- Test 3: Notifications API ---');
    const notifs = await request('/api/notifications', {
      headers: { Cookie: sessionCookie },
    });
    assert(notifs.status === 200 && typeof notifs.json?.lowStockCount === 'number', 'Notifications API returns low stock and alert counts');

    // 4. Dashboard Metrics from Live Database
    console.log('\n--- Test 4: Dashboard Live Database Metrics ---');
    const dash = await request('/api/dashboard', {
      headers: { Cookie: sessionCookie },
    });
    assert(dash.status === 200, 'Dashboard API responds 200');
    assert(dash.json?.metrics?.todaySales !== undefined, 'Live todaySales present in metrics');
    assert(dash.json?.metrics?.todayProfit !== undefined, 'Live todayProfit calculated from actual cost price');
    assert(dash.json?.metrics?.stockCostValue > 0, `Live inventory cost value: ₦${dash.json?.metrics?.stockCostValue}`);
    assert(Array.isArray(dash.json?.salesTrend), '7-day sales trend array returned');
    assert(Array.isArray(dash.json?.topCategories), 'Top categories array returned');
    assert(Array.isArray(dash.json?.fastMoving), 'Fast moving products returned');
    assert(Array.isArray(dash.json?.slowMoving), 'Slow moving products returned');

    // 5. Products & Inventory
    console.log('\n--- Test 5: Products & Stock Management ---');
    const prods = await request('/api/products', {
      headers: { Cookie: sessionCookie },
    });
    assert(prods.status === 200 && prods.json?.products?.length > 0, `Products list returned (${prods.json?.products?.length} items)`);
    const testProduct = prods.json.products[0];
    const initialQty = testProduct.quantity;

    // 6. POS Sales Transaction with Automatic Stock Deduction
    console.log('\n--- Test 6: Sales POS Transaction & Automatic Inventory Deduction ---');
    const saleRes = await request('/api/sales', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: sessionCookie,
      },
      body: {
        paymentMethod: 'TRANSFER',
        discount: 200,
        notes: 'Automated test purchase',
        items: [
          {
            productId: testProduct.id,
            quantity: 1,
            unitSellingPrice: testProduct.sellingPrice,
            discount: 0,
            totalAmount: testProduct.sellingPrice,
          },
        ],
      },
    });

    assert(saleRes.status === 200 && saleRes.json?.success === true, 'Sale transaction processed successfully');
    const saleId = saleRes.json?.sale?.saleId;
    assert(Boolean(saleId), `Sale created with ID: ${saleId}`);

    // Verify Stock Automatically Decreased
    const verifyProd = await request(`/api/products/${testProduct.id}`, {
      headers: { Cookie: sessionCookie },
    });
    const updatedQty = verifyProd.json?.product?.quantity;
    assert(updatedQty === initialQty - 1, `Inventory quantity decreased correctly: ${initialQty} -> ${updatedQty}`);

    // Verify Stock Movement was recorded
    const movements = verifyProd.json?.movements || [];
    const saleMovement = movements.find((m) => m.referenceId === saleId);
    assert(Boolean(saleMovement) && saleMovement.quantity === -1, 'SALE stock movement recorded with -1 quantity');

    // 7. Sales Receipt Endpoint
    console.log('\n--- Test 7: Sales Receipt Generation ---');
    const receiptRes = await request(`/api/sales/${saleId}`, {
      headers: { Cookie: sessionCookie },
    });
    assert(receiptRes.status === 200, 'Sale receipt endpoint responded 200');
    assert(receiptRes.json?.sale?.saleNumber !== undefined, `Receipt contains saleNumber: ${receiptRes.json?.sale?.saleNumber}`);
    assert(receiptRes.json?.shop?.name === 'Amarantus Clothings', `Receipt shop name: ${receiptRes.json?.shop?.name}`);
    assert(receiptRes.json?.items?.length === 1, 'Receipt contains purchased item');

    // 8. Stock Adjustment API
    console.log('\n--- Test 8: Manual Stock Adjustment with Audit ---');
    const adjustRes = await request(`/api/products/${testProduct.id}/adjust`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: sessionCookie,
      },
      body: {
        type: 'ADJUSTMENT',
        quantityChange: 2,
        notes: 'Stock check physical count verified +2',
      },
    });
    assert(adjustRes.status === 200 && adjustRes.json?.success === true, 'Manual stock adjustment applied');
    assert(adjustRes.json?.product?.quantity === updatedQty + 2, 'Quantity updated in database');

    // 9. Negative Stock Prevention Safeguard
    console.log('\n--- Test 9: Prevention of Negative Stock ---');
    const negativeSale = await request('/api/sales', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: sessionCookie,
      },
      body: {
        paymentMethod: 'CASH',
        items: [
          {
            productId: testProduct.id,
            quantity: 9999, // Exceeds available stock
            unitSellingPrice: testProduct.sellingPrice,
            discount: 0,
            totalAmount: testProduct.sellingPrice * 9999,
          },
        ],
      },
    });
    assert(negativeSale.status === 400 && negativeSale.json?.error.includes('Insufficient stock'), 'Transaction rejected when requested quantity exceeds stock');

    // 10. Purchasing Module (Thursday Market Intake)
    console.log('\n--- Test 10: Purchasing Batch Intake & Auto Stock Increment ---');
    const beforeBatchQty = adjustRes.json?.product?.quantity;
    const purchaseRes = await request('/api/purchases', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: sessionCookie,
      },
      body: {
        purchaseDate: new Date().toISOString().slice(0, 10),
        transportCost: 6000,
        otherCosts: 1500,
        notes: 'Test Amarantus Clothings batch',
        items: [
          {
            productId: testProduct.id,
            quantity: 5,
            unitCost: testProduct.costPrice,
            sellingPrice: testProduct.sellingPrice,
          },
        ],
      },
    });
    assert(purchaseRes.status === 200 && purchaseRes.json?.success === true, 'Purchase batch created');

    const afterBatchProd = await request(`/api/products/${testProduct.id}`, {
      headers: { Cookie: sessionCookie },
    });
    assert(afterBatchProd.json?.product?.quantity === beforeBatchQty + 5, `Inventory quantity increased by +5 after purchase: ${beforeBatchQty} -> ${afterBatchProd.json?.product?.quantity}`);

    // 11. Thursday Purchasing Planning Engine
    console.log('\n--- Test 11: Thursday Purchasing Engine ---');
    const thursdayPlan = await request('/api/thursday-plan', {
      headers: { Cookie: sessionCookie },
    });
    assert(thursdayPlan.status === 200, 'Thursday plan endpoint returned 200');
    assert(Array.isArray(thursdayPlan.json?.items) && thursdayPlan.json?.items.length > 0, `Recommendations calculated for ${thursdayPlan.json?.items.length} categories`);
    assert(thursdayPlan.json?.items[0]?.averageWeeklySales !== undefined, 'Average weekly sales computed via 30-day formula');
    assert(thursdayPlan.json?.items[0]?.recommendedQuantity !== undefined, 'Recommended purchase pieces computed');

    // 12. Clearance Module
    console.log('\n--- Test 12: Clearance & Stagnant Inventory Engine ---');
    const clearance = await request('/api/clearance', {
      headers: { Cookie: sessionCookie },
    });
    assert(clearance.status === 200 && Array.isArray(clearance.json?.clearanceItems), 'Clearance endpoint identifies stagnant stock');

    // 13. Reports & Profit/Loss Calculation
    console.log('\n--- Test 13: Reports & P&L Calculation ---');
    const reports = await request('/api/reports?period=30days', {
      headers: { Cookie: sessionCookie },
    });
    assert(reports.status === 200, 'Reports API responded 200');
    assert(reports.json?.summary?.grossProfit !== undefined, `Gross profit: ₦${reports.json?.summary?.grossProfit}`);
    assert(reports.json?.summary?.costOfGoodsSold !== undefined, `COGS: ₦${reports.json?.summary?.costOfGoodsSold}`);
    assert(reports.json?.summary?.netProfit !== undefined, `Net profit: ₦${reports.json?.summary?.netProfit}`);
    assert(Array.isArray(reports.json?.categorySales), 'Category sales breakdown returned');
    assert(Array.isArray(reports.json?.categoryExpenses), 'Expenses breakdown returned');

    // 14. Social Selling
    console.log('\n--- Test 14: Social Selling Studio ---');
    const socialRes = await request('/api/social-posts', {
      headers: { Cookie: sessionCookie },
    });
    assert(socialRes.status === 200 && Array.isArray(socialRes.json?.posts), 'Social posts tracker returned');

    // 15. Staff Role Security
    console.log('\n--- Test 15: Role-Based Access Control ---');
    const staffLogin = await request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { email: 'staff@clothshop.ng', password: 'password123' },
    });
    const staffCookie = staffLogin.headers['set-cookie'][0].split(';')[0];

    // Staff trying to view reports should be 403 Forbidden
    const staffReport = await request('/api/reports', {
      headers: { Cookie: staffCookie },
    });
    assert(staffReport.status === 403, 'Staff user correctly blocked from viewing financial P&L reports (403 Forbidden)');

    // Staff trying to view users should be 403 Forbidden
    const staffUsers = await request('/api/users', {
      headers: { Cookie: staffCookie },
    });
    assert(staffUsers.status === 403, 'Staff user correctly blocked from viewing user accounts (403 Forbidden)');

    console.log('\n========================================');
    console.log(`🎉 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('========================================\n');

    if (failed > 0) process.exit(1);
  } catch (err) {
    console.error('Fatal error during test run:', err);
    process.exit(1);
  }
}

runTests();
