import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
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
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[Dawosti ErrorBoundary] Caught render exception:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    if (window.location.hostname.endsWith('dawosti.com') && !window.location.hostname.startsWith('dawosti.com')) {
      window.location.href = 'https://dawosti.com';
    } else {
      window.location.href = '/';
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#FAF2E9',
            color: '#2B1810',
            padding: 20,
            fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
          }}
        >
          <div
            style={{
              maxWidth: 520,
              width: '100%',
              backgroundColor: '#FFFFFF',
              borderRadius: 16,
              border: '1.5px solid #EADCCE',
              padding: '32px 28px',
              boxShadow: '0 10px 30px rgba(43, 24, 16, 0.08)',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 16,
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                backgroundColor: '#FFF0F0',
                border: '1.5px solid #F5C2C7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AlertCircle size={28} color="#B02A37" />
            </div>

            <div>
              <h2 style={{ margin: '0 0 6px 0', fontSize: 20, fontWeight: 800, color: '#561F1F' }}>
                {this.props.fallbackTitle || 'Display Recovery Activated'}
              </h2>
              <p style={{ margin: 0, fontSize: 13.5, color: '#6B564C', lineHeight: 1.5 }}>
                An unexpected view state occurred. Our autonomous recovery system has caught this to protect your account data.
              </p>
            </div>

            {this.state.error && (
              <div
                style={{
                  width: '100%',
                  background: '#F8F4EE',
                  border: '1px solid #EADCCE',
                  borderRadius: 8,
                  padding: '10px 14px',
                  fontSize: 12,
                  fontFamily: 'monospace',
                  color: '#8B3A3A',
                  textAlign: 'left',
                  maxHeight: 120,
                  overflowY: 'auto',
                  wordBreak: 'break-word',
                }}
              >
                {this.state.error.message || String(this.state.error)}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, width: '100%', marginTop: 8 }}>
              <button
                onClick={this.handleReload}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '10px 18px',
                  borderRadius: 8,
                  backgroundColor: '#1B7F5E',
                  color: '#FFF',
                  border: 'none',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                <RefreshCw size={15} />
                <span>Reload Page</span>
              </button>

              <button
                onClick={this.handleGoHome}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '10px 18px',
                  borderRadius: 8,
                  backgroundColor: '#FAF2E9',
                  color: '#2B1810',
                  border: '1px solid #EADCCE',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                <Home size={15} />
                <span>Return to Shop</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
