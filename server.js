const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const multer = require('multer');
const { MongoClient, ObjectId } = require('mongodb');
const cloudinary = require('cloudinary').v2;
require('dotenv').config();

// Ensure reliable DNS resolution for MongoDB Atlas SRV connection strings
const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (_) {}

const app = express();
const PORT = process.env.PORT || 3000;

// Enable JSON and URL-encoded body parsing
app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Ensure upload & data directories exist
const uploadsDir = path.join(__dirname, 'public', 'uploads');
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

// Serve static frontend files from 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// Configure Multer (memory storage for flexible Cloudinary/local fallback routing)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// Configure Cloudinary
function getCloudinaryConfig() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  const isConfigured = Boolean(cloudName && apiKey && apiSecret && apiKey !== 'your_api_key');
  if (isConfigured) {
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret
    });
  }
  return { isConfigured, cloudName };
}

// Upload helper: uploads to Cloudinary if configured; otherwise saves to public/uploads
async function handleImageUpload(file, originalUrl) {
  if (originalUrl && !file) {
    return originalUrl;
  }
  if (!file) {
    return '/uploads/product1.png';
  }

  const { isConfigured } = getCloudinaryConfig();

  if (isConfigured) {
    try {
      const uploadResult = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: 'product_marketing/products',
            resource_type: 'image'
          },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        );
        stream.end(file.buffer);
      });
      return uploadResult.secure_url;
    } catch (err) {
      console.warn('⚠️ Cloudinary upload failed, falling back to local file storage:', err.message);
    }
  }

  // Local fallback storage
  const ext = path.extname(file.originalname) || '.png';
  const safeName = `product_${Date.now()}_${Math.random().toString(36).substring(2, 7)}${ext}`;
  const filePath = path.join(uploadsDir, safeName);
  fs.writeFileSync(filePath, file.buffer);
  return `/uploads/${safeName}`;
}

// Default Seed Products
const DEFAULT_PRODUCTS = [
  {
    title: 'Lumière Celestial Gold Makeup Vault',
    category: 'Beauty & Cosmetics',
    price: 129.99,
    originalPrice: 189.99,
    stock: 35,
    badge: 'Best Seller',
    rating: 4.9,
    reviewsCount: 128,
    image: '/uploads/product1.png',
    description: 'Exclusive luxury master beauty collection with high-pigment velvety eyeshadow palette, luminescent highlighter powder, radiant lip lacquer, and ultra-soft artisan brushes.',
    features: [
      'Ultra-pigmented shimmer & velvet matte finishes',
      'Dermatologist tested, vegan & cruelty-free formula',
      '18-hour crease-proof all-day wear',
      'Includes gold compact mirror & luxury velvet case'
    ],
    isFeatured: true,
    createdAt: new Date().toISOString()
  },
  {
    title: 'SŌKE Minimalist Botanical Skincare Ritual (7-Piece Set)',
    category: 'Skincare & Wellness',
    price: 89.50,
    originalPrice: 115.00,
    stock: 50,
    badge: 'Staff Pick',
    rating: 4.8,
    reviewsCount: 94,
    image: '/uploads/product2.png',
    description: 'Clean, dermatologist-formulated morning-to-night skincare ritual. Restores the moisture barrier, refines pores, and deeply hydrates with active botanical extracts.',
    features: [
      '100% Vegan & cruelty-free botanical ingredients',
      'pH balanced with Centella Asiatica & Niacinamide',
      'Sustainable amber glass packaging with precision pump',
      'Non-comedogenic, clinically tested for sensitive skin'
    ],
    isFeatured: true,
    createdAt: new Date().toISOString()
  },
  {
    title: 'Organic Farm-Fresh Gourmet Harvest Basket',
    category: 'Fresh Gourmet',
    price: 49.99,
    originalPrice: 65.00,
    stock: 25,
    badge: 'Organic Farm',
    rating: 5.0,
    reviewsCount: 215,
    image: '/uploads/product3.png',
    description: 'Hand-picked same-day farm harvest basket containing premium seasonal fruits, heirloom organic vegetables, cold-pressed artisanal juice, and extra virgin olive oil.',
    features: [
      'Direct from certified local organic family farms',
      'Harvested and packed within 12 hours of dispatch',
      'Zero synthetic pesticides or artificial preservatives',
      'Eco-friendly reusable wire basket with chilled thermal pack'
    ],
    isFeatured: true,
    createdAt: new Date().toISOString()
  },
  {
    title: 'AeroTitanium Chrono X-1 Smartwatch',
    category: 'Wearable Tech',
    price: 249.00,
    originalPrice: 320.00,
    stock: 18,
    badge: 'Trending',
    rating: 4.9,
    reviewsCount: 340,
    image: '/uploads/product4.jpg',
    description: 'Aerospace-grade titanium chassis with curved sapphire crystal, always-on Retina AMOLED display, 14-day battery life, and comprehensive ECG & biometric tracking.',
    features: [
      'Titanium Grade-5 casing with Milanese magnetic mesh loop',
      '14-day continuous battery life on single charge',
      '50M waterproof rating with precision dual-band GPS',
      'Real-time SpO2, sleep stages & cardiac stress analytics'
    ],
    isFeatured: true,
    createdAt: new Date().toISOString()
  },
  {
    title: 'Aurora Noir ANC Studio Wireless Headphones',
    category: 'Audio & Acoustics',
    price: 179.00,
    originalPrice: 229.00,
    stock: 42,
    badge: 'Hot Deal',
    rating: 4.9,
    reviewsCount: 182,
    image: '/uploads/product5.jpg',
    description: 'Audiophile-grade studio acoustic sound with hybrid 45dB Active Noise Cancellation, memory foam comfort pads, 40-hour playtime, and fast USB-C charge.',
    features: [
      'Custom 40mm beryllium diaphragm drivers for crisp detail',
      'Hybrid Active Noise Cancellation with Transparency mode',
      'Ultra-soft cooling-gel memory foam ear cushions',
      'Multipoint Bluetooth 5.3 connection with low-latency mode'
    ],
    isFeatured: true,
    createdAt: new Date().toISOString()
  }
];

// Database Management: Hybrid MongoDB with automatic Local JSON fallback
const localDbFile = path.join(dataDir, 'local_db.json');
let mongoClient = null;
let mongoDb = null;
let isMongoConnected = false;

function readLocalDb() {
  if (!fs.existsSync(localDbFile)) {
    const initialData = {
      products: DEFAULT_PRODUCTS.map((p, idx) => ({ ...p, id: `prod_${idx + 1}` })),
      orders: []
    };
    fs.writeFileSync(localDbFile, JSON.stringify(initialData, null, 2));
    return initialData;
  }
  try {
    const raw = fs.readFileSync(localDbFile, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    return { products: [], orders: [] };
  }
}

function writeLocalDb(data) {
  try {
    fs.writeFileSync(localDbFile, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Failed to write local database file:', err);
  }
}

// Connect to MongoDB
async function initMongo() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB || 'product_marketing';
  if (!uri) {
    console.log('ℹ️ MONGODB_URI not provided. Running in local JSON storage mode.');
    return false;
  }
  try {
    mongoClient = new MongoClient(uri, { serverSelectionTimeoutMS: 3000 });
    await mongoClient.connect();
    mongoDb = mongoClient.db(dbName);
    isMongoConnected = true;
    console.log(`✅ Connected to MongoDB database: "${dbName}"`);

    // Ensure collections and seed if empty
    const productsColl = mongoDb.collection('products');
    const count = await productsColl.countDocuments();
    if (count === 0) {
      console.log('🌱 MongoDB products collection empty. Seeding default sample products...');
      await productsColl.insertMany(DEFAULT_PRODUCTS.map(p => ({ ...p })));
      console.log('✅ Default products seeded into MongoDB.');
    }
    return true;
  } catch (err) {
    console.warn(`⚠️ MongoDB connection attempt failed (${err.message}). Using local JSON storage fallback.`);
    isMongoConnected = false;
    mongoClient = null;
    mongoDb = null;
    return false;
  }
}

// Unified Database Helpers
const db = {
  async getProducts({ category, search, sort } = {}) {
    let list = [];
    if (isMongoConnected && mongoDb) {
      const query = {};
      if (category && category !== 'All') {
        query.category = category;
      }
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { category: { $regex: search, $options: 'i' } }
        ];
      }
      let cursor = mongoDb.collection('products').find(query);
      if (sort === 'price-asc') cursor = cursor.sort({ price: 1 });
      else if (sort === 'price-desc') cursor = cursor.sort({ price: -1 });
      else if (sort === 'rating') cursor = cursor.sort({ rating: -1 });
      else cursor = cursor.sort({ createdAt: -1 });

      const raw = await cursor.toArray();
      list = raw.map(p => ({ ...p, id: p._id.toString() }));
    } else {
      const local = readLocalDb();
      list = [...local.products];
      if (category && category !== 'All') {
        list = list.filter(p => p.category === category);
      }
      if (search) {
        const q = search.toLowerCase();
        list = list.filter(p =>
          (p.title && p.title.toLowerCase().includes(q)) ||
          (p.description && p.description.toLowerCase().includes(q)) ||
          (p.category && p.category.toLowerCase().includes(q))
        );
      }
      if (sort === 'price-asc') list.sort((a, b) => a.price - b.price);
      else if (sort === 'price-desc') list.sort((a, b) => b.price - a.price);
      else if (sort === 'rating') list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      else list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }
    return list;
  },

  async getProductById(id) {
    if (isMongoConnected && mongoDb) {
      try {
        const item = await mongoDb.collection('products').findOne({ _id: new ObjectId(id) });
        if (item) return { ...item, id: item._id.toString() };
      } catch (e) {
        // Fallback for non-ObjectId id strings
        const item = await mongoDb.collection('products').findOne({ id: id });
        if (item) return { ...item, id: item._id.toString() };
      }
      return null;
    } else {
      const local = readLocalDb();
      return local.products.find(p => p.id === id) || null;
    }
  },

  async createProduct(data) {
    const newProduct = {
      ...data,
      price: parseFloat(data.price) || 0,
      originalPrice: parseFloat(data.originalPrice) || parseFloat(data.price) || 0,
      stock: parseInt(data.stock, 10) || 1,
      rating: parseFloat(data.rating) || 5.0,
      reviewsCount: parseInt(data.reviewsCount, 10) || 1,
      features: Array.isArray(data.features) ? data.features : (data.features ? data.features.split('\n').map(s => s.trim()).filter(Boolean) : []),
      createdAt: new Date().toISOString()
    };

    if (isMongoConnected && mongoDb) {
      const result = await mongoDb.collection('products').insertOne(newProduct);
      return { ...newProduct, id: result.insertedId.toString() };
    } else {
      const local = readLocalDb();
      newProduct.id = `prod_${Date.now()}`;
      local.products.unshift(newProduct);
      writeLocalDb(local);
      return newProduct;
    }
  },

  async updateProduct(id, updates) {
    if (updates.price !== undefined) updates.price = parseFloat(updates.price);
    if (updates.originalPrice !== undefined) updates.originalPrice = parseFloat(updates.originalPrice);
    if (updates.stock !== undefined) updates.stock = parseInt(updates.stock, 10);
    if (updates.features && typeof updates.features === 'string') {
      updates.features = updates.features.split('\n').map(s => s.trim()).filter(Boolean);
    }
    updates.updatedAt = new Date().toISOString();

    if (isMongoConnected && mongoDb) {
      try {
        const result = await mongoDb.collection('products').findOneAndUpdate(
          { _id: new ObjectId(id) },
          { $set: updates },
          { returnDocument: 'after' }
        );
        if (result) return { ...result, id: result._id.toString() };
      } catch (e) {
        const result = await mongoDb.collection('products').findOneAndUpdate(
          { id: id },
          { $set: updates },
          { returnDocument: 'after' }
        );
        if (result) return { ...result, id: result._id.toString() };
      }
      return null;
    } else {
      const local = readLocalDb();
      const idx = local.products.findIndex(p => p.id === id);
      if (idx === -1) return null;
      local.products[idx] = { ...local.products[idx], ...updates };
      writeLocalDb(local);
      return local.products[idx];
    }
  },

  async deleteProduct(id) {
    if (isMongoConnected && mongoDb) {
      try {
        const result = await mongoDb.collection('products').deleteOne({ _id: new ObjectId(id) });
        return result.deletedCount > 0;
      } catch (e) {
        const result = await mongoDb.collection('products').deleteOne({ id: id });
        return result.deletedCount > 0;
      }
    } else {
      const local = readLocalDb();
      const initialLen = local.products.length;
      local.products = local.products.filter(p => p.id !== id);
      writeLocalDb(local);
      return local.products.length < initialLen;
    }
  },

  async resetSeedProducts() {
    if (isMongoConnected && mongoDb) {
      await mongoDb.collection('products').deleteMany({});
      await mongoDb.collection('products').insertMany(DEFAULT_PRODUCTS.map(p => ({ ...p })));
      const raw = await mongoDb.collection('products').find({}).toArray();
      return raw.map(p => ({ ...p, id: p._id.toString() }));
    } else {
      const local = {
        products: DEFAULT_PRODUCTS.map((p, idx) => ({ ...p, id: `prod_${idx + 1}` })),
        orders: readLocalDb().orders || []
      };
      writeLocalDb(local);
      return local.products;
    }
  },

  async getOrders(statusFilter) {
    if (isMongoConnected && mongoDb) {
      const query = statusFilter && statusFilter !== 'All' ? { status: statusFilter } : {};
      const raw = await mongoDb.collection('orders').find(query).sort({ createdAt: -1 }).toArray();
      return raw.map(o => ({ ...o, id: o._id.toString() }));
    } else {
      const local = readLocalDb();
      let list = [...(local.orders || [])];
      if (statusFilter && statusFilter !== 'All') {
        list = list.filter(o => o.status === statusFilter);
      }
      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return list;
    }
  },

  async getOrderByIdOrPhone(identifier) {
    if (!identifier) return null;
    const clean = identifier.trim();
    if (isMongoConnected && mongoDb) {
      let order = null;
      try {
        order = await mongoDb.collection('orders').findOne({ orderNumber: clean });
      } catch (e) {}
      if (!order) {
        order = await mongoDb.collection('orders').findOne({ customerPhone: clean });
      }
      if (!order) {
        try {
          order = await mongoDb.collection('orders').findOne({ _id: new ObjectId(clean) });
        } catch (e) {}
      }
      return order ? { ...order, id: order._id.toString() } : null;
    } else {
      const local = readLocalDb();
      const order = (local.orders || []).find(
        o => o.orderNumber === clean || o.customerPhone === clean || o.id === clean
      );
      return order || null;
    }
  },

  async createOrder(orderData) {
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    const orderNumber = `ORD-${randomSuffix}`;
    const newOrder = {
      orderNumber,
      customerName: orderData.customerName || 'Anonymous Customer',
      customerEmail: orderData.customerEmail || '',
      customerPhone: orderData.customerPhone || '',
      shippingAddress: orderData.shippingAddress || '',
      notes: orderData.notes || '',
      paymentMethod: orderData.paymentMethod || 'Cash on Delivery',
      orderType: orderData.orderType || 'cart', // 'single' or 'cart'
      items: orderData.items || [],
      subtotal: parseFloat(orderData.subtotal) || 0,
      shipping: parseFloat(orderData.shipping) || 0,
      discount: parseFloat(orderData.discount) || 0,
      total: parseFloat(orderData.total) || 0,
      status: 'Pending', // Pending, Confirmed, Processing, Shipped, Delivered, Cancelled
      createdAt: new Date().toISOString()
    };

    if (isMongoConnected && mongoDb) {
      const result = await mongoDb.collection('orders').insertOne(newOrder);
      return { ...newOrder, id: result.insertedId.toString() };
    } else {
      const local = readLocalDb();
      if (!local.orders) local.orders = [];
      newOrder.id = `ord_${Date.now()}`;
      local.orders.unshift(newOrder);
      writeLocalDb(local);
      return newOrder;
    }
  },

  async updateOrderStatus(id, status) {
    if (isMongoConnected && mongoDb) {
      try {
        const result = await mongoDb.collection('orders').findOneAndUpdate(
          { _id: new ObjectId(id) },
          { $set: { status, updatedAt: new Date().toISOString() } },
          { returnDocument: 'after' }
        );
        if (result) return { ...result, id: result._id.toString() };
      } catch (e) {
        const result = await mongoDb.collection('orders').findOneAndUpdate(
          { id: id },
          { $set: { status, updatedAt: new Date().toISOString() } },
          { returnDocument: 'after' }
        );
        if (result) return { ...result, id: result._id.toString() };
      }
      return null;
    } else {
      const local = readLocalDb();
      const idx = (local.orders || []).findIndex(o => o.id === id || o.orderNumber === id);
      if (idx === -1) return null;
      local.orders[idx].status = status;
      local.orders[idx].updatedAt = new Date().toISOString();
      writeLocalDb(local);
      return local.orders[idx];
    }
  },

  async deleteOrder(id) {
    if (isMongoConnected && mongoDb) {
      try {
        const res = await mongoDb.collection('orders').deleteOne({ _id: new ObjectId(id) });
        return res.deletedCount > 0;
      } catch (e) {
        const res = await mongoDb.collection('orders').deleteOne({ id: id });
        return res.deletedCount > 0;
      }
    } else {
      const local = readLocalDb();
      const initial = (local.orders || []).length;
      local.orders = (local.orders || []).filter(o => o.id !== id && o.orderNumber !== id);
      writeLocalDb(local);
      return (local.orders || []).length < initial;
    }
  },

  async getDashboardStats() {
    const products = await this.getProducts();
    const orders = await this.getOrders();

    const totalRevenue = orders
      .filter(o => o.status !== 'Cancelled')
      .reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0);

    const pendingOrdersCount = orders.filter(o => o.status === 'Pending').length;

    // Categories Breakdown
    const categoryCounts = {};
    products.forEach(p => {
      const cat = p.category || 'General';
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });

    return {
      totalRevenue: Number(totalRevenue.toFixed(2)),
      totalOrders: orders.length,
      totalProducts: products.length,
      pendingOrders: pendingOrdersCount,
      recentOrders: orders.slice(0, 6),
      categoryCounts
    };
  }
};

// ==========================================
// REST API ROUTES
// ==========================================

// 1. Products API
app.get('/api/products', async (req, res) => {
  try {
    const { category, search, sort } = req.query;
    const products = await db.getProducts({ category, search, sort });
    res.json({ success: true, count: products.length, products });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const product = await db.getProductById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/products', upload.single('imageFile'), async (req, res) => {
  try {
    let imageUrl = req.body.imageUrl || '';
    if (req.file) {
      imageUrl = await handleImageUpload(req.file, imageUrl);
    } else if (!imageUrl) {
      imageUrl = '/uploads/product1.png';
    }

    const productData = {
      title: req.body.title || 'Untitled Product',
      category: req.body.category || 'General',
      price: req.body.price,
      originalPrice: req.body.originalPrice || req.body.price,
      stock: req.body.stock || 10,
      badge: req.body.badge || '',
      rating: req.body.rating || 5.0,
      reviewsCount: req.body.reviewsCount || 1,
      image: imageUrl,
      description: req.body.description || '',
      features: req.body.features || [],
      isFeatured: req.body.isFeatured === 'true' || req.body.isFeatured === true
    };

    const created = await db.createProduct(productData);
    res.status(201).json({ success: true, product: created, message: 'Product added successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/api/products/:id', upload.single('imageFile'), async (req, res) => {
  try {
    const updates = { ...req.body };
    if (req.file) {
      updates.image = await handleImageUpload(req.file);
    }
    delete updates.imageFile;

    const updated = await db.updateProduct(req.params.id, updates);
    if (!updated) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, product: updated, message: 'Product updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Quick price update route specifically requested by user ("change product prize")
app.patch('/api/products/:id/price', async (req, res) => {
  try {
    const { price, originalPrice } = req.body;
    if (price === undefined) {
      return res.status(400).json({ success: false, message: 'Price is required' });
    }
    const updates = { price: parseFloat(price) };
    if (originalPrice !== undefined) updates.originalPrice = parseFloat(originalPrice);

    const updated = await db.updateProduct(req.params.id, updates);
    if (!updated) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, product: updated, message: 'Product price updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    const deleted = await db.deleteProduct(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/products/seed', async (req, res) => {
  try {
    const seeded = await db.resetSeedProducts();
    res.json({ success: true, count: seeded.length, products: seeded, message: 'Default catalog reseeded' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 2. Orders API
app.get('/api/orders', async (req, res) => {
  try {
    const { status } = req.query;
    const orders = await db.getOrders(status);
    res.json({ success: true, count: orders.length, orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/orders/:identifier', async (req, res) => {
  try {
    const order = await db.getOrderByIdOrPhone(req.params.identifier);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/orders', async (req, res) => {
  try {
    const { customerName, customerPhone, shippingAddress, items } = req.body;
    if (!customerName || !customerPhone || !shippingAddress) {
      return res.status(400).json({ success: false, message: 'Name, phone and shipping address are required' });
    }
    if (!items || !items.length) {
      return res.status(400).json({ success: false, message: 'Order must contain at least 1 item' });
    }

    const order = await db.createOrder(req.body);
    res.status(201).json({ success: true, order, message: 'Order placed successfully!' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.patch('/api/orders/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const updated = await db.updateOrderStatus(req.params.id, status);
    if (!updated) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, order: updated, message: `Order status changed to ${status}` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/orders/:id', async (req, res) => {
  try {
    const deleted = await db.deleteOrder(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, message: 'Order removed successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 3. Admin Dashboard Analytics
app.get('/api/stats', async (req, res) => {
  try {
    const stats = await db.getDashboardStats();
    res.json({ success: true, stats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 4. System & Cloudinary Status Diagnostics
app.get('/api/system-status', async (req, res) => {
  const cConfig = getCloudinaryConfig();
  res.json({
    success: true,
    mongo: {
      connected: isMongoConnected,
      database: isMongoConnected ? (process.env.MONGODB_DB || 'product_marketing') : 'local-json-fallback',
      uriConfigured: Boolean(process.env.MONGODB_URI)
    },
    cloudinary: {
      configured: cConfig.isConfigured,
      cloudName: cConfig.cloudName || 'Not configured (using local file storage)'
    },
    serverUptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

// Serve frontend fallback for direct routing
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Start Server & Connect MongoDB
async function startServer() {
  await initMongo();
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Product Marketing Server running at: http://localhost:${PORT}`);
    console.log(`🛍️ Customer Storefront: http://localhost:${PORT}/`);
    console.log(`📊 Admin Portal:        http://localhost:${PORT}/admin.html`);
  });
}

startServer();
