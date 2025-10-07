import React from 'react';
import { createLogger } from '../lib/logger';

const logger = createLogger('ErrorBoundary');

/**
 * Error boundary component to catch and log errors that occur in the component tree
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render shows fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to our logging service
    logger.error('React component error', { 
      error: error.toString(), 
      componentStack: errorInfo.componentStack,
      location: window.location.href
    });
  }

  render() {
    const { fallback } = this.props;
    
    if (this.state.hasError) {
      // You can render any custom fallback UI
      if (fallback) {
        return fallback(this.state.error);
      }
      
      return (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-800">
          <h2 className="text-lg font-semibold mb-2">Something went wrong</h2>
          <p className="mb-4">An error occurred while rendering this component. The error has been logged.</p>
          {process.env.NODE_ENV !== 'production' && (
            <details className="mt-2">
              <summary className="cursor-pointer font-medium">Error details</summary>
              <pre className="mt-2 p-2 bg-red-100 rounded overflow-auto text-sm">
                {this.state.error?.toString()}
              </pre>
            </details>
          )}
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-100 hover:bg-red-200 rounded-md transition-colors"
          >
            Reload page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;