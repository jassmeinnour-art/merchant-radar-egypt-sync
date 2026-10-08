import React, { ErrorInfo, ReactNode } from 'react';
import { RefreshCw, Home, ShieldAlert } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error, errorInfo: null };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  private handleClearStorageAndReset = (): void => {
    try {
      sessionStorage.clear();
    } catch {
      // Ignore
    }
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  public override render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div 
          id="error-boundary-screen" 
          className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-['Cairo',sans-serif] text-slate-800"
          dir="rtl"
        >
          <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-6 md:p-8 text-center">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-inner">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <h2 className="text-xl md:text-2xl font-black text-slate-900 mb-2">
              حدث خطأ غير متوقع في الواجهة
            </h2>

            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
              تم رصد استثناء في عرض الصفحة. تم حفظ بياناتك محلياً بشكل آمن. يمكنك إعادة تحميل التطبيق للمتابعة فوراً.
            </p>

            {this.state.error && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-6 text-left text-xs font-mono text-slate-600 overflow-x-auto max-h-32 text-ltr" dir="ltr">
                {this.state.error.toString()}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                id="btn-error-reload"
                onClick={this.handleReset}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-md transition-all active:scale-98 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>إعادة تشغيل التطبيق</span>
              </button>

              <button
                type="button"
                id="btn-error-clear"
                onClick={this.handleClearStorageAndReset}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-sm transition-all active:scale-98 cursor-pointer"
              >
                <Home className="w-4 h-4" />
                <span>استعادة الجلسة والعودة</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
