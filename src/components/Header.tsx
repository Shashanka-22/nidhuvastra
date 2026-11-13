import React, { useMemo, useState } from 'react';
import { ChevronDown, Heart, Menu, Search, ShoppingBag, User, X } from 'lucide-react';
import { BRAND, BRAND_ASSETS, COLLECTIONS, wixImageUrl } from '../data/brand';
import { useStore } from '../context/StoreContext';
import { SafeImage } from './SafeImage';

export const Header: React.FC = () => {
  const {
    products,
    route,
    navigate,
    cartCount,
    wishlist,
    setCartOpen,
    searchOpen,
    setSearchOpen,
    setAccountOpen,
  } = useStore();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const featuredCollections = useMemo(
    () => COLLECTIONS.filter((c) => c.featuredOnHome),
    []
  );

  const collectionThumbs = useMemo(() => {
    const map: Record<string, string> = {};
    for (const col of featuredCollections) {
      const match = products.find((p) => p.categories.includes(col.slug) && p.images[0]);
      if (match) map[col.slug] = match.images[0].id;
    }
    return map;
  }, [featuredCollections, products]);

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return products.slice(0, 4);
    return products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.code.toLowerCase().includes(q) ||
          p.productType.toLowerCase().includes(q) ||
          p.colors.some((c) => c.toLowerCase().includes(q))
      )
      .slice(0, 6);
  }, [products, searchQuery]);

  const isActive = (path: string) => {
    if (path === '/') return route === '/';
    return route.startsWith(path);
  };

  return (
    <div className="sticky top-0 z-40">
      {/* Slim Announcement Bar */}
      <div className="bg-[#641E32] text-[#FAF7F2] px-4 py-1.5 text-center text-[11px] sm:text-xs tracking-[0.14em] uppercase font-medium">
        FREE SHIPPING ACROSS INDIA | DISCOVER THE BEAUTY OF NIDHUVASTRA
      </div>

      {/* Main Sticky Header */}
      <header
        className="relative bg-[#FAF7F2]/95 backdrop-blur-md border-b border-[#242020]/10"
        onMouseLeave={() => setMegaMenuOpen(false)}
      >
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 sm:gap-8 px-4 sm:px-8 h-16 sm:h-[72px]">
          {/* Zone 1: Brand Wordmark + Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              className="flex lg:hidden h-10 w-10 items-center justify-center text-[#242020] hover:text-[#641E32] cursor-pointer"
            >
              <Menu className="h-5 w-5" strokeWidth={1.6} />
            </button>

            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                navigate('/');
              }}
              className="flex items-center gap-2.5 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#641E32]"
            >
              <SafeImage
                src={wixImageUrl(BRAND_ASSETS.logoId, 160, 80, 90)}
                alt="NidhuVastra Logo"
                loading="eager"
                className="h-8 sm:h-9 w-auto object-contain rounded-sm"
              />
              <span className="font-editorial text-xl sm:text-2xl font-semibold tracking-[0.12em] text-[#242020]">
                {BRAND.name}
              </span>
            </a>
          </div>

          {/* Zone 2: Concise Navigation Links */}
          <nav
            aria-label="Primary"
            className="hidden lg:flex items-center gap-7 text-sm font-medium text-[#242020]/85"
          >
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                navigate('/');
              }}
              className={`whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors ${
                isActive('/')
                  ? 'border-[#641E32] text-[#641E32]'
                  : 'border-transparent hover:text-[#641E32]'
              }`}
            >
              Home
            </a>

            <a
              href="/shop"
              onClick={(e) => {
                e.preventDefault();
                navigate('/shop');
              }}
              className={`whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors ${
                isActive('/shop')
                  ? 'border-[#641E32] text-[#641E32]'
                  : 'border-transparent hover:text-[#641E32]'
              }`}
            >
              Shop
            </a>

            <button
              type="button"
              onMouseEnter={() => setMegaMenuOpen(true)}
              onClick={() => setMegaMenuOpen((prev) => !prev)}
              aria-expanded={megaMenuOpen}
              className={`flex items-center gap-1 whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors cursor-pointer ${
                isActive('/category')
                  ? 'border-[#641E32] text-[#641E32]'
                  : 'border-transparent hover:text-[#641E32]'
              }`}
            >
              <span>Collections</span>
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform duration-200 ${
                  megaMenuOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            <a
              href="/about"
              onClick={(e) => {
                e.preventDefault();
                navigate('/about');
              }}
              className={`whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors ${
                isActive('/about')
                  ? 'border-[#641E32] text-[#641E32]'
                  : 'border-transparent hover:text-[#641E32]'
              }`}
            >
              About Us
            </a>

            <a
              href="/contact"
              onClick={(e) => {
                e.preventDefault();
                navigate('/contact');
              }}
              className={`whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors ${
                isActive('/contact')
                  ? 'border-[#641E32] text-[#641E32]'
                  : 'border-transparent hover:text-[#641E32]'
              }`}
            >
              Contact
            </a>
          </nav>

          {/* Zone 3: Utility Action Icons */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setSearchOpen(!searchOpen)}
              aria-label="Search sarees"
              className="flex h-10 w-10 items-center justify-center text-[#242020] hover:text-[#641E32] transition-colors cursor-pointer"
            >
              <Search className="h-[18px] w-[18px]" strokeWidth={1.6} />
            </button>

            <button
              type="button"
              onClick={() => setAccountOpen(true)}
              aria-label="Account and order tracking"
              className="hidden sm:flex h-10 w-10 items-center justify-center text-[#242020] hover:text-[#641E32] transition-colors cursor-pointer"
            >
              <User className="h-[18px] w-[18px]" strokeWidth={1.6} />
            </button>

            <button
              type="button"
              onClick={() => setAccountOpen(true)}
              aria-label={`Wishlist (${wishlist.length} items)`}
              className="relative flex h-10 w-10 items-center justify-center text-[#242020] hover:text-[#641E32] transition-colors cursor-pointer"
            >
              <Heart className="h-[18px] w-[18px]" strokeWidth={1.6} />
              {wishlist.length > 0 && (
                <span className="absolute top-1.5 right-1 text-[10px] font-semibold text-[#641E32] tabular-nums">
                  {wishlist.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setCartOpen(true)}
              aria-label={`Shopping bag (${cartCount} items)`}
              className="relative flex h-10 items-center gap-1.5 px-2.5 text-[#242020] hover:text-[#641E32] transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <ShoppingBag className="h-[18px] w-[18px]" strokeWidth={1.6} />
              <span className="text-xs font-semibold tabular-nums">{cartCount}</span>
            </button>
          </div>
        </div>

        {/* Mega Menu Dropdown */}
        {megaMenuOpen && (
          <div className="hidden lg:block absolute left-0 right-0 top-full bg-white border-b border-[#242020]/10 shadow-lg z-50">
            <div className="mx-auto max-w-[1440px] px-8 py-8 grid grid-cols-12 gap-8">
              <div className="col-span-3 border-r border-[#242020]/10 pr-6 flex flex-col justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.16em] text-[#641E32] font-semibold">
                    Curated Weaves
                  </p>
                  <h3 className="font-editorial text-2xl font-medium text-[#242020] mt-2">
                    Explore Signature Saree Collections
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-[#5C5252]">
                    From heirloom Banarasi &amp; Kanjivaram silks to breathable Khadi &amp; Mysore Semi Crepe drapes.
                  </p>
                </div>
                <div className="mt-6 flex flex-col gap-2 text-xs font-medium">
                  <button
                    type="button"
                    onClick={() => {
                      setMegaMenuOpen(false);
                      navigate('/shop');
                    }}
                    className="text-left text-[#641E32] hover:underline cursor-pointer"
                  >
                    View All 102 Sarees →
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMegaMenuOpen(false);
                      navigate('/track-order');
                    }}
                    className="text-left text-[#242020]/75 hover:text-[#641E32] cursor-pointer"
                  >
                    Track Your Order →
                  </button>
                </div>
              </div>

              <div className="col-span-9 grid grid-cols-4 gap-4">
                {featuredCollections.map((col) => (
                  <button
                    key={col.slug}
                    type="button"
                    onClick={() => {
                      setMegaMenuOpen(false);
                      navigate(`/shop?category=${col.slug}`);
                    }}
                    className="group flex items-center gap-3 p-2 text-left hover:bg-[#FAF7F2] transition-colors cursor-pointer"
                  >
                    <div className="h-16 w-12 shrink-0 overflow-hidden bg-[#F5F0E8]">
                      <SafeImage
                        src={wixImageUrl(collectionThumbs[col.slug] || '', 160, 220, 85)}
                        alt={col.name}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[#242020] group-hover:text-[#641E32] truncate">
                        {col.name}
                      </p>
                      <p className="text-[11px] text-[#5C5252] line-clamp-2 mt-0.5">
                        {col.subtitle}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Search Overlay */}
        {searchOpen && (
          <div className="absolute left-0 right-0 top-full bg-white border-b border-[#242020]/10 shadow-xl z-50">
            <div className="mx-auto max-w-[1100px] px-4 sm:px-8 py-6">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
                }}
                className="flex items-center gap-3 border-b border-[#242020]/20 pb-3"
              >
                <Search className="h-5 w-5 text-[#641E32] shrink-0" />
                <input
                  type="text"
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by saree name, product code (e.g. 102, 049), fabric, or color..."
                  className="w-full bg-transparent text-sm sm:text-base text-[#242020] placeholder:text-[#5C5252]/70 focus:outline-none"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="text-xs text-[#5C5252] hover:text-[#242020] cursor-pointer"
                  >
                    Clear
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSearchOpen(false)}
                  aria-label="Close search"
                  className="p-1.5 text-[#5C5252] hover:text-[#242020] cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </form>

              <div className="mt-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] uppercase tracking-[0.12em] text-[#5C5252] font-medium">
                    {searchQuery ? 'Matching Sarees' : 'Latest Edit Suggestions'}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      navigate(`/shop${searchQuery ? `?search=${encodeURIComponent(searchQuery.trim())}` : ''}`)
                    }
                    className="text-xs font-medium text-[#641E32] hover:underline cursor-pointer"
                  >
                    View all in Shop →
                  </button>
                </div>

                {searchResults.length === 0 ? (
                  <p className="py-6 text-sm text-[#5C5252]">
                    No sarees matched &ldquo;{searchQuery}&rdquo;. Try searching for Banarasi, Cotton, Mysore, Tissue, or a code like 067.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {searchResults.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => navigate(`/product/${p.slug}`)}
                        className="flex items-center gap-3 p-2 text-left hover:bg-[#FAF7F2] transition-colors cursor-pointer"
                      >
                        <div className="h-16 w-12 shrink-0 overflow-hidden bg-[#F5F0E8]">
                          <SafeImage
                            src={wixImageUrl(p.images[0]?.id || '', 160, 220, 85)}
                            alt={p.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] uppercase tracking-wider text-[#5C5252] tabular-nums">
                            Code {p.code} · {p.productType}
                          </p>
                          <p className="text-xs font-medium text-[#242020] truncate">{p.name}</p>
                          <p className="text-xs font-semibold text-[#641E32] mt-0.5 tabular-nums">
                            ₹{p.price.toLocaleString('en-IN')}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-[#242020]/50 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative z-10 flex w-[85%] max-w-sm flex-col bg-[#FAF7F2] h-full overflow-y-auto p-6">
            <div className="flex items-center justify-between border-b border-[#242020]/10 pb-4">
              <span className="font-editorial text-2xl font-semibold tracking-[0.12em] text-[#242020]">
                {BRAND.name}
              </span>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close navigation menu"
                className="flex h-11 w-11 items-center justify-center text-[#242020]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="mt-6 flex flex-col gap-1">
              {[
                { label: 'Home', to: '/' },
                { label: 'Shop All Sarees (102)', to: '/shop' },
                { label: 'Track Order', to: '/track-order' },
                { label: 'About Us', to: '/about' },
                { label: 'Contact Us', to: '/contact' },
              ].map((item) => (
                <button
                  key={item.to}
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate(item.to);
                  }}
                  className="py-3 text-left text-base font-medium text-[#242020] border-b border-[#242020]/8 hover:text-[#641E32]"
                >
                  {item.label}
                </button>
              ))}
            </nav>

            <div className="mt-6">
              <p className="text-[11px] uppercase tracking-[0.14em] text-[#641E32] font-semibold mb-3">
                Shop by Collection
              </p>
              <div className="grid grid-cols-1 gap-1.5">
                {featuredCollections.map((c) => (
                  <button
                    key={c.slug}
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigate(`/shop?category=${c.slug}`);
                    }}
                    className="py-2 text-left text-sm text-[#5C5252] hover:text-[#641E32]"
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-auto pt-8 border-t border-[#242020]/10 text-xs text-[#5C5252] space-y-1.5">
              <p className="font-medium text-[#242020]">Customer Support</p>
              <p>{BRAND.phone} · {BRAND.hours}</p>
              <p>{BRAND.email}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
