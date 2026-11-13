import React from 'react';
import { Instagram, Mail, MapPin, Phone } from 'lucide-react';
import { BRAND, BRAND_ASSETS, wixImageUrl } from '../data/brand';
import { useStore } from '../context/StoreContext';
import { SafeImage } from './SafeImage';

export const Footer: React.FC = () => {
  const { navigate } = useStore();

  const handleLink = (e: React.MouseEvent, to: string) => {
    e.preventDefault();
    navigate(to);
  };

  return (
    <footer className="bg-[#242020] text-[#FAF7F2]">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-8 py-14 sm:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8">
          {/* Brand Column */}
          <div className="lg:col-span-4 space-y-4">
            <a
              href="/"
              onClick={(e) => handleLink(e, '/')}
              className="inline-flex items-center gap-3"
            >
              <SafeImage
                src={wixImageUrl(BRAND_ASSETS.emblemId, 240, 160, 90)}
                alt="NidhuVastra Emblem"
                className="h-12 w-auto object-contain brightness-110"
              />
              <span className="font-editorial text-2xl font-semibold tracking-[0.14em] text-[#FAF7F2]">
                {BRAND.name}
              </span>
            </a>
            <p className="text-sm leading-relaxed text-[#FAF7F2]/75 max-w-sm">
              {BRAND.tagline} Handpicked Indian ethnic sarees celebrating artisan looms and contemporary elegance.
            </p>
            <div className="pt-2">
              <a
                href={BRAND.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-[#C5A46D] hover:text-[#FAF7F2] transition-colors"
              >
                <Instagram className="h-4 w-4" strokeWidth={1.6} />
                <span>Follow @nidhu_vastra</span>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="lg:col-span-2">
            <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-[#C5A46D] mb-4 font-sans">
              Quick Links
            </h3>
            <ul className="space-y-2.5 text-sm text-[#FAF7F2]/80">
              {[
                { label: 'Home', to: '/' },
                { label: 'Shop All Sarees', to: '/shop' },
                { label: 'About Us', to: '/about' },
                { label: 'Track Order', to: '/track-order' },
                { label: 'Contact Us', to: '/contact' },
              ].map((link) => (
                <li key={link.to}>
                  <a
                    href={link.to}
                    onClick={(e) => handleLink(e, link.to)}
                    className="hover:text-[#FAF7F2] transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Support & Policies */}
          <div className="lg:col-span-3">
            <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-[#C5A46D] mb-4 font-sans">
              Customer Support
            </h3>
            <ul className="space-y-2.5 text-sm text-[#FAF7F2]/80">
              {[
                { label: 'Shipping Policy', to: '/shipping-policy' },
                { label: 'Return & Exchange Policy', to: '/return-policy' },
                { label: 'Privacy Policy', to: '/privacy-policy' },
                { label: 'Terms & Conditions', to: '/terms' },
                { label: 'Accessibility Statement', to: '/accessibility' },
              ].map((link) => (
                <li key={link.to}>
                  <a
                    href={link.to}
                    onClick={(e) => handleLink(e, link.to)}
                    className="hover:text-[#FAF7F2] transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="lg:col-span-3">
            <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-[#C5A46D] mb-4 font-sans">
              Atelier &amp; Contact
            </h3>
            <ul className="space-y-3 text-sm text-[#FAF7F2]/80">
              <li className="flex items-start gap-2.5">
                <MapPin className="h-4 w-4 text-[#C5A46D] shrink-0 mt-0.5" strokeWidth={1.6} />
                <span>{BRAND.address}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 text-[#C5A46D] shrink-0" strokeWidth={1.6} />
                <a href={`tel:${BRAND.phone.replace(/\s+/g, '')}`} className="hover:text-[#FAF7F2] tabular-nums">
                  {BRAND.phone}
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 text-[#C5A46D] shrink-0" strokeWidth={1.6} />
                <a href={`mailto:${BRAND.email}`} className="hover:text-[#FAF7F2]">
                  {BRAND.email}
                </a>
              </li>
              <li className="pt-1 text-xs text-[#FAF7F2]/60">
                Support Hours: {BRAND.hours}
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-[#FAF7F2]/12 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#FAF7F2]/60">
          <p>© 2026 NidhuVastra. All Rights Reserved.</p>
          <p>Free Shipping Across India · Mysuru Heritage Craftsmanship</p>
        </div>
      </div>
    </footer>
  );
};
