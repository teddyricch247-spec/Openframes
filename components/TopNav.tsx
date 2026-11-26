'use client';

import { useState } from 'react';
import { Menu, X } from 'lucide-react';

interface TopNavProps {
  salePrice: number;
  onOpenCheckout: () => void;
}

const NAV_LINKS = [
  { href: '#examples', label: 'Examples' },
  { href: '#inside', label: 'Playbook' },
  { href: '#faq', label: 'FAQ' },
];

export default function TopNav({ salePrice, onOpenCheckout }: TopNavProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-emerald-950/8 bg-white/98">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-8 px-4 sm:px-6 lg:px-8">
        {/* Zone 1: Single-element Brand Wordmark */}
        <a
          href="#"
          className="font-display text-xl font-bold tracking-tight text-slate-950 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded"
        >
          OpenFrame
        </a>

        {/* Zone 2: Clean single-line text navigation links */}
        <nav
          aria-label="Primary navigation"
          className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600"
        >
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="whitespace-nowrap shrink-0 transition-colors duration-150 hover:text-blue-600 hover:underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onOpenCheckout}
            className="hidden sm:inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors duration-150 hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 whitespace-nowrap shrink-0 cursor-pointer"
          >
            Get Guide — ${salePrice}
          </button>

          <button
            type="button"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((prev) => !prev)}
            className="inline-flex md:hidden h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-700 transition-colors hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 cursor-pointer"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-4">
          <nav aria-label="Mobile navigation" className="flex flex-col gap-3">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="py-2 text-base font-medium text-slate-700 hover:text-blue-600"
              >
                {link.label}
              </a>
            ))}
            <button
              type="button"
              onClick={() => {
                setMobileOpen(false);
                onOpenCheckout();
              }}
              className="mt-2 w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 cursor-pointer"
            >
              Get Guide — ${salePrice}
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}
