import React from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { QuickViewModal } from './components/QuickViewModal';
import { CartDrawer } from './components/CartDrawer';
import { AccountDrawer } from './components/AccountDrawer';
import { ToastContainer } from './components/ToastContainer';
import { FloatingWhatsApp } from './components/FloatingWhatsApp';
import { HomePage } from './pages/HomePage';
import { ShopPage } from './pages/ShopPage';
import { ProductPage } from './pages/ProductPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { TrackOrderPage } from './pages/TrackOrderPage';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';
import {
  AccessibilityPage,
  PrivacyPolicyPage,
  ReturnPolicyPage,
  ShippingPolicyPage,
  TermsPage,
} from './pages/PolicyPages';

const RouterView: React.FC = () => {
  const { route } = useStore();
  const path = route.split('?')[0].replace(/\/+$/, '') || '/';

  if (path === '/') return <HomePage />;
  if (path === '/shop' || path.startsWith('/category/')) return <ShopPage />;
  if (path.startsWith('/product/')) {
    const slug = decodeURIComponent(path.replace('/product/', ''));
    return <ProductPage slug={slug} />;
  }
  if (path === '/cart') return <CartPage />;
  if (path === '/checkout') return <CheckoutPage />;
  if (path === '/track-order') return <TrackOrderPage />;
  if (path === '/about' || path === '/aboutus') return <AboutPage />;
  if (path === '/contact') return <ContactPage />;
  if (path === '/shipping-policy' || path === '/shippingpolicy') return <ShippingPolicyPage />;
  if (path === '/return-policy' || path === '/returnploicy') return <ReturnPolicyPage />;
  if (path === '/privacy-policy' || path === '/privacypolicy') return <PrivacyPolicyPage />;
  if (path === '/terms') return <TermsPage />;
  if (path === '/accessibility') return <AccessibilityPage />;

  return <HomePage />;
};

export default function App() {
  return (
    <StoreProvider>
      <div className="min-h-screen flex flex-col bg-[#FAF7F2] text-[#242020]">
        <Header />
        <main className="flex-1">
          <RouterView />
        </main>
        <Footer />
        <QuickViewModal />
        <CartDrawer />
        <AccountDrawer />
        <FloatingWhatsApp />
        <ToastContainer />
      </div>
    </StoreProvider>
  );
}
