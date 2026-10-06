const express = require('express');
const path = require('path');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const Database = require('better-sqlite3');

const app = express();
const PORT = process.env.PORT || 3000;
const db = new Database(path.join(__dirname, 'qualibuy.db'));

db.pragma('journal_mode = WAL');

function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      category TEXT NOT NULL,
      image TEXT NOT NULL,
      description TEXT,
      keywords TEXT,
      quality_score INTEGER NOT NULL,
      rating INTEGER NOT NULL,
      availability TEXT NOT NULL,
      overall_quality INTEGER NOT NULL,
      material_quality INTEGER NOT NULL,
      build_quality INTEGER NOT NULL,
      durability INTEGER NOT NULL,
      performance INTEGER NOT NULL,
      user_rating INTEGER NOT NULL,
      seller_reliability INTEGER NOT NULL,
      strengths TEXT,
      weak_points TEXT,
      important_info TEXT,
      best_use_case TEXT,
      value_for_money TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS shops (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      rating INTEGER NOT NULL DEFAULT 0,
      reliability INTEGER NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS product_shop (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      shop_id INTEGER NOT NULL,
      price REAL NOT NULL,
      availability TEXT NOT NULL,
      quality_score INTEGER NOT NULL,
      rating INTEGER NOT NULL,
      seller_reliability INTEGER NOT NULL,
      value_score INTEGER NOT NULL,
      stock_status TEXT,
      shipping TEXT,
      FOREIGN KEY(product_id) REFERENCES products(id),
      FOREIGN KEY(shop_id) REFERENCES shops(id),
      UNIQUE(product_id, shop_id)
    );

    CREATE TABLE IF NOT EXISTS favorites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, product_id),
      FOREIGN KEY(user_id) REFERENCES users(id),
      FOREIGN KEY(product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS comparisons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      shop_ids TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id),
      FOREIGN KEY(product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS recent_views (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      viewed_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, product_id),
      FOREIGN KEY(user_id) REFERENCES users(id),
      FOREIGN KEY(product_id) REFERENCES products(id)
    );
  `);
}

function ensureSeedData() {
  const productCount = db.prepare('SELECT COUNT(*) AS count FROM products').get().count;
  if (productCount > 0) return;

  const products = [
    {
      name: 'Aero Wireless Headphones',
      slug: 'aero-wireless-headphones',
      category: 'Electronics',
      image: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=900&q=80',
      description: 'Premium wireless headphones with noise cancelling, deep bass, and all-day comfort.',
      keywords: 'headphones, audio, earbuds, headphones under 3000, हेडफ़ोन, శబ్దాలు, ഇന്റര്നെറ്റ്',
      quality_score: 92,
      rating: 4.8,
      availability: 'In Stock',
      overall_quality: 92,
      material_quality: 90,
      build_quality: 88,
      durability: 85,
      performance: 95,
      user_rating: 89,
      seller_reliability: 91,
      strengths: JSON.stringify(['Excellent noise canceling', 'Comfortable long-wear design', 'Strong battery life']),
      weak_points: JSON.stringify(['Premium pricing', 'No USB-C charging case']),
      important_info: JSON.stringify(['40-hour battery life', 'Fast pairing support', 'Includes carrying case']),
      best_use_case: 'Travel, focus sessions, and daily commuting',
      value_for_money: 'High value for music lovers and remote workers'
    },
    {
      name: 'Velocity Running Shoes',
      slug: 'velocity-running-shoes',
      category: 'Footwear',
      image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80',
      description: 'Lightweight running shoes designed for speed, cushioning, and all-day comfort.',
      keywords: 'shoes, sneakers, sports shoes, trainers, running footwear, காலணி, జోడి, ചെരിപ്പ്',
      quality_score: 87,
      rating: 4.7,
      availability: 'Available',
      overall_quality: 87,
      material_quality: 86,
      build_quality: 84,
      durability: 82,
      performance: 90,
      user_rating: 88,
      seller_reliability: 86,
      strengths: JSON.stringify(['Responsive sole', 'Lightweight feel', 'Breathable fabric']),
      weak_points: JSON.stringify(['Slightly narrow fit', 'White color may stain fast']),
      important_info: JSON.stringify(['Foam midsole', 'Good grip for city runs', 'Mesh upper']),
      best_use_case: 'Daily running, gym sessions, and walking',
      value_for_money: 'Very good value for sports-focused buyers'
    },
    {
      name: 'Echo Smartwatch Pro',
      slug: 'echo-smartwatch-pro',
      category: 'Wearables',
      image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80',
      description: 'Feature-rich smartwatch with health tracking, fitness goals, and fast notifications.',
      keywords: 'smartwatch, watch, wearable, fitness tracker, घड़ी, గడియారం, സ്മാർട്ട്‌വാച്ച്',
      quality_score: 89,
      rating: 4.6,
      availability: 'In Stock',
      overall_quality: 89,
      material_quality: 84,
      build_quality: 88,
      durability: 87,
      performance: 91,
      user_rating: 90,
      seller_reliability: 88,
      strengths: JSON.stringify(['Good heart tracking', 'Brighter display', 'Strong app support']),
      weak_points: JSON.stringify(['Charging cable not included', 'Average speaker volume']),
      important_info: JSON.stringify(['7-day battery', 'Water resistant', 'GPS enabled']),
      best_use_case: 'Fitness tracking and daily productivity',
      value_for_money: 'Strong everyday watch option with premium features'
    },
    {
      name: 'Nova 4K Smart TV',
      slug: 'nova-4k-smart-tv',
      category: 'Electronics',
      image: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=900&q=80',
      description: 'Large 4K display with vivid HDR visuals and a streamlined smart platform.',
      keywords: 'TV, television, smart tv, 4k tv, टीवी, టీవీ, ചിത്രപ്പട്ട',
      quality_score: 90,
      rating: 4.7,
      availability: 'Available',
      overall_quality: 90,
      material_quality: 89,
      build_quality: 88,
      durability: 86,
      performance: 93,
      user_rating: 91,
      seller_reliability: 89,
      strengths: JSON.stringify(['Excellent picture sharpness', 'Smooth smart interface', 'Great sound for size']),
      weak_points: JSON.stringify(['Base stand is large', 'App support is limited']),
      important_info: JSON.stringify(['55-inch display', 'HDR10 support', 'Voice assistant enabled']),
      best_use_case: 'Living room entertainment and gaming',
      value_for_money: 'Excellent value for large-screen entertainment'
    },
    {
      name: 'Summit Hiking Backpack',
      slug: 'summit-hiking-backpack',
      category: 'Accessories',
      image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80',
      description: 'Durable backpack built for hikes, commutes, and daily travel needs.',
      keywords: 'backpack, bag, travel bag, backpack under 2000, थैला, బ్యాగ్, ബാഗ്',
      quality_score: 84,
      rating: 4.4,
      availability: 'Limited Stock',
      overall_quality: 84,
      material_quality: 87,
      build_quality: 83,
      durability: 88,
      performance: 82,
      user_rating: 84,
      seller_reliability: 85,
      strengths: JSON.stringify(['Weather-resistant body', 'Large storage pockets', 'Comfortable straps']),
      weak_points: JSON.stringify(['No dedicated laptop sleeve', 'Zippers can feel stiff']),
      important_info: JSON.stringify(['45L capacity', 'Water resistant', 'Padded shoulder support']),
      best_use_case: 'Travel, hiking, and college carry',
      value_for_money: 'Good value for outdoor and daily use'
    },
    {
      name: 'ChefBlend Mixer',
      slug: 'chefblend-mixer',
      category: 'Home Appliances',
      image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=900&q=80',
      description: 'Powerful kitchen mixer for smoothies, juices, and quick food prep.',
      keywords: 'mixer, blender, kitchen appliance, mixer under 4000, ब्लेंडर, మిక్సర్, മിക്സർ',
      quality_score: 83,
      rating: 4.5,
      availability: 'Available',
      overall_quality: 83,
      material_quality: 81,
      build_quality: 82,
      durability: 80,
      performance: 88,
      user_rating: 85,
      seller_reliability: 84,
      strengths: JSON.stringify(['Strong motor', 'Fast blending', 'Easy-clean jar']),
      weak_points: JSON.stringify(['Noise is noticeable', 'Jar may feel heavy']),
      important_info: JSON.stringify(['1.5L jar', '3 speed settings', 'Good for daily prep']),
      best_use_case: 'Smoothies, shakes, and kitchen prep',
      value_for_money: 'Affordable and functional for regular home use'
    }
  ];

  const shopData = [
    { name: 'Amazon', rating: 4.8, reliability: 92 },
    { name: 'Flipkart', rating: 4.6, reliability: 88 },
    { name: 'Myntra', rating: 4.5, reliability: 86 },
    { name: 'Croma', rating: 4.7, reliability: 90 },
    { name: 'Snapdeal', rating: 4.2, reliability: 75 }
  ];

  const insertShop = db.prepare('INSERT INTO shops (name, rating, reliability) VALUES (@name, @rating, @reliability)');
  const insertProduct = db.prepare(`
    INSERT INTO products (
      name, slug, category, image, description, keywords,
      quality_score, rating, availability, overall_quality,
      material_quality, build_quality, durability, performance,
      user_rating, seller_reliability, strengths, weak_points,
      important_info, best_use_case, value_for_money
    ) VALUES (
      @name, @slug, @category, @image, @description, @keywords,
      @quality_score, @rating, @availability, @overall_quality,
      @material_quality, @build_quality, @durability, @performance,
      @user_rating, @seller_reliability, @strengths, @weak_points,
      @important_info, @best_use_case, @value_for_money
    )
  `);

  shopData.forEach(shop => insertShop.run(shop));

  const shops = db.prepare('SELECT * FROM shops').all();
  const shopMap = Object.fromEntries(shops.map(shop => [shop.name, shop.id]));

  const productShopInsert = db.prepare(`
    INSERT INTO product_shop (
      product_id, shop_id, price, availability, quality_score,
      rating, seller_reliability, value_score, stock_status, shipping
    ) VALUES (
      @product_id, @shop_id, @price, @availability, @quality_score,
      @rating, @seller_reliability, @value_score, @stock_status, @shipping
    )
  `);

  const productSeeds = [
    {
      product: products[0],
      offers: [
        { shop: 'Amazon', price: 14999, quality_score: 95, rating: 4.8, seller_reliability: 93, value_score: 94, availability: 'In Stock', stock_status: 'Ready to ship', shipping: 'Free delivery' },
        { shop: 'Flipkart', price: 15750, quality_score: 92, rating: 4.7, seller_reliability: 89, value_score: 90, availability: 'In Stock', stock_status: 'Fast dispatch', shipping: '2-day delivery' },
        { shop: 'Croma', price: 16249, quality_score: 94, rating: 4.8, seller_reliability: 91, value_score: 92, availability: 'Available', stock_status: 'Limited stock', shipping: '1-day delivery' }
      ]
    },
    {
      product: products[1],
      offers: [
        { shop: 'Amazon', price: 2999, quality_score: 87, rating: 4.7, seller_reliability: 88, value_score: 88, availability: 'Available', stock_status: 'Ready to ship', shipping: 'Free delivery' },
        { shop: 'Myntra', price: 3299, quality_score: 84, rating: 4.5, seller_reliability: 82, value_score: 84, availability: 'In Stock', stock_status: 'Limited stock', shipping: '2-day delivery' },
        { shop: 'Snapdeal', price: 2799, quality_score: 82, rating: 4.3, seller_reliability: 75, value_score: 80, availability: 'Limited Stock', stock_status: 'Low stock', shipping: '3-day delivery' }
      ]
    },
    {
      product: products[2],
      offers: [
        { shop: 'Amazon', price: 9999, quality_score: 91, rating: 4.7, seller_reliability: 90, value_score: 90, availability: 'In Stock', stock_status: 'Ready to ship', shipping: 'Free delivery' },
        { shop: 'Flipkart', price: 10499, quality_score: 88, rating: 4.6, seller_reliability: 87, value_score: 87, availability: 'Available', stock_status: 'Fast dispatch', shipping: '2-day delivery' },
        { shop: 'Croma', price: 10999, quality_score: 90, rating: 4.7, seller_reliability: 89, value_score: 89, availability: 'In Stock', stock_status: 'Low stock', shipping: '1-day delivery' }
      ]
    },
    {
      product: products[3],
      offers: [
        { shop: 'Amazon', price: 42999, quality_score: 92, rating: 4.8, seller_reliability: 92, value_score: 91, availability: 'Available', stock_status: 'Ready to ship', shipping: 'Free delivery' },
        { shop: 'Flipkart', price: 44999, quality_score: 89, rating: 4.6, seller_reliability: 88, value_score: 88, availability: 'In Stock', stock_status: 'Fast dispatch', shipping: '2-day delivery' },
        { shop: 'Croma', price: 43999, quality_score: 90, rating: 4.7, seller_reliability: 91, value_score: 90, availability: 'Available', stock_status: 'Limited stock', shipping: '1-day delivery' }
      ]
    },
    {
      product: products[4],
      offers: [
        { shop: 'Amazon', price: 2399, quality_score: 85, rating: 4.5, seller_reliability: 84, value_score: 86, availability: 'Limited Stock', stock_status: 'Low stock', shipping: 'Free delivery' },
        { shop: 'Myntra', price: 2499, quality_score: 83, rating: 4.4, seller_reliability: 82, value_score: 83, availability: 'Available', stock_status: 'Ready to ship', shipping: '2-day delivery' },
        { shop: 'Snapdeal', price: 2199, quality_score: 80, rating: 4.3, seller_reliability: 77, value_score: 79, availability: 'Limited Stock', stock_status: 'Low stock', shipping: '3-day delivery' }
      ]
    },
    {
      product: products[5],
      offers: [
        { shop: 'Amazon', price: 3799, quality_score: 84, rating: 4.6, seller_reliability: 85, value_score: 86, availability: 'Available', stock_status: 'Ready to ship', shipping: 'Free delivery' },
        { shop: 'Flipkart', price: 3899, quality_score: 82, rating: 4.4, seller_reliability: 83, value_score: 82, availability: 'In Stock', stock_status: 'Fast dispatch', shipping: '2-day delivery' },
        { shop: 'Croma', price: 3650, quality_score: 86, rating: 4.6, seller_reliability: 88, value_score: 87, availability: 'Available', stock_status: 'Limited stock', shipping: '1-day delivery' }
      ]
    }
  ];

  productSeeds.forEach(({ product, offers }) => {
    const insertedProduct = insertProduct.run(product);
    offers.forEach(offer => {
      productShopInsert.run({
        product_id: insertedProduct.lastInsertRowid,
        shop_id: shopMap[offer.shop],
        price: offer.price,
        availability: offer.availability,
        quality_score: offer.quality_score,
        rating: offer.rating,
        seller_reliability: offer.seller_reliability,
        value_score: offer.value_score,
        stock_status: offer.stock_status,
        shipping: offer.shipping
      });
    });
  });
}

initializeDatabase();
ensureSeedData();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: 'qualibuy-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax', maxAge: 1000 * 60 * 60 * 24 * 7 }
}));

function getCurrentUser(req) {
  if (!req.session || !req.session.userId) return null;
  return db.prepare('SELECT id, name, email FROM users WHERE id = ?').get(req.session.userId);
}

function parseProductRow(row) {
  if (!row) return null;
  return {
    ...row,
    strengths: row.strengths ? JSON.parse(row.strengths) : [],
    weak_points: row.weak_points ? JSON.parse(row.weak_points) : [],
    important_info: row.important_info ? JSON.parse(row.important_info) : [],
    comparison_shops: []
  };
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: 'QualiBuy' });
});

app.get('/api/categories', (req, res) => {
  const categories = db.prepare('SELECT DISTINCT category AS name FROM products ORDER BY category').all();
  res.json(categories);
});

app.get('/api/shops', (req, res) => {
  const shops = db.prepare('SELECT id, name FROM shops ORDER BY name').all();
  res.json(shops);
});

app.get('/api/products', (req, res) => {
  const { q = '', category = 'all', minPrice, maxPrice, quality, availability = 'all', shop = 'all', sort = 'best-value' } = req.query;
  const query = String(q || '').trim();
  const categoryFilter = category !== 'all' ? category : null;
  const min = minPrice ? Number(minPrice) : null;
  const max = maxPrice ? Number(maxPrice) : null;
  const qualityMin = quality ? Number(quality) : null;
  const stockFilter = availability !== 'all' ? availability : null;
  const shopFilter = shop !== 'all' ? shop : null;

  let sql = `
    SELECT p.*
    FROM products p
    LEFT JOIN product_shop ps ON ps.product_id = p.id
    LEFT JOIN shops s ON s.id = ps.shop_id
    WHERE 1 = 1
  `;
  const params = [];

  if (query) {
    sql += ` AND (LOWER(p.name) LIKE ? OR LOWER(p.category) LIKE ? OR LOWER(p.keywords) LIKE ? OR LOWER(p.description) LIKE ?)`;
    const value = `%${query.toLowerCase()}%`;
    params.push(value, value, value, value);
  }

  if (categoryFilter) {
    sql += ' AND p.category = ?';
    params.push(categoryFilter);
  }

  if (min !== null) {
    sql += ' AND ps.price >= ?';
    params.push(min);
  }

  if (max !== null) {
    sql += ' AND ps.price <= ?';
    params.push(max);
  }

  if (qualityMin !== null) {
    sql += ' AND p.quality_score >= ?';
    params.push(qualityMin);
  }

  if (stockFilter) {
    const normalized = stockFilter === 'available' ? 'Available' : stockFilter;
    sql += ' AND ps.availability = ?';
    params.push(normalized);
  }

  if (shopFilter) {
    sql += ' AND s.name = ?';
    params.push(shopFilter);
  }

  sql += ' GROUP BY p.id';

  if (sort === 'lowest-price') {
    sql += ' ORDER BY MIN(ps.price) ASC';
  } else if (sort === 'highest-quality') {
    sql += ' ORDER BY p.quality_score DESC';
  } else if (sort === 'best-value') {
    sql += ' ORDER BY (p.quality_score + p.rating * 10) DESC';
  } else if (sort === 'most-available') {
    sql += ' ORDER BY COUNT(ps.id) DESC';
  } else {
    sql += ' ORDER BY p.quality_score DESC';
  }

  const rows = db.prepare(sql).all(...params);
  const products = rows.map((row) => {
    const product = parseProductRow(row);
    const offers = db.prepare(`
      SELECT s.name AS shop_name, ps.price, ps.availability, ps.quality_score, ps.rating, ps.seller_reliability, ps.value_score, ps.stock_status, ps.shipping
      FROM product_shop ps
      JOIN shops s ON s.id = ps.shop_id
      WHERE ps.product_id = ?
      ORDER BY ps.value_score DESC, ps.price ASC
    `).all(product.id);

    product.comparison_shops = offers;
    product.lowest_price = offers.length ? Math.min(...offers.map((offer) => Number(offer.price))) : 0;
    product.availability = offers.length ? offers[0].availability : product.availability;
    return product;
  });

  res.json(products.slice(0, 40));
});

app.get('/api/products/:id', (req, res) => {
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }

  const shops = db.prepare(`
    SELECT s.name AS shop_name, ps.price, ps.availability, ps.quality_score, ps.rating, ps.seller_reliability, ps.value_score, ps.stock_status, ps.shipping
    FROM product_shop ps
    JOIN shops s ON s.id = ps.shop_id
    WHERE ps.product_id = ?
    ORDER BY ps.value_score DESC, ps.price ASC
  `).all(req.params.id);

  const normalized = parseProductRow(product);
  normalized.comparison_shops = shops;
  normalized.lowest_price = Math.min(...shops.map(item => Number(item.price)));
  normalized.highest_quality = Math.max(...shops.map(item => Number(item.quality_score)));
  normalized.best_value = shops.reduce((best, current) => (Number(current.value_score) > Number(best.value_score) ? current : best), shops[0] || {});
  normalized.best_seller = shops.reduce((best, current) => (Number(current.seller_reliability) > Number(best.seller_reliability) ? current : best), shops[0] || {});

  if (req.session && req.session.userId) {
    db.prepare('INSERT OR IGNORE INTO recent_views (user_id, product_id) VALUES (?, ?)').run(req.session.userId, req.params.id);
  }

  res.json(normalized);
});

app.get('/api/compare/:productId', (req, res) => {
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id || req.params.productId);
  if (!product) return res.status(404).json({ message: 'Product not found' });

  const shops = db.prepare(`
    SELECT s.name AS shop_name, ps.price, ps.availability, ps.quality_score, ps.rating, ps.value_score, ps.seller_reliability, ps.stock_status, ps.shipping
    FROM product_shop ps
    JOIN shops s ON s.id = ps.shop_id
    WHERE ps.product_id = ?
    ORDER BY ps.value_score DESC, ps.price ASC
  `).all(req.params.id || req.params.productId);

  res.json({ product, shops });
});

app.post('/api/register', (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || !email || !password || password.length < 6) {
    return res.status(400).json({ message: 'Valid name, email and password (6+ chars) are required.' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
  if (existing) {
    return res.status(409).json({ message: 'An account with this email already exists.' });
  }

  const passwordHash = bcrypt.hashSync(password, 10);
  const result = db.prepare('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)').run(name.trim(), email.toLowerCase(), passwordHash);
  req.session.userId = result.lastInsertRowid;

  res.json({ message: 'Registration successful', user: { id: result.lastInsertRowid, name: name.trim(), email: email.toLowerCase() } });
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(String(email).toLowerCase());
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const valid = bcrypt.compareSync(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  req.session.userId = user.id;
  res.json({ message: 'Login successful', user: { id: user.id, name: user.name, email: user.email } });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ message: 'Logged out successfully' });
  });
});

app.get('/api/profile', (req, res) => {
  const user = getCurrentUser(req);
  if (!user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  const favorites = db.prepare(`
    SELECT p.*
    FROM favorites f
    JOIN products p ON p.id = f.product_id
    WHERE f.user_id = ?
    ORDER BY f.created_at DESC
  `).all(user.id).map(parseProductRow);

  const comparisons = db.prepare(`
    SELECT c.*, p.name AS product_name
    FROM comparisons c
    JOIN products p ON p.id = c.product_id
    WHERE c.user_id = ?
    ORDER BY c.created_at DESC
  `).all(user.id);

  const history = db.prepare(`
    SELECT p.*
    FROM recent_views rv
    JOIN products p ON p.id = rv.product_id
    WHERE rv.user_id = ?
    ORDER BY rv.viewed_at DESC
    LIMIT 6
  `).all(user.id).map(parseProductRow);

  res.json({ user, favorites, comparisons, history });
});

app.post('/api/favorites/:productId', (req, res) => {
  const user = getCurrentUser(req);
  if (!user) return res.status(401).json({ message: 'Login required' });

  const product = db.prepare('SELECT id FROM products WHERE id = ?').get(req.params.productId);
  if (!product) return res.status(404).json({ message: 'Product not found' });

  db.prepare('INSERT OR IGNORE INTO favorites (user_id, product_id) VALUES (?, ?)').run(user.id, product.id);
  res.json({ message: 'Saved product' });
});

app.delete('/api/favorites/:productId', (req, res) => {
  const user = getCurrentUser(req);
  if (!user) return res.status(401).json({ message: 'Login required' });

  db.prepare('DELETE FROM favorites WHERE user_id = ? AND product_id = ?').run(user.id, req.params.productId);
  res.json({ message: 'Removed product from saved list' });
});

app.post('/api/compare', (req, res) => {
  const user = getCurrentUser(req);
  if (!user) return res.status(401).json({ message: 'Login required' });

  const { productId, shopIds } = req.body || {};
  if (!productId || !Array.isArray(shopIds) || !shopIds.length) {
    return res.status(400).json({ message: 'A product and at least one shop selection are required.' });
  }

  db.prepare('INSERT INTO comparisons (user_id, product_id, shop_ids) VALUES (?, ?, ?)').run(user.id, productId, JSON.stringify(shopIds));
  res.json({ message: 'Comparison saved' });
});

app.get('/api/auth/session', (req, res) => {
  const user = getCurrentUser(req);
  res.json({ user });
});

app.use(express.static(path.join(__dirname, 'public')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`QualiBuy app running at http://localhost:${PORT}`);
});
