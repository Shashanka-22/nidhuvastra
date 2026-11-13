import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import type { OrderRecord, Product } from './src/types/store.ts';

dotenv.config();

const PORT = Number(process.env.PORT || 3000);
const DATA_DIR = path.join(process.cwd(), 'data');
const STORE_FILE = path.join(DATA_DIR, 'store.json');
const CATALOG_FILE = path.join(process.cwd(), 'src', 'data', 'catalog.json');

interface StoreDb {
  orders: OrderRecord[];
  newsletter: { email: string; subscribedAt: string }[];
  inquiries: {
    id: string;
    name: string;
    email: string;
    phone: string;
    subject: string;
    message: string;
    createdAt: string;
  }[];
}

function ensureStore(): StoreDb {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(STORE_FILE)) {
    const initial: StoreDb = { orders: [], newsletter: [], inquiries: [] };
    fs.writeFileSync(STORE_FILE, JSON.stringify(initial, null, 2), 'utf8');
    return initial;
  }
  try {
    const raw = fs.readFileSync(STORE_FILE, 'utf8');
    const parsed = JSON.parse(raw) as Partial<StoreDb>;
    return {
      orders: Array.isArray(parsed.orders) ? parsed.orders : [],
      newsletter: Array.isArray(parsed.newsletter) ? parsed.newsletter : [],
      inquiries: Array.isArray(parsed.inquiries) ? parsed.inquiries : [],
    };
  } catch {
    return { orders: [], newsletter: [], inquiries: [] };
  }
}

function saveStore(db: StoreDb): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const tmpFile = `${STORE_FILE}.tmp`;
  fs.writeFileSync(tmpFile, JSON.stringify(db, null, 2), 'utf8');
  fs.renameSync(tmpFile, STORE_FILE);
}

function loadCatalog(): Product[] {
  const raw = fs.readFileSync(CATALOG_FILE, 'utf8');
  return JSON.parse(raw) as Product[];
}

function normalizePhone(input: string): string {
  const digits = input.replace(/\D/g, '');
  return digits.length > 10 ? digits.slice(-10) : digits;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  const catalog = loadCatalog();
  const productById = new Map<string, Product>(catalog.map((p) => [p.id, p]));
  const productBySlug = new Map<string, Product>(catalog.map((p) => [p.slug, p]));

  const razorpayKeyId = process.env.RAZORPAY_KEY_ID?.trim() || '';
  const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET?.trim() || '';
  const razorpayEnabled = Boolean(razorpayKeyId && razorpayKeySecret);

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, products: catalog.length });
  });

  app.get('/api/products', (req, res) => {
    const category = String(req.query.category || '').trim();
    const search = String(req.query.search || '').trim().toLowerCase();
    let list = catalog;
    if (category && category !== 'all-products') {
      list = list.filter((p) => p.categories.includes(category));
    }
    if (search) {
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(search) ||
          p.code.toLowerCase().includes(search) ||
          p.productType.toLowerCase().includes(search) ||
          p.colors.some((c) => c.toLowerCase().includes(search))
      );
    }
    res.json({ total: list.length, products: list });
  });

  app.get('/api/products/:slug', (req, res) => {
    const prod = productBySlug.get(req.params.slug) || productById.get(req.params.slug);
    if (!prod) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    res.json({ product: prod });
  });

  app.get('/api/payment/config', (_req, res) => {
    res.json({
      razorpayEnabled,
      keyId: razorpayEnabled ? razorpayKeyId : undefined,
      shippingFee: 0,
      freeShippingIndia: true,
    });
  });

  app.post('/api/payment/razorpay/order', async (req, res) => {
    if (!razorpayEnabled) {
      res.status(400).json({ error: 'Razorpay merchant credentials are not configured on the server.' });
      return;
    }

    const itemsInput = Array.isArray(req.body?.items) ? req.body.items : [];
    if (itemsInput.length === 0) {
      res.status(400).json({ error: 'Your bag is empty.' });
      return;
    }

    let subtotal = 0;
    for (const item of itemsInput) {
      const product = productById.get(String(item.productId || ''));
      const qty = Math.max(1, Math.min(20, Number(item.quantity || 1)));
      if (!product) {
        res.status(400).json({ error: 'One or more products in your bag could not be found.' });
        return;
      }
      if (!product.inStock) {
        res.status(400).json({ error: `${product.name} is currently out of stock.` });
        return;
      }
      subtotal += product.price * qty;
    }

    try {
      const auth = Buffer.from(`${razorpayKeyId}:${razorpayKeySecret}`).toString('base64');
      const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: Math.round(subtotal * 100),
          currency: 'INR',
          receipt: `nv_rcpt_${Date.now()}`,
        }),
      });
      const data = await rzpRes.json();
      if (!rzpRes.ok) {
        res.status(502).json({ error: data?.error?.description || 'Failed to initialize Razorpay payment.' });
        return;
      }
      res.json({ orderId: data.id, amount: data.amount, currency: data.currency, keyId: razorpayKeyId });
    } catch {
      res.status(502).json({ error: 'Unable to reach Razorpay payment gateway.' });
    }
  });

  app.post('/api/orders', (req, res) => {
    const body = req.body || {};
    const customer = body.customer || {};
    const itemsInput = Array.isArray(body.items) ? body.items : [];
    const paymentMethod = String(body.paymentMethod || '') as OrderRecord['paymentMethod'];

    const name = String(customer.name || '').trim();
    const mobileRaw = String(customer.mobile || '').trim();
    const mobile = normalizePhone(mobileRaw);
    const email = String(customer.email || '').trim().toLowerCase();
    const address = String(customer.address || '').trim();
    const city = String(customer.city || '').trim();
    const state = String(customer.state || '').trim();
    const pinCode = String(customer.pinCode || '').replace(/\D/g, '');

    if (name.length < 2) {
      res.status(400).json({ error: 'Please enter your full name.' });
      return;
    }
    if (mobile.length !== 10) {
      res.status(400).json({ error: 'Please enter a valid 10-digit Indian mobile number.' });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({ error: 'Please enter a valid email address.' });
      return;
    }
    if (address.length < 6 || city.length < 2 || state.length < 2) {
      res.status(400).json({ error: 'Please complete your shipping address, city, and state.' });
      return;
    }
    if (!/^[1-9][0-9]{5}$/.test(pinCode)) {
      res.status(400).json({ error: 'Please enter a valid 6-digit Indian PIN code.' });
      return;
    }
    if (itemsInput.length === 0) {
      res.status(400).json({ error: 'Your shopping bag is empty.' });
      return;
    }

    if (!['razorpay', 'upi_whatsapp', 'cod'].includes(paymentMethod)) {
      res.status(400).json({ error: 'Please select a valid payment method.' });
      return;
    }

    if (paymentMethod === 'razorpay') {
      if (!razorpayEnabled) {
        res.status(400).json({ error: 'Razorpay payment gateway is not configured.' });
        return;
      }
      const rzpOrderId = String(body.razorpay?.orderId || '');
      const rzpPaymentId = String(body.razorpay?.paymentId || '');
      const rzpSignature = String(body.razorpay?.signature || '');
      if (!rzpOrderId || !rzpPaymentId || !rzpSignature) {
        res.status(400).json({ error: 'Missing Razorpay payment verification details.' });
        return;
      }
      const expected = crypto
        .createHmac('sha256', razorpayKeySecret)
        .update(`${rzpOrderId}|${rzpPaymentId}`)
        .digest('hex');
      if (expected !== rzpSignature) {
        res.status(400).json({ error: 'Payment signature verification failed.' });
        return;
      }
    }

    const verifiedItems: OrderRecord['items'] = [];
    let subtotal = 0;

    for (const item of itemsInput) {
      const product = productById.get(String(item.productId || ''));
      if (!product) {
        res.status(400).json({ error: 'A selected saree was not found in the catalogue.' });
        return;
      }
      if (!product.inStock) {
        res.status(400).json({ error: `${product.name} is currently out of stock.` });
        return;
      }
      const qty = Math.max(1, Math.min(20, Number(item.quantity || 1)));
      const firstImg = product.images[0]?.id || '';
      verifiedItems.push({
        productId: product.id,
        code: product.code,
        name: product.name,
        price: product.price,
        quantity: qty,
        selectedOption: item.selectedOption ? String(item.selectedOption) : undefined,
        imageId: firstImg,
      });
      subtotal += product.price * qty;
    }

    const now = new Date().toISOString();
    const db = ensureStore();
    const orderSeq = 1001 + db.orders.length;
    const suffix = crypto.randomBytes(2).toString('hex').toUpperCase();
    const orderNumber = `NV-${orderSeq}-${suffix}`;

    const paymentStatus: OrderRecord['paymentStatus'] =
      paymentMethod === 'razorpay'
        ? 'paid'
        : paymentMethod === 'cod'
          ? 'cod_confirmed'
          : 'pending_verification';

    const orderNote =
      paymentMethod === 'razorpay'
        ? 'Order confirmed with verified online payment.'
        : paymentMethod === 'cod'
          ? 'Order placed with Cash on Delivery confirmation.'
          : 'Order placed; awaiting UPI payment verification via NidhuVastra WhatsApp (+91 8861162769).';

    const record: OrderRecord = {
      orderNumber,
      createdAt: now,
      updatedAt: now,
      status: 'Order Placed',
      statusHistory: [
        {
          status: 'Order Placed',
          timestamp: now,
          note: orderNote,
        },
      ],
      customer: {
        name,
        mobile,
        email,
        address,
        city,
        state,
        pinCode,
      },
      items: verifiedItems,
      subtotal,
      shipping: 0,
      total: subtotal,
      paymentMethod,
      paymentStatus,
      razorpayPaymentId: paymentMethod === 'razorpay' ? String(body.razorpay?.paymentId || '') : undefined,
      courierName: 'DTDC',
    };

    db.orders.unshift(record);
    saveStore(db);

    res.status(201).json({ order: record });
  });

  app.get('/api/orders/track', (req, res) => {
    const orderNumber = String(req.query.orderNumber || '').trim().toUpperCase();
    const contact = String(req.query.contact || '').trim();

    if (!orderNumber || !contact) {
      res.status(400).json({ error: 'Please provide both your Order Number and registered mobile number or email.' });
      return;
    }

    const db = ensureStore();
    const contactEmail = contact.toLowerCase();
    const contactPhone = normalizePhone(contact);

    const found = db.orders.find((o) => {
      const numMatch = o.orderNumber.toUpperCase() === orderNumber;
      const emailMatch = o.customer.email.toLowerCase() === contactEmail;
      const phoneMatch = contactPhone.length >= 10 && o.customer.mobile === contactPhone;
      return numMatch && (emailMatch || phoneMatch);
    });

    if (!found) {
      res.status(404).json({
        error:
          'No matching order found in our store records. If you placed an order on our legacy storefront or need immediate assistance, please track via DTDC or message us on WhatsApp at +91 8861162769.',
      });
      return;
    }

    res.json({ order: found });
  });

  app.post('/api/newsletter', (req, res) => {
    const email = String(req.body?.email || '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({ error: 'Please enter a valid email address.' });
      return;
    }
    const db = ensureStore();
    const exists = db.newsletter.some((n) => n.email === email);
    if (!exists) {
      db.newsletter.push({ email, subscribedAt: new Date().toISOString() });
      saveStore(db);
    }
    res.json({ ok: true, alreadySubscribed: exists });
  });

  app.post('/api/contact', (req, res) => {
    const name = String(req.body?.name || '').trim();
    const email = String(req.body?.email || '').trim();
    const phone = String(req.body?.phone || '').trim();
    const subject = String(req.body?.subject || 'General Inquiry').trim();
    const message = String(req.body?.message || '').trim();

    if (name.length < 2 || (!email && !phone) || message.length < 5) {
      res.status(400).json({ error: 'Please enter your name, contact details, and message.' });
      return;
    }

    const db = ensureStore();
    const ticketId = `INQ-${Date.now().toString().slice(-6)}`;
    db.inquiries.unshift({
      id: ticketId,
      name,
      email,
      phone,
      subject,
      message,
      createdAt: new Date().toISOString(),
    });
    saveStore(db);
    res.status(201).json({ ok: true, ticketId });
  });

  // Vite integration in dev vs static dist in production
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.join(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`NidhuVastra server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
