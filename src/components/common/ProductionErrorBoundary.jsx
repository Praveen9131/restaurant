import React from 'react';

class ProductionErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Generate unique error ID
    const errorId = `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.setState({
      error: error,
      errorInfo: errorInfo,
      errorId: errorId
    });

    // Log error for monitoring (only in production)
    if (import.meta.env.PROD) {
      this.logErrorToService(error, errorInfo, errorId);
    } else {
      // In development, log to console
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
  }

  logErrorToService = (error, errorInfo, errorId) => {
    // In a real production app, you would send this to an error monitoring service
    // like Sentry, LogRocket, or Bugsnag
    const errorData = {
      errorId,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: localStorage.getItem('userId') || 'anonymous'
    };

    // For now, we'll just log it (in production, send to monitoring service)
    console.error('Production Error:', errorData);
    
    // Example: Send to monitoring service
    // fetch('/api/errors', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(errorData)
    // }).catch(console.error);
  };

  handleRetry = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: null 
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const isProduction = import.meta.env.PROD;
      
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
            {/* Error Icon */}
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
              <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>

            {/* Error Message */}
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              {isProduction ? 'Something went wrong' : 'Error Boundary Caught'}
            </h1>
            
            <p className="text-gray-600 mb-6">
              {isProduction 
                ? 'We apologize for the inconvenience. Our team has been notified and is working to fix this issue.'
                : 'An error occurred in the application. Check the console for details.'
              }
            </p>

            {/* Error ID for support */}
            {isProduction && this.state.errorId && (
              <div className="bg-gray-100 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-600 mb-2">Error ID:</p>
                <p className="font-mono text-sm text-gray-800 break-all">
                  {this.state.errorId}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Please include this ID when contacting support
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={this.handleRetry}
                className="w-full bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors font-medium"
              >
                Try Again
              </button>
              
              <button
                onClick={this.handleReload}
                className="w-full bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors font-medium"
              >
                Reload Page
              </button>
            </div>

            {/* Development Error Details */}
            {!isProduction && this.state.error && (
              <details className="mt-8 text-left">
                <summary className="cursor-pointer text-sm font-medium text-gray-700 mb-2">
                  Error Details (Development)
                </summary>
                <div className="bg-gray-100 rounded-lg p-4 text-xs font-mono text-gray-800 overflow-auto max-h-64">
                  <div className="mb-4">
                    <strong>Error:</strong>
                    <pre className="whitespace-pre-wrap break-all mt-1">
                      {this.state.error.toString()}
                    </pre>
                  </div>
                  <div>
                    <strong>Component Stack:</strong>
                    <pre className="whitespace-pre-wrap break-all mt-1">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </div>
                </div>
              </details>
            )}

            {/* Support Information */}
            {isProduction && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-500 mb-2">Need help?</p>
                <div className="flex justify-center space-x-4 text-sm">
                  <a 
                    href="mailto:admin@seasidelbs.com" 
                    className="text-orange-600 hover:text-orange-700"
                  >
                    Contact Support
                  </a>
                  <a 
                    href="tel:+919994592607" 
                    className="text-orange-600 hover:text-orange-700"
                  >
                    Call Us
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ProductionErrorBoundary;
