import React, { useState } from 'react';
import { Eye, Heart, ShoppingBag } from 'lucide-react';
import { wixImageUrl } from '../data/brand';
import { useStore } from '../context/StoreContext';
import type { Product } from '../types/store';
import { SafeImage } from './SafeImage';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { navigate, addToCart, toggleWishlist, isWishlisted, setQuickViewProduct } = useStore();
  const [hovered, setHovered] = useState(false);

  const primaryImg = product.images[0]?.id || '';
  const secondaryImg = product.images[1]?.id || primaryImg;
  const displayImg = hovered && secondaryImg ? secondaryImg : primaryImg;
  const wishlisted = isWishlisted(product.id);

  return (
    <article
      className="group flex flex-col bg-white transition-transform duration-200 hover:-translate-y-0.5"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Image Frame */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#F5F0E8]">
        <a
          href={`/product/${product.slug}`}
          onClick={(e) => {
            e.preventDefault();
            navigate(`/product/${product.slug}`);
          }}
          className="block h-full w-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#641E32]"
        >
          <SafeImage
            src={wixImageUrl(displayImg, 720, 960, 88)}
            alt={product.name}
            fallbackTitle={product.name}
            className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-[1.03]"
          />
        </a>

        {/* Subtle Top Corner Actions */}
        <div className="absolute top-3 right-3 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => toggleWishlist(product)}
            aria-label={wishlisted ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
            className={`flex h-10 w-10 items-center justify-center bg-white/95 backdrop-blur-sm transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-[#641E32] ${
              wishlisted ? 'text-[#641E32]' : 'text-[#242020]/75 hover:text-[#641E32]'
            }`}
          >
            <Heart className="h-4 w-4" fill={wishlisted ? 'currentColor' : 'none'} strokeWidth={1.6} />
          </button>

          <button
            type="button"
            onClick={() => setQuickViewProduct(product)}
            aria-label={`Quick view ${product.name}`}
            className="flex h-10 w-10 items-center justify-center bg-white/95 text-[#242020]/75 backdrop-blur-sm transition-opacity duration-200 hover:text-[#641E32] md:opacity-0 md:group-hover:opacity-100 focus:opacity-100 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#641E32]"
          >
            <Eye className="h-4 w-4" strokeWidth={1.6} />
          </button>
        </div>

        {/* Out of Stock subtle scrim tag */}
        {!product.inStock && (
          <div className="absolute bottom-0 inset-x-0 bg-[#242020]/80 py-1.5 text-center text-[11px] font-medium tracking-[0.14em] uppercase text-[#FAF7F2]">
            Out of Stock
          </div>
        )}
      </div>

      {/* Card Body */}
      <div className="flex flex-1 flex-col justify-between p-3.5 sm:p-4 border-x border-b border-[#242020]/8">
        <div>
          <div className="flex items-center gap-1.5 text-[11px] tracking-[0.08em] uppercase text-[#5C5252]">
            <span className="tabular-nums">Code {product.code}</span>
            <span aria-hidden="true">·</span>
            <span className="truncate">{product.productType}</span>
          </div>

          <h3 className="mt-1.5 text-sm sm:text-[15px] font-medium leading-snug text-[#242020] line-clamp-2 min-h-[2.6em]">
            <a
              href={`/product/${product.slug}`}
              onClick={(e) => {
                e.preventDefault();
                navigate(`/product/${product.slug}`);
              }}
              className="hover:text-[#641E32] transition-colors"
            >
              {product.name}
            </a>
          </h3>
        </div>

        <div className="mt-3 pt-2.5 border-t border-[#242020]/8">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-base font-semibold text-[#242020] tabular-nums">
              ₹{product.price.toLocaleString('en-IN')}
            </span>
            <span className="text-[11px] text-[#5C5252] whitespace-nowrap">Taxes Included</span>
          </div>

          <button
            type="button"
            disabled={!product.inStock}
            onClick={() => addToCart(product, 1, product.options[0]?.selections[0]?.label)}
            className={`mt-3 flex w-full min-h-[40px] items-center justify-center gap-2 px-4 py-2 text-xs font-medium tracking-[0.08em] uppercase transition-colors whitespace-nowrap shrink-0 ${
              product.inStock
                ? 'bg-[#242020] text-[#FAF7F2] hover:bg-[#641E32] cursor-pointer'
                : 'bg-[#F0EBE3] text-[#5C5252] cursor-not-allowed'
            }`}
          >
            <ShoppingBag className="h-3.5 w-3.5" strokeWidth={1.6} />
            <span>{product.inStock ? 'Add to Cart' : 'Out of Stock'}</span>
          </button>
        </div>
      </div>
    </article>
  );
};
