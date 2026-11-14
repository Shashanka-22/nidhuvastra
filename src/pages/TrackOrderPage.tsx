import React, { useEffect, useMemo, useState } from 'react';
import { Check, ExternalLink, MessageCircle, Package, Search, Truck } from 'lucide-react';
import { BRAND, wixImageUrl } from '../data/brand';
import { useStore } from '../context/StoreContext';
import type { OrderRecord, OrderStatus } from '../types/store';
import { SafeImage } from '../components/SafeImage';

const STAGES: OrderStatus[] = [
  'Order Placed',
  'Processing',
  'Dispatched',
  'Shipped',
  'Out for Delivery',
  'Delivered',
];

export const TrackOrderPage: React.FC = () => {
  const { route, recentOrders } = useStore();

  const initialQuery = useMemo(() => {
    const qIndex = route.indexOf('?');
    const params = new URLSearchParams(qIndex >= 0 ? route.slice(qIndex) : '');
    return {
      orderNumber: params.get('orderNumber') || '',
      contact: params.get('contact') || '',
    };
  }, [route]);

  const [orderNumber, setOrderNumber] = useState(initialQuery.orderNumber);
  const [contact, setContact] = useState(initialQuery.contact);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<OrderRecord | null>(null);

  const performLookup = async (ord: string, cnt: string) => {
    if (!ord.trim() || !cnt.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await fetch(
        `/api/orders/track?orderNumber=${encodeURIComponent(ord.trim())}&contact=${encodeURIComponent(cnt.trim())}`
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'No matching order found.');
      } else {
        setResult(data.order as OrderRecord);
      }
    } catch {
      setError('Unable to reach order tracking service. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialQuery.orderNumber && initialQuery.contact) {
      setOrderNumber(initialQuery.orderNumber);
      setContact(initialQuery.contact);
      performLookup(initialQuery.orderNumber, initialQuery.contact);
    }
  }, [initialQuery.orderNumber, initialQuery.contact]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performLookup(orderNumber, contact);
  };

  const currentStageIdx = result ? STAGES.indexOf(result.status) : -1;

  return (
    <div className="mx-auto max-w-[1100px] px-4 sm:px-8 py-12 sm:py-16">
      <div className="text-center max-w-2xl mx-auto">
        <p className="text-xs uppercase tracking-[0.18em] text-[#641E32] font-medium">
          Shipment Status
        </p>
        <h1 className="font-editorial text-4xl sm:text-5xl font-medium text-[#242020] mt-2">
          Track Your Order
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-[#5C5252]">
          Enter your NidhuVastra order number and registered mobile number or email address to check your live dispatch and delivery status.
        </p>
      </div>

      {/* Lookup Form */}
      <form
        onSubmit={handleSubmit}
        className="mt-10 bg-white border border-[#242020]/10 p-6 sm:p-8 max-w-3xl mx-auto"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="track-order-num" className="block text-xs font-medium uppercase tracking-wider text-[#5C5252] mb-1.5">
              Order Number *
            </label>
            <input
              id="track-order-num"
              type="text"
              required
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              placeholder="e.g. NV-1001-XXXX"
              className="w-full border border-[#242020]/20 bg-[#FAF7F2]/50 px-4 py-3 text-sm tabular-nums focus:border-[#641E32] focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="track-contact" className="block text-xs font-medium uppercase tracking-wider text-[#5C5252] mb-1.5">
              Registered Mobile or Email *
            </label>
            <input
              id="track-contact"
              type="text"
              required
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="10-digit mobile or email"
              className="w-full border border-[#242020]/20 bg-[#FAF7F2]/50 px-4 py-3 text-sm focus:border-[#641E32] focus:outline-none"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-5 w-full sm:w-auto flex items-center justify-center gap-2 bg-[#641E32] px-8 py-3.5 text-xs font-medium uppercase tracking-[0.16em] text-[#FAF7F2] hover:bg-[#4B1424] transition-colors disabled:opacity-60 cursor-pointer"
        >
          <Search className="h-4 w-4" />
          <span>{loading ? 'Checking Records...' : 'Track Order'}</span>
        </button>

        {recentOrders.length > 0 && (
          <div className="mt-5 pt-4 border-t border-[#242020]/10">
            <p className="text-xs text-[#5C5252] mb-2">Recent orders placed from this browser:</p>
            <div className="flex flex-wrap gap-2">
              {recentOrders.slice(0, 4).map((o) => (
                <button
                  key={o.orderNumber}
                  type="button"
                  onClick={() => {
                    setOrderNumber(o.orderNumber);
                    setContact(o.customer.mobile);
                    performLookup(o.orderNumber, o.customer.mobile);
                  }}
                  className="border border-[#242020]/20 bg-[#FAF7F2] px-3 py-1.5 text-xs font-medium text-[#242020] hover:border-[#641E32] tabular-nums cursor-pointer"
                >
                  {o.orderNumber}
                </button>
              ))}
            </div>
          </div>
        )}
      </form>

      {/* Error */}
      {error && (
        <div className="mt-8 max-w-3xl mx-auto bg-white border border-[#641E32]/30 p-6 text-sm text-[#242020] space-y-3">
          <p className="font-medium text-[#641E32]">{error}</p>
          <div className="flex flex-wrap gap-3 pt-1">
            <a
              href={BRAND.dtdcTrackUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 border border-[#242020]/20 px-4 py-2 text-xs font-medium uppercase tracking-wider hover:border-[#641E32]"
            >
              <span>Track on DTDC Website</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
            <a
              href={BRAND.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 bg-[#242020] px-4 py-2 text-xs font-medium uppercase tracking-wider text-white hover:bg-[#641E32]"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              <span>WhatsApp Support ({BRAND.phone})</span>
            </a>
          </div>
        </div>
      )}

      {/* Tracking Result */}
      {result && (
        <div className="mt-10 max-w-3xl mx-auto bg-white border border-[#242020]/10 p-6 sm:p-10 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#242020]/10 pb-6">
            <div>
              <p className="text-xs uppercase tracking-wider text-[#5C5252]">Order Reference</p>
              <h2 className="font-editorial text-3xl font-medium text-[#242020] tabular-nums mt-0.5">
                {result.orderNumber}
              </h2>
              <p className="text-xs text-[#5C5252] mt-1">
                Placed on{' '}
                {new Date(result.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>
            <div className="text-left sm:text-right">
              <span className="text-xs uppercase tracking-wider text-[#5C5252]">Current Status</span>
              <p className="text-lg font-semibold text-[#641E32] mt-0.5">{result.status}</p>
              {result.razorpayPaymentId && (
                <p className="text-xs text-[#5C5252] mt-1 tabular-nums">
                  Payment ID: {result.razorpayPaymentId}
                </p>
              )}
              {result.trackingNumber && (
                <p className="text-xs text-[#242020] mt-1 tabular-nums">
                  {result.courierName || 'DTDC'} AWB: {result.trackingNumber}
                </p>
              )}
            </div>
          </div>

          {(result.status === 'Payment Pending' || result.status === 'Payment Failed') && (
            <div className="border border-[#641E32]/25 bg-[#FAF7F2] p-4 text-xs leading-relaxed text-[#242020]">
              <p className="font-semibold text-[#641E32]">{result.status}</p>
              <p className="mt-1 text-[#5C5252]">
                {result.failureReason ||
                  'Payment has not been verified for this order yet. Return to Checkout to retry payment or contact our WhatsApp concierge.'}
              </p>
            </div>
          )}

          {/* 6-Stage Progress */}
          <div>
            <h3 className="font-sans text-xs font-semibold uppercase tracking-[0.14em] text-[#5C5252] mb-5">
              Shipment Journey
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
              {STAGES.map((stage, idx) => {
                const completed = currentStageIdx >= 0 && idx <= currentStageIdx;
                const current = currentStageIdx >= 0 && idx === currentStageIdx;
                return (
                  <div
                    key={stage}
                    className={`p-3 border ${
                      current
                        ? 'border-[#641E32] bg-[#FAF7F2]'
                        : completed
                          ? 'border-[#C5A46D]/60 bg-white'
                          : 'border-[#242020]/10 bg-white opacity-55'
                    }`}
                  >
                    <div
                      className={`h-6 w-6 flex items-center justify-center text-xs font-semibold mb-2 ${
                        completed ? 'bg-[#641E32] text-white' : 'bg-[#F0EBE3] text-[#5C5252]'
                      }`}
                    >
                      {completed ? <Check className="h-3.5 w-3.5" /> : idx + 1}
                    </div>
                    <p className="text-xs font-medium text-[#242020] leading-snug">{stage}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* History Log */}
          <div className="border-t border-[#242020]/10 pt-6">
            <h3 className="font-sans text-xs font-semibold uppercase tracking-[0.14em] text-[#5C5252] mb-3">
              Order Activity
            </h3>
            <div className="space-y-3">
              {result.statusHistory.map((h, i) => (
                <div key={i} className="flex items-start gap-3 text-sm">
                  <Package className="h-4 w-4 text-[#641E32] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-[#242020]">
                      {h.status}{' '}
                      <span className="text-xs font-normal text-[#5C5252] ml-2">
                        {new Date(h.timestamp).toLocaleString('en-IN')}
                      </span>
                    </p>
                    <p className="text-xs text-[#5C5252] mt-0.5">{h.note}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Items & Delivery Info */}
          <div className="border-t border-[#242020]/10 pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-sans text-xs font-semibold uppercase tracking-[0.14em] text-[#5C5252] mb-3">
                Items in Order
              </h3>
              <div className="space-y-3">
                {result.items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 text-xs">
                    <div className="h-14 w-11 shrink-0 bg-[#F5F0E8] overflow-hidden">
                      <SafeImage
                        src={wixImageUrl(item.imageId, 120, 160, 80)}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-[#242020] truncate">{item.name}</p>
                      <p className="text-[#5C5252] tabular-nums">
                        Code {item.code} · Qty {item.quantity} · ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#FAF7F2] p-4 border border-[#242020]/8 text-xs space-y-2">
              <div className="flex items-center gap-2 font-semibold text-[#242020]">
                <Truck className="h-4 w-4 text-[#641E32]" />
                <span>Delivery Address</span>
              </div>
              <p className="text-[#242020]">{result.customer.name}</p>
              <p className="text-[#5C5252]">
                {result.customer.address}, {result.customer.city}, {result.customer.state} –{' '}
                {result.customer.pinCode}
              </p>
              {result.discountAmount && result.discountAmount > 0 ? (
                <p className="text-[#2E5A3E] tabular-nums">
                  Promo ({result.promoCode}): −₹{result.discountAmount.toLocaleString('en-IN')}
                </p>
              ) : null}
              <p className="text-[#242020] font-semibold tabular-nums">
                Total: ₹{result.total.toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Courier Note */}
      <div className="mt-10 max-w-3xl mx-auto bg-[#F3ECE2] p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-[#242020]">
        <div>
          <p className="font-semibold">Placed an order via WhatsApp or our legacy store?</p>
          <p className="text-[#5C5252] mt-1">
            Use your DTDC tracking number directly on DTDC or message our Mysuru support team.
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5 shrink-0">
          <a
            href={BRAND.dtdcTrackUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 border border-[#242020]/25 bg-white px-4 py-2 font-medium hover:border-[#641E32]"
          >
            <span>DTDC Website</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
          <a
            href={BRAND.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 bg-[#242020] px-4 py-2 font-medium text-white hover:bg-[#641E32]"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            <span>WhatsApp</span>
          </a>
        </div>
      </div>
    </div>
  );
};
