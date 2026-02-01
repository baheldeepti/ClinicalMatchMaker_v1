import { useState, useEffect, useRef } from 'react';
import { X, Shield, Zap, Infinity } from 'lucide-react';
import { initStripe, redirectToCheckout, PRODUCT_TIERS } from '../../lib/stripe';

// ============================================================================
// Props
// ============================================================================

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  remainingFreeMatches: number;
}

// ============================================================================
// Component
// ============================================================================

export function PaymentModal({ isOpen, onClose, remainingFreeMatches }: PaymentModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Focus trap and escape key handling
  useEffect(() => {
    if (!isOpen) return;

    // Store the previously focused element
    previousFocusRef.current = document.activeElement as HTMLElement;

    // Focus the modal
    modalRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }

      // Focus trap
      if (e.key === 'Tab') {
        const focusableElements = modalRef.current?.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusableElements || focusableElements.length === 0) return;

        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      // Return focus to previous element
      previousFocusRef.current?.focus();
    };
  }, [isOpen, onClose]);

  // Handle upgrade click
  const handleUpgrade = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const stripe = await initStripe();
      const priceId = PRODUCT_TIERS.premium.paymentLinkId;

      if (priceId) {
        await redirectToCheckout(stripe, priceId);
      } else {
        throw new Error('Payment not configured');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start checkout');
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      aria-labelledby="payment-modal-title"
      aria-modal="true"
      role="dialog"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          ref={modalRef}
          tabIndex={-1}
          className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6 transform transition-all"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="text-center mb-6">
            <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Zap className="w-6 h-6 text-blue-600" />
            </div>
            <h2 id="payment-modal-title" className="text-xl font-semibold text-gray-900">
              Upgrade Your Search
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              {remainingFreeMatches > 0
                ? `You have ${remainingFreeMatches} free match${remainingFreeMatches !== 1 ? 'es' : ''} remaining`
                : "You've used all your free matches"}
            </p>
          </div>

          {/* Benefits */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-3 text-sm text-gray-700">
              <Infinity className="w-5 h-5 text-green-500 flex-shrink-0" />
              <span>Unlimited trial matches for this session</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-700">
              <Zap className="w-5 h-5 text-green-500 flex-shrink-0" />
              <span>Priority processing</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-700">
              <Shield className="w-5 h-5 text-green-500 flex-shrink-0" />
              <span>Secure payment via Stripe</span>
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-center">
            <p className="text-3xl font-bold text-gray-900">
              ${PRODUCT_TIERS.premium.price}
            </p>
            <p className="text-sm text-gray-500">One-time payment</p>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={handleUpgrade}
              disabled={isLoading}
              className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                'Upgrade Now'
              )}
            </button>

            <button
              onClick={onClose}
              className="w-full py-3 px-4 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Maybe Later
            </button>
          </div>

          {/* Trust badges */}
          <div className="mt-6 flex items-center justify-center gap-4 text-xs text-gray-400">
            <div className="flex items-center gap-1">
              <Shield className="w-4 h-4" />
              <span>Secure Payment</span>
            </div>
            <span>•</span>
            <span>Powered by Stripe</span>
          </div>
        </div>
      </div>
    </div>
  );
}
