import { Info } from 'lucide-react';

export function DisclaimerBanner() {
  return (
    <div
      role="contentinfo"
      className="fixed bottom-0 left-0 right-0 z-50 bg-blue-50 border-t border-blue-200 py-3 px-4"
    >
      <div className="max-w-4xl mx-auto flex items-center gap-2 text-sm text-blue-800">
        <Info className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
        <p>
          This tool provides informational guidance only and does not constitute
          medical advice. Always consult with a qualified healthcare provider
          before making decisions about clinical trial participation.
        </p>
      </div>
    </div>
  );
}
