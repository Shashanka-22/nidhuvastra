import React from 'react';
import { BRAND } from '../data/brand';

export const FloatingWhatsApp: React.FC = () => {
  return (
    <a
      href={BRAND.whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with NidhuVastra on WhatsApp (+91 76764 07220)"
      className="fixed bottom-20 lg:bottom-6 right-4 sm:right-6 z-40 group flex items-center gap-2.5 rounded-full bg-[#25D366] text-white px-3.5 py-3 shadow-lg hover:bg-[#1EBE5D] hover:-translate-y-0.5 transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#641E32]"
    >
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
        className="h-5 w-5 shrink-0"
      >
        <path d="M12.031 2c-5.516 0-9.969 4.453-9.969 9.969 0 1.766.469 3.484 1.344 5l-1.406 5.156 5.281-1.375c1.469.797 3.109 1.219 4.75 1.219 5.516 0 9.969-4.453 9.969-9.969S17.547 2 12.031 2zm5.813 14.125c-.25.703-1.438 1.344-2 1.422-.516.078-1.172.109-1.891-.125-.438-.141-1-.328-1.719-.641-3.031-1.313-5-4.375-5.156-4.578-.156-.203-1.234-1.641-1.234-3.125s.781-2.219 1.063-2.531c.281-.313.609-.391.813-.391.203 0 .406 0 .578.016.188.016.438-.078.688.531.25.609.859 2.094.938 2.25.078.156.125.344.031.547-.094.203-.141.328-.297.5-.156.172-.313.391-.453.516-.156.156-.313.328-.141.641.172.313.781 1.297 1.672 2.094 1.156 1.031 2.125 1.359 2.438 1.516.313.156.484.125.672-.078.188-.203.781-.906.984-1.219.203-.313.422-.266.703-.156.281.109 1.797.844 2.109 1s.516.234.594.359c.078.125.078.734-.172 1.438z" />
      </svg>
      <span className="hidden sm:inline text-xs font-semibold tracking-wide whitespace-nowrap">
        WhatsApp Us
      </span>
    </a>
  );
};
