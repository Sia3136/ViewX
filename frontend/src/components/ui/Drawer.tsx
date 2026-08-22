"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect } from "react";

export function Drawer({
  open,
  onClose,
  title,
  subtitle,
  children,
  widthClass = "w-[92vw] sm:w-[440px]",
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  widthClass?: string;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 bg-black/35 backdrop-blur-[2px]"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.38, ease: [0.4, 0, 0.2, 1] }}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className={`fixed right-0 top-0 z-50 h-full ${widthClass} glass-surface border-l shadow-2xl overflow-y-auto`}
          >
            <div className="sticky top-0 z-10 flex items-start justify-between p-6 pb-4 glass-surface border-b">
              <div>
                {title && <h2 className="text-xl font-semibold">{title}</h2>}
                {subtitle && <p className="text-sm text-[var(--text-2)] mt-1">{subtitle}</p>}
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                className="rounded-full p-1.5 hover:bg-[var(--surface-2)] transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-6 pt-4">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
