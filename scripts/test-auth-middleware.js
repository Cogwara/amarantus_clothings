const BASE_URL = 'http://localhost:3001';

async function runTests() {
  console.log('--- Starting Authentication & Middleware Protection Tests ---');

  // 1. Verify unauthenticated access to protected pages redirects to /login?redirect=...
  const protectedRoutes = [
    '/dashboard',
    '/sales',
    '/inventory',
    '/thursday-plan',
    '/purchases',
    '/reports',
    '/expenses',
    '/customers',
    '/clearance',
    '/social-selling',
    '/staff',
    '/settings',
  ];

  console.log('\n1. Testing Unauthenticated Access to Backend Pages:');
  for (const route of protectedRoutes) {
    const res = await fetch(`${BASE_URL}${route}`, {
      redirect: 'manual', // do not follow redirect so we can inspect status and location header
    });

    const location = res.headers.get('location');
    console.log(`Checking ${route}: status=${res.status}, location=${location}`);

    if (res.status !== 307 && res.status !== 302) {
      throw new Error(`Expected redirect (307/302) for unauthenticated ${route}, got ${res.status}`);
    }

    if (!location || !location.includes('/login') || !location.includes(`redirect=${encodeURIComponent(route)}`)) {
      throw new Error(`Expected location to redirect to /login with redirect=${route}, got ${location}`);
    }
    console.log(`✓ ${route} correctly protected (redirects to /login)`);
  }

  // 2. Testing unauthenticated API access
  console.log('\n2. Testing Unauthenticated Protected API Access:');
  const protectedAPIs = ['/api/dashboard', '/api/sales', '/api/purchases', '/api/expenses'];
  for (const apiRoute of protectedAPIs) {
    const res = await fetch(`${BASE_URL}${apiRoute}`);
    console.log(`Checking API ${apiRoute}: status=${res.status}`);
    if (res.status !== 401) {
      throw new Error(`Expected 401 for unauthenticated ${apiRoute}, got ${res.status}`);
    }
    const data = await res.json();
    console.log(`✓ ${apiRoute} rejected with 401: ${data.error}`);
  }

  // 3. Testing public storefront & public APIs remain accessible without login
  console.log('\n3. Testing Public Storefront & Public APIs (Accessible without auth):');
  const storeRes = await fetch(`${BASE_URL}/`);
  if (!storeRes.ok) {
    throw new Error(`Expected public storefront / to return 200, got ${storeRes.status}`);
  }
  console.log('✓ Public storefront / accessible (200 OK)');

  const pubProductsRes = await fetch(`${BASE_URL}/api/public/products`);
  if (!pubProductsRes.ok) {
    throw new Error(`Expected /api/public/products to return 200, got ${pubProductsRes.status}`);
  }
  const pubData = await pubProductsRes.json();
  console.log(`✓ Public API /api/public/products accessible (${pubData.products?.length} products)`);

  // 4. Authenticate as Owner
  console.log('\n4. Logging in as Owner...');
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'amarantus@gmail.com',
      password: 'Amarantus@123',
    }),
  });

  if (!loginRes.ok) {
    throw new Error(`Login failed with status ${loginRes.status}`);
  }

  const setCookie = loginRes.headers.get('set-cookie');
  if (!setCookie) {
    throw new Error('No set-cookie returned from login');
  }
  const cookieHeader = setCookie.split(';')[0];
  console.log('✓ Successfully authenticated and obtained session cookie.');

  // 5. Test authenticated access to protected pages
  console.log('\n5. Testing Authenticated Access with Session Cookie:');
  for (const route of ['/dashboard', '/sales', '/inventory', '/thursday-plan']) {
    const res = await fetch(`${BASE_URL}${route}`, {
      headers: { Cookie: cookieHeader },
      redirect: 'manual',
    });
    console.log(`Checking authenticated ${route}: status=${res.status}`);
    if (res.status !== 200) {
      throw new Error(`Expected 200 for authenticated ${route}, got ${res.status}`);
    }
    console.log(`✓ Authenticated ${route} allowed (200 OK)`);
  }

  // 6. Test authenticated user visiting /login redirects to /dashboard
  console.log('\n6. Testing Authenticated User visiting /login:');
  const loginPageRes = await fetch(`${BASE_URL}/login`, {
    headers: { Cookie: cookieHeader },
    redirect: 'manual',
  });
  const loginRedirect = loginPageRes.headers.get('location');
  console.log(`Checking /login with session: status=${loginPageRes.status}, location=${loginRedirect}`);
  if (loginPageRes.status !== 307 && loginPageRes.status !== 302) {
    throw new Error(`Expected redirect from /login for logged-in user, got ${loginPageRes.status}`);
  }
  if (!loginRedirect || !loginRedirect.includes('/dashboard')) {
    throw new Error(`Expected redirect to /dashboard, got ${loginRedirect}`);
  }
  console.log('✓ Already logged-in user correctly redirected to /dashboard');

  console.log('\n======================================================');
  console.log('🎉 ALL AUTHENTICATION & MIDDLEWARE TESTS PASSED! 🎉');
  console.log('======================================================');
}

runTests().catch((err) => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});
