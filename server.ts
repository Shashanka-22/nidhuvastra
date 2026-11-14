import crypto from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import dotenv from 'dotenv';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import type { BillingAddress, OrderRecord, Product } from './src/types/store.ts';

dotenv.config();

function resolvePort(): number {
  const portFlagIdx = process.argv.indexOf('--port');
  if (portFlagIdx !== -1 && process.argv[portFlagIdx + 1]) {
    const cliPort = Number(process.argv[portFlagIdx + 1]);
    if (Number.isFinite(cliPort) && cliPort > 0) return cliPort;
  }
  if (process.env.NODE_ENV !== 'production') {
    return Number(process.env.DEFAULT_APP_PORT || 3000);
  }
  return Number(process.env.PORT || process.env.DEFAULT_APP_PORT || 3000);
}

const PORT = resolvePort();
const DATA_DIR = path.join(process.cwd(), 'data');
const STORE_FILE = path.join(DATA_DIR, 'store.json');
const PROMOS_FILE = path.join(DATA_DIR, 'promos.json');
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
  processedPaymentIds: string[];
  processedWebhookEventIds: string[];
}

interface PromoRule {
  code: string;
  type: 'percent' | 'flat';
  value: number;
  minSubtotal?: number;
  maxDiscount?: number;
  active?: boolean;
  expiresAt?: string;
  description?: string;
}

let storeLockChain: Promise<void> = Promise.resolve();

function withStoreLock<T>(fn: () => Promise<T> | T): Promise<T> {
  const run = storeLockChain.then(() => fn());
  storeLockChain = run.then(
    () => undefined,
    () => undefined
  );
  return run;
}

function ensureStore(): StoreDb {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(STORE_FILE)) {
    const initial: StoreDb = {
      orders: [],
      newsletter: [],
      inquiries: [],
      processedPaymentIds: [],
      processedWebhookEventIds: [],
    };
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
      processedPaymentIds: Array.isArray(parsed.processedPaymentIds) ? parsed.processedPaymentIds : [],
      processedWebhookEventIds: Array.isArray(parsed.processedWebhookEventIds)
        ? parsed.processedWebhookEventIds
        : [],
    };
  } catch {
    return {
      orders: [],
      newsletter: [],
      inquiries: [],
      processedPaymentIds: [],
      processedWebhookEventIds: [],
    };
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

function timingSafeEqualHex(a: string, b: string): boolean {
  if (!a || !b || a.length !== b.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
  } catch {
    return false;
  }
}

function getRazorpayConfig() {
  const keyId = process.env.RAZORPAY_KEY_ID?.trim() || '';
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim() || '';
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET?.trim() || '';
  const enabled = Boolean(keyId && keySecret);
  const mode: 'test' | 'live' = keyId.startsWith('rzp_live_') ? 'live' : 'test';
  return { keyId, keySecret, webhookSecret, enabled, mode };
}

function loadConfiguredPromos(): PromoRule[] {
  const promos: PromoRule[] = [];
  const envRaw = process.env.PROMO_CODES_JSON?.trim();
  if (envRaw) {
    try {
      const parsed = JSON.parse(envRaw);
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          if (item && typeof item.code === 'string' && typeof item.value === 'number') {
            promos.push(item as PromoRule);
          }
        }
      }
    } catch {
      // Ignore malformed env promo config
    }
  }
  if (fs.existsSync(PROMOS_FILE)) {
    try {
      const fileRaw = fs.readFileSync(PROMOS_FILE, 'utf8');
      const parsed = JSON.parse(fileRaw);
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          if (item && typeof item.code === 'string' && typeof item.value === 'number') {
            promos.push(item as PromoRule);
          }
        }
      }
    } catch {
      // Ignore malformed promo file
    }
  }
  return promos;
}

function evaluatePromoCode(
  rawCode: string,
  subtotal: number
): { valid: boolean; code?: string; discountAmount: number; description?: string; error?: string } {
  const normalized = rawCode.trim().toUpperCase();
  if (!normalized) {
    return { valid: false, discountAmount: 0, error: 'Please enter a promo code.' };
  }

  const promos = loadConfiguredPromos();
  const match = promos.find((p) => p.code.trim().toUpperCase() === normalized);
  if (!match || match.active === false) {
    return {
      valid: false,
      discountAmount: 0,
      error: 'Promo code is invalid or not currently active.',
    };
  }

  if (match.expiresAt) {
    const expiry = Date.parse(match.expiresAt);
    if (Number.isFinite(expiry) && Date.now() > expiry) {
      return { valid: false, discountAmount: 0, error: 'This promo code has expired.' };
    }
  }

  if (typeof match.minSubtotal === 'number' && subtotal < match.minSubtotal) {
    return {
      valid: false,
      discountAmount: 0,
      error: `Minimum order value of ₹${match.minSubtotal.toLocaleString('en-IN')} required for ${match.code.toUpperCase()}.`,
    };
  }

  let discount = 0;
  if (match.type === 'percent') {
    discount = Math.round((subtotal * Math.max(0, Math.min(100, match.value))) / 100);
    if (typeof match.maxDiscount === 'number' && match.maxDiscount > 0) {
      discount = Math.min(discount, match.maxDiscount);
    }
  } else if (match.type === 'flat') {
    discount = Math.round(Math.max(0, match.value));
  }

  // Keep payable total >= ₹1 so Razorpay/payment processors never receive a 0 amount
  discount = Math.min(discount, Math.max(0, subtotal - 1));
  if (discount <= 0) {
    return { valid: false, discountAmount: 0, error: 'Promo code is not applicable to this bag total.' };
  }

  return {
    valid: true,
    code: match.code.trim().toUpperCase(),
    discountAmount: discount,
    description: match.description || `${match.code.trim().toUpperCase()} applied`,
  };
}

function validateCustomerAndBilling(body: Record<string, unknown>):
  | {
      ok: true;
      customer: OrderRecord['customer'];
      billingAddress: BillingAddress;
    }
  | { ok: false; error: string } {
  const customerIn = (body.customer || {}) as Record<string, unknown>;
  const name = String(customerIn.name || '').trim();
  const mobile = normalizePhone(String(customerIn.mobile || '').trim());
  const email = String(customerIn.email || '').trim().toLowerCase();
  const address = String(customerIn.address || '').trim();
  const city = String(customerIn.city || '').trim();
  const state = String(customerIn.state || '').trim();
  const pinCode = String(customerIn.pinCode || '').replace(/\D/g, '');

  if (name.length < 2) {
    return { ok: false, error: 'Please enter your full name.' };
  }
  if (mobile.length !== 10) {
    return { ok: false, error: 'Please enter a valid 10-digit Indian mobile number.' };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: 'Please enter a valid email address.' };
  }
  if (address.length < 6 || city.length < 2 || state.length < 2) {
    return { ok: false, error: 'Please complete your shipping address, city, and state.' };
  }
  if (!/^[1-9][0-9]{5}$/.test(pinCode)) {
    return { ok: false, error: 'Please enter a valid 6-digit Indian PIN code.' };
  }

  const customer: OrderRecord['customer'] = {
    name,
    mobile,
    email,
    address,
    city,
    state,
    pinCode,
  };

  const billingIn = (body.billingAddress || {}) as Record<string, unknown>;
  const sameAsShipping = billingIn.sameAsShipping !== false;
  if (sameAsShipping) {
    return {
      ok: true,
      customer,
      billingAddress: {
        sameAsShipping: true,
        name,
        address,
        city,
        state,
        pinCode,
      },
    };
  }

  const bName = String(billingIn.name || '').trim();
  const bAddress = String(billingIn.address || '').trim();
  const bCity = String(billingIn.city || '').trim();
  const bState = String(billingIn.state || '').trim();
  const bPin = String(billingIn.pinCode || '').replace(/\D/g, '');

  if (bName.length < 2 || bAddress.length < 6 || bCity.length < 2 || bState.length < 2) {
    return { ok: false, error: 'Please complete your billing name, address, city, and state.' };
  }
  if (!/^[1-9][0-9]{5}$/.test(bPin)) {
    return { ok: false, error: 'Please enter a valid 6-digit billing PIN code.' };
  }

  return {
    ok: true,
    customer,
    billingAddress: {
      sameAsShipping: false,
      name: bName,
      address: bAddress,
      city: bCity,
      state: bState,
      pinCode: bPin,
    },
  };
}

function buildVerifiedCartItems(
  itemsInput: unknown[],
  productById: Map<string, Product>
):
  | { ok: true; items: OrderRecord['items']; subtotal: number }
  | { ok: false; error: string } {
  if (!Array.isArray(itemsInput) || itemsInput.length === 0) {
    return { ok: false, error: 'Your shopping bag is empty.' };
  }

  const verifiedItems: OrderRecord['items'] = [];
  let subtotal = 0;

  for (const rawItem of itemsInput) {
    const item = (rawItem || {}) as Record<string, unknown>;
    const product = productById.get(String(item.productId || ''));
    if (!product) {
      return { ok: false, error: 'A selected saree was not found in the catalogue.' };
    }
    if (!product.inStock) {
      return { ok: false, error: `${product.name} is currently out of stock.` };
    }
    const qty = Math.max(1, Math.min(20, Math.floor(Number(item.quantity || 1))));
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

  return { ok: true, items: verifiedItems, subtotal };
}

function recordOrderConfirmationNotification(order: OrderRecord, channelDetail: string): void {
  const now = new Date().toISOString();
  order.notificationSentAt = now;
  const entry = `[${now}] Confirmation recorded for ${order.customer.email} (+91 ${order.customer.mobile}) via ${channelDetail}`;
  order.notificationLog = [...(order.notificationLog || []), entry];
  console.log(`NidhuVastra Notification :: Order ${order.orderNumber} (${order.paymentStatus}) -> ${order.customer.email}`);
}

function generateOrderNumber(existingCount: number): string {
  const orderSeq = 1001 + existingCount;
  const suffix = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `NV-${orderSeq}-${suffix}`;
}

async function createRazorpayGatewayOrder(params: {
  keyId: string;
  keySecret: string;
  amountInPaise: number;
  receipt: string;
  notes: Record<string, string>;
}): Promise<{ id: string; amount: number; currency: string }> {
  const auth = Buffer.from(`${params.keyId}:${params.keySecret}`).toString('base64');
  const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: params.amountInPaise,
      currency: 'INR',
      receipt: params.receipt,
      notes: params.notes,
    }),
  });
  const data = (await rzpRes.json()) as {
    id?: string;
    amount?: number;
    currency?: string;
    error?: { description?: string };
  };
  if (!rzpRes.ok || !data.id) {
    throw new Error(data?.error?.description || 'Failed to initialize Razorpay order.');
  }
  return {
    id: data.id,
    amount: Number(data.amount || params.amountInPaise),
    currency: String(data.currency || 'INR'),
  };
}

async function startServer() {
  const app = express();

  const catalog = loadCatalog();
  const productById = new Map<string, Product>(catalog.map((p) => [p.id, p]));
  const productBySlug = new Map<string, Product>(catalog.map((p) => [p.slug, p]));

  // Mount raw-body Razorpay webhook route BEFORE express.json() so HMAC signature verification uses exact raw bytes
  app.post(
    '/api/webhooks/razorpay',
    express.raw({ type: 'application/json', limit: '1mb' }),
    async (req, res) => {
      const cfg = getRazorpayConfig();
      if (!cfg.webhookSecret) {
        res.status(503).json({ error: 'Razorpay webhook secret is not configured.' });
        return;
      }

      const signature = String(req.headers['x-razorpay-signature'] || '').trim();
      const rawBuffer = Buffer.isBuffer(req.body) ? req.body : Buffer.from(String(req.body || ''), 'utf8');
      if (!signature || rawBuffer.length === 0) {
        res.status(400).json({ error: 'Missing webhook signature or payload.' });
        return;
      }

      const expectedSignature = crypto
        .createHmac('sha256', cfg.webhookSecret)
        .update(rawBuffer)
        .digest('hex');

      if (!timingSafeEqualHex(expectedSignature, signature)) {
        res.status(400).json({ error: 'Invalid Razorpay webhook signature.' });
        return;
      }

      let payload: Record<string, any>;
      try {
        payload = JSON.parse(rawBuffer.toString('utf8'));
      } catch {
        res.status(400).json({ error: 'Invalid webhook JSON payload.' });
        return;
      }

      const eventName = String(payload.event || '');
      const paymentEntity = payload?.payload?.payment?.entity;
      const orderEntity = payload?.payload?.order?.entity;
      const eventHeaderId = String(req.headers['x-razorpay-event-id'] || '').trim();
      const dedupeKey = eventHeaderId || `${eventName}:${paymentEntity?.id || orderEntity?.id || ''}`;

      const result = await withStoreLock(() => {
        const db = ensureStore();
        if (dedupeKey && db.processedWebhookEventIds.includes(dedupeKey)) {
          return { status: 200, body: { ok: true, duplicate: true } };
        }

        const rzpOrderId = String(paymentEntity?.order_id || orderEntity?.id || '');
        const rzpPaymentId = String(paymentEntity?.id || '');
        const noteOrderNum = String(paymentEntity?.notes?.orderNumber || orderEntity?.notes?.orderNumber || '');

        const order = db.orders.find(
          (o) =>
            (rzpOrderId && o.razorpayOrderId === rzpOrderId) ||
            (noteOrderNum && o.orderNumber === noteOrderNum)
        );

        if (!order) {
          if (dedupeKey) {
            db.processedWebhookEventIds.push(dedupeKey);
            saveStore(db);
          }
          return { status: 200, body: { ok: true, ignored: 'Order not found in store' } };
        }

        const now = new Date().toISOString();

        if (eventName === 'payment.captured' || eventName === 'order.paid') {
          const expectedPaise = Math.round(order.total * 100);
          const paidPaise = Number(paymentEntity?.amount || orderEntity?.amount_paid || 0);
          const paidCurrency = String(paymentEntity?.currency || orderEntity?.currency || 'INR');

          if (paidPaise !== expectedPaise || paidCurrency !== 'INR') {
            return {
              status: 400,
              body: { error: 'Webhook amount or currency mismatch against stored order total.' },
            };
          }

          if (order.paymentStatus !== 'paid') {
            if (rzpPaymentId && db.processedPaymentIds.includes(rzpPaymentId)) {
              return { status: 200, body: { ok: true, duplicatePayment: true } };
            }
            order.paymentStatus = 'paid';
            order.status = 'Order Placed';
            order.razorpayPaymentId = rzpPaymentId || order.razorpayPaymentId;
            order.webhookVerified = true;
            order.paidAt = now;
            order.updatedAt = now;
            order.failureReason = undefined;
            order.statusHistory.push({
              status: 'Order Placed',
              timestamp: now,
              note: `Payment confirmed via Razorpay webhook (${eventName}). Payment ID: ${rzpPaymentId || 'verified'}.`,
            });
            recordOrderConfirmationNotification(order, 'Razorpay Webhook');
            if (rzpPaymentId) {
              db.processedPaymentIds.push(rzpPaymentId);
            }
          } else {
            order.webhookVerified = true;
            order.updatedAt = now;
          }
        } else if (eventName === 'payment.failed') {
          if (order.paymentStatus !== 'paid') {
            const failDesc = String(
              paymentEntity?.error_description ||
                paymentEntity?.error_reason ||
                'Payment failed at payment gateway.'
            );
            order.paymentStatus = 'failed';
            order.status = 'Payment Failed';
            order.failureReason = failDesc;
            order.updatedAt = now;
            order.statusHistory.push({
              status: 'Payment Failed',
              timestamp: now,
              note: `Razorpay webhook reported payment failure: ${failDesc}`,
            });
          }
        }

        if (dedupeKey) {
          db.processedWebhookEventIds.push(dedupeKey);
        }
        saveStore(db);
        return { status: 200, body: { ok: true, orderNumber: order.orderNumber } };
      });

      res.status(result.status).json(result.body);
    }
  );

  app.use(express.json({ limit: '1mb' }));

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
    const cfg = getRazorpayConfig();
    res.json({
      razorpayEnabled: cfg.enabled,
      razorpayMode: cfg.mode,
      keyId: cfg.enabled ? cfg.keyId : undefined,
      shippingFee: 0,
      freeShippingIndia: true,
      taxesIncluded: true,
    });
  });

  app.post('/api/promos/validate', (req, res) => {
    const code = String(req.body?.code || '').trim();
    const itemsResult = buildVerifiedCartItems(req.body?.items, productById);
    if (!itemsResult.ok) {
      res.status(400).json({ valid: false, error: itemsResult.error });
      return;
    }

    const promoResult = evaluatePromoCode(code, itemsResult.subtotal);
    if (!promoResult.valid) {
      res.status(400).json({ valid: false, error: promoResult.error });
      return;
    }

    res.json({
      valid: true,
      code: promoResult.code,
      discountAmount: promoResult.discountAmount,
      description: promoResult.description,
      subtotal: itemsResult.subtotal,
      total: itemsResult.subtotal - promoResult.discountAmount,
    });
  });

  app.post('/api/checkout/razorpay/initiate', async (req, res) => {
    const cfg = getRazorpayConfig();
    if (!cfg.enabled) {
      res.status(400).json({
        error: 'Razorpay merchant credentials (RAZORPAY_KEY_ID & RAZORPAY_KEY_SECRET) are not configured on the server.',
      });
      return;
    }

    const body = (req.body || {}) as Record<string, unknown>;
    const validation = validateCustomerAndBilling(body);
    if (!validation.ok) {
      res.status(400).json({ error: validation.error });
      return;
    }

    const itemsResult = buildVerifiedCartItems(body.items as unknown[], productById);
    if (!itemsResult.ok) {
      res.status(400).json({ error: itemsResult.error });
      return;
    }

    const promoInput = String(body.promoCode || '').trim();
    let discountAmount = 0;
    let appliedPromoCode: string | undefined;
    if (promoInput) {
      const promoEval = evaluatePromoCode(promoInput, itemsResult.subtotal);
      if (!promoEval.valid) {
        res.status(400).json({ error: promoEval.error });
        return;
      }
      discountAmount = promoEval.discountAmount;
      appliedPromoCode = promoEval.code;
    }

    const total = Math.max(1, itemsResult.subtotal - discountAmount);
    const amountInPaise = Math.round(total * 100);
    const idempotencyKey = String(body.idempotencyKey || '').trim() || undefined;
    const retryOrderNumber = String(body.retryOrderNumber || '').trim() || undefined;

    try {
      const prep = await withStoreLock(() => {
        const db = ensureStore();
        let targetOrder: OrderRecord | undefined;

        if (retryOrderNumber) {
          targetOrder = db.orders.find((o) => o.orderNumber === retryOrderNumber);
          if (!targetOrder) {
            return { errorStatus: 404, error: 'Eligible order for retry was not found.' } as const;
          }
          if (targetOrder.paymentStatus === 'paid') {
            return {
              errorStatus: 409,
              error: 'This order has already been paid.',
              alreadyPaid: true,
              order: targetOrder,
            } as const;
          }
        } else if (idempotencyKey) {
          targetOrder = db.orders.find((o) => o.idempotencyKey === idempotencyKey);
          if (targetOrder?.paymentStatus === 'paid') {
            return {
              errorStatus: 409,
              error: 'This checkout session has already been paid.',
              alreadyPaid: true,
              order: targetOrder,
            } as const;
          }
        }

        const orderNumber = targetOrder?.orderNumber || generateOrderNumber(db.orders.length);
        return { errorStatus: 0, orderNumber, existingOrderNumber: targetOrder?.orderNumber } as const;
      });

      if (prep.errorStatus !== 0) {
        res.status(prep.errorStatus).json({
          error: prep.error,
          alreadyPaid: 'alreadyPaid' in prep ? prep.alreadyPaid : undefined,
          order: 'order' in prep ? prep.order : undefined,
        });
        return;
      }

      const rzpOrder = await createRazorpayGatewayOrder({
        keyId: cfg.keyId,
        keySecret: cfg.keySecret,
        amountInPaise,
        receipt: prep.orderNumber,
        notes: {
          orderNumber: prep.orderNumber,
          customerEmail: validation.customer.email,
          customerMobile: validation.customer.mobile,
          ...(appliedPromoCode ? { promoCode: appliedPromoCode } : {}),
        },
      });

      const savedOrder = await withStoreLock(() => {
        const db = ensureStore();
        const now = new Date().toISOString();
        let existing = prep.existingOrderNumber
          ? db.orders.find((o) => o.orderNumber === prep.existingOrderNumber)
          : undefined;

        if (existing) {
          if (existing.paymentStatus === 'paid') {
            return { conflict: true, order: existing } as const;
          }
          existing.updatedAt = now;
          existing.customer = validation.customer;
          existing.billingAddress = validation.billingAddress;
          existing.items = itemsResult.items;
          existing.subtotal = itemsResult.subtotal;
          existing.discountAmount = discountAmount;
          existing.promoCode = appliedPromoCode;
          existing.shipping = 0;
          existing.total = total;
          existing.currency = 'INR';
          existing.paymentMethod = 'razorpay';
          existing.paymentStatus = 'pending';
          existing.status = 'Payment Pending';
          existing.razorpayOrderId = rzpOrder.id;
          existing.failureReason = undefined;
          existing.idempotencyKey = idempotencyKey || existing.idempotencyKey;
          existing.statusHistory.push({
            status: 'Payment Pending',
            timestamp: now,
            note: `Razorpay payment initiated (Order ID: ${rzpOrder.id}).`,
          });
          saveStore(db);
          return { conflict: false, order: existing } as const;
        }

        const newRecord: OrderRecord = {
          orderNumber: prep.orderNumber,
          createdAt: now,
          updatedAt: now,
          status: 'Payment Pending',
          statusHistory: [
            {
              status: 'Payment Pending',
              timestamp: now,
              note: `Order created; awaiting Razorpay payment confirmation (Razorpay Order ID: ${rzpOrder.id}).`,
            },
          ],
          customer: validation.customer,
          billingAddress: validation.billingAddress,
          items: itemsResult.items,
          subtotal: itemsResult.subtotal,
          discountAmount,
          promoCode: appliedPromoCode,
          shipping: 0,
          total,
          currency: 'INR',
          paymentMethod: 'razorpay',
          paymentStatus: 'pending',
          razorpayOrderId: rzpOrder.id,
          idempotencyKey,
          courierName: 'DTDC',
        };
        db.orders.unshift(newRecord);
        saveStore(db);
        return { conflict: false, order: newRecord } as const;
      });

      if (savedOrder.conflict) {
        res.status(409).json({
          error: 'This order has already been paid.',
          alreadyPaid: true,
          order: savedOrder.order,
        });
        return;
      }

      res.status(201).json({
        order: savedOrder.order,
        razorpay: {
          orderId: rzpOrder.id,
          amount: rzpOrder.amount,
          currency: rzpOrder.currency,
          keyId: cfg.keyId,
          mode: cfg.mode,
        },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to reach Razorpay payment gateway.';
      res.status(502).json({ error: message });
    }
  });

  app.post('/api/payment/razorpay/verify', async (req, res) => {
    const cfg = getRazorpayConfig();
    if (!cfg.enabled) {
      res.status(400).json({ error: 'Razorpay payment gateway is not configured.' });
      return;
    }

    const orderNumber = String(req.body?.orderNumber || '').trim();
    const rzpOrderId = String(req.body?.razorpay_order_id || '').trim();
    const rzpPaymentId = String(req.body?.razorpay_payment_id || '').trim();
    const rzpSignature = String(req.body?.razorpay_signature || '').trim();

    if (!orderNumber || !rzpOrderId || !rzpPaymentId || !rzpSignature) {
      res.status(400).json({ error: 'Missing Razorpay payment verification parameters.' });
      return;
    }

    const result = await withStoreLock(() => {
      const db = ensureStore();
      const order = db.orders.find((o) => o.orderNumber === orderNumber);
      if (!order) {
        return { status: 404, body: { error: 'Order not found for verification.' } };
      }

      if (order.razorpayOrderId !== rzpOrderId) {
        return {
          status: 400,
          body: { error: 'Razorpay order ID does not match this NidhuVastra order.' },
        };
      }

      if (order.paymentStatus === 'paid' && order.razorpayPaymentId === rzpPaymentId) {
        return { status: 200, body: { order, alreadyProcessed: true } };
      }

      if (order.paymentStatus === 'paid' || db.processedPaymentIds.includes(rzpPaymentId)) {
        return {
          status: 409,
          body: { error: 'This payment has already been processed.', order },
        };
      }

      const expected = crypto
        .createHmac('sha256', cfg.keySecret)
        .update(`${rzpOrderId}|${rzpPaymentId}`)
        .digest('hex');

      const now = new Date().toISOString();

      if (!timingSafeEqualHex(expected, rzpSignature)) {
        order.paymentStatus = 'failed';
        order.status = 'Payment Failed';
        order.failureReason = 'Payment signature verification failed.';
        order.updatedAt = now;
        order.statusHistory.push({
          status: 'Payment Failed',
          timestamp: now,
          note: 'Server rejected payment: Razorpay HMAC signature mismatch.',
        });
        saveStore(db);
        return {
          status: 400,
          body: { error: 'Payment signature verification failed. Please retry or contact support.', order },
        };
      }

      order.paymentStatus = 'paid';
      order.status = 'Order Placed';
      order.razorpayPaymentId = rzpPaymentId;
      order.razorpaySignatureVerified = true;
      order.paidAt = now;
      order.updatedAt = now;
      order.failureReason = undefined;
      order.statusHistory.push({
        status: 'Order Placed',
        timestamp: now,
        note: `Order confirmed with server-verified Razorpay payment (Payment ID: ${rzpPaymentId}).`,
      });
      recordOrderConfirmationNotification(order, 'Razorpay Checkout');
      db.processedPaymentIds.push(rzpPaymentId);
      saveStore(db);

      return { status: 200, body: { order } };
    });

    res.status(result.status).json(result.body);
  });

  app.post('/api/payment/razorpay/failed', async (req, res) => {
    const orderNumber = String(req.body?.orderNumber || '').trim();
    const rzpOrderId = String(req.body?.razorpayOrderId || '').trim();
    const description = String(req.body?.description || req.body?.reason || 'Payment was declined or could not be completed.').trim();

    if (!orderNumber) {
      res.status(400).json({ error: 'Missing orderNumber.' });
      return;
    }

    const result = await withStoreLock(() => {
      const db = ensureStore();
      const order = db.orders.find(
        (o) => o.orderNumber === orderNumber && (!rzpOrderId || o.razorpayOrderId === rzpOrderId)
      );
      if (!order) {
        return { status: 404, body: { error: 'Order not found.' } };
      }
      if (order.paymentStatus === 'paid') {
        return { status: 200, body: { order, alreadyPaid: true } };
      }
      const now = new Date().toISOString();
      order.paymentStatus = 'failed';
      order.status = 'Payment Failed';
      order.failureReason = description;
      order.updatedAt = now;
      order.statusHistory.push({
        status: 'Payment Failed',
        timestamp: now,
        note: description,
      });
      saveStore(db);
      return { status: 200, body: { order } };
    });

    res.status(result.status).json(result.body);
  });

  app.post('/api/payment/razorpay/cancelled', async (req, res) => {
    const orderNumber = String(req.body?.orderNumber || '').trim();
    const rzpOrderId = String(req.body?.razorpayOrderId || '').trim();

    if (!orderNumber) {
      res.status(400).json({ error: 'Missing orderNumber.' });
      return;
    }

    const result = await withStoreLock(() => {
      const db = ensureStore();
      const order = db.orders.find(
        (o) => o.orderNumber === orderNumber && (!rzpOrderId || o.razorpayOrderId === rzpOrderId)
      );
      if (!order) {
        return { status: 404, body: { error: 'Order not found.' } };
      }
      if (order.paymentStatus === 'paid') {
        return { status: 200, body: { order, alreadyPaid: true } };
      }
      const now = new Date().toISOString();
      if (order.paymentStatus === 'pending') {
        order.failureReason = 'Payment window was closed before completing payment.';
        order.updatedAt = now;
        order.statusHistory.push({
          status: 'Payment Pending',
          timestamp: now,
          note: 'Customer dismissed Razorpay checkout before payment completion.',
        });
        saveStore(db);
      }
      return { status: 200, body: { order } };
    });

    res.status(result.status).json(result.body);
  });

  // Backward-compatible direct order placement for UPI Concierge & COD
  app.post('/api/orders', async (req, res) => {
    const body = (req.body || {}) as Record<string, unknown>;
    const paymentMethod = String(body.paymentMethod || '') as OrderRecord['paymentMethod'];

    if (!['upi_whatsapp', 'cod'].includes(paymentMethod)) {
      res.status(400).json({
        error:
          paymentMethod === 'razorpay'
            ? 'Razorpay payments must be initiated and verified via /api/checkout/razorpay/initiate and /api/payment/razorpay/verify.'
            : 'Please select a valid payment method.',
      });
      return;
    }

    const validation = validateCustomerAndBilling(body);
    if (!validation.ok) {
      res.status(400).json({ error: validation.error });
      return;
    }

    const itemsResult = buildVerifiedCartItems(body.items as unknown[], productById);
    if (!itemsResult.ok) {
      res.status(400).json({ error: itemsResult.error });
      return;
    }

    const promoInput = String(body.promoCode || '').trim();
    let discountAmount = 0;
    let appliedPromoCode: string | undefined;
    if (promoInput) {
      const promoEval = evaluatePromoCode(promoInput, itemsResult.subtotal);
      if (!promoEval.valid) {
        res.status(400).json({ error: promoEval.error });
        return;
      }
      discountAmount = promoEval.discountAmount;
      appliedPromoCode = promoEval.code;
    }

    const total = Math.max(0, itemsResult.subtotal - discountAmount);
    const idempotencyKey = String(body.idempotencyKey || '').trim() || undefined;

    const result = await withStoreLock(() => {
      const db = ensureStore();
      if (idempotencyKey) {
        const duplicate = db.orders.find((o) => o.idempotencyKey === idempotencyKey);
        if (duplicate) {
          return { status: 200, body: { order: duplicate, duplicate: true } };
        }
      }

      const now = new Date().toISOString();
      const orderNumber = generateOrderNumber(db.orders.length);

      const paymentStatus: OrderRecord['paymentStatus'] =
        paymentMethod === 'cod' ? 'cod_confirmed' : 'pending_verification';

      const orderNote =
        paymentMethod === 'cod'
          ? 'Order placed with Cash on Delivery confirmation.'
          : 'Order placed; awaiting UPI payment verification via NidhuVastra WhatsApp (+91 76764 07220).';

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
        customer: validation.customer,
        billingAddress: validation.billingAddress,
        items: itemsResult.items,
        subtotal: itemsResult.subtotal,
        discountAmount,
        promoCode: appliedPromoCode,
        shipping: 0,
        total,
        currency: 'INR',
        paymentMethod,
        paymentStatus,
        idempotencyKey,
        courierName: 'DTDC',
      };

      recordOrderConfirmationNotification(
        record,
        paymentMethod === 'cod' ? 'Cash on Delivery' : 'UPI WhatsApp Concierge'
      );

      db.orders.unshift(record);
      saveStore(db);
      return { status: 201, body: { order: record } };
    });

    res.status(result.status).json(result.body);
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
          'No matching order found in our store records. If you placed an order on our legacy storefront or need immediate assistance, please track via DTDC or message us on WhatsApp at +91 76764 07220.',
      });
      return;
    }

    res.json({ order: found });
  });

  app.post('/api/newsletter', async (req, res) => {
    const email = String(req.body?.email || '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({ error: 'Please enter a valid email address.' });
      return;
    }
    const result = await withStoreLock(() => {
      const db = ensureStore();
      const exists = db.newsletter.some((n) => n.email === email);
      if (!exists) {
        db.newsletter.push({ email, subscribedAt: new Date().toISOString() });
        saveStore(db);
      }
      return exists;
    });
    res.json({ ok: true, alreadySubscribed: result });
  });

  app.post('/api/contact', async (req, res) => {
    const name = String(req.body?.name || '').trim();
    const email = String(req.body?.email || '').trim();
    const phone = String(req.body?.phone || '').trim();
    const subject = String(req.body?.subject || 'General Inquiry').trim();
    const message = String(req.body?.message || '').trim();

    if (name.length < 2 || (!email && !phone) || message.length < 5) {
      res.status(400).json({ error: 'Please enter your name, contact details, and message.' });
      return;
    }

    const ticketId = `INQ-${Date.now().toString().slice(-6)}`;
    await withStoreLock(() => {
      const db = ensureStore();
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
    });
    res.status(201).json({ ok: true, ticketId });
  });

  const server = http.createServer(app);

  // Vite integration in dev vs static dist in production
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR === 'true' ? false : { server },
      },
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

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`NidhuVastra server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
