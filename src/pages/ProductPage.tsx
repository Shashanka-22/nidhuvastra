import React, { useEffect, useMemo, useState } from 'react';
import {
  Check,
  ChevronRight,
  Heart,
  Minus,
  Plus,
  RefreshCw,
  ShieldCheck,
  ShoppingBag,
  Truck,
  Video,
  ZoomIn,
} from 'lucide-react';
import { BRAND, COLLECTIONS, wixImageUrl } from '../data/brand';
import { useStore } from '../context/StoreContext';
import { ProductCard } from '../components/ProductCard';
import { SafeImage } from '../components/SafeImage';

interface ProductPageProps {
  slug: string;
}

export const ProductPage: React.FC<ProductPageProps> = ({ slug }) => {
  const { products, navigate, addToCart, toggleWishlist, isWishlisted } = useStore();

  const product = useMemo(
    () => products.find((p) => p.slug === slug || p.id === slug),
    [products, slug]
  );

  const [activeMediaIdx, setActiveMediaIdx] = useState(0);
  const [showVideo, setShowVideo] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const [zoomOrigin, setZoomOrigin] = useState({ x: 50, y: 50 });
  const [qty, setQty] = useState(1);
  const [selectedOption, setSelectedOption] = useState<string | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<'description' | 'details' | 'shipping' | 'returns'>(
    'description'
  );

  useEffect(() => {
    setActiveMediaIdx(0);
    setShowVideo(false);
    setZoomed(false);
    setQty(1);
    setSelectedOption(product?.options[0]?.selections[0]?.label);
    setActiveTab(product && product.description.length > 0 ? 'description' : 'details');
  }, [slug, product]);

  // Inject Product Schema.org JSON-LD for SEO
  useEffect(() => {
    if (!product) return;
    document.title = `${product.name} | NidhuVastra`;
    const ldScript = document.createElement('script');
    ldScript.type = 'application/ld+json';
    ldScript.id = 'product-json-ld';
    ldScript.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      sku: product.code,
      image: product.images.map((im) => wixImageUrl(im.id, 900, 1200, 90)),
      description:
        product.description.join(' ') ||
        `${product.name} (${product.productType}) curated by NidhuVastra.`,
      brand: {
        '@type': 'Brand',
        name: 'NidhuVastra',
      },
      offers: {
        '@type': 'Offer',
        priceCurrency: 'INR',
        price: product.price,
        availability: product.inStock
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
      },
    });
    const old = document.getElementById('product-json-ld');
    if (old) old.remove();
    document.head.appendChild(ldScript);
    return () => {
      ldScript.remove();
      document.title = 'NidhuVastra – Weaving Threads of Tradition with Contemporary Elegance';
    };
  }, [product]);

  const relatedProducts = useMemo(() => {
    if (!product) return [];
    const primaryCat = product.categories[0];
    return products
      .filter((p) => p.id !== product.id && p.categories.includes(primaryCat))
      .slice(0, 4);
  }, [products, product]);

  if (!product) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <h1 className="font-editorial text-4xl text-[#242020]">Saree Not Found</h1>
        <p className="mt-3 text-sm text-[#5C5252]">
          The requested saree could not be located in our catalogue.
        </p>
        <button
          type="button"
          onClick={() => navigate('/shop')}
          className="mt-6 bg-[#641E32] px-7 py-3 text-xs font-medium uppercase tracking-[0.14em] text-[#FAF7F2] cursor-pointer"
        >
          Return to Shop
        </button>
      </div>
    );
  }

  const wishlisted = isWishlisted(product.id);
  const images = product.images;
  const activeImg = images[activeMediaIdx]?.id || images[0]?.id || '';
  const primaryCatSlug = product.categories[0];
  const primaryCatName =
    COLLECTIONS.find((c) => c.slug === primaryCatSlug)?.name || product.productType;

  const handleOptionSelect = (label: string, linkedIds: string[]) => {
    setSelectedOption(label);
    setShowVideo(false);
    if (linkedIds.length > 0) {
      const idx = images.findIndex((im) => im.id === linkedIds[0]);
      if (idx >= 0) setActiveMediaIdx(idx);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!zoomed) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomOrigin({ x, y });
  };

  return (
    <div className="pb-20 lg:pb-12">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-8 py-6 sm:py-10">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-xs text-[#5C5252] mb-6">
          <button type="button" onClick={() => navigate('/')} className="hover:text-[#641E32] cursor-pointer">
            Home
          </button>
          <ChevronRight className="h-3.5 w-3.5" />
          <button type="button" onClick={() => navigate('/shop')} className="hover:text-[#641E32] cursor-pointer">
            Shop
          </button>
          <ChevronRight className="h-3.5 w-3.5" />
          <button
            type="button"
            onClick={() => navigate(`/shop?category=${primaryCatSlug}`)}
            className="hover:text-[#641E32] cursor-pointer"
          >
            {primaryCatName}
          </button>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-[#242020] font-medium truncate max-w-[260px]">{product.name}</span>
        </nav>

        {/* Main Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left: Gallery */}
          <div className="lg:col-span-7 flex flex-col-reverse md:flex-row gap-4">
            {/* Thumbnails */}
            {(images.length > 1 || product.videos.length > 0) && (
              <div className="flex md:flex-col gap-2.5 overflow-x-auto md:overflow-y-auto md:max-h-[680px] md:w-20 shrink-0 pb-1 md:pb-0">
                {images.map((img, idx) => (
                  <button
                    key={img.id + idx}
                    type="button"
                    onClick={() => {
                      setShowVideo(false);
                      setActiveMediaIdx(idx);
                    }}
                    className={`relative aspect-[3/4] w-16 md:w-full shrink-0 overflow-hidden border transition-all cursor-pointer ${
                      !showVideo && idx === activeMediaIdx
                        ? 'border-[#641E32] ring-1 ring-[#641E32]'
                        : 'border-[#242020]/10 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <SafeImage
                      src={wixImageUrl(img.id, 180, 240, 82)}
                      alt={`${product.name} view ${idx + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}

                {product.videos.map((vid, vidx) => (
                  <button
                    key={vid.mp4Url + vidx}
                    type="button"
                    onClick={() => setShowVideo(true)}
                    className={`relative aspect-[3/4] w-16 md:w-full shrink-0 overflow-hidden border bg-[#242020] text-white flex flex-col items-center justify-center gap-1 cursor-pointer ${
                      showVideo ? 'border-[#641E32] ring-1 ring-[#641E32]' : 'border-[#242020]/15 opacity-80'
                    }`}
                  >
                    <Video className="h-4 w-4 text-[#C5A46D]" />
                    <span className="text-[10px] uppercase tracking-wider">Reel</span>
                  </button>
                ))}
              </div>
            )}

            {/* Primary Viewport */}
            <div className="flex-1 bg-[#F5F0E8] relative overflow-hidden">
              {showVideo && product.videos[0] ? (
                <div className="aspect-[3/4] w-full bg-black flex items-center justify-center">
                  <video
                    src={product.videos[0].mp4Url}
                    poster={wixImageUrl(product.videos[0].posterId, 900, 1200, 88)}
                    controls
                    autoPlay
                    playsInline
                    className="h-full w-full object-contain"
                  />
                </div>
              ) : (
                <div
                  className="aspect-[3/4] w-full overflow-hidden cursor-zoom-in relative"
                  onClick={() => setZoomed((z) => !z)}
                  onMouseMove={handleMouseMove}
                  onMouseLeave={() => setZoomed(false)}
                >
                  <SafeImage
                    src={wixImageUrl(activeImg, 1200, 1600, 90)}
                    alt={product.name}
                    loading="eager"
                    className={`h-full w-full object-cover transition-transform duration-300 ${
                      zoomed ? 'scale-[1.85] cursor-zoom-out' : 'scale-100'
                    }`}
                  />
                  {zoomed && (
                    <img
                      src={wixImageUrl(activeImg, 1400, 1867, 92)}
                      alt={product.name}
                      referrerPolicy="no-referrer"
                      style={{
                        transformOrigin: `${zoomOrigin.x}% ${zoomOrigin.y}%`,
                      }}
                      className="absolute inset-0 h-full w-full object-cover scale-[2] pointer-events-none"
                    />
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setZoomed((z) => !z);
                    }}
                    aria-label={zoomed ? 'Zoom out' : 'Zoom in'}
                    className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-white/90 px-3 py-1.5 text-xs text-[#242020] shadow-sm cursor-pointer"
                  >
                    <ZoomIn className="h-3.5 w-3.5" />
                    <span>{zoomed ? 'Reset Zoom' : 'Click to Zoom'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right: Contiguous Purchase Module */}
          <div className="lg:col-span-5 lg:sticky lg:top-28 bg-white border border-[#242020]/10 p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.14em] text-[#5C5252]">
              <span className="tabular-nums font-medium text-[#641E32]">Code {product.code}</span>
              <span aria-hidden="true">·</span>
              <span>{product.productType}</span>
            </div>

            <h1 className="font-editorial text-3xl sm:text-4xl font-medium text-[#242020] mt-2 leading-tight">
              {product.name}
            </h1>

            <div className="mt-5 flex items-baseline gap-3 border-b border-[#242020]/10 pb-5">
              <span className="text-3xl font-semibold text-[#242020] tabular-nums">
                ₹{product.price.toLocaleString('en-IN')}
              </span>
              <span className="text-xs text-[#5C5252]">Taxes Included · Free Shipping Across India</span>
            </div>

            {/* Availability */}
            <div className="mt-4 flex items-center gap-2 text-sm">
              {product.inStock ? (
                <>
                  <Check className="h-4 w-4 text-[#2E5A3E]" />
                  <span className="font-medium text-[#2E5A3E]">In Stock — Ready to Dispatch</span>
                </>
              ) : (
                <span className="font-medium text-[#641E32]">Currently Out of Stock</span>
              )}
            </div>

            {/* Color Variants if present */}
            {product.options.length > 0 && (
              <div className="mt-6">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#5C5252] mb-2.5">
                  {product.options[0].title}:{' '}
                  <span className="text-[#242020]">{selectedOption}</span>
                </p>
                <div className="flex flex-wrap gap-2.5">
                  {product.options[0].selections.map((sel) => {
                    const active = selectedOption === sel.label;
                    return (
                      <button
                        key={sel.id}
                        type="button"
                        onClick={() => handleOptionSelect(sel.label, sel.linkedImageIds)}
                        className={`flex items-center gap-2 px-3.5 py-2 text-xs border transition-colors cursor-pointer ${
                          active
                            ? 'border-[#641E32] bg-[#FAF7F2] font-semibold text-[#242020]'
                            : 'border-[#242020]/15 text-[#5C5252] hover:border-[#242020]/40'
                        }`}
                      >
                        <span
                          className="h-3.5 w-3.5 rounded-full border border-black/15"
                          style={{ backgroundColor: sel.hex }}
                        />
                        <span>{sel.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity + Buy Actions */}
            <div className="mt-6 space-y-3">
              {product.inStock ? (
                <>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center border border-[#242020]/20">
                      <button
                        type="button"
                        aria-label="Decrease quantity"
                        onClick={() => setQty((q) => Math.max(1, q - 1))}
                        className="h-12 w-11 flex items-center justify-center text-[#242020] hover:bg-[#FAF7F2] cursor-pointer"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-11 text-center text-sm font-medium tabular-nums">{qty}</span>
                      <button
                        type="button"
                        aria-label="Increase quantity"
                        onClick={() => setQty((q) => Math.min(10, q + 1))}
                        className="h-12 w-11 flex items-center justify-center text-[#242020] hover:bg-[#FAF7F2] cursor-pointer"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => addToCart(product, qty, selectedOption, true)}
                      className="flex-1 h-12 flex items-center justify-center gap-2 bg-[#242020] text-[#FAF7F2] text-xs font-medium uppercase tracking-[0.14em] hover:bg-[#641E32] transition-colors cursor-pointer"
                    >
                      <ShoppingBag className="h-4 w-4" />
                      <span>Add to Cart</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleWishlist(product)}
                      aria-label={wishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
                      className={`h-12 w-12 flex items-center justify-center border transition-colors cursor-pointer ${
                        wishlisted
                          ? 'border-[#641E32] text-[#641E32]'
                          : 'border-[#242020]/20 text-[#242020] hover:border-[#641E32]'
                      }`}
                    >
                      <Heart className="h-4 w-4" fill={wishlisted ? 'currentColor' : 'none'} />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      addToCart(product, qty, selectedOption, false);
                      navigate('/checkout');
                    }}
                    className="w-full h-12 bg-[#641E32] text-[#FAF7F2] text-xs font-medium uppercase tracking-[0.16em] hover:bg-[#4B1424] transition-colors cursor-pointer"
                  >
                    Buy Now
                  </button>
                </>
              ) : (
                <div className="space-y-3">
                  <button
                    type="button"
                    disabled
                    className="w-full h-12 bg-[#F0EBE3] text-[#5C5252] text-xs font-medium uppercase tracking-[0.16em] cursor-not-allowed"
                  >
                    Out of Stock
                  </button>
                  <a
                    href={`https://wa.me/${BRAND.phoneRaw}?text=${encodeURIComponent(
                      `Hello NidhuVastra! I visited your website and would like to enquire about availability for ${product.name} (Code ${product.code}).`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full text-center py-3 border border-[#242020]/20 text-xs font-medium uppercase tracking-[0.14em] text-[#242020] hover:border-[#641E32] hover:text-[#641E32]"
                  >
                    Enquire Availability on WhatsApp
                  </a>
                </div>
              )}
            </div>

            {/* Delivery Highlights */}
            <div className="mt-6 pt-5 border-t border-[#242020]/10 space-y-2.5 text-xs text-[#5C5252]">
              <div className="flex items-start gap-2.5">
                <Truck className="h-4 w-4 text-[#641E32] shrink-0 mt-0.5" />
                <span>
                  <strong className="text-[#242020]">Free Shipping Across India:</strong> Dispatched within 2–3 business days; typical delivery in 3–4 business days.
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <RefreshCw className="h-4 w-4 text-[#641E32] shrink-0 mt-0.5" />
                <span>
                  <strong className="text-[#242020]">Exchange Assurance:</strong> Exchanges accepted within 2 days of delivery for damaged, defective, or incorrect items with unboxing video.
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <ShieldCheck className="h-4 w-4 text-[#641E32] shrink-0 mt-0.5" />
                <span>
                  <strong className="text-[#242020]">Authentic NidhuVastra Piece:</strong> Curated and dispatched directly from Mysuru, Karnataka.
                </span>
              </div>
            </div>

            {/* Tabs for Description / Details / Shipping / Returns */}
            <div className="mt-8 border-t border-[#242020]/10 pt-5">
              <div className="flex flex-wrap gap-4 border-b border-[#242020]/10 text-xs font-medium uppercase tracking-[0.1em]">
                {[
                  { id: 'description', label: 'Description' },
                  { id: 'details', label: 'Details' },
                  { id: 'shipping', label: 'Shipping' },
                  { id: 'returns', label: 'Exchange Policy' },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setActiveTab(t.id as typeof activeTab)}
                    className={`pb-2.5 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                      activeTab === t.id
                        ? 'border-[#641E32] text-[#641E32]'
                        : 'border-transparent text-[#5C5252] hover:text-[#242020]'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <div className="mt-4 text-sm leading-relaxed text-[#5C5252] space-y-3">
                {activeTab === 'description' && (
                  <>
                    {product.description.length > 0 ? (
                      product.description.map((para, i) => <p key={i}>{para}</p>)
                    ) : (
                      <p>
                        {product.name} (Product Code {product.code}) is curated by NidhuVastra in Mysuru. Crafted with attention to traditional drape and contemporary elegance.
                      </p>
                    )}
                  </>
                )}

                {activeTab === 'details' && (
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="border-b border-[#242020]/8 pb-2">
                      <dt className="text-[#5C5252]">Product Code</dt>
                      <dd className="font-medium text-[#242020] tabular-nums mt-0.5">{product.code}</dd>
                    </div>
                    <div className="border-b border-[#242020]/8 pb-2">
                      <dt className="text-[#5C5252]">Weave / Type</dt>
                      <dd className="font-medium text-[#242020] mt-0.5">{product.productType}</dd>
                    </div>
                    <div className="border-b border-[#242020]/8 pb-2">
                      <dt className="text-[#5C5252]">Colour Tone(s)</dt>
                      <dd className="font-medium text-[#242020] mt-0.5">{product.colors.join(', ')}</dd>
                    </div>
                    {Object.entries(product.specs).map(([k, v]) => (
                      <div key={k} className="border-b border-[#242020]/8 pb-2">
                        <dt className="text-[#5C5252]">{k}</dt>
                        <dd className="font-medium text-[#242020] mt-0.5">{v}</dd>
                      </div>
                    ))}
                  </dl>
                )}

                {activeTab === 'shipping' && (
                  <ul className="space-y-2 text-xs leading-relaxed">
                    <li>• Free shipping across all serviceable Indian PIN codes.</li>
                    <li>• Orders are dispatched within 2–3 business days of confirmation.</li>
                    <li>• Delivery typically arrives within 3–4 business days depending on location.</li>
                    <li>• Tracking details are provided once your saree is shipped.</li>
                  </ul>
                )}

                {activeTab === 'returns' && (
                  <div className="space-y-2 text-xs leading-relaxed">
                    <p>
                      Exchanges are accepted only for products damaged in shipping, manufacturing defects, or incorrect items sent—requested within 2 days of delivery.
                    </p>
                    <p>
                      A clear unboxing video and product photographs along with your Order Number and Product Code ({product.code}) are mandatory. No refunds are issued; approved exchanges are dispatched within 3–4 business days.
                    </p>
                    <a
                      href={BRAND.returnFormUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block text-[#641E32] font-medium hover:underline pt-1"
                    >
                      Open Return / Exchange Form →
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Related Sarees */}
        {relatedProducts.length > 0 && (
          <section className="mt-20 pt-14 border-t border-[#242020]/10">
            <div className="flex items-end justify-between mb-8">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-[#641E32] font-medium">
                  You May Also Admire
                </p>
                <h2 className="font-editorial text-3xl sm:text-4xl font-medium text-[#242020] mt-1">
                  Related {primaryCatName}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => navigate(`/shop?category=${primaryCatSlug}`)}
                className="text-xs font-medium uppercase tracking-[0.12em] text-[#641E32] hover:underline cursor-pointer"
              >
                View Collection →
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Mobile Sticky Purchase Bar (<= 64px height) */}
      <div className="fixed bottom-0 inset-x-0 z-30 lg:hidden bg-white border-t border-[#242020]/15 px-4 py-2.5 flex items-center justify-between gap-3 shadow-lg">
        <div>
          <p className="text-[11px] uppercase tracking-wider text-[#5C5252] tabular-nums">
            Code {product.code}
          </p>
          <p className="text-base font-semibold text-[#242020] tabular-nums">
            ₹{product.price.toLocaleString('en-IN')}
          </p>
        </div>
        <button
          type="button"
          disabled={!product.inStock}
          onClick={() => addToCart(product, qty, selectedOption, true)}
          className={`flex-1 max-w-[220px] h-11 flex items-center justify-center gap-2 text-xs font-medium uppercase tracking-[0.12em] ${
            product.inStock
              ? 'bg-[#641E32] text-[#FAF7F2]'
              : 'bg-[#F0EBE3] text-[#5C5252]'
          }`}
        >
          <ShoppingBag className="h-4 w-4" />
          <span>{product.inStock ? 'Add to Cart' : 'Out of Stock'}</span>
        </button>
      </div>
    </div>
  );
};
