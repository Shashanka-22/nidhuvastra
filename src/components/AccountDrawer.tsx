import React, { useState } from 'react';
import { Heart, Package, ShoppingBag, Trash2, X } from 'lucide-react';
import { wixImageUrl } from '../data/brand';
import { useStore } from '../context/StoreContext';
import { SafeImage } from './SafeImage';

export const AccountDrawer: React.FC = () => {
  const {
    products,
    wishlist,
    toggleWishlist,
    addToCart,
    recentOrders,
    accountOpen,
    setAccountOpen,
    navigate,
  } = useStore();

  const [tab, setTab] = useState<'wishlist' | 'orders'>('wishlist');

  if (!accountOpen) return null;

  const wishlistedProducts = products.filter((p) => wishlist.includes(p.id));

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label="Wishlist and Orders">
      <div
        className="fixed inset-0 bg-[#242020]/50 backdrop-blur-xs"
        onClick={() => setAccountOpen(false)}
      />
      <aside className="relative z-10 flex h-full w-full max-w-md flex-col bg-[#FAF7F2] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#242020]/10 bg-white px-6 py-4">
          <h2 className="font-editorial text-2xl font-medium text-[#242020]">Saved &amp; Orders</h2>
          <button
            type="button"
            onClick={() => setAccountOpen(false)}
            aria-label="Close saved items drawer"
            className="flex h-10 w-10 items-center justify-center text-[#242020] hover:text-[#641E32] cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-2 border-b border-[#242020]/10 bg-white">
          <button
            type="button"
            onClick={() => setTab('wishlist')}
            className={`py-3 text-xs font-medium uppercase tracking-[0.12em] border-b-2 transition-colors cursor-pointer ${
              tab === 'wishlist'
                ? 'border-[#641E32] text-[#641E32]'
                : 'border-transparent text-[#5C5252] hover:text-[#242020]'
            }`}
          >
            Wishlist ({wishlistedProducts.length})
          </button>
          <button
            type="button"
            onClick={() => setTab('orders')}
            className={`py-3 text-xs font-medium uppercase tracking-[0.12em] border-b-2 transition-colors cursor-pointer ${
              tab === 'orders'
                ? 'border-[#641E32] text-[#641E32]'
                : 'border-transparent text-[#5C5252] hover:text-[#242020]'
            }`}
          >
            My Orders ({recentOrders.length})
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {tab === 'wishlist' ? (
            wishlistedProducts.length === 0 ? (
              <div className="py-16 text-center">
                <Heart className="mx-auto h-10 w-10 text-[#C5A46D] mb-4" strokeWidth={1.2} />
                <h3 className="font-editorial text-2xl text-[#242020]">No saved sarees yet</h3>
                <p className="mt-2 text-sm text-[#5C5252]">
                  Tap the heart icon on any saree to save your favourites for later.
                </p>
                <button
                  type="button"
                  onClick={() => navigate('/shop')}
                  className="mt-6 bg-[#641E32] px-6 py-3 text-xs font-medium uppercase tracking-[0.14em] text-[#FAF7F2] hover:bg-[#4B1424] cursor-pointer"
                >
                  Browse Sarees
                </button>
              </div>
            ) : (
              wishlistedProducts.map((p) => (
                <div key={p.id} className="flex gap-3.5 bg-white p-3.5 border border-[#242020]/8">
                  <button
                    type="button"
                    onClick={() => navigate(`/product/${p.slug}`)}
                    className="h-24 w-[72px] shrink-0 overflow-hidden bg-[#F5F0E8] cursor-pointer"
                  >
                    <SafeImage
                      src={wixImageUrl(p.images[0]?.id || '', 200, 267, 85)}
                      alt={p.name}
                      className="h-full w-full object-cover"
                    />
                  </button>
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between gap-2">
                        <span className="text-[11px] uppercase tracking-wider text-[#5C5252] tabular-nums">
                          Code {p.code}
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleWishlist(p)}
                          aria-label={`Remove ${p.name} from wishlist`}
                          className="text-[#5C5252] hover:text-[#641E32] cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => navigate(`/product/${p.slug}`)}
                        className="text-left text-sm font-medium text-[#242020] hover:text-[#641E32] line-clamp-2 mt-0.5 cursor-pointer"
                      >
                        {p.name}
                      </button>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold tabular-nums">
                        ₹{p.price.toLocaleString('en-IN')}
                      </span>
                      <button
                        type="button"
                        disabled={!p.inStock}
                        onClick={() => addToCart(p, 1)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium uppercase tracking-wider ${
                          p.inStock
                            ? 'bg-[#242020] text-white hover:bg-[#641E32] cursor-pointer'
                            : 'bg-[#F0EBE3] text-[#5C5252] cursor-not-allowed'
                        }`}
                      >
                        <ShoppingBag className="h-3 w-3" />
                        <span>{p.inStock ? 'Add to Bag' : 'Sold Out'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )
          ) : recentOrders.length === 0 ? (
            <div className="py-16 text-center">
              <Package className="mx-auto h-10 w-10 text-[#C5A46D] mb-4" strokeWidth={1.2} />
              <h3 className="font-editorial text-2xl text-[#242020]">No orders on this browser yet</h3>
              <p className="mt-2 text-sm text-[#5C5252]">
                Have an existing order number? Look up your live shipment status on our Track Order page.
              </p>
              <button
                type="button"
                onClick={() => navigate('/track-order')}
                className="mt-6 bg-[#641E32] px-6 py-3 text-xs font-medium uppercase tracking-[0.14em] text-[#FAF7F2] hover:bg-[#4B1424] cursor-pointer"
              >
                Track an Order
              </button>
            </div>
          ) : (
            recentOrders.map((order) => (
              <div key={order.orderNumber} className="bg-white p-4 border border-[#242020]/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#641E32] tabular-nums">
                    {order.orderNumber}
                  </span>
                  <span className="text-xs font-medium text-[#242020]">{order.status}</span>
                </div>
                <p className="text-xs text-[#5C5252]">
                  {new Date(order.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}{' '}
                  · {order.items.reduce((s, i) => s + i.quantity, 0)} saree(s) ·{' '}
                  <span className="tabular-nums font-medium text-[#242020]">
                    ₹{order.total.toLocaleString('en-IN')}
                  </span>
                </p>
                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      `/track-order?orderNumber=${encodeURIComponent(order.orderNumber)}&contact=${encodeURIComponent(order.customer.mobile)}`
                    )
                  }
                  className="text-xs font-medium text-[#641E32] hover:underline cursor-pointer"
                >
                  View Tracking Status →
                </button>
              </div>
            ))
          )}
        </div>
      </aside>
    </div>
  );
};
