// RESKIN ONLY — Logic untouched. UI layer updated per Agri-Tech spec.
import { Component, ErrorInfo, ReactNode } from 'react';
import { XCircle, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

/* INJECT LOGIC HERE — DO NOT REMOVE */
export class ErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false });
  };
  /* END LOGIC */

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card-agri-dark border-agri-terra/30 bg-agri-terra/5 flex flex-col items-center justify-center text-center p-8 min-h-[200px]"
          role="alert"
        >
          <div className="w-12 h-12 bg-agri-terra/10 rounded-2xl flex items-center justify-center mb-4 border border-agri-terra/20">
            <XCircle className="w-6 h-6 text-agri-terra" />
          </div>
          <h3 className="text-agri-soil-deep font-semibold text-base mb-1">Something went wrong</h3>
          <p className="text-agri-soil/60 text-sm mb-6 max-w-[200px]">
            We encountered a problem loading this section.
          </p>
          <button
            onClick={this.handleRetry}
            className="flex items-center gap-2 px-6 py-3 min-h-[44px] bg-agri-cream hover:bg-agri-soil/10 text-agri-soil-deep rounded-2xl transition-colors border border-agri-soil/20 focus:outline-none focus:ring-2 focus:ring-agri-green focus:ring-offset-2 group"
          >
            <RefreshCw className="w-4 h-4 group-active:rotate-180 transition-transform duration-500" />
            <span className="text-sm font-medium">Try Again</span>
          </button>
        </motion.div>
      );
    }

    return this.props.children;
  }
}

/*
 * Changes Made:
 * - Dark zinc → agri-terra/5 tinted surface
 * - AlertCircle → XCircle (error icon)
 * - Text: agri-soil-deep / agri-soil/60
 * - Retry button: agri-cream bg, min-h-[44px], focus ring
 * - role="alert" for screen readers
 */
