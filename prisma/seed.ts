import bcrypt from 'bcryptjs';
import { pool } from '../lib/db';

async function seed() {
  console.log('🌱 Starting ClothShop Manager database seed...');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Clean existing data in reverse order of foreign keys
    console.log('Clearing existing demo tables...');
    await client.query('DELETE FROM audit_logs');
    await client.query('DELETE FROM social_posts');
    await client.query('DELETE FROM purchasing_plan_items');
    await client.query('DELETE FROM purchasing_plans');
    await client.query('DELETE FROM stock_movements');
    await client.query('DELETE FROM discounts');
    await client.query('DELETE FROM sale_items');
    await client.query('DELETE FROM sales');
    await client.query('DELETE FROM purchase_items');
    await client.query('DELETE FROM purchase_batches');
    await client.query('DELETE FROM product_images');
    await client.query('DELETE FROM products');
    await client.query('DELETE FROM categories');
    await client.query('DELETE FROM suppliers');
    await client.query('DELETE FROM customers');
    await client.query('DELETE FROM expenses');
    await client.query('DELETE FROM users');
    await client.query('DELETE FROM shops');

    // 1. Shop Profile
    console.log('Creating Shop profile...');
    await client.query(`
      INSERT INTO shops (id, name, phone, address, logo, currency, "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
    `, [
      'shop_01',
      'Elegance Thrift Haven',
      '+234 803 123 4567',
      'Shop 14, Block B, Katangua Main Complex, Super B/Stop, Lagos, Nigeria',
      null,
      'NGN',
    ]);

    // 2. Demo Users (password: password123)
    console.log('Creating Users...');
    const passwordHash = await bcrypt.hash('password123', 10);

    const users = [
      { id: 'usr_owner', name: 'Amaka Okafor', email: 'owner@clothshop.ng', phone: '+234 803 111 2233', role: 'OWNER' },
      { id: 'usr_manager', name: 'Chidi Nnamdi', email: 'manager@clothshop.ng', phone: '+234 802 333 4455', role: 'MANAGER' },
      { id: 'usr_staff', name: 'Blessing Adeyemi', email: 'staff@clothshop.ng', phone: '+234 805 777 8899', role: 'STAFF' },
    ];

    for (const u of users) {
      await client.query(`
        INSERT INTO users (id, name, email, phone, "passwordHash", role, "isActive", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, $6, true, NOW(), NOW())
      `, [u.id, u.name, u.email, u.phone, passwordHash, u.role]);
    }

    // 3. Categories
    console.log('Creating Categories...');
    const categories = [
      { id: 'cat_dresses', name: "Women's Dresses", description: 'Chiffon, cotton, dinner and casual dresses' },
      { id: 'cat_w_tops', name: "Women's Tops", description: 'Silk, chiffon blouses, vintage shirts, cropped tops' },
      { id: 'cat_w_trousers', name: "Women's Trousers", description: 'High-waisted trousers, palazzos, mom jeans' },
      { id: 'cat_skirts', name: "Women's Skirts", description: 'Pleated, pencil, midi and maxi skirts' },
      { id: 'cat_m_shirts', name: "Men's Shirts", description: 'Casual button-downs, formal corporate, vintage patterns' },
      { id: 'cat_m_trousers', name: "Men's Trousers", description: 'Chinos, cargo pants, tailored formal pants' },
      { id: 'cat_m_jackets', name: "Men's Jackets", description: 'Denim jackets, blazers, bomber jackets' },
      { id: 'cat_children', name: "Children's Clothes", description: 'Boys & girls everyday clothes, party wear' },
      { id: 'cat_shoes', name: 'Shoes', description: 'Sneakers, leather loafers, ladies heels & sandals' },
      { id: 'cat_bags', name: 'Bags', description: 'Leather tote bags, handbags, backpacks' },
      { id: 'cat_accessories', name: 'Accessories', description: 'Belts, scarves, caps, sunglasses' },
      { id: 'cat_others', name: 'Others', description: 'Scarves, bedsheets and miscellaneous items' },
    ];

    for (const c of categories) {
      await client.query(`
        INSERT INTO categories (id, name, description, "isActive", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, true, NOW(), NOW())
      `, [c.id, c.name, c.description]);
    }

    // 4. Suppliers
    console.log('Creating Suppliers...');
    const suppliers = [
      { id: 'sup_musa', name: 'Alhaji Musa Bales', phone: '+234 802 111 9900', market: 'Katangua Market', notes: 'Direct importer of UK Grade A chiffon dresses and silk tops' },
      { id: 'sup_beatrice', name: 'Madam Beatrice Okonkwo', phone: '+234 803 444 8811', market: 'Yaba Market', notes: 'Specializes in first-selection corporate skirts and trousers' },
      { id: 'sup_emeka', name: 'Emeka London Stock', phone: '+234 806 777 3322', market: 'Balogun Market', notes: 'Top supplier for men designer shirts, vintage denims and blazers' },
      { id: 'sup_kemi', name: 'Mama Kemi Children Bales', phone: '+234 809 555 1212', market: 'Aswani Market', notes: 'Wholesale children wear and toddler sets' },
    ];

    for (const s of suppliers) {
      await client.query(`
        INSERT INTO suppliers (id, name, phone, market, notes, "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      `, [s.id, s.name, s.phone, s.market, s.notes]);
    }

    // 5. Customers
    console.log('Creating Customers...');
    const customers = [
      { id: 'cust_01', name: 'Funke Akindele', phone: '+234 803 999 1122', email: 'funke.a@example.com', address: 'Allen Avenue, Ikeja, Lagos', notes: 'Loves floral midi dresses and silk blouses' },
      { id: 'cust_02', name: 'Tunde Bakare', phone: '+234 802 888 3344', email: 'tunde.b@example.com', address: 'Bode Thomas, Surulere, Lagos', notes: 'Regular buyer of corporate long-sleeve shirts' },
      { id: 'cust_03', name: 'Zainab Ahmed', phone: '+234 806 555 7788', email: 'zainab.a@example.com', address: 'Adeola Odeku, Victoria Island, Lagos', notes: 'High-end thrift collector, buys luxury brands' },
      { id: 'cust_04', name: 'Chioma Adeleke', phone: '+234 807 444 6655', email: 'chioma.ad@example.com', address: 'Admiralty Way, Lekki Phase 1, Lagos', notes: 'Bulk buyer for university students' },
      { id: 'cust_05', name: 'Emeka Obi', phone: '+234 808 333 2211', email: 'emeka.obi@example.com', address: 'Commercial Avenue, Yaba, Lagos', notes: 'Prefers denim jackets and casual trousers' },
    ];

    for (const cu of customers) {
      await client.query(`
        INSERT INTO customers (id, name, phone, email, address, notes, "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      `, [cu.id, cu.name, cu.phone, cu.email, cu.address, cu.notes]);
    }

    // 6. Products
    console.log('Creating Products & Images...');
    const now = new Date();
    const daysAgo = (d: number) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000);

    const products = [
      {
        id: 'prod_01',
        sku: 'DRS-001',
        name: 'Vintage Floral Chiffon Wrap Dress',
        categoryId: 'cat_dresses',
        description: 'Breezy Grade A floral wrap dress with waist tie. Perfect for church, brunch or work.',
        size: 'M',
        gender: 'WOMEN',
        condition: 'EXCELLENT',
        brand: 'Zara',
        color: 'Multicolor / Cream',
        costPrice: 3500,
        sellingPrice: 8500,
        quantity: 8,
        minimumStock: 3,
        status: 'AVAILABLE',
        dateAdded: daysAgo(5),
        imageUrl: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=600&q=80',
      },
      {
        id: 'prod_02',
        sku: 'DRS-002',
        name: 'Zara Emerald Pleated Midi Dress',
        categoryId: 'cat_dresses',
        description: 'Elegant emerald green pleated midi dress with long sleeves and high neck collar.',
        size: 'L',
        gender: 'WOMEN',
        condition: 'EXCELLENT',
        brand: 'Zara',
        color: 'Emerald Green',
        costPrice: 4200,
        sellingPrice: 10500,
        quantity: 2, // LOW STOCK
        minimumStock: 3,
        status: 'LOW_STOCK',
        dateAdded: daysAgo(12),
        imageUrl: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=600&q=80',
      },
      {
        id: 'prod_03',
        sku: 'TOP-001',
        name: 'Silk Chiffon Office Blouse',
        categoryId: 'cat_w_tops',
        description: 'First selection ivory silk blouse with pearl buttons and bow tie collar.',
        size: 'S',
        gender: 'WOMEN',
        condition: 'VERY_GOOD',
        brand: 'Marks & Spencer',
        color: 'Ivory / Cream',
        costPrice: 2000,
        sellingPrice: 5500,
        quantity: 14,
        minimumStock: 4,
        status: 'AVAILABLE',
        dateAdded: daysAgo(4),
        imageUrl: 'https://images.unsplash.com/photo-1589310243389-96a5483213a8?auto=format&fit=crop&w=600&q=80',
      },
      {
        id: 'prod_04',
        sku: 'TRS-001',
        name: 'High-Waist Tailored Palazzo Trousers',
        categoryId: 'cat_w_trousers',
        description: 'Super flattering high-waist palazzo with side pockets and belt loops.',
        size: 'M',
        gender: 'WOMEN',
        condition: 'EXCELLENT',
        brand: 'Atmosphere',
        color: 'Camel / Brown',
        costPrice: 2800,
        sellingPrice: 7000,
        quantity: 6,
        minimumStock: 3,
        status: 'AVAILABLE',
        dateAdded: daysAgo(8),
        imageUrl: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=600&q=80',
      },
      {
        id: 'prod_05',
        sku: 'SHR-001',
        name: 'Tommy Hilfiger Striped Oxford Shirt',
        categoryId: 'cat_m_shirts',
        description: 'Classic navy and white striped Oxford cotton long sleeve shirt.',
        size: 'L',
        gender: 'MEN',
        condition: 'EXCELLENT',
        brand: 'Tommy Hilfiger',
        color: 'Blue / White Striped',
        costPrice: 4000,
        sellingPrice: 9500,
        quantity: 11,
        minimumStock: 3,
        status: 'AVAILABLE',
        dateAdded: daysAgo(6),
        imageUrl: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=600&q=80',
      },
      {
        id: 'prod_06',
        sku: 'SHR-002',
        name: 'Ralph Lauren Custom Fit Linen Shirt',
        categoryId: 'cat_m_shirts',
        description: 'Lightweight pure white summer linen shirt with iconic pony embroidery.',
        size: 'XL',
        gender: 'MEN',
        condition: 'EXCELLENT',
        brand: 'Ralph Lauren',
        color: 'Crisp White',
        costPrice: 5000,
        sellingPrice: 13000,
        quantity: 1, // LOW STOCK
        minimumStock: 3,
        status: 'LOW_STOCK',
        dateAdded: daysAgo(10),
        imageUrl: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=600&q=80',
      },
      {
        id: 'prod_07',
        sku: 'TRS-002',
        name: 'Slim Fit Cotton Chino Trousers',
        categoryId: 'cat_m_trousers',
        description: 'Khaki slim fit stretch cotton chinos. Clean finish, ready to wear.',
        size: '34',
        gender: 'MEN',
        condition: 'VERY_GOOD',
        brand: 'Uniqlo',
        color: 'Khaki Sand',
        costPrice: 3200,
        sellingPrice: 7500,
        quantity: 9,
        minimumStock: 3,
        status: 'AVAILABLE',
        dateAdded: daysAgo(7),
        imageUrl: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=600&q=80',
      },
      {
        id: 'prod_08',
        sku: 'JKT-001',
        name: 'Vintage Oversized Denim Trucker Jacket',
        categoryId: 'cat_m_jackets',
        description: 'Heavyweight stone-washed blue vintage denim trucker jacket.',
        size: 'L',
        gender: 'UNISEX',
        condition: 'EXCELLENT',
        brand: "Levi's",
        color: 'Washed Indigo',
        costPrice: 6500,
        sellingPrice: 15500,
        quantity: 4,
        minimumStock: 2,
        status: 'AVAILABLE',
        dateAdded: daysAgo(9),
        imageUrl: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=600&q=80',
      },
      {
        id: 'prod_09',
        sku: 'SKT-001',
        name: 'Retro Pleated Midi Accordion Skirt',
        categoryId: 'cat_skirts',
        description: 'Silky accordion pleated skirt with elastic waist. Rich wine burgundy color.',
        size: 'M',
        gender: 'WOMEN',
        condition: 'GOOD',
        brand: 'Vintage',
        color: 'Burgundy',
        costPrice: 2200,
        sellingPrice: 5000,
        quantity: 7,
        minimumStock: 2,
        status: 'CLEARANCE', // CLEARANCE CANDIDATE (> 50 days)
        dateAdded: daysAgo(54),
        imageUrl: 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?auto=format&fit=crop&w=600&q=80',
      },
      {
        id: 'prod_10',
        sku: 'BAG-001',
        name: 'Structured Leather Crossbody Bag',
        categoryId: 'cat_bags',
        description: 'Tan brown genuine leather crossbody bag with gold hardware.',
        size: 'Standard',
        gender: 'WOMEN',
        condition: 'EXCELLENT',
        brand: 'Fossil',
        color: 'Tan Brown',
        costPrice: 5500,
        sellingPrice: 14000,
        quantity: 3,
        minimumStock: 2,
        status: 'AVAILABLE',
        dateAdded: daysAgo(11),
        imageUrl: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=600&q=80',
      },
      {
        id: 'prod_11',
        sku: 'SHO-001',
        name: 'Nike Air Max 90 Classic Sneakers',
        categoryId: 'cat_shoes',
        description: 'First selection white/grey Air Max 90. Soles in clean condition.',
        size: '43',
        gender: 'MEN',
        condition: 'VERY_GOOD',
        brand: 'Nike',
        color: 'White / Wolf Grey',
        costPrice: 8000,
        sellingPrice: 19500,
        quantity: 2,
        minimumStock: 2,
        status: 'AVAILABLE',
        dateAdded: daysAgo(3),
        imageUrl: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=600&q=80',
      },
      {
        id: 'prod_12',
        sku: 'KID-001',
        name: 'Toddler Denim Dungarees Set',
        categoryId: 'cat_children',
        description: 'Cute denim dungaree with yellow cotton t-shirt for boys or girls (2-3 years).',
        size: '2-3Y',
        gender: 'KIDS',
        condition: 'EXCELLENT',
        brand: 'Next Kids',
        color: 'Blue Denim',
        costPrice: 1800,
        sellingPrice: 4500,
        quantity: 12,
        minimumStock: 4,
        status: 'AVAILABLE',
        dateAdded: daysAgo(5),
        imageUrl: 'https://images.unsplash.com/photo-1519457431-44ccd64a579b?auto=format&fit=crop&w=600&q=80',
      },
      {
        id: 'prod_13',
        sku: 'DRS-003',
        name: 'Boho Tiered Maxi Summer Dress',
        categoryId: 'cat_dresses',
        description: 'Tiered floral cotton maxi dress with puff sleeves.',
        size: 'S',
        gender: 'WOMEN',
        condition: 'GOOD',
        brand: 'H&M',
        color: 'Yellow Floral',
        costPrice: 2800,
        sellingPrice: 6500,
        quantity: 5,
        minimumStock: 2,
        status: 'CLEARANCE', // Clearance candidate (62 days old)
        dateAdded: daysAgo(62),
        imageUrl: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=600&q=80',
      },
      {
        id: 'prod_14',
        sku: 'TOP-002',
        name: 'Vintage Patterned Silk Button-Down',
        categoryId: 'cat_w_tops',
        description: 'Bold 90s geometric pattern silk shirt. Statement piece.',
        size: 'Free Size',
        gender: 'UNISEX',
        condition: 'EXCELLENT',
        brand: 'Vintage',
        color: 'Multi Abstract',
        costPrice: 2500,
        sellingPrice: 6000,
        quantity: 8,
        minimumStock: 3,
        status: 'AVAILABLE',
        dateAdded: daysAgo(2),
        imageUrl: 'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&w=600&q=80',
      },
      {
        id: 'prod_15',
        sku: 'JKT-002',
        name: 'Double Breasted Plaid Tailored Blazer',
        categoryId: 'cat_m_jackets',
        description: 'Grey checked wool-blend tailored blazer with tortoiseshell buttons.',
        size: '42R',
        gender: 'MEN',
        condition: 'EXCELLENT',
        brand: 'Massimo Dutti',
        color: 'Grey Plaid',
        costPrice: 7000,
        sellingPrice: 17500,
        quantity: 3,
        minimumStock: 2,
        status: 'AVAILABLE',
        dateAdded: daysAgo(7),
        imageUrl: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=600&q=80',
      },
      {
        id: 'prod_16',
        sku: 'TRS-003',
        name: 'Distressed Vintage Mom Jeans',
        categoryId: 'cat_w_trousers',
        description: 'Classic high-waist 100% thick cotton denim mom jeans.',
        size: 'W28 / L30',
        gender: 'WOMEN',
        condition: 'VERY_GOOD',
        brand: 'Topshop',
        color: 'Light Wash Blue',
        costPrice: 3200,
        sellingPrice: 8000,
        quantity: 0, // OUT OF STOCK
        minimumStock: 3,
        status: 'OUT_OF_STOCK',
        dateAdded: daysAgo(20),
        imageUrl: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=600&q=80',
      }
    ];

    for (const p of products) {
      await client.query(`
        INSERT INTO products (
          id, sku, name, "categoryId", description, size, gender, condition,
          brand, color, "costPrice", "sellingPrice", quantity, "minimumStock",
          status, "dateAdded", "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW(), NOW())
      `, [
        p.id, p.sku, p.name, p.categoryId, p.description, p.size, p.gender,
        p.condition, p.brand, p.color, p.costPrice, p.sellingPrice, p.quantity,
        p.minimumStock, p.status, p.dateAdded
      ]);

      // Add Primary Product Image
      await client.query(`
        INSERT INTO product_images (id, "productId", url, "isPrimary", "createdAt")
        VALUES ($1, $2, $3, true, NOW())
      `, ['img_' + p.id, p.id, p.imageUrl]);

      // Add initial stock movement
      await client.query(`
        INSERT INTO stock_movements (id, "productId", type, quantity, "referenceId", notes, "createdById", "createdAt")
        VALUES ($1, $2, 'PURCHASE', $3, 'INITIAL', 'Initial bale selection & shop opening inventory', 'usr_owner', $4)
      `, ['mov_init_' + p.id, p.id, p.quantity + 4, p.dateAdded]);
    }

    // 7. Purchase Batches (Thursday Market Purchases)
    console.log('Creating Purchase Batches & Items...');
    const batches = [
      {
        id: 'batch_01',
        batchNumber: 'BATCH-20260918-01',
        supplierId: 'sup_musa',
        purchaseDate: daysAgo(12),
        purchaseAmount: 185000,
        transportCost: 8000,
        otherCosts: 2500,
        totalCost: 195500,
        notes: 'Thursday Katangua opening bale: First selection chiffon dresses and silk blouses.',
        createdById: 'usr_owner',
        items: [
          { productId: 'prod_01', quantity: 15, unitCost: 3500, totalCost: 52500 },
          { productId: 'prod_03', quantity: 25, unitCost: 2000, totalCost: 50000 },
          { productId: 'prod_04', quantity: 12, unitCost: 2800, totalCost: 33600 },
          { productId: 'prod_02', quantity: 10, unitCost: 4200, totalCost: 42000 },
        ],
      },
      {
        id: 'batch_02',
        batchNumber: 'BATCH-20260925-01',
        supplierId: 'sup_emeka',
        purchaseDate: daysAgo(5),
        purchaseAmount: 210000,
        transportCost: 7500,
        otherCosts: 3000,
        totalCost: 220500,
        notes: 'Thursday Balogun market trip: Men shirts, denims and branded sneakers.',
        createdById: 'usr_manager',
        items: [
          { productId: 'prod_05', quantity: 20, unitCost: 4000, totalCost: 80000 },
          { productId: 'prod_07', quantity: 15, unitCost: 3200, totalCost: 48000 },
          { productId: 'prod_08', quantity: 8, unitCost: 6500, totalCost: 52000 },
          { productId: 'prod_11', quantity: 5, unitCost: 8000, totalCost: 40000 },
        ],
      },
    ];

    for (const b of batches) {
      await client.query(`
        INSERT INTO purchase_batches (
          id, "batchNumber", "supplierId", "purchaseDate", "purchaseAmount",
          "transportCost", "otherCosts", "totalCost", notes, "createdById",
          "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
      `, [
        b.id, b.batchNumber, b.supplierId, b.purchaseDate, b.purchaseAmount,
        b.transportCost, b.otherCosts, b.totalCost, b.notes, b.createdById
      ]);

      for (const item of b.items) {
        await client.query(`
          INSERT INTO purchase_items (id, "purchaseBatchId", "productId", quantity, "unitCost", "totalCost")
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [
          'pitem_' + b.id + '_' + item.productId,
          b.id, item.productId, item.quantity, item.unitCost, item.totalCost
        ]);
      }
    }

    // 8. Sales History (Covering today and recent days)
    console.log('Creating Sales & Sale Items...');
    const sales = [
      // Today's Sales
      {
        id: 'sale_01',
        saleNumber: 'SALE-20260930-001',
        customerId: 'cust_01',
        subtotal: 17000,
        discount: 1000,
        totalAmount: 16000,
        paymentMethod: 'TRANSFER',
        saleDate: daysAgo(0),
        soldById: 'usr_staff',
        notes: 'Funke bought dress & palazzo. Paid via GTBank transfer.',
        items: [
          { productId: 'prod_01', quantity: 1, unitSellingPrice: 8500, unitCostPrice: 3500, discount: 500, totalAmount: 8000, profit: 4500 },
          { productId: 'prod_04', quantity: 1, unitSellingPrice: 7000, unitCostPrice: 2800, discount: 500, totalAmount: 8000, profit: 5200 },
        ],
      },
      {
        id: 'sale_02',
        saleNumber: 'SALE-20260930-002',
        customerId: 'cust_02',
        subtotal: 9500,
        discount: 0,
        totalAmount: 9500,
        paymentMethod: 'POS',
        saleDate: daysAgo(0),
        soldById: 'usr_staff',
        notes: 'Walk-in corporate customer, card payment.',
        items: [
          { productId: 'prod_05', quantity: 1, unitSellingPrice: 9500, unitCostPrice: 4000, discount: 0, totalAmount: 9500, profit: 5500 },
        ],
      },
      // Yesterday's Sales
      {
        id: 'sale_03',
        saleNumber: 'SALE-20260929-001',
        customerId: 'cust_03',
        subtotal: 24500,
        discount: 1500,
        totalAmount: 23000,
        paymentMethod: 'TRANSFER',
        saleDate: daysAgo(1),
        soldById: 'usr_manager',
        notes: 'Zainab bought emerald dress & leather bag.',
        items: [
          { productId: 'prod_02', quantity: 1, unitSellingPrice: 10500, unitCostPrice: 4200, discount: 500, totalAmount: 10000, profit: 5800 },
          { productId: 'prod_10', quantity: 1, unitSellingPrice: 14000, unitCostPrice: 5500, discount: 1000, totalAmount: 13000, profit: 7500 },
        ],
      },
      // 3 Days Ago
      {
        id: 'sale_04',
        saleNumber: 'SALE-20260927-001',
        customerId: 'cust_04',
        subtotal: 31000,
        discount: 2000,
        totalAmount: 29000,
        paymentMethod: 'CASH',
        saleDate: daysAgo(3),
        soldById: 'usr_staff',
        notes: 'Chioma bought bulk blouses and denim jacket for campus.',
        items: [
          { productId: 'prod_03', quantity: 3, unitSellingPrice: 5500, unitCostPrice: 2000, discount: 1000, totalAmount: 15500, profit: 9500 },
          { productId: 'prod_08', quantity: 1, unitSellingPrice: 15500, unitCostPrice: 6500, discount: 1000, totalAmount: 14500, profit: 8000 },
        ],
      },
      // 7 Days Ago
      {
        id: 'sale_05',
        saleNumber: 'SALE-20260923-001',
        customerId: 'cust_05',
        subtotal: 15000,
        discount: 1000,
        totalAmount: 14000,
        paymentMethod: 'POS',
        saleDate: daysAgo(7),
        soldById: 'usr_manager',
        notes: 'Emeka bought chinos and cotton shirt.',
        items: [
          { productId: 'prod_07', quantity: 1, unitSellingPrice: 7500, unitCostPrice: 3200, discount: 500, totalAmount: 7000, profit: 3800 },
          { productId: 'prod_05', quantity: 1, unitSellingPrice: 9500, unitCostPrice: 4000, discount: 500, totalAmount: 7000, profit: 3000 },
        ],
      },
      // 14 Days Ago
      {
        id: 'sale_06',
        saleNumber: 'SALE-20260916-001',
        customerId: null,
        subtotal: 19500,
        discount: 500,
        totalAmount: 19000,
        paymentMethod: 'CASH',
        saleDate: daysAgo(14),
        soldById: 'usr_staff',
        notes: 'Walk-in customer bought Nike sneakers.',
        items: [
          { productId: 'prod_11', quantity: 1, unitSellingPrice: 19500, unitCostPrice: 8000, discount: 500, totalAmount: 19000, profit: 11000 },
        ],
      },
    ];

    for (const s of sales) {
      await client.query(`
        INSERT INTO sales (
          id, "saleNumber", "customerId", subtotal, discount, "totalAmount",
          "paymentMethod", "saleDate", "soldById", notes, "createdAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `, [
        s.id, s.saleNumber, s.customerId, s.subtotal, s.discount, s.totalAmount,
        s.paymentMethod, s.saleDate, s.soldById, s.notes, s.saleDate
      ]);

      for (const si of s.items) {
        await client.query(`
          INSERT INTO sale_items (
            id, "saleId", "productId", quantity, "unitSellingPrice", "unitCostPrice",
            discount, "totalAmount", profit
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [
          'sitem_' + s.id + '_' + si.productId,
          s.id, si.productId, si.quantity, si.unitSellingPrice, si.unitCostPrice,
          si.discount, si.totalAmount, si.profit
        ]);

        // Add SALE stock movement
        await client.query(`
          INSERT INTO stock_movements (id, "productId", type, quantity, "referenceId", notes, "createdById", "createdAt")
          VALUES ($1, $2, 'SALE', $3, $4, $5, $6, $7)
        `, [
          'mov_sale_' + s.id + '_' + si.productId,
          si.productId, -si.quantity, s.id, `Sale ${s.saleNumber}`, s.soldById, s.saleDate
        ]);
      }
    }

    // 9. Expenses
    console.log('Creating Expenses...');
    const expenses = [
      { id: 'exp_01', category: 'TRANSPORT', description: 'Logistics fare to Katangua market for Thursday purchasing', amount: 8500, date: daysAgo(5), userId: 'usr_owner' },
      { id: 'exp_02', category: 'PACKAGING', description: 'Branded nylon shopping bags and price tagging pins', amount: 14000, date: daysAgo(10), userId: 'usr_manager' },
      { id: 'exp_03', category: 'ELECTRICITY', description: 'Monthly EKEDC token and generator fuel for shop display lights', amount: 22000, date: daysAgo(8), userId: 'usr_owner' },
      { id: 'exp_04', category: 'STAFF', description: 'Weekly lunch & transport allowance for Blessing', amount: 12500, date: daysAgo(2), userId: 'usr_owner' },
      { id: 'exp_05', category: 'MARKET_EXPENSE', description: 'Market gate fee, wheelbarrow porter & bale opening fee at Katangua', amount: 6000, date: daysAgo(5), userId: 'usr_manager' },
      { id: 'exp_06', category: 'MARKETING', description: 'Instagram sponsored post for weekend thrift drops', amount: 10000, date: daysAgo(4), userId: 'usr_owner' },
    ];

    for (const e of expenses) {
      await client.query(`
        INSERT INTO expenses (id, category, description, amount, "expenseDate", "createdById", "createdAt")
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [e.id, e.category, e.description, e.amount, e.date, e.userId, e.date]);
    }

    // 10. Thursday Purchasing Plan
    console.log('Creating Thursday Purchasing Plan...');
    await client.query(`
      INSERT INTO purchasing_plans (id, "planDate", status, "createdAt", "updatedAt")
      VALUES ($1, NOW() + INTERVAL '1 day', 'READY', NOW(), NOW())
    `, ['plan_next_thursday']);

    const planItems = [
      { categoryId: 'cat_dresses', currentStock: 10, avgSales: 8.5, recQty: 12, actual: 0, notes: 'Focus on floral wrap & dinner midi dresses' },
      { categoryId: 'cat_m_shirts', currentStock: 12, avgSales: 7.2, recQty: 10, actual: 0, notes: 'High demand for Ralph Lauren and striped Oxford shirts' },
      { categoryId: 'cat_w_trousers', currentStock: 6, avgSales: 5.0, recQty: 8, actual: 0, notes: 'Get more palazzo and mom jeans sizes 28-34' },
      { categoryId: 'cat_shoes', currentStock: 2, avgSales: 3.5, recQty: 6, actual: 0, notes: 'Restock clean sneakers sizes 41-44' },
      { categoryId: 'cat_w_tops', currentStock: 22, avgSales: 6.0, recQty: 0, actual: 0, notes: 'Current stock is sufficient for 3 weeks' },
    ];

    for (const pi of planItems) {
      await client.query(`
        INSERT INTO purchasing_plan_items (
          id, "planId", "categoryId", "currentStock", "averageWeeklySales",
          "recommendedQuantity", "actualQuantityPurchased", notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        'pi_' + pi.categoryId, 'plan_next_thursday', pi.categoryId,
        pi.currentStock, pi.avgSales, pi.recQty, pi.actual, pi.notes
      ]);
    }

    // 11. Social Posts
    console.log('Creating Social Posts...');
    const socialPosts = [
      {
        id: 'post_01',
        productId: 'prod_01',
        platform: 'WHATSAPP',
        caption: `✨ *NEW ARRIVAL AT ELEGANCE THRIFT HAVEN* ✨\n\n👗 *Item:* Vintage Floral Chiffon Wrap Dress\n🏷️ Brand: Zara\n📏 *Size:* M\n⭐ *Condition:* Grade A (First Selection - Like New)\n💰 *Price:* ₦8,500\n\n📍 *Shop Location:* Shop 14, Block B, Katangua Main Complex, Super B/Stop, Lagos\n🚚 Fast delivery available across Lagos & nationwide!\n\n📲 *To order or claim:* Reply to this status or WhatsApp +234 803 123 4567\n⚡ Only 1 piece available! Fastest finger wins.`,
        imageUrl: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=600&q=80',
        status: 'READY',
      },
      {
        id: 'post_02',
        productId: 'prod_05',
        platform: 'INSTAGRAM',
        caption: `✨ Fresh Thrift Pick! ✨\n\nTommy Hilfiger Striped Oxford Shirt in stunning condition.\n\nDETAILS:\n• Size: L\n• Brand: Tommy Hilfiger\n• Quality: Grade A (First Selection - Like New)\n• Price: ₦9,500\n\n📍 Visit us: Shop 14, Block B, Katangua Main Complex, Super B/Stop, Lagos\n📦 We deliver doorstep nationwide!\n\nHOW TO ORDER:\n1. Send a DM with screenshot\n2. Or WhatsApp us via link in bio (+234 803 123 4567)\n\n#lagosthrift #thriftlagos #okrikaonline #katanguamarket #yabathrift #nigerianfashion #sustainablefashionng #menshirts`,
        imageUrl: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=600&q=80',
        status: 'POSTED',
      },
    ];

    for (const sp of socialPosts) {
      await client.query(`
        INSERT INTO social_posts (id, "productId", platform, caption, "imageUrl", status, "createdAt")
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
      `, [sp.id, sp.productId, sp.platform, sp.caption, sp.imageUrl, sp.status]);
    }

    // 12. Audit Logs
    console.log('Creating initial Audit Logs...');
    await client.query(`
      INSERT INTO audit_logs (id, "userId", action, entity, "entityId", description, "createdAt")
      VALUES 
      ('aud_01', 'usr_owner', 'DATABASE_SEED', 'System', null, 'Initial database setup and demo inventory seed loaded', NOW()),
      ('aud_02', 'usr_owner', 'CREATE_PURCHASE_BATCH', 'PurchaseBatch', 'batch_01', 'Recorded Thursday Katangua opening bale (₦195,500 total)', NOW() - INTERVAL '12 days'),
      ('aud_03', 'usr_staff', 'CREATE_SALE', 'Sale', 'sale_01', 'Processed Sale SALE-20260930-001 for Funke Akindele (₦16,000)', NOW())
    `);

    await client.query('COMMIT');
    console.log('✅ ClothShop Manager database seeded successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Error during seeding:', err);
    throw err;
  } finally {
    client.release();
  }
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
