import React from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

interface State {
  hasError: boolean;
  errorMessage: string;
}

export class FirebaseErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      errorMessage: error.message || 'An unexpected application error occurred.',
    };
  }

  componentDidCatch(error: Error) {
    console.error('CivicLens ErrorBoundary caught error:', error);
  }

  render() {
    if (this.state.hasError) {
      let parsedSummary = this.state.errorMessage;
      try {
        const parsed = JSON.parse(this.state.errorMessage) as {
          error?: string;
          operationType?: string;
          path?: string;
        };
        if (parsed.error) {
          parsedSummary = `${parsed.operationType?.toUpperCase() || 'OPERATION'} on ${parsed.path || 'unknown path'}: ${parsed.error}`;
        }
      } catch {
        // plain text error
      }

      return (
        <div className="min-h-screen bg-[#0B1020] text-slate-100 flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-[#121A2B] border border-[#FF4D5E]/40 rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-[#FF4D5E]">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h2 className="text-base font-bold font-mono uppercase tracking-wider">
                CivicLens Sync / Permission Error
              </h2>
            </div>
            <p className="text-xs text-slate-300 font-mono bg-[#0B1020] p-3 rounded-xl border border-[#223252] break-words">
              {parsedSummary}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-2.5 rounded-xl bg-[#C6FF5F] text-[#0B1020] font-bold font-mono text-xs uppercase tracking-wider flex items-center justify-center gap-2"
            >
              <RefreshCcw className="w-4 h-4" />
              <span>Reload CivicLens</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
