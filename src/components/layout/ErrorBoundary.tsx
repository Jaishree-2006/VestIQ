import React from 'react';
import { AlertTriangle, RefreshCw, LayoutDashboard } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  /** Optional context label shown in the error UI (e.g. "Dashboard", "Holdings") */
  context?: string;
  /** Optional fallback override — completely replaces the default error UI */
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

/**
 * ErrorBoundary
 *
 * Wraps any React subtree and catches unhandled render/lifecycle exceptions,
 * showing a friendly fallback instead of a blank white screen.
 *
 * Usage:
 *   <ErrorBoundary context="Dashboard">
 *     <DashboardPage />
 *   </ErrorBoundary>
 */
export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    this.setState({ errorInfo: info });
    // Log to console for developer visibility; swap with a real monitoring
    // service (Sentry, Datadog, etc.) in production.
    console.error('[ErrorBoundary] Caught unhandled render error:', error, info);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  private handleGoHome = () => {
    // Reset boundary state and navigate to root (SPA home)
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.history.pushState({}, '', '/');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    if (this.props.fallback) {
      return this.props.fallback;
    }

    const { context, } = this.props;
    const { error } = this.state;
    const isDev = import.meta.env.DEV;

    return (
      <div
        className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center p-6 font-sans text-[#14213D]"
        role="alert"
        aria-live="assertive"
      >
        {/* Icon */}
        <div className="w-16 h-16 rounded-2xl bg-[#FDF2F2] border border-[#FCA5A5] flex items-center justify-center mb-6">
          <AlertTriangle className="w-8 h-8 text-[#EF4444]" />
        </div>

        {/* Heading */}
        <h1 className="text-2xl font-extrabold text-[#14213D] mb-2 text-center">
          Something went wrong
          {context ? ` in ${context}` : ''}
        </h1>

        {/* Sub-message */}
        <p className="text-sm text-[#6B7280] mb-8 max-w-md text-center leading-relaxed">
          An unexpected error occurred and this section couldn't render. Your data is safe — nothing was modified. You can try reloading the page or go back to the dashboard.
        </p>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
          <button
            onClick={this.handleReset}
            className="px-5 py-2.5 bg-[#C57D25] hover:bg-[#B06C19] text-white rounded-xl text-sm font-bold transition-all shadow-xs flex items-center space-x-2 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Try Again</span>
          </button>

          <button
            onClick={this.handleReload}
            className="px-5 py-2.5 bg-white border border-[#EDE9DF] hover:bg-[#F6F4ED] text-[#14213D] rounded-xl text-sm font-bold transition-all flex items-center space-x-2 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Reload Page</span>
          </button>

          <button
            onClick={this.handleGoHome}
            className="px-5 py-2.5 bg-white border border-[#EDE9DF] hover:bg-[#F6F4ED] text-[#14213D] rounded-xl text-sm font-bold transition-all flex items-center space-x-2 cursor-pointer"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Back to Home</span>
          </button>
        </div>

        {/* Dev-mode error details */}
        {isDev && error && (
          <details className="w-full max-w-2xl bg-[#14213D] rounded-2xl p-5 text-left">
            <summary className="text-xs font-bold text-[#C8E6C9] cursor-pointer mb-2 select-none">
              🛠 Developer Details (dev mode only)
            </summary>
            <p className="text-xs font-bold text-[#EF4444] mb-1">{error.name}: {error.message}</p>
            <pre className="text-[10px] text-[#94A3B8] overflow-auto max-h-64 leading-relaxed whitespace-pre-wrap">
              {error.stack}
            </pre>
          </details>
        )}
      </div>
    );
  }
}

/**
 * withErrorBoundary — HOC convenience wrapper
 *
 * Usage:
 *   export default withErrorBoundary(MyPage, 'My Page');
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  context?: string
): React.ComponentType<P> {
  const Wrapped: React.FC<P> = (props) => (
    <ErrorBoundary context={context}>
      <Component {...props} />
    </ErrorBoundary>
  );
  Wrapped.displayName = `WithErrorBoundary(${Component.displayName || Component.name || 'Component'})`;
  return Wrapped;
}
