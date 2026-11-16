import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

export default class TravelErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Travel module caught error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '1.25rem',
          background: '#fef2f2',
          border: '1px solid #fca5a5',
          borderRadius: '0.75rem',
          color: '#991b1b',
          margin: '1rem 0',
          fontSize: '0.9rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, marginBottom: '0.4rem' }}>
            <AlertCircle size={18} />
            <span>Smart Travel module encountered a display issue</span>
          </div>
          <p style={{ margin: '0 0 0.75rem 0', color: '#b91c1c', fontSize: '0.85rem' }}>
            {this.state.error?.message || 'A temporary rendering error occurred.'}
          </p>
          <button
            type="button"
            onClick={this.handleReset}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.4rem 0.8rem',
              fontSize: '0.8rem',
              fontWeight: 600,
              color: '#ffffff',
              background: '#dc2626',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: 'pointer'
            }}
          >
            <RotateCcw size={14} /> Retry View
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
