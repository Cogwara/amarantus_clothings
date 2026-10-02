const BASE_URL = 'http://localhost:3001';

async function runTests() {
  console.log('--- Starting Multi-Photo Upload & Multi-Image Product Tests ---');
  let cookieHeader = '';

  // 1. Login as Owner
  console.log('1. Authenticating as Owner...');
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
  if (setCookie) {
    cookieHeader = setCookie.split(';')[0];
  }
  console.log('✓ Successfully logged in as owner.');

  // 2. Batch upload multiple sample images
  console.log('2. Uploading batch of multiple sample images via FormData files[]');
  const pngBase64 =
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  const imgBuffer = Buffer.from(pngBase64, 'base64');

  const multiFormData = new FormData();
  multiFormData.append('files', new Blob([imgBuffer], { type: 'image/png' }), 'angle1-front.png');
  multiFormData.append('files', new Blob([imgBuffer], { type: 'image/png' }), 'angle2-back.png');
  multiFormData.append('files', new Blob([imgBuffer], { type: 'image/png' }), 'angle3-tag.png');

  const multiUploadRes = await fetch(`${BASE_URL}/api/upload`, {
    method: 'POST',
    headers: { Cookie: cookieHeader },
    body: multiFormData,
  });

  if (!multiUploadRes.ok) {
    const err = await multiUploadRes.json();
    throw new Error(`Multi upload failed: ${JSON.stringify(err)}`);
  }

  const uploadResult = await multiUploadRes.json();
  console.log('✓ Batch upload successful! Response:', uploadResult);

  if (!uploadResult.urls || uploadResult.urls.length !== 3) {
    throw new Error(`Expected 3 URLs in response, got ${uploadResult.urls?.length}`);
  }

  const [url1, url2, url3] = uploadResult.urls;

  // 3. Create Product with 3 images
  console.log('3. Creating product with 3 uploaded images (cover + 2 extra)...');
  const catRes = await fetch(`${BASE_URL}/api/categories`, {
    headers: { Cookie: cookieHeader },
  });
  const catData = await catRes.json();
  const categoryId = catData.categories[0].id;

  const createProdRes = await fetch(`${BASE_URL}/api/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookieHeader,
    },
    body: JSON.stringify({
      name: 'Multi-Photo Designer Jacket',
      categoryId: categoryId,
      size: 'L',
      gender: 'UNISEX',
      condition: 'EXCELLENT',
      brand: 'Gucci Thrift',
      color: 'Navy Blue',
      costPrice: 5000,
      sellingPrice: 18000,
      quantity: 5,
      minimumStock: 2,
      images: [url1, url2, url3],
    }),
  });

  if (!createProdRes.ok) {
    const err = await createProdRes.json();
    throw new Error(`Failed to create product: ${JSON.stringify(err)}`);
  }

  const createdProd = await createProdRes.json();
  const productId = createdProd.product.id;
  console.log(`✓ Product created successfully! ID: ${productId}`);

  // 4. Verify product images via GET /api/products/[id]
  console.log(`4. Fetching product via GET /api/products/${productId}...`);
  const getProdRes = await fetch(`${BASE_URL}/api/products/${productId}`, {
    headers: { Cookie: cookieHeader },
  });
  const getProdData = await getProdRes.json();
  console.log('✓ Retrieved product images count:', getProdData.product.images?.length);

  if (!getProdData.product.images || getProdData.product.images.length !== 3) {
    throw new Error(`Expected 3 images in product, got ${getProdData.product.images?.length}`);
  }

  // Cover image check
  const primaryImg = getProdData.product.images.find((img) => img.isPrimary);
  console.log(`✓ Primary cover image URL: ${primaryImg?.url}`);
  if (primaryImg?.url !== url1) {
    throw new Error(`Expected primary image to be ${url1}, got ${primaryImg?.url}`);
  }

  // 5. Verify public storefront API returns images
  console.log('5. Verifying storefront API /api/public/products...');
  const publicRes = await fetch(`${BASE_URL}/api/public/products?search=Multi-Photo+Designer+Jacket`);
  const publicData = await publicRes.json();
  const publicProd = publicData.products.find((p) => p.id === productId);

  if (!publicProd) {
    throw new Error('Created product was not found in public products API');
  }

  console.log(`✓ Public product found with ${publicProd.images?.length} images`);
  if (!publicProd.images || publicProd.images.length !== 3) {
    throw new Error(`Expected 3 images in public product, got ${publicProd.images?.length}`);
  }
  if (publicProd.primaryImageUrl !== url1) {
    throw new Error(`Expected primaryImageUrl to be ${url1}, got ${publicProd.primaryImageUrl}`);
  }

  // 6. Test updating images: Reorder cover (url2 as cover, url1 second, remove url3, add url4)
  console.log('6. Updating product photos (reordering cover and updating list)...');
  const dummyBlob4 = new Blob([imgBuffer], { type: 'image/png' });
  const singleFormData = new FormData();
  singleFormData.append('file', dummyBlob4, 'angle4-details.png');

  const upload4Res = await fetch(`${BASE_URL}/api/upload`, {
    method: 'POST',
    headers: { Cookie: cookieHeader },
    body: singleFormData,
  });
  const upload4Data = await upload4Res.json();
  const url4 = upload4Data.url;

  // New list: url2 is now first (cover), then url1, then url4
  const updateProdRes = await fetch(`${BASE_URL}/api/products/${productId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookieHeader,
    },
    body: JSON.stringify({
      images: [url2, url1, url4],
    }),
  });

  if (!updateProdRes.ok) {
    const err = await updateProdRes.json();
    throw new Error(`Failed to update product images: ${JSON.stringify(err)}`);
  }

  // Verify updated cover
  const updatedFetch = await fetch(`${BASE_URL}/api/products/${productId}`, {
    headers: { Cookie: cookieHeader },
  });
  const updatedData = await updatedFetch.json();
  const updatedPrimary = updatedData.product.images?.find((img) => img.isPrimary);
  console.log(`✓ Updated primary cover image URL: ${updatedPrimary?.url}`);
  if (updatedPrimary?.url !== url2) {
    throw new Error(`Expected new cover image to be ${url2}, got ${updatedPrimary?.url}`);
  }

  // 7. Clean up test product
  console.log('7. Cleaning up test product...');
  await fetch(`${BASE_URL}/api/products/${productId}`, {
    method: 'DELETE',
    headers: { Cookie: cookieHeader },
  });
  console.log('✓ Cleaned up test product.');

  console.log('\n=============================================');
  console.log('🎉 ALL MULTI-PHOTO UPLOAD & API TESTS PASSED! 🎉');
  console.log('=============================================');
}

runTests().catch((err) => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});
