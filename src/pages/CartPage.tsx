import React from 'react';
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2, Truck } from 'lucide-react';
import { wixImageUrl } from '../data/brand';
import { useStore } from '../context/StoreContext';
import { SafeImage } from '../components/SafeImage';

export const CartPage: React.FC = () => {
  const { cart, cartCount, cartSubtotal, updateCartQty, removeFromCart, navigate } = useStore();

  return (
    <div className="mx-auto max-w-[1320px] px-4 sm:px-8 py-12 sm:py-16">
      <div className="border-b border-[#242020]/10 pb-6 mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-[#641E32] font-medium">
            Your Selection
          </p>
          <h1 className="font-editorial text-4xl sm:text-5xl font-medium text-[#242020] mt-2">
            Shopping Bag
          </h1>
        </div>
        <p className="text-sm text-[#5C5252] tabular-nums">
          {cartCount} {cartCount === 1 ? 'saree' : 'sarees'} in bag
        </p>
      </div>

      {cart.length === 0 ? (
        <div className="bg-white border border-[#242020]/10 py-20 px-6 text-center">
          <ShoppingBag className="mx-auto h-12 w-12 text-[#C5A46D] mb-4" strokeWidth={1.2} />
          <h2 className="font-editorial text-3xl text-[#242020]">Your Shopping Bag is Empty</h2>
          <p className="mt-2 text-sm text-[#5C5252] max-w-md mx-auto">
            Discover timeless Banarasi, Mysore Semi Crepe Silk, Tissue Silk, and Cotton sarees curated in Mysuru.
          </p>
          <button
            type="button"
            onClick={() => navigate('/shop')}
            className="mt-7 bg-[#641E32] px-8 py-3.5 text-xs font-medium uppercase tracking-[0.16em] text-[#FAF7F2] hover:bg-[#4B1424] cursor-pointer"
          >
            Explore Sarees
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          {/* Items Table / Cards */}
          <div className="lg:col-span-8 space-y-4">
            {cart.map((item) => (
              <div
                key={`${item.productId}-${item.selectedOption || 'default'}`}
                className="flex gap-4 sm:gap-6 bg-white p-4 sm:p-5 border border-[#242020]/10"
              >
                <a
                  href={`/product/${item.slug}`}
                  onClick={(e) => {
                    e.preventDefault();
                    navigate(`/product/${item.slug}`);
                  }}
                  className="h-32 w-24 shrink-0 overflow-hidden bg-[#F5F0E8]"
                >
                  <SafeImage
                    src={wixImageUrl(item.imageId, 240, 320, 85)}
                    alt={item.name}
                    className="h-full w-full object-cover"
                  />
                </a>

                <div className="flex-1 flex flex-col justify-between min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.12em] text-[#5C5252] tabular-nums">
                        Code {item.code}
                      </p>
                      <a
                        href={`/product/${item.slug}`}
                        onClick={(e) => {
                          e.preventDefault();
                          navigate(`/product/${item.slug}`);
                        }}
                        className="font-editorial text-xl sm:text-2xl font-medium text-[#242020] hover:text-[#641E32] mt-0.5 block"
                      >
                        {item.name}
                      </a>
                      {item.selectedOption && (
                        <p className="text-xs text-[#5C5252] mt-1">Color: {item.selectedOption}</p>
                      )}
                      <p className="text-xs text-[#5C5252] mt-1 tabular-nums">
                        Unit Price: ₹{item.price.toLocaleString('en-IN')} (Taxes Included)
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeFromCart(item.productId, item.selectedOption)}
                      aria-label={`Remove ${item.name}`}
                      className="p-2 text-[#5C5252] hover:text-[#641E32] cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center border border-[#242020]/20">
                      <button
                        type="button"
                        aria-label="Decrease quantity"
                        onClick={() => updateCartQty(item.productId, item.selectedOption, item.quantity - 1)}
                        className="h-9 w-9 flex items-center justify-center hover:bg-[#FAF7F2] cursor-pointer"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-9 text-center text-sm font-medium tabular-nums">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        aria-label="Increase quantity"
                        onClick={() => updateCartQty(item.productId, item.selectedOption, item.quantity + 1)}
                        className="h-9 w-9 flex items-center justify-center hover:bg-[#FAF7F2] cursor-pointer"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <span className="text-lg font-semibold text-[#242020] tabular-nums">
                      ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary Panel */}
          <aside className="lg:col-span-4 bg-white border border-[#242020]/10 p-6 sm:p-8 lg:sticky lg:top-28">
            <h2 className="font-editorial text-2xl font-medium text-[#242020] border-b border-[#242020]/10 pb-4">
              Order Summary
            </h2>

            <div className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between text-[#5C5252]">
                <span>Subtotal (Taxes Included)</span>
                <span className="tabular-nums text-[#242020]">₹{cartSubtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-[#5C5252]">
                <span>Shipping across India</span>
                <span className="font-medium text-[#2E5A3E]">FREE</span>
              </div>
              <div className="flex justify-between border-t border-[#242020]/10 pt-3 text-lg font-semibold text-[#242020]">
                <span>Total Amount</span>
                <span className="tabular-nums">₹{cartSubtotal.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="mt-5 flex items-start gap-2.5 bg-[#FAF7F2] p-3.5 text-xs text-[#5C5252]">
              <Truck className="h-4 w-4 text-[#641E32] shrink-0 mt-0.5" />
              <span>
                Free shipping across all serviceable Indian PIN codes. Dispatched within 2–3 business days.
              </span>
            </div>

            <button
              type="button"
              onClick={() => navigate('/checkout')}
              className="mt-6 w-full flex items-center justify-center gap-2 bg-[#641E32] py-4 text-xs font-medium uppercase tracking-[0.16em] text-[#FAF7F2] hover:bg-[#4B1424] transition-colors cursor-pointer"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() => navigate('/shop')}
              className="mt-3 w-full py-2.5 text-center text-xs font-medium uppercase tracking-[0.12em] text-[#5C5252] hover:text-[#242020] cursor-pointer"
            >
              Continue Shopping
            </button>
          </aside>
        </div>
      )}
    </div>
  );
};
