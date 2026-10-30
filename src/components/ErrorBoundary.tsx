import React, { Component, ErrorInfo, ReactNode } from "react";
import { systemLogger } from "../services/systemLogger";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error caught by ErrorBoundary:", error, errorInfo);
    
    // Check if error is a known browser extension / translate DOM mutation issue
    const isDOMError = 
      error?.message?.includes("removeChild") ||
      error?.message?.includes("insertBefore") ||
      error?.message?.includes("NotFoundError") ||
      error?.message?.includes("Kaldırılacak düğüm");

    if (isDOMError) {
      console.warn("DOM Node mutation error detected (likely browser auto-translate or extension). Attempting smooth recovery.");
      // Auto recovery for translation DOM glitches without blocking user
      setTimeout(() => {
        this.setState({ hasError: false, error: null, errorInfo: null });
      }, 500);
      return;
    }

    this.setState({
      error,
      errorInfo
    });

    // Safely log crash to system error logs infrastructure
    try {
      systemLogger.logCrash("ReactErrorBoundary", error, {
        componentStack: errorInfo?.componentStack
      });
    } catch (e) {
      console.warn("Could not log crash via systemLogger:", e);
    }
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  private handleGoToLogin = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = "/giris";
  };

  public render() {
    if (this.state.hasError) {
      const isDOMError = 
        this.state.error?.message?.includes("removeChild") ||
        this.state.error?.message?.includes("insertBefore") ||
        this.state.error?.message?.includes("NotFoundError") ||
        this.state.error?.message?.includes("Kaldırılacak düğüm");

      return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center select-none" translate="no">
          <div className="max-w-md w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center mx-auto text-amber-400 text-2xl font-bold">
              !
            </div>
            
            <h2 className="text-xl font-bold text-white">
              {isDOMError ? "Görünüm Yenileniyor" : "Geçici Bir Durum Oluştu"}
            </h2>
            
            <p className="text-sm text-slate-400 leading-relaxed">
              {isDOMError 
                ? "Tarayıcı otomatik çevirisi sayfa yapısını etkiledi. Otomatik düzeltiliyor..."
                : "Aksama durumunda oturumunuz güvenle saklanır. Giriş yapabilir veya sayfayı yenileyebilirsiniz."}
            </p>

            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={this.handleReset}
                className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-600/20 cursor-pointer text-sm"
              >
                Sayfayı Yenile
              </button>
              <button
                type="button"
                onClick={this.handleGoToLogin}
                className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 font-semibold rounded-xl transition-all border border-slate-700 cursor-pointer text-sm"
              >
                Giriş Sayfasına Git
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

