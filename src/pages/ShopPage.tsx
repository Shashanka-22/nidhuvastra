import React, { useEffect, useMemo, useState } from 'react';
import { Filter, Search, SlidersHorizontal, X } from 'lucide-react';
import { COLLECTIONS } from '../data/brand';
import { useStore } from '../context/StoreContext';
import { ProductCard } from '../components/ProductCard';

type SortOption = 'recommended' | 'price-asc' | 'price-desc' | 'newest' | 'alpha';

const PRICE_RANGES = [
  { id: 'all', label: 'All Prices', min: 0, max: Infinity },
  { id: 'under-1200', label: 'Under ₹1,200', min: 0, max: 1199 },
  { id: '1200-1599', label: '₹1,200 – ₹1,599', min: 1200, max: 1599 },
  { id: '1600-1999', label: '₹1,600 – ₹1,999', min: 1600, max: 1999 },
  { id: '2000-plus', label: '₹2,000 & Above', min: 2000, max: Infinity },
];

export const ShopPage: React.FC = () => {
  const { products, route } = useStore();

  const initialParams = useMemo(() => {
    const qIndex = route.indexOf('?');
    const pathPart = qIndex >= 0 ? route.slice(0, qIndex) : route;
    const searchStr = qIndex >= 0 ? route.slice(qIndex) : '';
    const params = new URLSearchParams(searchStr);
    const pathCategory = pathPart.startsWith('/category/')
      ? decodeURIComponent(pathPart.replace('/category/', '').replace(/\/+$/, ''))
      : '';
    return {
      category: params.get('category') || pathCategory || 'all-products',
      search: params.get('search') || '',
      sort: (params.get('sort') as SortOption) || 'recommended',
    };
  }, [route]);

  const [selectedCategory, setSelectedCategory] = useState(initialParams.category);
  const [searchTerm, setSearchTerm] = useState(initialParams.search);
  const [sortBy, setSortBy] = useState<SortOption>(initialParams.sort);
  const [priceRange, setPriceRange] = useState('all');
  const [selectedColor, setSelectedColor] = useState('all');
  const [availability, setAvailability] = useState<'all' | 'in_stock' | 'out_of_stock'>('all');
  const [selectedType, setSelectedType] = useState('all');
  const [visibleCount, setVisibleCount] = useState(24);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  useEffect(() => {
    setSelectedCategory(initialParams.category);
    setSearchTerm(initialParams.search);
    setSortBy(initialParams.sort);
    setVisibleCount(24);
  }, [initialParams.category, initialParams.search, initialParams.sort]);

  const allColors = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of products) {
      for (const c of p.colors) {
        counts.set(c, (counts.get(c) || 0) + 1);
      }
    }
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  }, [products]);

  const allTypes = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of products) {
      counts.set(p.productType, (counts.get(p.productType) || 0) + 1);
    }
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  }, [products]);

  const categoryCounts = useMemo(() => {
    const map: Record<string, number> = { 'all-products': products.length };
    for (const col of COLLECTIONS) {
      map[col.slug] = products.filter((p) => p.categories.includes(col.slug)).length;
    }
    return map;
  }, [products]);

  const filteredProducts = useMemo(() => {
    const rangeObj = PRICE_RANGES.find((r) => r.id === priceRange) || PRICE_RANGES[0];
    const q = searchTerm.trim().toLowerCase();

    const list = products.filter((p) => {
      if (selectedCategory !== 'all-products' && !p.categories.includes(selectedCategory)) {
        return false;
      }
      if (p.price < rangeObj.min || p.price > rangeObj.max) {
        return false;
      }
      if (selectedColor !== 'all' && !p.colors.includes(selectedColor)) {
        return false;
      }
      if (availability === 'in_stock' && !p.inStock) {
        return false;
      }
      if (availability === 'out_of_stock' && p.inStock) {
        return false;
      }
      if (selectedType !== 'all' && p.productType !== selectedType) {
        return false;
      }
      if (q) {
        const hay = `${p.name} ${p.code} ${p.productType} ${p.colors.join(' ')}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    const sorted = [...list];
    switch (sortBy) {
      case 'price-asc':
        sorted.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        sorted.sort((a, b) => b.price - a.price);
        break;
      case 'newest':
        sorted.sort((a, b) => b.codeNum - a.codeNum);
        break;
      case 'alpha':
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'recommended':
      default:
        sorted.sort((a, b) => a.orderIndex - b.orderIndex);
        break;
    }
    return sorted;
  }, [
    products,
    selectedCategory,
    priceRange,
    selectedColor,
    availability,
    selectedType,
    searchTerm,
    sortBy,
  ]);

  const activeCategoryMeta = COLLECTIONS.find((c) => c.slug === selectedCategory);
  const pageTitle = activeCategoryMeta ? activeCategoryMeta.name : 'All Products';
  const displayed = filteredProducts.slice(0, visibleCount);
  const hasActiveFilters =
    selectedCategory !== 'all-products' ||
    priceRange !== 'all' ||
    selectedColor !== 'all' ||
    availability !== 'all' ||
    selectedType !== 'all' ||
    searchTerm.trim() !== '';

  const resetFilters = () => {
    setSelectedCategory('all-products');
    setPriceRange('all');
    setSelectedColor('all');
    setAvailability('all');
    setSelectedType('all');
    setSearchTerm('');
    setSortBy('recommended');
    setVisibleCount(24);
  };

  const renderFilterControls = () => (
    <div className="space-y-7">
      {/* Category */}
      <div>
        <h3 className="font-sans text-xs font-semibold uppercase tracking-[0.14em] text-[#641E32] mb-3">
          Browse by Category
        </h3>
        <ul className="space-y-1">
          <li>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('all-products');
                setVisibleCount(24);
              }}
              className={`flex w-full items-center justify-between py-1.5 text-sm transition-colors cursor-pointer ${
                selectedCategory === 'all-products'
                  ? 'font-semibold text-[#641E32]'
                  : 'text-[#5C5252] hover:text-[#242020]'
              }`}
            >
              <span>All Products</span>
              <span className="text-xs tabular-nums">{categoryCounts['all-products']}</span>
            </button>
          </li>
          {COLLECTIONS.map((col) => (
            <li key={col.slug}>
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory(col.slug);
                  setVisibleCount(24);
                }}
                className={`flex w-full items-center justify-between py-1.5 text-sm transition-colors cursor-pointer ${
                  selectedCategory === col.slug
                    ? 'font-semibold text-[#641E32]'
                    : 'text-[#5C5252] hover:text-[#242020]'
                }`}
              >
                <span className="text-left">{col.name}</span>
                <span className="text-xs tabular-nums">{categoryCounts[col.slug] || 0}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Price */}
      <div className="border-t border-[#242020]/10 pt-5">
        <h3 className="font-sans text-xs font-semibold uppercase tracking-[0.14em] text-[#641E32] mb-3">
          Price Range
        </h3>
        <div className="space-y-1.5">
          {PRICE_RANGES.map((range) => (
            <label key={range.id} className="flex items-center gap-2.5 text-sm text-[#242020] cursor-pointer py-0.5">
              <input
                type="radio"
                name="price-range"
                checked={priceRange === range.id}
                onChange={() => {
                  setPriceRange(range.id);
                  setVisibleCount(24);
                }}
                className="accent-[#641E32]"
              />
              <span>{range.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Availability */}
      <div className="border-t border-[#242020]/10 pt-5">
        <h3 className="font-sans text-xs font-semibold uppercase tracking-[0.14em] text-[#641E32] mb-3">
          Availability
        </h3>
        <div className="space-y-1.5">
          {[
            { id: 'all', label: 'All Sarees' },
            { id: 'in_stock', label: 'In Stock Only' },
            { id: 'out_of_stock', label: 'Out of Stock' },
          ].map((opt) => (
            <label key={opt.id} className="flex items-center gap-2.5 text-sm text-[#242020] cursor-pointer py-0.5">
              <input
                type="radio"
                name="availability"
                checked={availability === opt.id}
                onChange={() => {
                  setAvailability(opt.id as typeof availability);
                  setVisibleCount(24);
                }}
                className="accent-[#641E32]"
              />
              <span>{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Colour Filter */}
      <div className="border-t border-[#242020]/10 pt-5">
        <h3 className="font-sans text-xs font-semibold uppercase tracking-[0.14em] text-[#641E32] mb-3">
          Colour
        </h3>
        <select
          aria-label="Filter by colour"
          value={selectedColor}
          onChange={(e) => {
            setSelectedColor(e.target.value);
            setVisibleCount(24);
          }}
          className="w-full bg-white border border-[#242020]/20 px-3 py-2 text-sm text-[#242020] focus:border-[#641E32] focus:outline-none"
        >
          <option value="all">All Colours</option>
          {allColors.map(([color, count]) => (
            <option key={color} value={color}>
              {color} ({count})
            </option>
          ))}
        </select>
      </div>

      {/* Product Type */}
      <div className="border-t border-[#242020]/10 pt-5">
        <h3 className="font-sans text-xs font-semibold uppercase tracking-[0.14em] text-[#641E32] mb-3">
          Product Type
        </h3>
        <select
          aria-label="Filter by product type"
          value={selectedType}
          onChange={(e) => {
            setSelectedType(e.target.value);
            setVisibleCount(24);
          }}
          className="w-full bg-white border border-[#242020]/20 px-3 py-2 text-sm text-[#242020] focus:border-[#641E32] focus:outline-none"
        >
          <option value="all">All Fabric &amp; Weave Types</option>
          {allTypes.map(([type, count]) => (
            <option key={type} value={type}>
              {type} ({count})
            </option>
          ))}
        </select>
      </div>

      {hasActiveFilters && (
        <button
          type="button"
          onClick={resetFilters}
          className="w-full border border-[#641E32] py-2.5 text-xs font-medium uppercase tracking-[0.12em] text-[#641E32] hover:bg-[#641E32] hover:text-white transition-colors cursor-pointer"
        >
          Clear All Filters
        </button>
      )}
    </div>
  );

  return (
    <div className="mx-auto max-w-[1440px] px-4 sm:px-8 py-10 sm:py-14">
      {/* Page Header */}
      <div className="border-b border-[#242020]/10 pb-8 mb-8">
        <p className="text-xs uppercase tracking-[0.18em] text-[#641E32] font-medium">
          NidhuVastra Catalogue
        </p>
        <div className="mt-2 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="font-editorial text-4xl sm:text-5xl font-medium text-[#242020]">
              {pageTitle}
            </h1>
            <p className="mt-2 text-sm text-[#5C5252]">
              {activeCategoryMeta
                ? activeCategoryMeta.subtitle
                : 'Every saree from our complete curated collection—with original pricing, product codes, and complimentary shipping across India.'}
            </p>
          </div>
          <p className="text-sm font-medium text-[#242020] tabular-nums shrink-0">
            Showing {filteredProducts.length} of {products.length} sarees
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block lg:col-span-3">
          <div className="sticky top-28 bg-white border border-[#242020]/10 p-6">
            {renderFilterControls()}
          </div>
        </aside>

        {/* Main Area */}
        <div className="lg:col-span-9">
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6 bg-white p-3.5 border border-[#242020]/10">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(true)}
                className="flex lg:hidden items-center gap-2 border border-[#242020]/20 px-3.5 py-2 text-xs font-medium uppercase tracking-wider text-[#242020] shrink-0 cursor-pointer"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                <span>Filters</span>
              </button>

              <div className="relative flex-1">
                <Search className="h-4 w-4 text-[#5C5252] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setVisibleCount(24);
                  }}
                  placeholder="Search saree name, code (e.g. 049), colour..."
                  aria-label="Search catalogue"
                  className="w-full bg-[#FAF7F2] border border-[#242020]/10 pl-9 pr-8 py-2 text-sm text-[#242020] placeholder:text-[#5C5252]/70 focus:border-[#641E32] focus:outline-none"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    aria-label="Clear search"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#5C5252] hover:text-[#242020] cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <label htmlFor="shop-sort" className="text-xs text-[#5C5252] whitespace-nowrap">
                Sort by:
              </label>
              <select
                id="shop-sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="bg-[#FAF7F2] border border-[#242020]/15 px-3 py-2 text-xs sm:text-sm text-[#242020] focus:border-[#641E32] focus:outline-none"
              >
                <option value="recommended">Recommended</option>
                <option value="newest">Newest First</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="alpha">Alphabetical</option>
              </select>
            </div>
          </div>

          {/* Product Grid */}
          {displayed.length === 0 ? (
            <div className="bg-white border border-[#242020]/10 py-16 px-6 text-center">
              <Filter className="mx-auto h-9 w-9 text-[#C5A46D] mb-4" strokeWidth={1.3} />
              <h2 className="font-editorial text-2xl text-[#242020]">No matching sarees found</h2>
              <p className="mt-2 text-sm text-[#5C5252] max-w-md mx-auto">
                Try adjusting your price range, weave category, colour filter, or search query.
              </p>
              <button
                type="button"
                onClick={resetFilters}
                className="mt-6 bg-[#641E32] px-6 py-3 text-xs font-medium uppercase tracking-[0.14em] text-[#FAF7F2] hover:bg-[#4B1424] cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                {displayed.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {/* Load More / Show All */}
              {visibleCount < filteredProducts.length && (
                <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setVisibleCount((c) => c + 24)}
                    className="bg-[#242020] px-8 py-3.5 text-xs font-medium uppercase tracking-[0.14em] text-[#FAF7F2] hover:bg-[#641E32] transition-colors cursor-pointer"
                  >
                    Load More Sarees ({filteredProducts.length - visibleCount} remaining)
                  </button>
                  <button
                    type="button"
                    onClick={() => setVisibleCount(filteredProducts.length)}
                    className="border border-[#242020]/25 px-6 py-3.5 text-xs font-medium uppercase tracking-[0.14em] text-[#242020] hover:border-[#641E32] hover:text-[#641E32] transition-colors cursor-pointer"
                  >
                    Show All {filteredProducts.length}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-[#242020]/50 backdrop-blur-xs"
            onClick={() => setMobileFiltersOpen(false)}
          />
          <div className="relative z-10 flex h-full w-[88%] max-w-sm flex-col bg-[#FAF7F2] p-6 overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#242020]/10 pb-4 mb-5">
              <h2 className="font-editorial text-2xl font-medium text-[#242020]">Filter Sarees</h2>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                aria-label="Close filters"
                className="flex h-10 w-10 items-center justify-center text-[#242020]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {renderFilterControls()}
            <button
              type="button"
              onClick={() => setMobileFiltersOpen(false)}
              className="mt-6 w-full bg-[#641E32] py-3 text-xs font-medium uppercase tracking-[0.14em] text-[#FAF7F2]"
            >
              Show {filteredProducts.length} Sarees
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
