import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('MmediCompannion ErrorBoundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white p-6">
          <div className="max-w-md text-center space-y-4">
            <div className="text-5xl font-black text-teal-400">MmediCompannion</div>
            <h1 className="text-xl font-bold">Something went wrong</h1>
            <p className="text-slate-400 text-sm">
              An unexpected error occurred. Your data is safe — please reload to continue.
            </p>
            {this.state.error && (
              <p className="text-xs text-slate-600 font-mono break-all">{this.state.error.message}</p>
            )}
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 font-semibold text-sm transition"
            >
              Reload App
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
