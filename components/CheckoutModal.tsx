'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, Lock, X } from 'lucide-react';
import { validateCheckoutForm, type PricingSummary } from '@/lib/pricing';

interface CheckoutModalProps {
  isOpen: boolean;
  pricing: PricingSummary;
  onClose: () => void;
  onPurchaseComplete?: (amountUsd: number) => void;
}

export default function CheckoutModal({
  isOpen,
  pricing,
  onClose,
  onPurchaseComplete,
}: CheckoutModalProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<{ fullName?: string; email?: string }>({});
  const [submittedOrder, setSubmittedOrder] = useState<{
    orderCode: string;
    buyerName: string;
    buyerEmail: string;
    totalPaid: number;
  } | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateCheckoutForm({ fullName, email });
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }
    setErrors({});
    setSubmittedOrder({
      orderCode: 'OF-BF2026-17',
      buyerName: fullName.trim(),
      buyerEmail: email.trim(),
      totalPaid: pricing.effectivePrice,
    });
    onPurchaseComplete?.(pricing.effectivePrice);
  };

  const handleResetAndClose = () => {
    setSubmittedOrder(null);
    setFullName('');
    setEmail('');
    setErrors({});
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="checkout-modal-title"
      onClick={handleResetAndClose}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <p className="text-xs font-medium text-emerald-700">
              {pricing.isSaleActive
                ? 'Black Friday Offer · Ends Nov 27, 2026'
                : 'Standard Edition'}
            </p>
            <h3
              id="checkout-modal-title"
              className="font-display text-lg font-bold text-slate-950"
            >
              {submittedOrder ? 'Instant Access Unlocked' : 'Complete Your Guide Access'}
            </h3>
          </div>
          <button
            type="button"
            onClick={handleResetAndClose}
            aria-label="Close checkout dialog"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {submittedOrder ? (
          <div className="space-y-5 p-6">
            <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-emerald-700" />
              <div>
                <p className="font-display font-bold text-slate-950">
                  Welcome aboard, {submittedOrder.buyerName}
                </p>
                <p className="mt-1 text-sm text-slate-700">
                  Your guide link, 20-minute workflow recording, and open-source starter repo were
                  prepared for <span className="font-medium">{submittedOrder.buyerEmail}</span>.
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
              <div className="flex justify-between py-1 text-slate-600">
                <span>Order Reference</span>
                <span className="font-mono font-semibold text-slate-900 tabular-nums">
                  {submittedOrder.orderCode}
                </span>
              </div>
              <div className="flex justify-between py-1 text-slate-600">
                <span>Total Charged</span>
                <span className="font-mono font-bold text-emerald-700 tabular-nums">
                  ${submittedOrder.totalPaid}.00 USD
                </span>
              </div>
              <div className="mt-3 border-t border-slate-200 pt-3 text-xs text-slate-600">
                Included: 6 Modules · OpenCode + Free LLM Setup · 12 Prompt Blueprints · 4-Min Edit
                Checklist
              </div>
            </div>

            <button
              type="button"
              onClick={handleResetAndClose}
              className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 cursor-pointer"
            >
              Return to Landing Page
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="space-y-5 p-6">
            {/* Order Summary */}
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
              <div className="flex items-center justify-between text-sm text-slate-700">
                <span>OpenFrame 20-Min Animation Guide</span>
                <span className="font-mono tabular-nums text-slate-500 line-through">
                  ${pricing.regularPrice}.00
                </span>
              </div>
              {pricing.isSaleActive && (
                <div className="mt-1.5 flex items-center justify-between text-sm text-emerald-800">
                  <span>Black Friday Sale Discount ({pricing.discountPercent}% off)</span>
                  <span className="font-mono font-medium tabular-nums">
                    -${pricing.savingsAmount}.00
                  </span>
                </div>
              )}
              <div className="mt-3 flex items-center justify-between border-t border-emerald-200/80 pt-3">
                <span className="font-semibold text-slate-950">Total Due Today</span>
                <span className="font-mono text-2xl font-bold text-blue-700 tabular-nums">
                  ${pricing.effectivePrice}.00
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="checkout-full-name"
                  className="block text-sm font-medium text-slate-800"
                >
                  Full Name
                </label>
                <input
                  id="checkout-full-name"
                  type="text"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: undefined }));
                  }}
                  placeholder="Jordan Taylor"
                  className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-950 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                />
                {errors.fullName && (
                  <p role="alert" className="mt-1.5 text-xs font-medium text-red-600">
                    {errors.fullName}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="checkout-email"
                  className="block text-sm font-medium text-slate-800"
                >
                  Email Address for Instant Access
                </label>
                <input
                  id="checkout-email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                  }}
                  placeholder="jordan@studio.com"
                  className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-950 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                />
                {errors.email && (
                  <p role="alert" className="mt-1.5 text-xs font-medium text-red-600">
                    {errors.email}
                  </p>
                )}
              </div>
            </div>

            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 cursor-pointer"
            >
              <Lock className="h-4 w-4" />
              Unlock Guide Now — ${pricing.effectivePrice}
            </button>

            <p className="text-center text-xs text-slate-500">
              One-time payment · Lifetime updates · Zero recurring AI subscriptions required
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
