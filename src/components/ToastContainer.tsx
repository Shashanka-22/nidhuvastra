import React from 'react';
import { CheckCircle2, Info, AlertCircle } from 'lucide-react';
import { useStore } from '../context/StoreContext';

export const ToastContainer: React.FC = () => {
  const { toasts } = useStore();

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm pointer-events-none"
      aria-live="polite"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-center gap-2.5 px-4 py-3 text-xs sm:text-sm font-medium shadow-lg border ${
            t.tone === 'error'
              ? 'bg-[#641E32] text-[#FAF7F2] border-[#4B1424]'
              : t.tone === 'success'
                ? 'bg-[#242020] text-[#FAF7F2] border-[#C5A46D]/40'
                : 'bg-white text-[#242020] border-[#242020]/15'
          }`}
        >
          {t.tone === 'success' ? (
            <CheckCircle2 className="h-4 w-4 text-[#C5A46D] shrink-0" />
          ) : t.tone === 'error' ? (
            <AlertCircle className="h-4 w-4 text-[#E8C9C9] shrink-0" />
          ) : (
            <Info className="h-4 w-4 text-[#641E32] shrink-0" />
          )}
          <span>{t.text}</span>
        </div>
      ))}
    </div>
  );
};
