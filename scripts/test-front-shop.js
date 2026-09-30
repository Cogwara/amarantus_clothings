// test-front-shop.js
const http = require('http');

const BASE_URL = 'http://localhost:3005';

async function request(path, options = {}) {
  const url = new URL(path, BASE_URL);
  const headers = { ...options.headers };
  if (options.body) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(url.toString(), {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch (e) {
    // not JSON
  }

  return { status: res.status, headers: res.headers, text, json };
}

async function run() {
  console.log('--- TESTING FRONT SHOP STOREFRONT & APIS ---');
  let passed = 0;
  let failed = 0;

  function assert(condition, name) {
    if (condition) {
      console.log(`[PASS] ${name}`);
      passed++;
    } else {
      console.error(`[FAIL] ${name}`);
      failed++;
    }
  }

  try {
    // 1. Check Storefront Page
    const pageRes = await request('/');
    assert(pageRes.status === 200, 'GET / returns 200 OK');
    assert(pageRes.text.includes('Elegance Thrift Haven') || pageRes.text.includes('ClothShop'), 'GET / HTML contains Storefront brand');

    // 2. Check Public Products API
    const productsRes = await request('/api/public/products');
    assert(productsRes.status === 200, 'GET /api/public/products returns 200 OK');
    assert(Array.isArray(productsRes.json?.products), 'Products response contains products array');
    assert(productsRes.json.products.length > 0, `Returned ${productsRes.json?.products?.length} products`);
    assert(Array.isArray(productsRes.json?.categories), 'Products response contains categories array');

    const sampleProduct = productsRes.json.products.find(p => p.quantity > 2) || productsRes.json.products[0];
    const initialQty = sampleProduct.quantity;
    console.log(`Sample product selected: "${sampleProduct.name}" (ID: ${sampleProduct.id}, Qty: ${initialQty}, Price: ₦${sampleProduct.sellingPrice})`);

    // 3. Test Public Contact / Style Request API
    const contactRes = await request('/api/public/contact', {
      method: 'POST',
      body: {
        name: 'Adaobi Okonjo',
        phone: '08023456789',
        message: 'Looking for UK Grade A Chiffon Floral midi dresses in Size M or L.',
        categoryPreference: "Women's Dresses",
      },
    });
    assert(contactRes.status === 200, 'POST /api/public/contact returns 200 OK');
    assert(contactRes.json?.success === true, 'Contact message submitted successfully');

    // 4. Test Public Order Checkout (Bank Transfer / Pay on Delivery)
    const orderRes = await request('/api/public/orders', {
      method: 'POST',
      body: {
        customerName: 'Chiamaka Nnamani',
        customerPhone: '08123456789',
        customerAddress: '14 Admiralty Way, Lekki Phase 1, Lagos',
        paymentMethod: 'TRANSFER',
        items: [
          {
            productId: sampleProduct.id,
            quantity: 1,
          },
        ],
        notes: 'Please double-bag in clean polythene. Deliver after 2pm.',
      },
    });

    assert(orderRes.status === 200 || orderRes.status === 201, `POST /api/public/orders returns success status (got ${orderRes.status})`);
    assert(orderRes.json?.saleNumber?.startsWith('WEB-') || orderRes.json?.order?.saleNumber?.startsWith('WEB-'), `Order created with online sale number: ${orderRes.json?.saleNumber || orderRes.json?.order?.saleNumber}`);
    assert((orderRes.json?.totalAmount || orderRes.json?.order?.totalAmount) > 0, `Order total recorded: ₦${orderRes.json?.totalAmount || orderRes.json?.order?.totalAmount}`);

    // 5. Verify Stock Deduction in Public Products
    const checkProductRes = await request(`/api/public/products`);
    const updatedProduct = checkProductRes.json?.products?.find(p => p.id === sampleProduct.id);
    assert(updatedProduct && updatedProduct.quantity === initialQty - 1,
      `Inventory decremented correctly from ${initialQty} to ${updatedProduct?.quantity}`);

    console.log('\n=============================================');
    console.log(`FRONT SHOP TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('=============================================\n');

    if (failed > 0) process.exit(1);
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  }
}

run();
