import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowRight,
  Clock,
  Headphones,
  Mail,
  MessageCircle,
  Phone,
  Play,
  ShieldCheck,
  Sparkles,
  Truck,
  X,
} from 'lucide-react';
import { BRAND, BRAND_ASSETS, COLLECTIONS, wixImageUrl } from '../data/brand';
import { useStore } from '../context/StoreContext';
import { ProductCard } from '../components/ProductCard';
import { SafeImage } from '../components/SafeImage';

export const HomePage: React.FC = () => {
  const { products, navigate, showToast } = useStore();
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterLoading, setNewsletterLoading] = useState(false);
  const [newsletterDone, setNewsletterDone] = useState(false);
  const [videoModalOpen, setVideoModalOpen] = useState(false);

  const featuredCollections = useMemo(() => {
    const list = COLLECTIONS.filter((c) => c.featuredOnHome);
    return list.map((col) => {
      const matching = products.filter((p) => p.categories.includes(col.slug));
      const coverProd = matching.find((p) => p.inStock && p.images[0]) || matching[0];
      return {
        ...col,
        count: matching.length,
        imageId: coverProd?.images[0]?.id || BRAND_ASSETS.editorialPrimaryId,
      };
    });
  }, [products]);

  const latestEdit = useMemo(() => products.slice(0, 8), [products]);

  const signatureClassics = useMemo(() => {
    const targetCodes = ['067', '001', '091', '011', '019', '015', '031', '072'];
    const picked = targetCodes
      .map((code) => products.find((p) => p.code === code))
      .filter((p): p is NonNullable<typeof p> => Boolean(p));
    if (picked.length < 8) {
      for (const p of products.slice(8)) {
        if (!picked.some((x) => x.id === p.id)) picked.push(p);
        if (picked.length >= 8) break;
      }
    }
    return picked.slice(0, 8);
  }, [products]);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    setNewsletterLoading(true);
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newsletterEmail.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Please enter a valid email address.', 'error');
      } else {
        setNewsletterDone(true);
        setNewsletterEmail('');
        showToast(
          data.alreadySubscribed
            ? 'You are already subscribed to NidhuVastra updates.'
            : 'Thank you for subscribing to NidhuVastra.',
          'success'
        );
      }
    } catch {
      showToast('Unable to subscribe right now. Please try again.', 'error');
    } finally {
      setNewsletterLoading(false);
    }
  };

  return (
    <div>
      {/* C. Hero Section */}
      <section className="relative min-h-[76vh] lg:min-h-[84vh] flex items-end lg:items-center overflow-hidden bg-[#242020]">
        <div className="absolute inset-0">
          <SafeImage
            src={wixImageUrl(BRAND_ASSETS.heroBannerId, 1920, 1280, 90)}
            alt="NidhuVastra Indian Ethnic Saree Editorial"
            loading="eager"
            className="h-full w-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#1A1315]/85 via-[#1A1315]/50 to-[#1A1315]/15" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1A1315]/75 via-transparent to-transparent lg:hidden" />
        </div>

        <div className="relative z-10 mx-auto w-full max-w-[1440px] px-4 sm:px-8 py-16 sm:py-24">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-2xl"
          >
            <p className="text-xs uppercase tracking-[0.22em] text-[#C5A46D] font-medium">
              Mysuru Heritage Boutique · Est. Tradition
            </p>
            <h1 className="font-editorial text-4xl sm:text-5xl lg:text-[64px] font-medium leading-[1.06] tracking-tight text-[#FAF7F2] mt-4">
              TIMELESS ELEGANCE.
              <br />
              WOVEN FOR YOU.
            </h1>
            <p className="mt-5 text-base sm:text-lg leading-relaxed text-[#FAF7F2]/85 max-w-xl">
              Discover sarees that celebrate tradition, craftsmanship and the beauty of every occasion.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => navigate('/shop')}
                className="inline-flex items-center gap-2.5 bg-[#641E32] px-7 py-3.5 text-xs font-medium uppercase tracking-[0.16em] text-[#FAF7F2] hover:bg-[#4B1424] transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <span>Explore Collection</span>
                <ArrowRight className="h-4 w-4" strokeWidth={1.6} />
              </button>

              <a
                href="#latest-edit"
                className="inline-flex items-center gap-2 border border-[#FAF7F2]/60 bg-[#242020]/30 backdrop-blur-xs px-7 py-3.5 text-xs font-medium uppercase tracking-[0.16em] text-[#FAF7F2] hover:bg-[#FAF7F2] hover:text-[#242020] transition-colors whitespace-nowrap shrink-0"
              >
                Shop New Arrivals
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* D. Trust & Benefits Strip */}
      <section className="bg-white border-b border-[#242020]/10">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-8 py-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-0 lg:divide-x lg:divide-[#242020]/10">
            {[
              {
                icon: Truck,
                title: 'Free Shipping Across India',
                desc: 'Complimentary delivery to serviceable PIN codes',
              },
              {
                icon: Sparkles,
                title: 'Carefully Curated Collections',
                desc: '102 handpicked authentic ethnic sarees',
              },
              {
                icon: ShieldCheck,
                title: 'Secure Payments',
                desc: 'Verified checkout & transparent order tracking',
              },
              {
                icon: Headphones,
                title: 'Dedicated Customer Support',
                desc: 'Personal assistance Mon–Sat, 10 AM–6 PM IST',
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="flex items-start gap-3.5 lg:px-6 first:lg:pl-0 last:lg:pr-0">
                  <Icon className="h-5 w-5 text-[#641E32] shrink-0 mt-0.5" strokeWidth={1.5} />
                  <div>
                    <h2 className="font-sans text-sm font-semibold text-[#242020]">{item.title}</h2>
                    <p className="text-xs text-[#5C5252] mt-0.5">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* E. Shop by Collection (Editorial Asymmetric Layout) */}
      <section className="mx-auto max-w-[1440px] px-4 sm:px-8 py-16 sm:py-24">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10 sm:mb-12">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-[#641E32] font-medium">
              Shop by Collection
            </p>
            <h2 className="font-editorial text-3xl sm:text-4xl lg:text-[44px] font-medium text-[#242020] mt-2 leading-tight">
              Signature Indian Weaves
            </h2>
          </div>
          <button
            type="button"
            onClick={() => navigate('/shop')}
            className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-[#641E32] hover:underline self-start sm:self-auto cursor-pointer"
          >
            <span>Browse All 102 Sarees</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* First 2 tall editorial feature cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {featuredCollections.slice(0, 2).map((col) => (
            <button
              key={col.slug}
              type="button"
              onClick={() => navigate(`/shop?category=${col.slug}`)}
              className="group relative aspect-[16/11] w-full overflow-hidden bg-[#F5F0E8] text-left cursor-pointer"
            >
              <SafeImage
                src={wixImageUrl(col.imageId, 1100, 800, 88)}
                alt={col.name}
                className="h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-[1.04]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1A1315]/80 via-[#1A1315]/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
                <span className="text-[11px] uppercase tracking-[0.16em] text-[#C5A46D] tabular-nums">
                  {col.count} Sarees
                </span>
                <h3 className="font-editorial text-2xl sm:text-3xl font-medium text-[#FAF7F2] mt-1">
                  {col.name}
                </h3>
                <p className="text-xs sm:text-sm text-[#FAF7F2]/80 mt-1 max-w-md">{col.subtitle}</p>
                <span className="mt-4 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-[#FAF7F2] border-b border-[#C5A46D] pb-0.5">
                  Shop Collection <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Remaining 6 collections in 3x2 / 6-col editorial portrait grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-5">
          {featuredCollections.slice(2).map((col) => (
            <button
              key={col.slug}
              type="button"
              onClick={() => navigate(`/shop?category=${col.slug}`)}
              className="group relative aspect-[3/4] w-full overflow-hidden bg-[#F5F0E8] text-left cursor-pointer"
            >
              <SafeImage
                src={wixImageUrl(col.imageId, 600, 800, 88)}
                alt={col.name}
                className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-[1.05]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1A1315]/85 via-[#1A1315]/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4">
                <span className="text-[10px] uppercase tracking-[0.14em] text-[#C5A46D] tabular-nums">
                  {col.count} {col.count === 1 ? 'Saree' : 'Sarees'}
                </span>
                <h3 className="font-editorial text-lg sm:text-xl font-medium text-[#FAF7F2] leading-snug mt-0.5">
                  {col.name}
                </h3>
                <span className="mt-2 inline-flex items-center gap-1 text-[11px] uppercase tracking-[0.12em] text-[#FAF7F2]/90 group-hover:text-[#C5A46D] transition-colors">
                  Shop <ArrowRight className="h-3 w-3" />
                </span>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* F. New Arrivals — THE LATEST EDIT */}
      <section id="latest-edit" className="bg-white border-y border-[#242020]/8 py-16 sm:py-24">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10 sm:mb-12">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-[#641E32] font-medium">
                The Latest Edit
              </p>
              <h2 className="font-editorial text-3xl sm:text-4xl lg:text-[44px] font-medium text-[#242020] mt-2">
                Fresh Arrivals, Timeless Elegance
              </h2>
            </div>
            <button
              type="button"
              onClick={() => navigate('/shop?sort=newest')}
              className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-[#641E32] hover:underline self-start sm:self-auto cursor-pointer"
            >
              <span>Explore New Arrivals</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {latestEdit.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* G. Featured Collection Editorial Banner */}
      <section className="mx-auto max-w-[1440px] px-4 sm:px-8 py-16 sm:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch bg-[#641E32] text-[#FAF7F2]">
          <div className="lg:col-span-6 p-8 sm:p-12 lg:p-16 flex flex-col justify-center">
            <p className="text-xs uppercase tracking-[0.2em] text-[#C5A46D] font-medium">
              Featured Editorial
            </p>
            <h2 className="font-editorial text-3xl sm:text-4xl lg:text-5xl font-medium leading-[1.1] mt-4">
              AN EXPRESSION OF TIMELESS BEAUTY
            </h2>
            <p className="mt-5 text-base leading-relaxed text-[#FAF7F2]/85 max-w-lg">
              Every saree tells a story. Discover the art of Indian craftsmanship with collections thoughtfully curated for you.
            </p>
            <div className="mt-8">
              <button
                type="button"
                onClick={() => navigate('/shop?category=banarasi-sarees')}
                className="inline-flex items-center gap-2.5 bg-[#FAF7F2] px-7 py-3.5 text-xs font-semibold uppercase tracking-[0.16em] text-[#242020] hover:bg-[#C5A46D] hover:text-[#242020] transition-colors cursor-pointer"
              >
                <span>Discover the Collection</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="lg:col-span-6 grid grid-cols-2 gap-1 bg-[#242020]">
            <div className="aspect-[3/4] lg:aspect-auto lg:h-full overflow-hidden">
              <SafeImage
                src={wixImageUrl(BRAND_ASSETS.editorialPrimaryId, 800, 1067, 90)}
                alt="NidhuVastra Curated Saree Drape"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="aspect-[3/4] lg:aspect-auto lg:h-full overflow-hidden">
              <SafeImage
                src={wixImageUrl(BRAND_ASSETS.editorialSecondaryId, 800, 1067, 90)}
                alt="NidhuVastra Traditional Craftsmanship"
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* H. Curated Classics across Weaves */}
      <section className="bg-white border-y border-[#242020]/8 py-16 sm:py-24">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10 sm:mb-12">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-[#641E32] font-medium">
                Signature Selection
              </p>
              <h2 className="font-editorial text-3xl sm:text-4xl lg:text-[44px] font-medium text-[#242020] mt-2">
                Heirloom &amp; Everyday Drapes
              </h2>
            </div>
            <button
              type="button"
              onClick={() => navigate('/shop')}
              className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-[#641E32] hover:underline self-start sm:self-auto cursor-pointer"
            >
              <span>Shop All 102 Sarees</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {signatureClassics.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* I. Brand Story Section */}
      <section className="mx-auto max-w-[1440px] px-4 sm:px-8 py-16 sm:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          <div className="lg:col-span-6 grid grid-cols-12 gap-4 items-center">
            <div className="col-span-7 aspect-[3/4] overflow-hidden bg-[#F5F0E8]">
              <SafeImage
                src={wixImageUrl(BRAND_ASSETS.aboutPrimaryId, 800, 1067, 90)}
                alt="NidhuVastra Heritage Craftsmanship"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="col-span-5 aspect-[3/4] overflow-hidden bg-[#F5F0E8] translate-y-6">
              <SafeImage
                src={wixImageUrl(BRAND_ASSETS.aboutSecondaryId, 600, 800, 90)}
                alt="Indian Artisan Saree Weaving"
                className="h-full w-full object-cover"
              />
            </div>
          </div>

          <div className="lg:col-span-6 lg:pl-6">
            <p className="text-xs uppercase tracking-[0.2em] text-[#641E32] font-medium">
              Our Heritage
            </p>
            <h2 className="font-editorial text-3xl sm:text-4xl lg:text-[42px] font-medium leading-[1.12] text-[#242020] mt-3">
              MORE THAN A SAREE. A STORY WOVEN IN TRADITION.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-[#5C5252]">
              Weaving threads of tradition with contemporary elegance, NidhuVastra is more than just a brand; it&rsquo;s a celebration of Indian heritage.
            </p>

            <div className="mt-7 space-y-5 border-t border-[#242020]/10 pt-6">
              {[
                {
                  title: '01. Our Story',
                  body: 'Rooted in Mysuru, Karnataka, NidhuVastra curates authentic sarees that honour classic Indian drapes while feeling effortless for modern celebrations.',
                },
                {
                  title: '02. The Art of Saree Making',
                  body: 'We partner with skilled artisans across the country—from the looms of Kanchipuram to the villages of Bengal—bringing you stories woven in thread.',
                },
                {
                  title: '03. Our Commitment to Craftsmanship',
                  body: 'We believe in sustainable practices, fair wages, transparent pricing with taxes included, and empowering our weaver communities.',
                },
              ].map((pillar) => (
                <div key={pillar.title}>
                  <h3 className="font-editorial text-xl font-semibold text-[#242020]">
                    {pillar.title}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-[#5C5252]">{pillar.body}</p>
                </div>
              ))}
            </div>

            <div className="mt-8">
              <button
                type="button"
                onClick={() => navigate('/about')}
                className="inline-flex items-center gap-2.5 bg-[#242020] px-7 py-3.5 text-xs font-medium uppercase tracking-[0.16em] text-[#FAF7F2] hover:bg-[#641E32] transition-colors cursor-pointer"
              >
                <span>Discover Our Story</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* J. How to Order + Original Video Guide */}
      <section className="bg-[#F3ECE2] py-16 sm:py-24 border-y border-[#242020]/8">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            <div className="lg:col-span-6 space-y-6">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-[#641E32] font-medium">
                  Seamless Shopping Guide
                </p>
                <h2 className="font-editorial text-3xl sm:text-4xl font-medium text-[#242020] mt-2">
                  How to Place Your Order
                </h2>
              </div>

              <div className="space-y-5">
                {[
                  {
                    step: '01',
                    title: 'Explore Your Favourite Saree',
                    desc: 'Browse by weave, color, or product code across our 102 curated sarees and view multiple high-resolution drapes.',
                  },
                  {
                    step: '02',
                    title: 'Add to Cart & Complete Secure Checkout',
                    desc: 'Review your bag with taxes included, enter your Indian shipping address, and confirm your order effortlessly.',
                  },
                  {
                    step: '03',
                    title: 'Receive Your Order at Your Doorstep',
                    desc: 'Dispatched within 2–3 business days with free shipping across India and live order tracking.',
                  },
                ].map((item) => (
                  <div key={item.step} className="flex gap-4 bg-white p-5 border border-[#242020]/8">
                    <span className="font-editorial text-3xl font-semibold text-[#C5A46D] tabular-nums leading-none">
                      {item.step}
                    </span>
                    <div>
                      <h3 className="text-base font-semibold text-[#242020]">{item.title}</h3>
                      <p className="text-sm text-[#5C5252] mt-1 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="relative aspect-video w-full overflow-hidden bg-[#242020] shadow-xl group">
                <SafeImage
                  src={wixImageUrl(BRAND_ASSETS.howToOrderPosterId, 1280, 720, 90)}
                  alt="How to Place the Order - NidhuVastra Video Guide"
                  className="h-full w-full object-cover opacity-90 group-hover:scale-[1.02] transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-[#1A1315]/40 flex flex-col items-center justify-center p-6 text-center">
                  <button
                    type="button"
                    onClick={() => setVideoModalOpen(true)}
                    aria-label="Play How to Place the Order video guide"
                    className="flex h-16 w-16 items-center justify-center rounded-full bg-[#FAF7F2] text-[#641E32] shadow-lg hover:scale-105 transition-transform cursor-pointer"
                  >
                    <Play className="h-6 w-6 ml-0.5" fill="currentColor" />
                  </button>
                  <p className="mt-4 font-editorial text-2xl text-[#FAF7F2]">
                    &ldquo;How to Place the Order&rdquo;
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-[0.14em] text-[#C5A46D]">
                    NidhuVastra Storefront Guide · 05:27
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* K & L. Customer Support + Newsletter Split */}
      <section className="mx-auto max-w-[1440px] px-4 sm:px-8 py-16 sm:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 bg-white border border-[#242020]/10">
          {/* Customer Support */}
          <div className="lg:col-span-6 p-8 sm:p-12 border-b lg:border-b-0 lg:border-r border-[#242020]/10 flex flex-col justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-[#641E32] font-medium">
                Personal Concierge
              </p>
              <h2 className="font-editorial text-3xl sm:text-4xl font-medium text-[#242020] mt-2">
                We&rsquo;re Here to Help You Drape with Confidence
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-[#5C5252]">
                Need assistance choosing a saree, verifying fabric details, or checking an order? Reach our Mysuru team directly.
              </p>

              <dl className="mt-6 space-y-3 text-sm">
                <div className="flex items-center gap-3 text-[#242020]">
                  <Phone className="h-4 w-4 text-[#641E32] shrink-0" />
                  <span className="tabular-nums font-medium">{BRAND.phone}</span>
                </div>
                <div className="flex items-center gap-3 text-[#242020]">
                  <Mail className="h-4 w-4 text-[#641E32] shrink-0" />
                  <a href={`mailto:${BRAND.email}`} className="hover:text-[#641E32]">
                    {BRAND.email}
                  </a>
                </div>
                <div className="flex items-center gap-3 text-[#5C5252]">
                  <Clock className="h-4 w-4 text-[#641E32] shrink-0" />
                  <span>{BRAND.hours}</span>
                </div>
              </dl>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href={BRAND.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[#242020] px-6 py-3 text-xs font-medium uppercase tracking-[0.14em] text-[#FAF7F2] hover:bg-[#641E32] transition-colors"
              >
                <MessageCircle className="h-4 w-4" />
                <span>WhatsApp Support</span>
              </a>
              <button
                type="button"
                onClick={() => navigate('/track-order')}
                className="inline-flex items-center gap-2 border border-[#242020]/25 px-6 py-3 text-xs font-medium uppercase tracking-[0.14em] text-[#242020] hover:border-[#641E32] hover:text-[#641E32] transition-colors cursor-pointer"
              >
                Track Order
              </button>
            </div>
          </div>

          {/* Newsletter */}
          <div className="lg:col-span-6 p-8 sm:p-12 bg-[#FAF7F2]/60 flex flex-col justify-center">
            <p className="text-xs uppercase tracking-[0.18em] text-[#641E32] font-medium">
              Newsletter
            </p>
            <h2 className="font-editorial text-3xl sm:text-4xl font-medium text-[#242020] mt-2">
              A LITTLE LOVE FROM NIDHUVASTRA
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[#5C5252] max-w-md">
              Be the first to discover new arrivals, exclusive collections and updates.
            </p>

            {newsletterDone ? (
              <div className="mt-6 bg-white border border-[#C5A46D]/50 p-4 text-sm text-[#242020]">
                Thank you for joining the NidhuVastra circle. You will receive updates on our latest saree edits.
              </div>
            ) : (
              <form onSubmit={handleNewsletterSubmit} className="mt-6 flex flex-col sm:flex-row gap-3">
                <label htmlFor="home-newsletter-email" className="sr-only">
                  Email address
                </label>
                <input
                  id="home-newsletter-email"
                  type="email"
                  required
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="flex-1 bg-white border border-[#242020]/20 px-4 py-3 text-sm text-[#242020] placeholder:text-[#5C5252]/70 focus:border-[#641E32] focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={newsletterLoading}
                  className="bg-[#641E32] px-7 py-3 text-xs font-medium uppercase tracking-[0.14em] text-[#FAF7F2] hover:bg-[#4B1424] transition-colors disabled:opacity-60 cursor-pointer whitespace-nowrap shrink-0"
                >
                  {newsletterLoading ? 'Subscribing...' : 'Subscribe'}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Video Modal */}
      {videoModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#242020]/80 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-label="How to Place the Order Video"
          onClick={() => setVideoModalOpen(false)}
        >
          <div
            className="relative w-full max-w-3xl bg-[#242020] text-[#FAF7F2] shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10">
              <span className="font-editorial text-xl">NidhuVastra — Saree Showcase &amp; Ordering Guide</span>
              <button
                type="button"
                onClick={() => setVideoModalOpen(false)}
                aria-label="Close video modal"
                className="p-1.5 text-[#FAF7F2]/80 hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="aspect-video bg-black">
              <video
                src={BRAND_ASSETS.showcaseReelMp4}
                poster={wixImageUrl(BRAND_ASSETS.howToOrderPosterId, 1280, 720, 90)}
                controls
                autoPlay
                playsInline
                className="h-full w-full object-contain"
              />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 bg-[#1B1818] text-xs text-[#FAF7F2]/80">
              <span>Need help placing an order? Message us on WhatsApp at {BRAND.phone}.</span>
              <a
                href={BRAND.existingSiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#C5A46D] hover:underline"
              >
                Open Full 05:27 Order Guide on NidhuVastra.com →
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
