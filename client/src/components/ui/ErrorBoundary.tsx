'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from './EliteComponents';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
          <div className="max-w-md w-full text-center space-y-6">
            <div className="w-20 h-20 bg-rose-50 dark:bg-rose-500/10 rounded-3xl flex items-center justify-center mx-auto text-rose-600">
              <AlertTriangle className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Something went wrong</h1>
              <p className="text-slate-500 dark:text-slate-400 font-medium">
                The application encountered an unexpected error. Please try refreshing the page or contact support if the problem persists.
              </p>
            </div>
            <Button 
              className="w-full" 
              onClick={() => window.location.reload()}
            >
              Refresh Application
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
