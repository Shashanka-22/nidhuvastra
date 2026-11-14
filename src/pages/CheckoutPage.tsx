import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  CreditCard,
  Landmark,
  Loader2,
  Lock,
  MapPin,
  MessageCircle,
  RefreshCw,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Tag,
  Truck,
  Wallet,
  X,
} from 'lucide-react';
import { BRAND, BRAND_ASSETS, INDIAN_STATES, wixImageUrl } from '../data/brand';
import { useStore } from '../context/StoreContext';
import type { BillingAddress, OrderRecord } from '../types/store';
import { SafeImage } from '../components/SafeImage';

interface RazorpayInstance {
  open: () => void;
  on: (event: string, cb: (response: RazorpayErrorEvent) => void) => void;
}

interface RazorpayErrorEvent {
  error?: {
    code?: string;
    description?: string;
    source?: string;
    step?: string;
    reason?: string;
  };
}

declare global {
  interface Window {
    Razorpay?: new (opts: Record<string, unknown>) => RazorpayInstance;
  }
}

type ProcessingStage =
  | 'idle'
  | 'creating_order'
  | 'gateway_open'
  | 'verifying_signature'
  | 'finalizing';

interface AppliedPromo {
  code: string;
  discountAmount: number;
  description: string;
}

interface FailedPaymentState {
  orderNumber?: string;
  razorpayOrderId?: string;
  amount: number;
  message: string;
  canRetryRazorpay: boolean;
}

function createIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `nv-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export const CheckoutPage: React.FC = () => {
  const { cart, cartCount, cartSubtotal, clearCart, recentOrders, saveRecentOrder, navigate, showToast } =
    useStore();

  // Customer & Shipping State
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('Karnataka');
  const [pinCode, setPinCode] = useState('');

  // Billing Address State
  const [sameAsShipping, setSameAsShipping] = useState(true);
  const [billingName, setBillingName] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [billingCity, setBillingCity] = useState('');
  const [billingState, setBillingState] = useState('Karnataka');
  const [billingPinCode, setBillingPinCode] = useState('');

  // Payment Gateway Config
  const [razorpayEnabled, setRazorpayEnabled] = useState(false);
  const [razorpayMode, setRazorpayMode] = useState<'test' | 'live'>('test');
  const [paymentMethod, setPaymentMethod] = useState<OrderRecord['paymentMethod']>('upi_whatsapp');

  // Promo Code State
  const [promoExpanded, setPromoExpanded] = useState(false);
  const [promoInput, setPromoInput] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<AppliedPromo | null>(null);

  // Checkout Flow State
  const [processingStage, setProcessingStage] = useState<ProcessingStage>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [confirmedOrder, setConfirmedOrder] = useState<OrderRecord | null>(null);
  const [failedState, setFailedState] = useState<FailedPaymentState | null>(null);

  // Per-checkout idempotency key (reset on cart edits so legitimate new orders get fresh keys)
  const idempotencyKeyRef = useRef<string>(createIdempotencyKey());
  const paymentTerminalEventHandledRef = useRef<boolean>(false);

  useEffect(() => {
    fetch('/api/payment/config')
      .then((r) => r.json())
      .then((cfg) => {
        if (cfg?.razorpayEnabled) {
          setRazorpayEnabled(true);
          setRazorpayMode(cfg.razorpayMode === 'live' ? 'live' : 'test');
          setPaymentMethod('razorpay');
        }
      })
      .catch(() => {
        // Fallback smoothly to UPI / COD if config unavailable
      });
  }, []);

  // Revalidate or clear promo when cart changes
  const cartSignature = useMemo(
    () => cart.map((i) => `${i.productId}:${i.quantity}`).join('|'),
    [cart]
  );

  useEffect(() => {
    idempotencyKeyRef.current = createIdempotencyKey();
    if (!appliedPromo) return;
    if (cart.length === 0) {
      setAppliedPromo(null);
      return;
    }
    fetch('/api/promos/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: appliedPromo.code,
        items: cart.map((c) => ({ productId: c.productId, quantity: c.quantity })),
      }),
    })
      .then((r) => r.json().then((d) => ({ ok: r.ok, data: d })))
      .then(({ ok, data }) => {
        if (ok && data?.valid) {
          setAppliedPromo({
            code: data.code,
            discountAmount: data.discountAmount,
            description: data.description,
          });
        } else {
          setAppliedPromo(null);
          setPromoError(data?.error || 'Promo code no longer applies to updated bag.');
        }
      })
      .catch(() => {
        // Ignore transient check failure
      });
  }, [cartSignature]);

  const discountAmount = appliedPromo?.discountAmount || 0;
  const finalTotal = Math.max(0, cartSubtotal - discountAmount);
  const isSubmitting = processingStage !== 'idle';

  const deliveryFilled = useMemo(() => {
    const cleanMobile = mobile.replace(/\D/g, '');
    const cleanPin = pinCode.replace(/\D/g, '');
    const shipOk =
      name.trim().length >= 2 &&
      cleanMobile.length === 10 &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) &&
      address.trim().length >= 6 &&
      city.trim().length >= 2 &&
      /^[1-9][0-9]{5}$/.test(cleanPin);
    if (!shipOk) return false;
    if (sameAsShipping) return true;
    const cleanBillPin = billingPinCode.replace(/\D/g, '');
    return (
      billingName.trim().length >= 2 &&
      billingAddress.trim().length >= 6 &&
      billingCity.trim().length >= 2 &&
      /^[1-9][0-9]{5}$/.test(cleanBillPin)
    );
  }, [
    name,
    mobile,
    email,
    address,
    city,
    pinCode,
    sameAsShipping,
    billingName,
    billingAddress,
    billingCity,
    billingPinCode,
  ]);

  const activeStep = confirmedOrder ? 3 : deliveryFilled ? 2 : 1;

  const fillFromPreviousOrder = () => {
    const prev = recentOrders[0];
    if (!prev) return;
    setName(prev.customer.name);
    setMobile(prev.customer.mobile);
    setEmail(prev.customer.email);
    setAddress(prev.customer.address);
    setCity(prev.customer.city);
    setState(prev.customer.state || 'Karnataka');
    setPinCode(prev.customer.pinCode);
    if (prev.billingAddress && !prev.billingAddress.sameAsShipping) {
      setSameAsShipping(false);
      setBillingName(prev.billingAddress.name);
      setBillingAddress(prev.billingAddress.address);
      setBillingCity(prev.billingAddress.city);
      setBillingState(prev.billingAddress.state);
      setBillingPinCode(prev.billingAddress.pinCode);
    } else {
      setSameAsShipping(true);
    }
    showToast('Previous delivery details filled.', 'info');
  };

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const existing = document.querySelector<HTMLScriptElement>(
        'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
      );
      if (existing) {
        existing.addEventListener('load', () => resolve(true), { once: true });
        existing.addEventListener('error', () => resolve(false), { once: true });
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleApplyPromo = async () => {
    const trimmed = promoInput.trim().toUpperCase();
    setPromoError('');
    if (!trimmed) {
      setPromoError('Please enter a promo code to apply.');
      return;
    }
    setPromoLoading(true);
    try {
      const res = await fetch('/api/promos/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: trimmed,
          items: cart.map((c) => ({ productId: c.productId, quantity: c.quantity })),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.valid) {
        setAppliedPromo(null);
        setPromoError(data?.error || 'This promo code is not valid.');
        return;
      }
      setAppliedPromo({
        code: data.code,
        discountAmount: data.discountAmount,
        description: data.description,
      });
      setPromoInput(data.code);
      showToast(`Promo ${data.code} applied (−₹${Number(data.discountAmount).toLocaleString('en-IN')}).`, 'success');
    } catch {
      setPromoError('Unable to validate promo code right now. Please try again.');
    } finally {
      setPromoLoading(false);
    }
  };

  const validateForm = (): string | null => {
    const cleanMobile = mobile.replace(/\D/g, '');
    const cleanPin = pinCode.replace(/\D/g, '');
    if (name.trim().length < 2) return 'Please enter your full name.';
    if (cleanMobile.length !== 10) return 'Please enter a valid 10-digit Indian mobile number.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return 'Please enter a valid email address.';
    if (address.trim().length < 6 || city.trim().length < 2) {
      return 'Please enter your complete delivery address and city.';
    }
    if (!/^[1-9][0-9]{5}$/.test(cleanPin)) return 'Please enter a valid 6-digit Indian PIN code.';

    if (!sameAsShipping) {
      const cleanBillPin = billingPinCode.replace(/\D/g, '');
      if (billingName.trim().length < 2 || billingAddress.trim().length < 6 || billingCity.trim().length < 2) {
        return 'Please complete your billing name, address, and city.';
      }
      if (!/^[1-9][0-9]{5}$/.test(cleanBillPin)) {
        return 'Please enter a valid 6-digit billing PIN code.';
      }
    }

    if (paymentMethod === 'razorpay' && !razorpayEnabled) {
      return 'Razorpay gateway is not configured on the server yet. Please select Direct UPI or Cash on Delivery.';
    }

    return null;
  };

  const buildPayload = (retryOrderNumber?: string) => {
    const cleanMobile = mobile.replace(/\D/g, '');
    const cleanPin = pinCode.replace(/\D/g, '');
    const cleanBillPin = billingPinCode.replace(/\D/g, '');

    const billing: BillingAddress = sameAsShipping
      ? {
          sameAsShipping: true,
          name: name.trim(),
          address: address.trim(),
          city: city.trim(),
          state,
          pinCode: cleanPin,
        }
      : {
          sameAsShipping: false,
          name: billingName.trim(),
          address: billingAddress.trim(),
          city: billingCity.trim(),
          state: billingState,
          pinCode: cleanBillPin,
        };

    return {
      customer: {
        name: name.trim(),
        mobile: cleanMobile,
        email: email.trim().toLowerCase(),
        address: address.trim(),
        city: city.trim(),
        state,
        pinCode: cleanPin,
      },
      billingAddress: billing,
      items: cart.map((c) => ({
        productId: c.productId,
        quantity: c.quantity,
        selectedOption: c.selectedOption,
      })),
      promoCode: appliedPromo?.code || undefined,
      idempotencyKey: idempotencyKeyRef.current,
      retryOrderNumber,
    };
  };

  const launchRazorpayFlow = async (retryOrderNumber?: string) => {
    setErrorMsg('');
    setFailedState(null);
    setProcessingStage('creating_order');

    const loaded = await loadRazorpayScript();
    if (!loaded || !window.Razorpay) {
      setProcessingStage('idle');
      setErrorMsg('Unable to load Razorpay Checkout SDK. Please check your connection and try again.');
      return;
    }

    const initRes = await fetch('/api/checkout/razorpay/initiate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildPayload(retryOrderNumber)),
    });

    const initData = await initRes.json();
    if (!initRes.ok) {
      if (initData?.alreadyPaid && initData?.order) {
        saveRecentOrder(initData.order as OrderRecord);
        clearCart();
        setConfirmedOrder(initData.order as OrderRecord);
        setProcessingStage('idle');
        return;
      }
      throw new Error(initData?.error || 'Could not initialize Razorpay order.');
    }

    const pendingOrder = initData.order as OrderRecord;
    const rzpDetails = initData.razorpay as {
      orderId: string;
      amount: number;
      currency: string;
      keyId: string;
    };

    paymentTerminalEventHandledRef.current = false;
    setProcessingStage('gateway_open');

    const options: Record<string, unknown> = {
      key: rzpDetails.keyId,
      amount: rzpDetails.amount,
      currency: rzpDetails.currency,
      name: 'NidhuVastra',
      description: `Order ${pendingOrder.orderNumber} · ${cartCount} ${cartCount === 1 ? 'Saree' : 'Sarees'}`,
      image: wixImageUrl(BRAND_ASSETS.emblemId, 256, 256, 90),
      order_id: rzpDetails.orderId,
      prefill: {
        name: pendingOrder.customer.name,
        email: pendingOrder.customer.email,
        contact: pendingOrder.customer.mobile,
      },
      notes: {
        orderNumber: pendingOrder.orderNumber,
      },
      theme: {
        color: '#641E32',
        backdrop_color: 'rgba(36, 32, 32, 0.55)',
      },
      handler: async (response: {
        razorpay_order_id: string;
        razorpay_payment_id: string;
        razorpay_signature: string;
      }) => {
        paymentTerminalEventHandledRef.current = true;
        setProcessingStage('verifying_signature');
        try {
          const verifyRes = await fetch('/api/payment/razorpay/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderNumber: pendingOrder.orderNumber,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
          });
          const verifyData = await verifyRes.json();
          if (!verifyRes.ok) {
            setFailedState({
              orderNumber: pendingOrder.orderNumber,
              razorpayOrderId: rzpDetails.orderId,
              amount: pendingOrder.total,
              message: verifyData?.error || 'Payment signature verification failed on the server.',
              canRetryRazorpay: true,
            });
            return;
          }
          const verifiedOrder = verifyData.order as OrderRecord;
          saveRecentOrder(verifiedOrder);
          clearCart();
          setConfirmedOrder(verifiedOrder);
          showToast(`Payment verified! Order ${verifiedOrder.orderNumber} placed.`, 'success');
        } catch {
          setFailedState({
            orderNumber: pendingOrder.orderNumber,
            razorpayOrderId: rzpDetails.orderId,
            amount: pendingOrder.total,
            message: 'Unable to verify payment with our server. Your cart has been preserved.',
            canRetryRazorpay: true,
          });
        } finally {
          setProcessingStage('idle');
        }
      },
      modal: {
        escape: true,
        confirm_close: true,
        ondismiss: async () => {
          if (paymentTerminalEventHandledRef.current) return;
          paymentTerminalEventHandledRef.current = true;
          try {
            await fetch('/api/payment/razorpay/cancelled', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                orderNumber: pendingOrder.orderNumber,
                razorpayOrderId: rzpDetails.orderId,
              }),
            });
          } catch {
            // Non-blocking audit call
          }
          setProcessingStage('idle');
          setFailedState({
            orderNumber: pendingOrder.orderNumber,
            razorpayOrderId: rzpDetails.orderId,
            amount: pendingOrder.total,
            message:
              'Payment checkout was closed before completion. No payment was confirmed and your bag remains intact.',
            canRetryRazorpay: true,
          });
        },
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', async (failEvt: RazorpayErrorEvent) => {
      if (paymentTerminalEventHandledRef.current) return;
      paymentTerminalEventHandledRef.current = true;
      const failMessage =
        failEvt?.error?.description ||
        failEvt?.error?.reason ||
        'Your payment could not be completed at the gateway.';

      try {
        await fetch('/api/payment/razorpay/failed', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderNumber: pendingOrder.orderNumber,
            razorpayOrderId: rzpDetails.orderId,
            code: failEvt?.error?.code,
            reason: failEvt?.error?.reason,
            description: failMessage,
          }),
        });
      } catch {
        // Non-blocking failure log
      }

      setProcessingStage('idle');
      setFailedState({
        orderNumber: pendingOrder.orderNumber,
        razorpayOrderId: rzpDetails.orderId,
        amount: pendingOrder.total,
        message: failMessage,
        canRetryRazorpay: true,
      });
    });

    rzp.open();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const validationError = validateForm();
    if (validationError) {
      setErrorMsg(validationError);
      return;
    }

    setErrorMsg('');

    try {
      if (paymentMethod === 'razorpay') {
        await launchRazorpayFlow();
        return;
      }

      setProcessingStage('finalizing');
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...buildPayload(),
          paymentMethod,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Could not place your order.');
      }

      const order = data.order as OrderRecord;
      saveRecentOrder(order);
      clearCart();
      setConfirmedOrder(order);
      showToast(`Order ${order.orderNumber} confirmed!`, 'success');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to place order. Please try again.');
    } finally {
      if (paymentMethod !== 'razorpay') {
        setProcessingStage('idle');
      } else {
        setProcessingStage((cur) => (cur === 'creating_order' ? 'idle' : cur));
      }
    }
  };

  const handleRetryPayment = async () => {
    if (!failedState || isSubmitting) return;
    try {
      await launchRazorpayFlow(failedState.orderNumber);
    } catch (err) {
      setProcessingStage('idle');
      setFailedState((prev) =>
        prev
          ? {
              ...prev,
              message: err instanceof Error ? err.message : 'Unable to restart Razorpay payment.',
            }
          : null
      );
    }
  };

  // =========================================================================
  // 1. PAYMENT SUCCESS SCREEN
  // =========================================================================
  if (confirmedOrder) {
    const whatsappConfirmText = encodeURIComponent(
      `Hello NidhuVastra, I placed Order ${confirmedOrder.orderNumber} (Total: ₹${confirmedOrder.total.toLocaleString('en-IN')}). Name: ${confirmedOrder.customer.name}. Please share confirmation details.`
    );

    const isRazorpayPaid =
      confirmedOrder.paymentMethod === 'razorpay' && confirmedOrder.paymentStatus === 'paid';

    return (
      <div className="mx-auto max-w-4xl px-4 sm:px-8 py-12 sm:py-18">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="relative overflow-hidden rounded-2xl bg-white border border-[#242020]/10 p-6 sm:p-12 shadow-[0_18px_50px_rgba(36,32,32,0.06)]"
        >
          {/* Subtle celebration accent */}
          <div className="flex flex-col items-center text-center">
            <div className="relative flex h-20 w-20 items-center justify-center">
              <motion.span
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1.15, opacity: 0 }}
                transition={{ duration: 1.4, repeat: 1, ease: 'easeOut' }}
                className="absolute inset-0 rounded-full border border-[#C5A46D]"
              />
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-[#2E5A3E]/10 border border-[#C5A46D]/60 text-[#2E5A3E]"
              >
                <CheckCircle2 className="h-9 w-9" strokeWidth={1.6} />
              </motion.div>
            </div>

            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-[#C5A46D]">
              {isRazorpayPaid ? 'Payment Verified & Confirmed' : 'Order Recorded'}
            </p>
            <h1 className="font-editorial text-4xl sm:text-5xl font-medium text-[#242020] mt-2">
              Your Order Has Been Placed!
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-[#5C5252]">
              Thank you, <strong className="text-[#242020]">{confirmedOrder.customer.name}</strong>. Your
              handpicked NidhuVastra sarees are now scheduled for quality inspection and dispatch within 2–3
              business days with complimentary pan-India shipping.
            </p>
          </div>

          {/* Key Payment & Order Details */}
          <div className="mt-9 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 rounded-xl bg-[#FAF7F2] p-5 border border-[#242020]/8 text-sm">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-[#5C5252]">Order Number</p>
              <p className="font-semibold text-[#641E32] tabular-nums mt-1">
                {confirmedOrder.orderNumber}
              </p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-[#5C5252]">Payment ID</p>
              <p className="font-medium text-[#242020] tabular-nums mt-1 break-all">
                {confirmedOrder.razorpayPaymentId ||
                  (confirmedOrder.paymentMethod === 'cod'
                    ? 'Pay on Delivery'
                    : 'Awaiting UPI Confirmation')}
              </p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-[#5C5252]">Amount Paid</p>
              <p className="font-semibold text-[#242020] tabular-nums mt-1">
                ₹{confirmedOrder.total.toLocaleString('en-IN')}
              </p>
              <p className="text-[11px] text-[#5C5252] mt-0.5">Taxes Included</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-[#5C5252]">Payment Status</p>
              <p className="font-semibold text-[#2E5A3E] mt-1">
                {confirmedOrder.paymentStatus === 'paid'
                  ? 'Paid · Verified'
                  : confirmedOrder.paymentStatus === 'cod_confirmed'
                    ? 'COD Confirmed'
                    : 'Pending UPI Verification'}
              </p>
            </div>
          </div>

          {/* Delivery & Billing Address */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm">
            <div className="rounded-xl border border-[#242020]/10 p-5">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#641E32]">
                <Truck className="h-4 w-4" />
                <span>Delivery Address</span>
              </div>
              <p className="font-medium text-[#242020] mt-2">{confirmedOrder.customer.name}</p>
              <p className="text-[#5C5252] mt-1 leading-relaxed">
                {confirmedOrder.customer.address}, {confirmedOrder.customer.city},{' '}
                {confirmedOrder.customer.state} – {confirmedOrder.customer.pinCode}
              </p>
              <p className="text-xs text-[#5C5252] mt-2 tabular-nums">
                +91 {confirmedOrder.customer.mobile} · {confirmedOrder.customer.email}
              </p>
            </div>

            <div className="rounded-xl border border-[#242020]/10 p-5">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#641E32]">
                <MapPin className="h-4 w-4" />
                <span>Billing Address</span>
              </div>
              {confirmedOrder.billingAddress && !confirmedOrder.billingAddress.sameAsShipping ? (
                <>
                  <p className="font-medium text-[#242020] mt-2">
                    {confirmedOrder.billingAddress.name}
                  </p>
                  <p className="text-[#5C5252] mt-1 leading-relaxed">
                    {confirmedOrder.billingAddress.address}, {confirmedOrder.billingAddress.city},{' '}
                    {confirmedOrder.billingAddress.state} – {confirmedOrder.billingAddress.pinCode}
                  </p>
                </>
              ) : (
                <>
                  <p className="font-medium text-[#242020] mt-2">{confirmedOrder.customer.name}</p>
                  <p className="text-[#5C5252] mt-1">Same as delivery address</p>
                </>
              )}
              {confirmedOrder.notificationSentAt && (
                <p className="text-xs text-[#2E5A3E] mt-3">
                  Confirmation recorded for {confirmedOrder.customer.email}
                </p>
              )}
            </div>
          </div>

          {/* Itemized Order Details */}
          <div className="mt-7 rounded-xl border border-[#242020]/10 p-5 sm:p-6">
            <h2 className="font-editorial text-2xl font-medium text-[#242020] pb-3 border-b border-[#242020]/10">
              Order Details
            </h2>
            <div className="mt-4 space-y-4">
              {confirmedOrder.items.map((item, i) => (
                <div key={i} className="flex items-center justify-between gap-4 text-sm">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="h-16 w-12 shrink-0 rounded-lg bg-[#F5F0E8] overflow-hidden">
                      <SafeImage
                        src={wixImageUrl(item.imageId, 140, 180, 82)}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-[#242020] truncate">{item.name}</p>
                      <p className="text-xs text-[#5C5252] tabular-nums mt-0.5">
                        Code {item.code}
                        {item.selectedOption ? ` · ${item.selectedOption}` : ''} · Qty {item.quantity}
                      </p>
                    </div>
                  </div>
                  <span className="font-semibold text-[#242020] tabular-nums shrink-0">
                    ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-5 pt-4 border-t border-[#242020]/10 space-y-2 text-sm">
              <div className="flex justify-between text-[#5C5252]">
                <span>Subtotal (Taxes Included)</span>
                <span className="tabular-nums text-[#242020]">
                  ₹{confirmedOrder.subtotal.toLocaleString('en-IN')}
                </span>
              </div>
              {confirmedOrder.discountAmount && confirmedOrder.discountAmount > 0 ? (
                <div className="flex justify-between text-[#2E5A3E]">
                  <span>Promo Discount ({confirmedOrder.promoCode})</span>
                  <span className="tabular-nums">
                    −₹{confirmedOrder.discountAmount.toLocaleString('en-IN')}
                  </span>
                </div>
              ) : null}
              <div className="flex justify-between text-[#5C5252]">
                <span>Delivery Charges</span>
                <span className="font-medium text-[#2E5A3E]">FREE</span>
              </div>
              <div className="flex justify-between border-t border-[#242020]/10 pt-3 text-base font-semibold text-[#242020]">
                <span>{isRazorpayPaid ? 'Total Paid' : 'Total Payable'}</span>
                <span className="tabular-nums text-lg">
                  ₹{confirmedOrder.total.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          {confirmedOrder.paymentMethod === 'upi_whatsapp' && (
            <div className="mt-6 rounded-xl bg-[#F3ECE2] p-5 text-xs leading-relaxed text-[#242020]">
              <p className="font-semibold">Complete UPI Payment Confirmation:</p>
              <p className="mt-1 text-[#5C5252]">
                Share your order reference <strong>{confirmedOrder.orderNumber}</strong> with our official
                WhatsApp concierge ({BRAND.phone}) to receive the verified NidhuVastra UPI QR &amp;
                priority dispatch confirmation.
              </p>
              <a
                href={`https://wa.me/${BRAND.phoneRaw}?text=${whatsappConfirmText}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-2 rounded-lg bg-[#242020] px-4 py-2.5 text-[11px] font-medium uppercase tracking-wider text-white hover:bg-[#641E32] transition-colors"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                <span>Share Order on WhatsApp</span>
              </a>
            </div>
          )}

          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3">
            <button
              type="button"
              onClick={() =>
                navigate(
                  `/track-order?orderNumber=${encodeURIComponent(confirmedOrder.orderNumber)}&contact=${encodeURIComponent(confirmedOrder.customer.mobile)}`
                )
              }
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#641E32] px-8 py-3.5 text-xs font-medium uppercase tracking-[0.14em] text-[#FAF7F2] hover:bg-[#4B1424] transition-colors cursor-pointer whitespace-nowrap"
            >
              <span>Track Your Order</span>
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => navigate('/shop')}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#242020]/20 px-8 py-3.5 text-xs font-medium uppercase tracking-[0.14em] text-[#242020] hover:border-[#641E32] hover:text-[#641E32] transition-colors cursor-pointer whitespace-nowrap"
            >
              <span>Continue Shopping</span>
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // =========================================================================
  // 2. PAYMENT FAILURE / CANCELLED SCREEN (Cart & Entered Details Preserved)
  // =========================================================================
  if (failedState && cart.length > 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 sm:px-8 py-14 sm:py-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-2xl bg-white border border-[#641E32]/20 p-7 sm:p-11 shadow-[0_18px_50px_rgba(100,30,50,0.08)] text-center"
        >
          <motion.div
            initial={{ scale: 0.7 }}
            animate={{ scale: [0.7, 1.06, 1] }}
            transition={{ duration: 0.45 }}
            className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#641E32]/10 text-[#641E32]"
          >
            <AlertTriangle className="h-8 w-8" strokeWidth={1.6} />
          </motion.div>

          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-[#641E32]">
            Payment Incomplete
          </p>
          <h1 className="font-editorial text-3xl sm:text-4xl font-medium text-[#242020] mt-2">
            We Could Not Confirm Your Payment
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-[#5C5252]">{failedState.message}</p>

          <div className="mt-6 rounded-xl bg-[#FAF7F2] border border-[#242020]/10 p-4 text-left text-xs sm:text-sm space-y-1.5">
            {failedState.orderNumber && (
              <div className="flex justify-between">
                <span className="text-[#5C5252]">Pending Order Reference</span>
                <span className="font-semibold text-[#242020] tabular-nums">
                  {failedState.orderNumber}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-[#5C5252]">Payable Amount</span>
              <span className="font-semibold text-[#641E32] tabular-nums">
                ₹{failedState.amount.toLocaleString('en-IN')}
              </span>
            </div>
            <p className="text-xs text-[#2E5A3E] pt-1">
              Your {cartCount} {cartCount === 1 ? 'saree has' : 'sarees have'} been safely preserved in your
              shopping bag. No duplicate order will be created when you retry.
            </p>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            {failedState.canRetryRazorpay && razorpayEnabled && (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleRetryPayment}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#641E32] px-7 py-3.5 text-xs font-medium uppercase tracking-[0.14em] text-[#FAF7F2] hover:bg-[#4B1424] transition-colors disabled:opacity-60 cursor-pointer whitespace-nowrap"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                <span>{isSubmitting ? 'Reconnecting...' : 'Retry Payment'}</span>
              </button>
            )}

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => setFailedState(null)}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#242020]/20 px-6 py-3.5 text-xs font-medium uppercase tracking-[0.14em] text-[#242020] hover:border-[#641E32] hover:text-[#641E32] transition-colors cursor-pointer whitespace-nowrap"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Change Payment Method</span>
            </button>
          </div>

          <div className="mt-6 pt-5 border-t border-[#242020]/10 text-xs text-[#5C5252]">
            Need help completing your order?{' '}
            <a
              href={BRAND.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-[#641E32] hover:underline"
            >
              Message us on WhatsApp ({BRAND.phone})
            </a>
          </div>
        </motion.div>
      </div>
    );
  }

  // =========================================================================
  // 3. EMPTY BAG GUARD
  // =========================================================================
  if (cart.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <ShoppingBag className="mx-auto h-11 w-11 text-[#C5A46D] mb-4" strokeWidth={1.3} />
        <h1 className="font-editorial text-4xl text-[#242020]">Your Bag is Empty</h1>
        <p className="mt-3 text-sm text-[#5C5252]">
          Please add at least one saree to your shopping bag before proceeding to checkout.
        </p>
        <button
          type="button"
          onClick={() => navigate('/shop')}
          className="mt-6 rounded-lg bg-[#641E32] px-8 py-3.5 text-xs font-medium uppercase tracking-[0.14em] text-[#FAF7F2] hover:bg-[#4B1424] transition-colors cursor-pointer"
        >
          Browse Sarees
        </button>
      </div>
    );
  }

  // =========================================================================
  // 4. TWO-COLUMN PREMIUM CHECKOUT EXPERIENCE
  // =========================================================================
  const processingLabel =
    processingStage === 'creating_order'
      ? 'Creating Secure Razorpay Order...'
      : processingStage === 'gateway_open'
        ? 'Complete Payment in Razorpay Window...'
        : processingStage === 'verifying_signature'
          ? 'Verifying Payment Signature...'
          : processingStage === 'finalizing'
            ? 'Confirming Your Order...'
            : '';

  return (
    <div className="mx-auto max-w-[1320px] px-4 sm:px-8 py-8 sm:py-14">
      {/* Header + Step Progress */}
      <div className="border-b border-[#242020]/10 pb-6 mb-8 sm:mb-10 flex flex-col md:flex-row md:items-end justify-between gap-5">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[#641E32] font-semibold">
            NidhuVastra Secure Checkout
          </p>
          <h1 className="font-editorial text-4xl sm:text-5xl font-medium text-[#242020] mt-1.5">
            Complete Your Saree Order
          </h1>
        </div>

        {/* Clean 3-Step Indicator */}
        <ol className="flex items-center gap-2 sm:gap-4 text-xs" aria-label="Checkout progress">
          {[
            { num: 1, label: 'Address' },
            { num: 2, label: 'Payment' },
            { num: 3, label: 'Confirmed' },
          ].map((step, idx) => {
            const done = activeStep > step.num;
            const current = activeStep === step.num;
            return (
              <React.Fragment key={step.num}>
                <li className="flex items-center gap-2 whitespace-nowrap">
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold tabular-nums transition-colors ${
                      done
                        ? 'bg-[#2E5A3E] text-white'
                        : current
                          ? 'bg-[#641E32] text-[#FAF7F2]'
                          : 'bg-[#E9E2D8] text-[#5C5252]'
                    }`}
                  >
                    {done ? <Check className="h-3.5 w-3.5" /> : step.num}
                  </span>
                  <span
                    className={`font-medium ${
                      current ? 'text-[#242020]' : done ? 'text-[#2E5A3E]' : 'text-[#5C5252]'
                    }`}
                  >
                    {step.label}
                  </span>
                </li>
                {idx < 2 && <span className="h-px w-4 sm:w-8 bg-[#242020]/15" aria-hidden="true" />}
              </React.Fragment>
            );
          })}
        </ol>
      </div>

      {/* Processing Banner when verifying signature or opening gateway */}
      <AnimatePresence>
        {isSubmitting && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mb-6 flex items-center justify-between gap-3 rounded-xl bg-[#242020] px-5 py-3.5 text-xs sm:text-sm text-[#FAF7F2] shadow-md"
          >
            <div className="flex items-center gap-3">
              <Loader2 className="h-4 w-4 animate-spin text-[#C5A46D] shrink-0" />
              <span>{processingLabel}</span>
            </div>
            <span className="hidden sm:inline text-[11px] uppercase tracking-wider text-[#C5A46D]">
              Do not refresh
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
        {/* LEFT SECTION – CHECKOUT */}
        <div className="lg:col-span-7 space-y-6">
          {/* 1. Payment Method */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="rounded-2xl bg-white border border-[#242020]/10 p-6 sm:p-8 shadow-[0_8px_30px_rgba(36,32,32,0.04)]"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 mb-5">
              <h2 className="font-editorial text-2xl sm:text-3xl font-medium text-[#242020]">
                1. Payment Method
              </h2>
              <span className="inline-flex items-center gap-1.5 text-xs text-[#5C5252]">
                <ShieldCheck className="h-4 w-4 text-[#C5A46D]" />
                <span>256-Bit Encrypted</span>
              </span>
            </div>

            <div className="space-y-3.5">
              {/* Razorpay Payment Card */}
              <motion.label
                whileHover={{ y: -1 }}
                transition={{ duration: 0.16 }}
                className={`block rounded-xl border p-4 sm:p-5 cursor-pointer transition-all ${
                  paymentMethod === 'razorpay'
                    ? 'border-[#641E32] bg-[#FAF7F2]/90 shadow-[0_6px_20px_rgba(100,30,50,0.07)]'
                    : 'border-[#242020]/15 bg-white hover:border-[#C5A46D]'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={paymentMethod === 'razorpay'}
                    onChange={() => setPaymentMethod('razorpay')}
                    className="mt-1 h-4 w-4 accent-[#641E32] shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm sm:text-base font-semibold text-[#242020]">
                        Razorpay Secure Checkout
                      </p>
                      <span className="text-[11px] font-medium uppercase tracking-wider text-[#641E32]">
                        {razorpayEnabled
                          ? razorpayMode === 'test'
                            ? 'Test Mode Ready'
                            : 'Instant Verification'
                          : 'Merchant Keys Required'}
                      </span>
                    </div>

                    <p className="text-xs text-[#5C5252] mt-1 leading-relaxed">
                      Pay seamlessly using UPI apps (GPay, PhonePe, Paytm), Credit &amp; Debit Cards,
                      NetBanking, or Wallets.
                    </p>

                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] font-medium text-[#5C5252]">
                      <span className="inline-flex items-center gap-1.5">
                        <Smartphone className="h-3.5 w-3.5 text-[#641E32]" />
                        <span>UPI / QR</span>
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <CreditCard className="h-3.5 w-3.5 text-[#641E32]" />
                        <span>Cards</span>
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Landmark className="h-3.5 w-3.5 text-[#641E32]" />
                        <span>NetBanking</span>
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Wallet className="h-3.5 w-3.5 text-[#641E32]" />
                        <span>Wallets</span>
                      </span>
                    </div>

                    {!razorpayEnabled && paymentMethod === 'razorpay' && (
                      <p className="mt-3 rounded-lg bg-[#641E32]/8 px-3 py-2 text-xs text-[#641E32]">
                        Set <code className="font-mono">RAZORPAY_KEY_ID</code> and{' '}
                        <code className="font-mono">RAZORPAY_KEY_SECRET</code> in server environment to
                        activate Razorpay checkout, or select Direct UPI / COD below.
                      </p>
                    )}
                  </div>
                </div>
              </motion.label>

              {/* Direct UPI WhatsApp Concierge */}
              <motion.label
                whileHover={{ y: -1 }}
                transition={{ duration: 0.16 }}
                className={`block rounded-xl border p-4 sm:p-5 cursor-pointer transition-all ${
                  paymentMethod === 'upi_whatsapp'
                    ? 'border-[#641E32] bg-[#FAF7F2]/90 shadow-[0_6px_20px_rgba(100,30,50,0.07)]'
                    : 'border-[#242020]/15 bg-white hover:border-[#C5A46D]'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={paymentMethod === 'upi_whatsapp'}
                    onChange={() => setPaymentMethod('upi_whatsapp')}
                    className="mt-1 h-4 w-4 accent-[#641E32] shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm sm:text-base font-semibold text-[#242020]">
                      Direct UPI / Bank Transfer Verification
                    </p>
                    <p className="text-xs text-[#5C5252] mt-1 leading-relaxed">
                      Reserve your sarees immediately and complete UPI payment with our official
                      WhatsApp concierge ({BRAND.phone}).
                    </p>
                  </div>
                </div>
              </motion.label>

              {/* Cash on Delivery */}
              <motion.label
                whileHover={{ y: -1 }}
                transition={{ duration: 0.16 }}
                className={`block rounded-xl border p-4 sm:p-5 cursor-pointer transition-all ${
                  paymentMethod === 'cod'
                    ? 'border-[#641E32] bg-[#FAF7F2]/90 shadow-[0_6px_20px_rgba(100,30,50,0.07)]'
                    : 'border-[#242020]/15 bg-white hover:border-[#C5A46D]'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={paymentMethod === 'cod'}
                    onChange={() => setPaymentMethod('cod')}
                    className="mt-1 h-4 w-4 accent-[#641E32] shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm sm:text-base font-semibold text-[#242020]">
                      Cash on Delivery (COD)
                    </p>
                    <p className="text-xs text-[#5C5252] mt-1 leading-relaxed">
                      Pay in cash or UPI upon delivery across serviceable Indian PIN codes.
                    </p>
                  </div>
                </div>
              </motion.label>
            </div>
          </motion.section>

          {/* 2. Delivery & Billing Address */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.05 }}
            className="rounded-2xl bg-white border border-[#242020]/10 p-6 sm:p-8 shadow-[0_8px_30px_rgba(36,32,32,0.04)]"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
              <h2 className="font-editorial text-2xl sm:text-3xl font-medium text-[#242020]">
                2. Delivery &amp; Billing Address
              </h2>
              {recentOrders.length > 0 && (
                <button
                  type="button"
                  onClick={fillFromPreviousOrder}
                  className="text-xs font-medium text-[#641E32] hover:underline cursor-pointer"
                >
                  Use details from last order
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label
                  htmlFor="chk-name"
                  className="block text-xs font-medium uppercase tracking-wider text-[#5C5252] mb-1.5"
                >
                  Full Name *
                </label>
                <input
                  id="chk-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full rounded-lg border border-[#242020]/20 bg-[#FAF7F2]/60 px-4 py-3 text-sm text-[#242020] focus:border-[#641E32] focus:bg-white focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label
                  htmlFor="chk-mobile"
                  className="block text-xs font-medium uppercase tracking-wider text-[#5C5252] mb-1.5"
                >
                  Mobile Number (10 digits) *
                </label>
                <div className="flex rounded-lg border border-[#242020]/20 bg-[#FAF7F2]/60 focus-within:border-[#641E32] focus-within:bg-white transition-colors overflow-hidden">
                  <span className="flex items-center px-3 text-xs font-semibold text-[#5C5252] border-r border-[#242020]/10 tabular-nums">
                    +91
                  </span>
                  <input
                    id="chk-mobile"
                    type="tel"
                    required
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="9876543210"
                    className="w-full bg-transparent px-3.5 py-3 text-sm tabular-nums text-[#242020] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="chk-email"
                  className="block text-xs font-medium uppercase tracking-wider text-[#5C5252] mb-1.5"
                >
                  Email Address *
                </label>
                <input
                  id="chk-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-lg border border-[#242020]/20 bg-[#FAF7F2]/60 px-4 py-3 text-sm text-[#242020] focus:border-[#641E32] focus:bg-white focus:outline-none transition-colors"
                />
              </div>

              <div className="sm:col-span-2">
                <label
                  htmlFor="chk-address"
                  className="block text-xs font-medium uppercase tracking-wider text-[#5C5252] mb-1.5"
                >
                  Delivery Street Address, House / Flat No. *
                </label>
                <textarea
                  id="chk-address"
                  required
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Door No., Building, Street, Landmark"
                  className="w-full rounded-lg border border-[#242020]/20 bg-[#FAF7F2]/60 px-4 py-3 text-sm text-[#242020] focus:border-[#641E32] focus:bg-white focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label
                  htmlFor="chk-city"
                  className="block text-xs font-medium uppercase tracking-wider text-[#5C5252] mb-1.5"
                >
                  City / Town *
                </label>
                <input
                  id="chk-city"
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Mysuru"
                  className="w-full rounded-lg border border-[#242020]/20 bg-[#FAF7F2]/60 px-4 py-3 text-sm text-[#242020] focus:border-[#641E32] focus:bg-white focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label
                  htmlFor="chk-state"
                  className="block text-xs font-medium uppercase tracking-wider text-[#5C5252] mb-1.5"
                >
                  State / UT *
                </label>
                <select
                  id="chk-state"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full rounded-lg border border-[#242020]/20 bg-[#FAF7F2]/60 px-4 py-3 text-sm text-[#242020] focus:border-[#641E32] focus:bg-white focus:outline-none transition-colors"
                >
                  {INDIAN_STATES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="chk-pin"
                  className="block text-xs font-medium uppercase tracking-wider text-[#5C5252] mb-1.5"
                >
                  PIN Code (6 digits) *
                </label>
                <input
                  id="chk-pin"
                  type="text"
                  required
                  maxLength={6}
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value)}
                  placeholder="e.g. 570017"
                  className="w-full rounded-lg border border-[#242020]/20 bg-[#FAF7F2]/60 px-4 py-3 text-sm tabular-nums text-[#242020] focus:border-[#641E32] focus:bg-white focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Billing Address Toggle */}
            <div className="mt-6 pt-5 border-t border-[#242020]/10">
              <label className="inline-flex items-center gap-2.5 text-sm font-medium text-[#242020] cursor-pointer">
                <input
                  type="checkbox"
                  checked={sameAsShipping}
                  onChange={(e) => setSameAsShipping(e.target.checked)}
                  className="h-4 w-4 rounded accent-[#641E32]"
                />
                <span>Billing address is the same as delivery address</span>
              </label>

              <AnimatePresence initial={false}>
                {!sameAsShipping && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl bg-[#FAF7F2] p-4 sm:p-5 border border-[#242020]/10">
                      <div className="sm:col-span-2">
                        <label
                          htmlFor="bill-name"
                          className="block text-xs font-medium uppercase tracking-wider text-[#5C5252] mb-1.5"
                        >
                          Billing Name *
                        </label>
                        <input
                          id="bill-name"
                          type="text"
                          required={!sameAsShipping}
                          value={billingName}
                          onChange={(e) => setBillingName(e.target.value)}
                          placeholder="Name for billing receipt"
                          className="w-full rounded-lg border border-[#242020]/20 bg-white px-4 py-2.5 text-sm focus:border-[#641E32] focus:outline-none"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label
                          htmlFor="bill-address"
                          className="block text-xs font-medium uppercase tracking-wider text-[#5C5252] mb-1.5"
                        >
                          Billing Street Address *
                        </label>
                        <input
                          id="bill-address"
                          type="text"
                          required={!sameAsShipping}
                          value={billingAddress}
                          onChange={(e) => setBillingAddress(e.target.value)}
                          placeholder="Billing door no., street, area"
                          className="w-full rounded-lg border border-[#242020]/20 bg-white px-4 py-2.5 text-sm focus:border-[#641E32] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="bill-city"
                          className="block text-xs font-medium uppercase tracking-wider text-[#5C5252] mb-1.5"
                        >
                          Billing City *
                        </label>
                        <input
                          id="bill-city"
                          type="text"
                          required={!sameAsShipping}
                          value={billingCity}
                          onChange={(e) => setBillingCity(e.target.value)}
                          placeholder="City"
                          className="w-full rounded-lg border border-[#242020]/20 bg-white px-4 py-2.5 text-sm focus:border-[#641E32] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="bill-state"
                          className="block text-xs font-medium uppercase tracking-wider text-[#5C5252] mb-1.5"
                        >
                          Billing State *
                        </label>
                        <select
                          id="bill-state"
                          value={billingState}
                          onChange={(e) => setBillingState(e.target.value)}
                          className="w-full rounded-lg border border-[#242020]/20 bg-white px-4 py-2.5 text-sm focus:border-[#641E32] focus:outline-none"
                        >
                          {INDIAN_STATES.map((st) => (
                            <option key={st} value={st}>
                              {st}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label
                          htmlFor="bill-pin"
                          className="block text-xs font-medium uppercase tracking-wider text-[#5C5252] mb-1.5"
                        >
                          Billing PIN Code *
                        </label>
                        <input
                          id="bill-pin"
                          type="text"
                          required={!sameAsShipping}
                          maxLength={6}
                          value={billingPinCode}
                          onChange={(e) => setBillingPinCode(e.target.value)}
                          placeholder="6-digit PIN"
                          className="w-full rounded-lg border border-[#242020]/20 bg-white px-4 py-2.5 text-sm tabular-nums focus:border-[#641E32] focus:outline-none"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.section>

          {/* 3. Order Review & Place Order & Pay CTA */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.1 }}
            className="rounded-2xl bg-white border border-[#242020]/10 p-6 sm:p-8 shadow-[0_8px_30px_rgba(36,32,32,0.04)]"
          >
            <h2 className="font-editorial text-2xl sm:text-3xl font-medium text-[#242020] mb-4">
              3. Order Review
            </h2>

            <div className="rounded-xl bg-[#FAF7F2] border border-[#242020]/8 p-4 sm:p-5 text-xs sm:text-sm space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                <span className="text-[#5C5252]">Recipient</span>
                <span className="font-medium text-[#242020]">
                  {name.trim() || 'Enter recipient name'}
                  {mobile.replace(/\D/g, '').length === 10
                    ? ` · +91 ${mobile.replace(/\D/g, '')}`
                    : ''}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                <span className="text-[#5C5252]">Deliver To</span>
                <span className="font-medium text-[#242020] sm:text-right max-w-md">
                  {address.trim()
                    ? `${address.trim()}, ${city.trim() || ''}, ${state} ${pinCode.trim()}`
                    : 'Enter your delivery address above'}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                <span className="text-[#5C5252]">Payment Selection</span>
                <span className="font-semibold text-[#641E32]">
                  {paymentMethod === 'razorpay'
                    ? 'Razorpay (UPI, Cards, NetBanking, Wallets)'
                    : paymentMethod === 'cod'
                      ? 'Cash on Delivery (COD)'
                      : 'Direct UPI via WhatsApp Concierge'}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-[#242020]/10">
                <span className="font-medium text-[#242020]">
                  Total Payable ({cartCount} {cartCount === 1 ? 'Saree' : 'Sarees'})
                </span>
                <span className="font-semibold text-base text-[#242020] tabular-nums">
                  ₹{finalTotal.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 rounded-xl bg-[#641E32]/10 border border-[#641E32]/30 p-3.5 text-sm text-[#641E32]"
              >
                {errorMsg}
              </motion.div>
            )}

            <motion.button
              type="submit"
              disabled={isSubmitting}
              whileHover={isSubmitting ? undefined : { scale: 1.008 }}
              whileTap={isSubmitting ? undefined : { scale: 0.99 }}
              className="mt-6 w-full flex items-center justify-center gap-2.5 rounded-xl bg-[#641E32] py-4 px-6 text-xs sm:text-sm font-medium uppercase tracking-[0.16em] text-[#FAF7F2] shadow-[0_10px_24px_rgba(100,30,50,0.22)] hover:bg-[#4B1424] transition-colors disabled:opacity-60 cursor-pointer min-h-[52px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{processingLabel || 'Processing...'}</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="h-4 w-4" />
                  <span>
                    {paymentMethod === 'razorpay'
                      ? `Place Order & Pay ₹${finalTotal.toLocaleString('en-IN')}`
                      : `Place Order · ₹${finalTotal.toLocaleString('en-IN')}`}
                  </span>
                </>
              )}
            </motion.button>

            <p className="mt-3 text-center text-[11px] text-[#5C5252] flex items-center justify-center gap-1.5">
              <Lock className="h-3.5 w-3.5 text-[#C5A46D]" />
              <span>
                Prices are inclusive of all taxes · Verified server-side before payment capture
              </span>
            </p>
          </motion.section>
        </div>

        {/* RIGHT SECTION – STICKY ORDER SUMMARY */}
        <aside className="lg:col-span-5 rounded-2xl bg-white border border-[#242020]/10 p-6 sm:p-8 shadow-[0_12px_36px_rgba(36,32,32,0.05)] lg:sticky lg:top-28">
          <div className="flex items-center justify-between border-b border-[#242020]/10 pb-4">
            <h2 className="font-editorial text-2xl sm:text-3xl font-medium text-[#242020]">
              Order Summary
            </h2>
            <button
              type="button"
              onClick={() => navigate('/cart')}
              className="text-xs font-medium text-[#641E32] hover:underline cursor-pointer"
            >
              Edit Bag ({cartCount})
            </button>
          </div>

          {/* Cart Items */}
          <div className="mt-5 space-y-4 max-h-80 overflow-y-auto pr-1">
            {cart.map((item) => (
              <div
                key={`${item.productId}-${item.selectedOption || 'default'}`}
                className="flex items-center justify-between gap-3.5 text-sm"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="h-18 w-14 shrink-0 rounded-lg bg-[#F5F0E8] overflow-hidden border border-[#242020]/8">
                    <SafeImage
                      src={wixImageUrl(item.imageId, 160, 210, 84)}
                      alt={item.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-[#242020] truncate">{item.name}</p>
                    <p className="text-xs text-[#5C5252] tabular-nums mt-0.5">
                      Code {item.code}
                      {item.selectedOption ? ` · ${item.selectedOption}` : ''}
                    </p>
                    <p className="text-xs text-[#5C5252] tabular-nums mt-0.5">
                      Qty {item.quantity} × ₹{item.price.toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>
                <span className="font-semibold text-[#242020] tabular-nums shrink-0">
                  ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                </span>
              </div>
            ))}
          </div>

          {/* Expandable Promo Code Section */}
          <div className="mt-5 pt-4 border-t border-[#242020]/10">
            <button
              type="button"
              onClick={() => setPromoExpanded((prev) => !prev)}
              aria-expanded={promoExpanded}
              className="flex w-full items-center justify-between py-1.5 text-xs font-medium text-[#242020] hover:text-[#641E32] transition-colors cursor-pointer"
            >
              <span className="inline-flex items-center gap-2">
                <Tag className="h-3.5 w-3.5 text-[#C5A46D]" />
                <span>{appliedPromo ? `Promo Applied: ${appliedPromo.code}` : 'Have a promo code?'}</span>
              </span>
              <ChevronDown
                className={`h-4 w-4 transition-transform duration-200 ${
                  promoExpanded ? 'rotate-180' : ''
                }`}
              />
            </button>

            <AnimatePresence initial={false}>
              {promoExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="pt-3 space-y-2.5">
                    {appliedPromo ? (
                      <div className="flex items-center justify-between rounded-lg bg-[#2E5A3E]/10 border border-[#2E5A3E]/25 px-3.5 py-2.5 text-xs">
                        <div>
                          <p className="font-semibold text-[#2E5A3E]">{appliedPromo.code}</p>
                          <p className="text-[#5C5252] mt-0.5">{appliedPromo.description}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setAppliedPromo(null);
                            setPromoError('');
                            setPromoInput('');
                          }}
                          aria-label="Remove promo code"
                          className="p-1.5 text-[#5C5252] hover:text-[#641E32] cursor-pointer"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={promoInput}
                          onChange={(e) => {
                            setPromoInput(e.target.value.toUpperCase());
                            if (promoError) setPromoError('');
                          }}
                          placeholder="Enter promo code"
                          className="min-w-0 flex-1 rounded-lg border border-[#242020]/20 bg-[#FAF7F2]/60 px-3.5 py-2.5 text-xs uppercase tracking-wider text-[#242020] focus:border-[#641E32] focus:bg-white focus:outline-none"
                        />
                        <button
                          type="button"
                          disabled={promoLoading}
                          onClick={handleApplyPromo}
                          className="rounded-lg bg-[#242020] px-4 py-2.5 text-xs font-medium uppercase tracking-wider text-white hover:bg-[#641E32] transition-colors disabled:opacity-60 cursor-pointer shrink-0 min-h-[44px]"
                        >
                          {promoLoading ? 'Checking...' : 'Apply'}
                        </button>
                      </div>
                    )}

                    {promoError && <p className="text-xs text-[#641E32]">{promoError}</p>}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Totals Breakdown */}
          <div className="mt-5 pt-4 border-t border-[#242020]/10 space-y-2.5 text-sm">
            <div className="flex justify-between text-[#5C5252]">
              <span>Subtotal (Taxes Included)</span>
              <span className="tabular-nums text-[#242020]">
                ₹{cartSubtotal.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex justify-between text-[#5C5252]">
              <span>Delivery Charges</span>
              <span className="font-medium text-[#2E5A3E]">FREE</span>
            </div>
            <AnimatePresence initial={false}>
              {discountAmount > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="flex justify-between text-[#2E5A3E] font-medium"
                >
                  <span>Promo Discount ({appliedPromo?.code})</span>
                  <span className="tabular-nums">−₹{discountAmount.toLocaleString('en-IN')}</span>
                </motion.div>
              )}
            </AnimatePresence>
            <div className="flex justify-between items-baseline border-t border-[#242020]/10 pt-3.5 text-[#242020]">
              <span className="text-base font-semibold">Final Total</span>
              <motion.span
                key={finalTotal}
                initial={{ opacity: 0.6, y: 2 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="font-editorial text-3xl font-semibold text-[#641E32] tabular-nums"
              >
                ₹{finalTotal.toLocaleString('en-IN')}
              </motion.span>
            </div>
          </div>

          <div className="mt-5 rounded-xl bg-[#FAF7F2] p-4 space-y-2.5 text-xs text-[#5C5252]">
            <div className="flex items-start gap-2.5">
              <Truck className="h-4 w-4 text-[#641E32] shrink-0 mt-0.5" />
              <span>Free pan-India shipping via DTDC / courier partners (dispatched in 2–3 days).</span>
            </div>
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="h-4 w-4 text-[#641E32] shrink-0 mt-0.5" />
              <span>Server-verified INR pricing &amp; instant order tracking reference.</span>
            </div>
          </div>
        </aside>
      </form>
    </div>
  );
};
