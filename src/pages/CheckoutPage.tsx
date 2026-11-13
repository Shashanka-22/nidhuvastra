import React, { useEffect, useState } from 'react';
import { CheckCircle2, Lock, MessageCircle, ShieldCheck, Truck } from 'lucide-react';
import { BRAND, INDIAN_STATES, wixImageUrl } from '../data/brand';
import { useStore } from '../context/StoreContext';
import type { OrderRecord } from '../types/store';
import { SafeImage } from '../components/SafeImage';

declare global {
  interface Window {
    Razorpay?: new (opts: Record<string, unknown>) => { open: () => void };
  }
}

export const CheckoutPage: React.FC = () => {
  const { cart, cartSubtotal, clearCart, saveRecentOrder, navigate, showToast } = useStore();

  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('Karnataka');
  const [pinCode, setPinCode] = useState('');

  const [razorpayEnabled, setRazorpayEnabled] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<OrderRecord['paymentMethod']>('upi_whatsapp');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [confirmedOrder, setConfirmedOrder] = useState<OrderRecord | null>(null);

  useEffect(() => {
    fetch('/api/payment/config')
      .then((r) => r.json())
      .then((cfg) => {
        if (cfg?.razorpayEnabled) {
          setRazorpayEnabled(true);
          setPaymentMethod('razorpay');
        }
      })
      .catch(() => {
        // default to upi_whatsapp / cod
      });
  }, []);

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const finalizeOrder = async (razorpayPayload?: {
    orderId: string;
    paymentId: string;
    signature: string;
  }) => {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer: { name, mobile, email, address, city, state, pinCode },
        items: cart.map((c) => ({
          productId: c.productId,
          quantity: c.quantity,
          selectedOption: c.selectedOption,
        })),
        paymentMethod,
        razorpay: razorpayPayload,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Could not place your order.');
    }
    const order = data.order as OrderRecord;
    saveRecentOrder(order);
    clearCart();
    setConfirmedOrder(order);
    showToast(`Order ${order.orderNumber} confirmed!`, 'success');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanMobile = mobile.replace(/\D/g, '');
    const cleanPin = pinCode.replace(/\D/g, '');
    if (name.trim().length < 2) {
      setErrorMsg('Please enter your full name.');
      return;
    }
    if (cleanMobile.length !== 10) {
      setErrorMsg('Please enter a valid 10-digit Indian mobile number.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    if (address.trim().length < 6 || city.trim().length < 2) {
      setErrorMsg('Please enter your complete delivery address and city.');
      return;
    }
    if (!/^[1-9][0-9]{5}$/.test(cleanPin)) {
      setErrorMsg('Please enter a valid 6-digit Indian PIN code.');
      return;
    }

    setSubmitting(true);
    try {
      if (paymentMethod === 'razorpay' && razorpayEnabled) {
        const loaded = await loadRazorpayScript();
        if (!loaded || !window.Razorpay) {
          throw new Error('Unable to load Razorpay payment gateway. Please try again.');
        }

        const rzpOrderRes = await fetch('/api/payment/razorpay/order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: cart.map((c) => ({ productId: c.productId, quantity: c.quantity })),
          }),
        });
        const rzpOrder = await rzpOrderRes.json();
        if (!rzpOrderRes.ok) {
          throw new Error(rzpOrder.error || 'Failed to initiate Razorpay payment.');
        }

        const options = {
          key: rzpOrder.keyId,
          amount: rzpOrder.amount,
          currency: rzpOrder.currency,
          name: 'NidhuVastra',
          description: 'Saree Order Checkout',
          order_id: rzpOrder.orderId,
          prefill: {
            name: name.trim(),
            email: email.trim(),
            contact: cleanMobile,
          },
          theme: { color: '#641E32' },
          handler: async (response: {
            razorpay_order_id: string;
            razorpay_payment_id: string;
            razorpay_signature: string;
          }) => {
            try {
              await finalizeOrder({
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
              });
            } catch (err) {
              setErrorMsg(err instanceof Error ? err.message : 'Payment verification failed.');
            } finally {
              setSubmitting(false);
            }
          },
          modal: {
            ondismiss: () => {
              setSubmitting(false);
              setErrorMsg('Payment was cancelled before completion.');
            },
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
        return;
      }

      await finalizeOrder();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to place order. Please try again.');
    } finally {
      if (paymentMethod !== 'razorpay') {
        setSubmitting(false);
      }
    }
  };

  if (confirmedOrder) {
    const whatsappConfirmText = encodeURIComponent(
      `Hello NidhuVastra, I placed Order ${confirmedOrder.orderNumber} (Total: ₹${confirmedOrder.total.toLocaleString('en-IN')}). Name: ${confirmedOrder.customer.name}. Please share UPI details / confirmation.`
    );

    return (
      <div className="mx-auto max-w-3xl px-4 sm:px-8 py-14 sm:py-20">
        <div className="bg-white border border-[#242020]/10 p-8 sm:p-12">
          <div className="flex items-center gap-3 text-[#2E5A3E]">
            <CheckCircle2 className="h-7 w-7" />
            <span className="text-xs font-semibold uppercase tracking-[0.16em]">Order Confirmed</span>
          </div>

          <h1 className="font-editorial text-4xl sm:text-5xl font-medium text-[#242020] mt-3">
            Thank You, {confirmedOrder.customer.name}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-[#5C5252]">
            Your order <strong className="text-[#242020] tabular-nums">{confirmedOrder.orderNumber}</strong> has been recorded. We dispatch within 2–3 business days with complimentary shipping across India.
          </p>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-6 bg-[#FAF7F2] p-5 border border-[#242020]/8 text-sm">
            <div>
              <p className="text-xs uppercase tracking-wider text-[#5C5252]">Order Reference</p>
              <p className="font-semibold text-[#641E32] tabular-nums mt-1">{confirmedOrder.orderNumber}</p>
              <p className="text-xs text-[#5C5252] mt-1">Status: {confirmedOrder.status}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-[#5C5252]">Shipping Destination</p>
              <p className="text-[#242020] mt-1">
                {confirmedOrder.customer.address}, {confirmedOrder.customer.city},{' '}
                {confirmedOrder.customer.state} – {confirmedOrder.customer.pinCode}
              </p>
              <p className="text-xs text-[#5C5252] mt-1 tabular-nums">
                +91 {confirmedOrder.customer.mobile} · {confirmedOrder.customer.email}
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-3 border-t border-[#242020]/10 pt-5">
            {confirmedOrder.items.map((item, i) => (
              <div key={i} className="flex items-center justify-between gap-4 text-sm">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-14 w-11 shrink-0 bg-[#F5F0E8] overflow-hidden">
                    <SafeImage
                      src={wixImageUrl(item.imageId, 120, 160, 80)}
                      alt={item.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-[#242020] truncate">{item.name}</p>
                    <p className="text-xs text-[#5C5252] tabular-nums">
                      Code {item.code} · Qty {item.quantity}
                    </p>
                  </div>
                </div>
                <span className="font-semibold tabular-nums">
                  ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                </span>
              </div>
            ))}
            <div className="flex justify-between border-t border-[#242020]/10 pt-3 text-base font-semibold text-[#242020]">
              <span>Total Paid / Payable (Taxes Included)</span>
              <span className="tabular-nums">₹{confirmedOrder.total.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {confirmedOrder.paymentMethod === 'upi_whatsapp' && (
            <div className="mt-6 bg-[#F3ECE2] p-4 text-xs leading-relaxed text-[#242020]">
              <p className="font-semibold">Complete UPI Payment Confirmation:</p>
              <p className="mt-1 text-[#5C5252]">
                Send your order reference <strong>{confirmedOrder.orderNumber}</strong> to our official WhatsApp concierge ({BRAND.phone}) to receive the verified NidhuVastra UPI QR &amp; instant dispatch priority.
              </p>
              <a
                href={`https://wa.me/${BRAND.phoneRaw}?text=${whatsappConfirmText}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-2 bg-[#242020] px-4 py-2 text-[11px] font-medium uppercase tracking-wider text-white hover:bg-[#641E32]"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                <span>Share Order on WhatsApp</span>
              </a>
            </div>
          )}

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() =>
                navigate(
                  `/track-order?orderNumber=${encodeURIComponent(confirmedOrder.orderNumber)}&contact=${encodeURIComponent(confirmedOrder.customer.mobile)}`
                )
              }
              className="bg-[#641E32] px-7 py-3.5 text-xs font-medium uppercase tracking-[0.14em] text-[#FAF7F2] hover:bg-[#4B1424] cursor-pointer"
            >
              Track This Order
            </button>
            <button
              type="button"
              onClick={() => navigate('/shop')}
              className="border border-[#242020]/20 px-7 py-3.5 text-xs font-medium uppercase tracking-[0.14em] text-[#242020] hover:border-[#641E32] cursor-pointer"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="font-editorial text-4xl text-[#242020]">Your Bag is Empty</h1>
        <p className="mt-3 text-sm text-[#5C5252]">
          Please add at least one saree to your shopping bag before proceeding to checkout.
        </p>
        <button
          type="button"
          onClick={() => navigate('/shop')}
          className="mt-6 bg-[#641E32] px-8 py-3.5 text-xs font-medium uppercase tracking-[0.14em] text-[#FAF7F2] cursor-pointer"
        >
          Browse Sarees
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1320px] px-4 sm:px-8 py-10 sm:py-14">
      <div className="border-b border-[#242020]/10 pb-6 mb-10">
        <p className="text-xs uppercase tracking-[0.18em] text-[#641E32] font-medium">
          Secure Checkout
        </p>
        <h1 className="font-editorial text-4xl sm:text-5xl font-medium text-[#242020] mt-2">
          Shipping &amp; Order Placement
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
        {/* Left Form */}
        <div className="lg:col-span-7 space-y-8 bg-white border border-[#242020]/10 p-6 sm:p-8">
          <div>
            <h2 className="font-editorial text-2xl font-medium text-[#242020] mb-5">
              1. Customer &amp; Delivery Address (India)
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label htmlFor="chk-name" className="block text-xs font-medium uppercase tracking-wider text-[#5C5252] mb-1.5">
                  Full Name *
                </label>
                <input
                  id="chk-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full border border-[#242020]/20 bg-[#FAF7F2]/50 px-4 py-3 text-sm focus:border-[#641E32] focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="chk-mobile" className="block text-xs font-medium uppercase tracking-wider text-[#5C5252] mb-1.5">
                  Mobile Number (10 digits) *
                </label>
                <input
                  id="chk-mobile"
                  type="tel"
                  required
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="w-full border border-[#242020]/20 bg-[#FAF7F2]/50 px-4 py-3 text-sm tabular-nums focus:border-[#641E32] focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="chk-email" className="block text-xs font-medium uppercase tracking-wider text-[#5C5252] mb-1.5">
                  Email Address *
                </label>
                <input
                  id="chk-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full border border-[#242020]/20 bg-[#FAF7F2]/50 px-4 py-3 text-sm focus:border-[#641E32] focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="chk-address" className="block text-xs font-medium uppercase tracking-wider text-[#5C5252] mb-1.5">
                  Street Address, House / Flat No. *
                </label>
                <textarea
                  id="chk-address"
                  required
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Door No., Building, Street, Landmark"
                  className="w-full border border-[#242020]/20 bg-[#FAF7F2]/50 px-4 py-3 text-sm focus:border-[#641E32] focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="chk-city" className="block text-xs font-medium uppercase tracking-wider text-[#5C5252] mb-1.5">
                  City / Town *
                </label>
                <input
                  id="chk-city"
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Mysuru"
                  className="w-full border border-[#242020]/20 bg-[#FAF7F2]/50 px-4 py-3 text-sm focus:border-[#641E32] focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="chk-state" className="block text-xs font-medium uppercase tracking-wider text-[#5C5252] mb-1.5">
                  State / UT *
                </label>
                <select
                  id="chk-state"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full border border-[#242020]/20 bg-[#FAF7F2]/50 px-4 py-3 text-sm focus:border-[#641E32] focus:outline-none"
                >
                  {INDIAN_STATES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="chk-pin" className="block text-xs font-medium uppercase tracking-wider text-[#5C5252] mb-1.5">
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
                  className="w-full border border-[#242020]/20 bg-[#FAF7F2]/50 px-4 py-3 text-sm tabular-nums focus:border-[#641E32] focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-[#242020]/10 pt-6">
            <h2 className="font-editorial text-2xl font-medium text-[#242020] mb-4">
              2. Payment Method
            </h2>

            <div className="space-y-3">
              {razorpayEnabled && (
                <label
                  className={`flex items-start gap-3 p-4 border cursor-pointer ${
                    paymentMethod === 'razorpay'
                      ? 'border-[#641E32] bg-[#FAF7F2]'
                      : 'border-[#242020]/15'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={paymentMethod === 'razorpay'}
                    onChange={() => setPaymentMethod('razorpay')}
                    className="mt-1 accent-[#641E32]"
                  />
                  <div>
                    <p className="text-sm font-semibold text-[#242020]">
                      Razorpay Secure Online Payment (UPI, Cards, NetBanking)
                    </p>
                    <p className="text-xs text-[#5C5252] mt-0.5">
                      Instant verified checkout via Razorpay.
                    </p>
                  </div>
                </label>
              )}

              <label
                className={`flex items-start gap-3 p-4 border cursor-pointer ${
                  paymentMethod === 'upi_whatsapp'
                    ? 'border-[#641E32] bg-[#FAF7F2]'
                    : 'border-[#242020]/15'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  checked={paymentMethod === 'upi_whatsapp'}
                  onChange={() => setPaymentMethod('upi_whatsapp')}
                  className="mt-1 accent-[#641E32]"
                />
                <div>
                  <p className="text-sm font-semibold text-[#242020]">
                    Direct UPI / Bank Transfer Verification
                  </p>
                  <p className="text-xs text-[#5C5252] mt-0.5">
                    Reserve your sarees immediately and complete UPI transfer via NidhuVastra&rsquo;s official WhatsApp concierge ({BRAND.phone}).
                  </p>
                </div>
              </label>

              <label
                className={`flex items-start gap-3 p-4 border cursor-pointer ${
                  paymentMethod === 'cod'
                    ? 'border-[#641E32] bg-[#FAF7F2]'
                    : 'border-[#242020]/15'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  checked={paymentMethod === 'cod'}
                  onChange={() => setPaymentMethod('cod')}
                  className="mt-1 accent-[#641E32]"
                />
                <div>
                  <p className="text-sm font-semibold text-[#242020]">
                    Cash on Delivery (COD — Pay at Doorstep)
                  </p>
                  <p className="text-xs text-[#5C5252] mt-0.5">
                    Pay in cash or UPI upon delivery across serviceable Indian PIN codes.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {errorMsg && (
            <div className="bg-[#641E32]/10 border border-[#641E32]/30 p-3.5 text-sm text-[#641E32]">
              {errorMsg}
            </div>
          )}
        </div>

        {/* Right Order Summary */}
        <aside className="lg:col-span-5 bg-white border border-[#242020]/10 p-6 sm:p-8 lg:sticky lg:top-28">
          <h2 className="font-editorial text-2xl font-medium text-[#242020] border-b border-[#242020]/10 pb-4">
            Order Summary
          </h2>

          <div className="mt-5 space-y-4 max-h-80 overflow-y-auto pr-1">
            {cart.map((item) => (
              <div
                key={`${item.productId}-${item.selectedOption || 'default'}`}
                className="flex items-center justify-between gap-3 text-sm"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-16 w-12 shrink-0 bg-[#F5F0E8] overflow-hidden">
                    <SafeImage
                      src={wixImageUrl(item.imageId, 140, 180, 82)}
                      alt={item.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-[#242020] truncate">{item.name}</p>
                    <p className="text-xs text-[#5C5252] tabular-nums">
                      Code {item.code} · Qty {item.quantity}
                    </p>
                  </div>
                </div>
                <span className="font-semibold text-[#242020] tabular-nums shrink-0">
                  ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-5 pt-4 border-t border-[#242020]/10 space-y-2.5 text-sm">
            <div className="flex justify-between text-[#5C5252]">
              <span>Subtotal (Taxes Included)</span>
              <span className="tabular-nums text-[#242020]">₹{cartSubtotal.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-[#5C5252]">
              <span>Shipping Across India</span>
              <span className="font-medium text-[#2E5A3E]">FREE</span>
            </div>
            <div className="flex justify-between border-t border-[#242020]/10 pt-3 text-lg font-semibold text-[#242020]">
              <span>Total Payable</span>
              <span className="tabular-nums">₹{cartSubtotal.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="mt-6 w-full flex items-center justify-center gap-2 bg-[#641E32] py-4 text-xs font-medium uppercase tracking-[0.16em] text-[#FAF7F2] hover:bg-[#4B1424] transition-colors disabled:opacity-60 cursor-pointer"
          >
            <Lock className="h-4 w-4" />
            <span>{submitting ? 'Placing Order...' : 'Confirm & Place Order'}</span>
          </button>

          <div className="mt-4 space-y-2 text-xs text-[#5C5252]">
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-[#641E32]" />
              <span>Dispatched within 2–3 business days via DTDC / courier partners.</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[#641E32]" />
              <span>Server-verified pricing &amp; instant order tracking reference.</span>
            </div>
          </div>
        </aside>
      </form>
    </div>
  );
};
