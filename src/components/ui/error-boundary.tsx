'use client';

import { Component, type ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
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

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex flex-col items-center justify-center min-h-[300px] p-6 text-center" role="alert">
          <AlertTriangle className="h-12 w-12 text-mly-500 mb-4" aria-hidden="true" />
          <h2 className="text-lg font-bold text-harbor-800 dark:text-white mb-2">
            Something went wrong
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 max-w-md">
            {this.state.error?.message || 'An unexpected error occurred. Please try again.'}
          </p>
          <Button
            variant="outline"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            <RotateCcw className="h-4 w-4 mr-2" aria-hidden="true" />
            Try again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
