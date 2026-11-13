import React from 'react';
import { ArrowRight } from 'lucide-react';
import { BRAND_ASSETS, wixImageUrl } from '../data/brand';
import { useStore } from '../context/StoreContext';
import { SafeImage } from '../components/SafeImage';

export const AboutPage: React.FC = () => {
  const { navigate } = useStore();

  return (
    <div>
      {/* Editorial Hero */}
      <section className="mx-auto max-w-[1440px] px-4 sm:px-8 pt-12 sm:pt-16 pb-12">
        <div className="max-w-3xl">
          <p className="text-xs uppercase tracking-[0.2em] text-[#641E32] font-medium">
            About NidhuVastra
          </p>
          <h1 className="font-editorial text-4xl sm:text-5xl lg:text-6xl font-medium leading-[1.08] text-[#242020] mt-3">
            Finding Inspiration in Every Turn
          </h1>
          <p className="mt-5 text-base sm:text-lg leading-relaxed text-[#5C5252]">
            Weaving threads of tradition with contemporary elegance, NidhuVastra is more than just a brand; it&rsquo;s a celebration of Indian heritage.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <div className="lg:col-span-7 aspect-[16/11] overflow-hidden bg-[#F5F0E8]">
            <SafeImage
              src={wixImageUrl(BRAND_ASSETS.aboutPrimaryId, 1200, 900, 90)}
              alt="NidhuVastra Indian Saree Heritage"
              loading="eager"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="lg:col-span-5 aspect-[4/5] lg:aspect-auto overflow-hidden bg-[#F5F0E8]">
            <SafeImage
              src={wixImageUrl(BRAND_ASSETS.aboutSecondaryId, 900, 1125, 90)}
              alt="Artisanal Saree Weaving Craftsmanship"
              loading="eager"
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* Story Chapters */}
      <section className="bg-white border-y border-[#242020]/10 py-16 sm:py-24">
        <div className="mx-auto max-w-[1160px] px-4 sm:px-8 grid grid-cols-1 md:grid-cols-3 gap-10 lg:gap-12">
          <div>
            <span className="font-editorial text-4xl text-[#C5A46D] tabular-nums">01</span>
            <h2 className="font-editorial text-2xl sm:text-3xl font-medium text-[#242020] mt-2">
              Our Story
            </h2>
            <p className="mt-3 text-sm sm:text-base leading-relaxed text-[#5C5252]">
              Weaving threads of tradition with contemporary elegance, NidhuVastra is more than just a brand; it&rsquo;s a celebration of Indian heritage.
            </p>
          </div>

          <div>
            <span className="font-editorial text-4xl text-[#C5A46D] tabular-nums">02</span>
            <h2 className="font-editorial text-2xl sm:text-3xl font-medium text-[#242020] mt-2">
              The Art of Saree Making
            </h2>
            <p className="mt-3 text-sm sm:text-base leading-relaxed text-[#5C5252]">
              Each NidhuVastra creation is a testament to the rich legacy of Indian craftsmanship. We partner with skilled artisans across the country—from the bustling looms of Kanchipuram to the serene villages of Bengal—to bring you sarees that are not just garments, but stories woven in thread.
            </p>
          </div>

          <div>
            <span className="font-editorial text-4xl text-[#C5A46D] tabular-nums">03</span>
            <h2 className="font-editorial text-2xl sm:text-3xl font-medium text-[#242020] mt-2">
              Our Mission
            </h2>
            <p className="mt-3 text-sm sm:text-base leading-relaxed text-[#5C5252]">
              To preserve timeless art forms while innovating for the modern woman. We believe in sustainable practices, fair wages, and empowering our weaver communities.
            </p>
          </div>
        </div>
      </section>

      {/* Editorial Closing CTA */}
      <section className="mx-auto max-w-[1160px] px-4 sm:px-8 py-16 sm:py-20 text-center">
        <h2 className="font-editorial text-3xl sm:text-4xl font-medium text-[#242020]">
          Explore Curated Sarees from Mysuru
        </h2>
        <p className="mt-3 text-sm sm:text-base text-[#5C5252] max-w-xl mx-auto">
          Browse our full collection of Banarasi, Mysore Semi Crepe Silk, Kanjivaram, Tissue Silk, Khadi, and Cotton sarees—with complimentary shipping across India.
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => navigate('/shop')}
            className="inline-flex items-center gap-2 bg-[#641E32] px-8 py-3.5 text-xs font-medium uppercase tracking-[0.16em] text-[#FAF7F2] hover:bg-[#4B1424] cursor-pointer"
          >
            <span>Shop Collection</span>
            <ArrowRight className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => navigate('/contact')}
            className="border border-[#242020]/25 px-8 py-3.5 text-xs font-medium uppercase tracking-[0.16em] text-[#242020] hover:border-[#641E32] hover:text-[#641E32] cursor-pointer"
          >
            Contact Us
          </button>
        </div>
      </section>
    </div>
  );
};
