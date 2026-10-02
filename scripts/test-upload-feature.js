const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3001';

async function runTests() {
  console.log('--- Starting Local Photo Upload & Inventory Integration Tests ---');
  let cookieHeader = '';

  // 1. Authenticate as Owner
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

  // 2. Test upload without auth (should fail 401)
  console.log('2. Testing unauthenticated upload rejection...');
  const fakeFormData = new FormData();
  const dummyBlob = new Blob(['sample image data'], { type: 'image/png' });
  fakeFormData.append('file', dummyBlob, 'test.png');

  const unauthRes = await fetch(`${BASE_URL}/api/upload`, {
    method: 'POST',
    body: fakeFormData,
  });
  if (unauthRes.status === 401) {
    console.log('✓ Unauthenticated upload correctly rejected with 401.');
  } else {
    throw new Error(`Expected 401 for unauthenticated upload, got ${unauthRes.status}`);
  }

  // 3. Test invalid file type rejection (e.g., .txt)
  console.log('3. Testing non-image file rejection...');
  const txtFormData = new FormData();
  const txtBlob = new Blob(['hello text file'], { type: 'text/plain' });
  txtFormData.append('file', txtBlob, 'notes.txt');

  const invalidTypeRes = await fetch(`${BASE_URL}/api/upload`, {
    method: 'POST',
    headers: { Cookie: cookieHeader },
    body: txtFormData,
  });
  if (invalidTypeRes.status === 400) {
    console.log('✓ Non-image file correctly rejected with 400.');
  } else {
    throw new Error(`Expected 400 for non-image file, got ${invalidTypeRes.status}`);
  }

  // 4. Test uploading a real sample image from device
  console.log('4. Uploading sample local image from device...');
  // 1x1 transparent PNG in base64
  const pngBase64 =
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  const imgBuffer = Buffer.from(pngBase64, 'base64');
  const validImgBlob = new Blob([imgBuffer], { type: 'image/png' });

  const validFormData = new FormData();
  validFormData.append('file', validImgBlob, 'device-sample-dress.png');

  const uploadRes = await fetch(`${BASE_URL}/api/upload`, {
    method: 'POST',
    headers: { Cookie: cookieHeader },
    body: validFormData,
  });

  if (!uploadRes.ok) {
    const err = await uploadRes.json();
    throw new Error(`Upload failed: ${JSON.stringify(err)}`);
  }

  const uploadData = await uploadRes.json();
  console.log('✓ Upload successful! Response:', uploadData);

  if (!uploadData.url || !uploadData.url.startsWith('/uploads/')) {
    throw new Error(`Unexpected upload URL format: ${uploadData.url}`);
  }

  // 5. Test accessing the uploaded image locally
  console.log(`5. Fetching uploaded image directly via GET ${uploadData.url}...`);
  const imageFetchRes = await fetch(`${BASE_URL}${uploadData.url}`);
  if (!imageFetchRes.ok) {
    throw new Error(`Failed to fetch uploaded image at ${uploadData.url}, status: ${imageFetchRes.status}`);
  }
  const contentType = imageFetchRes.headers.get('content-type');
  console.log(`✓ Image served successfully! Content-Type: ${contentType}`);

  // 6. Test creating a product with the local uploaded image
  console.log('6. Creating new product with local uploaded photo...');
  // Get categories first
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
      name: 'Local Device Uploaded Silk Gown',
      categoryId: categoryId,
      size: 'M',
      gender: 'WOMEN',
      condition: 'EXCELLENT',
      brand: 'Zara Local',
      color: 'Emerald',
      costPrice: 4000,
      sellingPrice: 12000,
      quantity: 8,
      minimumStock: 2,
      imageUrl: uploadData.url,
    }),
  });

  if (!createProdRes.ok) {
    const err = await createProdRes.json();
    throw new Error(`Failed to create product: ${JSON.stringify(err)}`);
  }

  const createdProd = await createProdRes.json();
  console.log(`✓ Product created successfully! ID: ${createdProd.product.id}`);

  // 7. Verify product shows the primary uploaded image
  console.log('7. Verifying product in inventory list...');
  const verifyRes = await fetch(`${BASE_URL}/api/products?search=Local+Device+Uploaded`, {
    headers: { Cookie: cookieHeader },
  });
  const verifyData = await verifyRes.json();
  const found = verifyData.products.find((p) => p.id === createdProd.product.id);

  if (!found) {
    throw new Error('Created product was not found in products list');
  }

  console.log(`✓ Product found with primaryImageUrl: ${found.primaryImageUrl}`);
  if (found.primaryImageUrl !== uploadData.url) {
    throw new Error(`Expected primaryImageUrl to be ${uploadData.url}, got ${found.primaryImageUrl}`);
  }

  // 8. Test updating the product with a different image / edit details
  console.log('8. Testing Edit Product with updated details and new photo...');
  const editProdRes = await fetch(`${BASE_URL}/api/products/${createdProd.product.id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookieHeader,
    },
    body: JSON.stringify({
      name: 'Local Device Uploaded Silk Gown (Updated)',
      sellingPrice: 13500,
      imageUrl: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=600&q=80',
    }),
  });

  if (!editProdRes.ok) {
    const err = await editProdRes.json();
    throw new Error(`Failed to update product: ${JSON.stringify(err)}`);
  }

  const updatedProd = await editProdRes.json();
  console.log(`✓ Product updated successfully! Name: ${updatedProd.product.name}`);

  // Clean up created test product
  console.log('9. Cleaning up test product...');
  await fetch(`${BASE_URL}/api/products/${createdProd.product.id}`, {
    method: 'DELETE',
    headers: { Cookie: cookieHeader },
  });
  console.log('✓ Cleaned up test product.');

  console.log('\n========================================');
  console.log('🎉 ALL LOCAL PHOTO UPLOAD TESTS PASSED! 🎉');
  console.log('========================================');
}

runTests().catch((err) => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});
