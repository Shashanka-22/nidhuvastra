import React, { useState } from 'react';
import { Heart, Minus, Plus, ShoppingBag, X } from 'lucide-react';
import { wixImageUrl } from '../data/brand';
import { useStore } from '../context/StoreContext';
import { SafeImage } from './SafeImage';

export const QuickViewModal: React.FC = () => {
  const {
    quickViewProduct,
    setQuickViewProduct,
    addToCart,
    toggleWishlist,
    isWishlisted,
    navigate,
  } = useStore();

  const [activeImgIdx, setActiveImgIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | undefined>(undefined);
  const [qty, setQty] = useState(1);

  if (!quickViewProduct) return null;

  const product = quickViewProduct;
  const images = product.images;
  const activeImg = images[activeImgIdx]?.id || images[0]?.id || '';
  const wishlisted = isWishlisted(product.id);
  const defaultOption = selectedOption || product.options[0]?.selections[0]?.label;

  const close = () => {
    setActiveImgIdx(0);
    setSelectedOption(undefined);
    setQty(1);
    setQuickViewProduct(null);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#242020]/60 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label={product.name}
      onClick={close}
    >
      <div
        className="relative w-full max-w-4xl bg-white shadow-2xl overflow-hidden max-h-[92vh] flex flex-col md:flex-row"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={close}
          aria-label="Close quick view"
          className="absolute top-3 right-3 z-10 flex h-10 w-10 items-center justify-center bg-white/90 text-[#242020] hover:text-[#641E32] cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Left Image Column */}
        <div className="md:w-1/2 bg-[#FAF7F2] flex flex-col">
          <div className="aspect-[3/4] w-full overflow-hidden bg-[#F5F0E8]">
            <SafeImage
              src={wixImageUrl(activeImg, 840, 1120, 90)}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 p-3 overflow-x-auto bg-white border-t border-[#242020]/8">
              {images.slice(0, 6).map((img, idx) => (
                <button
                  key={img.id + idx}
                  type="button"
                  onClick={() => setActiveImgIdx(idx)}
                  className={`h-14 w-11 shrink-0 overflow-hidden border transition-colors cursor-pointer ${
                    idx === activeImgIdx ? 'border-[#641E32]' : 'border-transparent opacity-65 hover:opacity-100'
                  }`}
                >
                  <SafeImage
                    src={wixImageUrl(img.id, 140, 180, 80)}
                    alt={`${product.name} thumbnail ${idx + 1}`}
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Details Column */}
        <div className="md:w-1/2 p-6 sm:p-8 overflow-y-auto flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-[#5C5252]">
              <span className="tabular-nums">Code {product.code}</span>
              <span aria-hidden="true">·</span>
              <span>{product.productType}</span>
            </div>

            <h2 className="font-editorial text-2xl sm:text-3xl font-medium text-[#242020] mt-2 leading-tight">
              {product.name}
            </h2>

            <div className="mt-4 flex items-baseline gap-3">
              <span className="text-2xl font-semibold text-[#242020] tabular-nums">
                ₹{product.price.toLocaleString('en-IN')}
              </span>
              <span className="text-xs text-[#5C5252]">Taxes Included · Free Shipping Across India</span>
            </div>

            <div className="mt-3 text-xs font-medium">
              {product.inStock ? (
                <span className="text-[#2E5A3E]">In Stock — Ready to Dispatch in 2–3 Business Days</span>
              ) : (
                <span className="text-[#641E32]">Currently Out of Stock</span>
              )}
            </div>

            {product.options.length > 0 && (
              <div className="mt-5">
                <p className="text-xs font-medium uppercase tracking-wider text-[#5C5252] mb-2">
                  {product.options[0].title}: <span className="text-[#242020]">{defaultOption}</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {product.options[0].selections.map((sel) => {
                    const active = defaultOption === sel.label;
                    return (
                      <button
                        key={sel.id}
                        type="button"
                        onClick={() => setSelectedOption(sel.label)}
                        className={`flex items-center gap-2 px-3 py-1.5 text-xs border transition-colors cursor-pointer ${
                          active
                            ? 'border-[#641E32] bg-[#FAF7F2] text-[#242020] font-medium'
                            : 'border-[#242020]/15 text-[#5C5252] hover:border-[#242020]/40'
                        }`}
                      >
                        <span
                          className="h-3 w-3 rounded-full border border-black/15"
                          style={{ backgroundColor: sel.hex }}
                        />
                        <span>{sel.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {product.description.length > 0 && (
              <p className="mt-5 text-sm leading-relaxed text-[#5C5252] line-clamp-4">
                {product.description[0]}
              </p>
            )}

            {Object.keys(product.specs).length > 0 && (
              <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-[#242020]/10 pt-4 text-xs">
                {Object.entries(product.specs)
                  .slice(0, 6)
                  .map(([k, v]) => (
                    <div key={k}>
                      <dt className="text-[#5C5252]">{k}</dt>
                      <dd className="font-medium text-[#242020] mt-0.5">{v}</dd>
                    </div>
                  ))}
              </dl>
            )}
          </div>

          <div className="mt-6 pt-5 border-t border-[#242020]/10 space-y-3">
            {product.inStock && (
              <div className="flex items-center gap-3">
                <div className="flex items-center border border-[#242020]/20">
                  <button
                    type="button"
                    aria-label="Decrease quantity"
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    className="h-11 w-10 flex items-center justify-center text-[#242020] hover:bg-[#FAF7F2] cursor-pointer"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="w-10 text-center text-sm font-medium tabular-nums">{qty}</span>
                  <button
                    type="button"
                    aria-label="Increase quantity"
                    onClick={() => setQty((q) => Math.min(10, q + 1))}
                    className="h-11 w-10 flex items-center justify-center text-[#242020] hover:bg-[#FAF7F2] cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    addToCart(product, qty, defaultOption, true);
                    close();
                  }}
                  className="flex-1 h-11 flex items-center justify-center gap-2 bg-[#641E32] text-[#FAF7F2] text-xs font-medium uppercase tracking-[0.12em] hover:bg-[#4B1424] transition-colors cursor-pointer"
                >
                  <ShoppingBag className="h-4 w-4" />
                  <span>Add to Cart</span>
                </button>

                <button
                  type="button"
                  onClick={() => toggleWishlist(product)}
                  aria-label="Toggle wishlist"
                  className={`h-11 w-11 flex items-center justify-center border border-[#242020]/20 transition-colors cursor-pointer ${
                    wishlisted ? 'text-[#641E32] border-[#641E32]' : 'text-[#242020] hover:border-[#641E32]'
                  }`}
                >
                  <Heart className="h-4 w-4" fill={wishlisted ? 'currentColor' : 'none'} />
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                const slug = product.slug;
                close();
                navigate(`/product/${slug}`);
              }}
              className="w-full py-2.5 text-center text-xs font-medium uppercase tracking-[0.12em] text-[#242020] border border-[#242020]/20 hover:border-[#641E32] hover:text-[#641E32] transition-colors cursor-pointer"
            >
              View Full Product Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
