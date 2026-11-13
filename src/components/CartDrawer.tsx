import React from 'react';
import { Minus, Plus, ShoppingBag, Trash2, Truck, X } from 'lucide-react';
import { wixImageUrl } from '../data/brand';
import { useStore } from '../context/StoreContext';
import { SafeImage } from './SafeImage';

export const CartDrawer: React.FC = () => {
  const {
    cart,
    cartCount,
    cartSubtotal,
    cartOpen,
    setCartOpen,
    updateCartQty,
    removeFromCart,
    navigate,
  } = useStore();

  if (!cartOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label="Shopping Bag">
      <div
        className="fixed inset-0 bg-[#242020]/50 backdrop-blur-xs"
        onClick={() => setCartOpen(false)}
      />
      <aside className="relative z-10 flex h-full w-full max-w-md flex-col bg-[#FAF7F2] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#242020]/10 bg-white px-6 py-4">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="h-5 w-5 text-[#641E32]" strokeWidth={1.6} />
            <h2 className="font-editorial text-2xl font-medium text-[#242020]">
              Shopping Bag <span className="text-sm font-sans text-[#5C5252] tabular-nums">({cartCount})</span>
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setCartOpen(false)}
            aria-label="Close shopping bag"
            className="flex h-10 w-10 items-center justify-center text-[#242020] hover:text-[#641E32] cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Free Shipping Note */}
        <div className="flex items-center gap-2 bg-[#F3ECE2] px-6 py-2.5 text-xs text-[#242020]">
          <Truck className="h-4 w-4 text-[#641E32] shrink-0" strokeWidth={1.6} />
          <span>Complimentary Free Shipping across all serviceable Indian PIN codes.</span>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <ShoppingBag className="h-10 w-10 text-[#C5A46D] mb-4" strokeWidth={1.2} />
              <h3 className="font-editorial text-2xl text-[#242020]">Your bag is currently empty</h3>
              <p className="mt-2 text-sm text-[#5C5252] max-w-xs">
                Explore our curated collection of Banarasi, Mysore Semi Crepe, Kanjivaram, Tissue, and Cotton sarees.
              </p>
              <button
                type="button"
                onClick={() => {
                  setCartOpen(false);
                  navigate('/shop');
                }}
                className="mt-6 bg-[#641E32] px-7 py-3 text-xs font-medium uppercase tracking-[0.14em] text-[#FAF7F2] hover:bg-[#4B1424] transition-colors cursor-pointer"
              >
                Explore Sarees
              </button>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={`${item.productId}-${item.selectedOption || 'default'}`}
                className="flex gap-4 bg-white p-3.5 border border-[#242020]/8"
              >
                <a
                  href={`/product/${item.slug}`}
                  onClick={(e) => {
                    e.preventDefault();
                    setCartOpen(false);
                    navigate(`/product/${item.slug}`);
                  }}
                  className="h-24 w-[72px] shrink-0 overflow-hidden bg-[#F5F0E8]"
                >
                  <SafeImage
                    src={wixImageUrl(item.imageId, 200, 267, 85)}
                    alt={item.name}
                    className="h-full w-full object-cover"
                  />
                </a>
                <div className="flex flex-1 flex-col justify-between min-w-0">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[11px] uppercase tracking-wider text-[#5C5252] tabular-nums">
                        Code {item.code}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.productId, item.selectedOption)}
                        aria-label={`Remove ${item.name}`}
                        className="text-[#5C5252] hover:text-[#641E32] cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" strokeWidth={1.6} />
                      </button>
                    </div>
                    <a
                      href={`/product/${item.slug}`}
                      onClick={(e) => {
                        e.preventDefault();
                        setCartOpen(false);
                        navigate(`/product/${item.slug}`);
                      }}
                      className="text-sm font-medium text-[#242020] hover:text-[#641E32] line-clamp-2 mt-0.5 block"
                    >
                      {item.name}
                    </a>
                    {item.selectedOption && (
                      <p className="text-xs text-[#5C5252] mt-0.5">Color: {item.selectedOption}</p>
                    )}
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center border border-[#242020]/15">
                      <button
                        type="button"
                        aria-label="Decrease quantity"
                        onClick={() => updateCartQty(item.productId, item.selectedOption, item.quantity - 1)}
                        className="h-8 w-8 flex items-center justify-center text-[#242020] hover:bg-[#FAF7F2] cursor-pointer"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-7 text-center text-xs font-medium tabular-nums">{item.quantity}</span>
                      <button
                        type="button"
                        aria-label="Increase quantity"
                        onClick={() => updateCartQty(item.productId, item.selectedOption, item.quantity + 1)}
                        className="h-8 w-8 flex items-center justify-center text-[#242020] hover:bg-[#FAF7F2] cursor-pointer"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    <span className="text-sm font-semibold text-[#242020] tabular-nums">
                      ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Totals */}
        {cart.length > 0 && (
          <div className="border-t border-[#242020]/10 bg-white px-6 py-5 space-y-4">
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-[#5C5252]">
                <span>Subtotal (Taxes Included)</span>
                <span className="tabular-nums text-[#242020]">₹{cartSubtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-[#5C5252]">
                <span>Shipping across India</span>
                <span className="font-medium text-[#2E5A3E]">FREE</span>
              </div>
              <div className="flex justify-between border-t border-[#242020]/10 pt-2.5 text-base font-semibold text-[#242020]">
                <span>Total</span>
                <span className="tabular-nums">₹{cartSubtotal.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setCartOpen(false);
                  navigate('/checkout');
                }}
                className="w-full bg-[#641E32] py-3.5 text-xs font-medium uppercase tracking-[0.14em] text-[#FAF7F2] hover:bg-[#4B1424] transition-colors cursor-pointer"
              >
                Proceed to Checkout
              </button>
              <button
                type="button"
                onClick={() => {
                  setCartOpen(false);
                  navigate('/cart');
                }}
                className="w-full border border-[#242020]/20 py-3 text-xs font-medium uppercase tracking-[0.14em] text-[#242020] hover:border-[#641E32] hover:text-[#641E32] transition-colors cursor-pointer"
              >
                View Full Shopping Bag
              </button>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
};
