import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import rawCatalog from '../data/catalog.json';
import type { CartItem, OrderRecord, Product } from '../types/store';

interface ToastMessage {
  id: number;
  text: string;
  tone: 'success' | 'info' | 'error';
}

interface StoreContextValue {
  products: Product[];
  route: string;
  navigate: (to: string) => void;
  cart: CartItem[];
  cartCount: number;
  cartSubtotal: number;
  addToCart: (product: Product, quantity?: number, selectedOption?: string, openDrawer?: boolean) => void;
  updateCartQty: (productId: string, selectedOption: string | undefined, qty: number) => void;
  removeFromCart: (productId: string, selectedOption?: string) => void;
  clearCart: () => void;
  wishlist: string[];
  toggleWishlist: (product: Product) => void;
  isWishlisted: (productId: string) => boolean;
  recentOrders: OrderRecord[];
  saveRecentOrder: (order: OrderRecord) => void;
  quickViewProduct: Product | null;
  setQuickViewProduct: (product: Product | null) => void;
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  searchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
  accountOpen: boolean;
  setAccountOpen: (open: boolean) => void;
  toasts: ToastMessage[];
  showToast: (text: string, tone?: ToastMessage['tone']) => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

const CART_KEY = 'nidhuvastra_cart_v1';
const WISHLIST_KEY = 'nidhuvastra_wishlist_v1';
const ORDERS_KEY = 'nidhuvastra_orders_v1';

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const products = useMemo(() => rawCatalog as Product[], []);

  const [route, setRoute] = useState<string>(() => {
    if (typeof window === 'undefined') return '/';
    return window.location.pathname + window.location.search;
  });

  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const raw = localStorage.getItem(CART_KEY);
      return raw ? (JSON.parse(raw) as CartItem[]) : [];
    } catch {
      return [];
    }
  });

  const [wishlist, setWishlist] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(WISHLIST_KEY);
      return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      return [];
    }
  });

  const [recentOrders, setRecentOrders] = useState<OrderRecord[]>(() => {
    try {
      const raw = localStorage.getItem(ORDERS_KEY);
      return raw ? (JSON.parse(raw) as OrderRecord[]) : [];
    } catch {
      return [];
    }
  });

  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch {
      // ignore storage quota
    }
  }, [cart]);

  useEffect(() => {
    try {
      localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist));
    } catch {
      // ignore
    }
  }, [wishlist]);

  useEffect(() => {
    try {
      localStorage.setItem(ORDERS_KEY, JSON.stringify(recentOrders));
    } catch {
      // ignore
    }
  }, [recentOrders]);

  useEffect(() => {
    const onPopState = () => {
      setRoute(window.location.pathname + window.location.search);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const showToast = useCallback((text: string, tone: ToastMessage['tone'] = 'info') => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((prev) => [...prev, { id, text, tone }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  }, []);

  const navigate = useCallback((to: string) => {
    const normalized = to.startsWith('/') ? to : `/${to}`;
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', normalized);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    setRoute(normalized);
    setSearchOpen(false);
    setAccountOpen(false);
  }, []);

  const addToCart = useCallback(
    (product: Product, quantity = 1, selectedOption?: string, openDrawer = true) => {
      if (!product.inStock) {
        showToast(`${product.name} is currently out of stock.`, 'error');
        return;
      }
      const imgId = product.images[0]?.id || '';
      setCart((prev) => {
        const idx = prev.findIndex(
          (i) => i.productId === product.id && i.selectedOption === selectedOption
        );
        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = { ...copy[idx], quantity: Math.min(20, copy[idx].quantity + quantity) };
          return copy;
        }
        return [
          ...prev,
          {
            productId: product.id,
            code: product.code,
            name: product.name,
            slug: product.slug,
            price: product.price,
            imageId: imgId,
            selectedOption,
            quantity,
          },
        ];
      });
      showToast(`Added ${product.name} to your shopping bag.`, 'success');
      if (openDrawer) {
        setCartOpen(true);
      }
    },
    [showToast]
  );

  const updateCartQty = useCallback(
    (productId: string, selectedOption: string | undefined, qty: number) => {
      if (qty <= 0) {
        setCart((prev) =>
          prev.filter((i) => !(i.productId === productId && i.selectedOption === selectedOption))
        );
        return;
      }
      setCart((prev) =>
        prev.map((i) =>
          i.productId === productId && i.selectedOption === selectedOption
            ? { ...i, quantity: Math.min(20, qty) }
            : i
        )
      );
    },
    []
  );

  const removeFromCart = useCallback((productId: string, selectedOption?: string) => {
    setCart((prev) =>
      prev.filter((i) => !(i.productId === productId && i.selectedOption === selectedOption))
    );
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const toggleWishlist = useCallback(
    (product: Product) => {
      setWishlist((prev) => {
        const exists = prev.includes(product.id);
        if (exists) {
          showToast(`Removed ${product.name} from wishlist.`, 'info');
          return prev.filter((id) => id !== product.id);
        }
        showToast(`Saved ${product.name} to wishlist.`, 'success');
        return [...prev, product.id];
      });
    },
    [showToast]
  );

  const isWishlisted = useCallback(
    (productId: string) => wishlist.includes(productId),
    [wishlist]
  );

  const saveRecentOrder = useCallback((order: OrderRecord) => {
    setRecentOrders((prev) => [order, ...prev.filter((o) => o.orderNumber !== order.orderNumber)]);
  }, []);

  const cartCount = useMemo(() => cart.reduce((sum, i) => sum + i.quantity, 0), [cart]);
  const cartSubtotal = useMemo(() => cart.reduce((sum, i) => sum + i.price * i.quantity, 0), [cart]);

  const value: StoreContextValue = {
    products,
    route,
    navigate,
    cart,
    cartCount,
    cartSubtotal,
    addToCart,
    updateCartQty,
    removeFromCart,
    clearCart,
    wishlist,
    toggleWishlist,
    isWishlisted,
    recentOrders,
    saveRecentOrder,
    quickViewProduct,
    setQuickViewProduct,
    cartOpen,
    setCartOpen,
    searchOpen,
    setSearchOpen,
    accountOpen,
    setAccountOpen,
    toasts,
    showToast,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
};

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}
