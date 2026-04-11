import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
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

  private handleRetry = () => {
    this.setState({ hasError: false });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card-agri-dark border-red-500/30 bg-red-900/10 flex flex-col items-center justify-center text-center p-8 min-h-[200px]"
        >
          <div className="w-12 h-12 bg-red-500/20 rounded-2xl flex items-center justify-center mb-4 border border-red-500/20">
            <AlertCircle className="w-6 h-6 text-red-500" />
          </div>
          <h3 className="text-white font-black text-sm uppercase tracking-widest mb-2">Component Error</h3>
          <p className="text-zinc-500 text-[10px] font-bold uppercase mb-6 max-w-[200px]">
            We encountered a problem loading this section.
          </p>
          <button
            onClick={this.handleRetry}
            className="flex items-center gap-2 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-full transition-colors border border-zinc-700 group"
          >
            <RefreshCw className="w-4 h-4 group-active:rotate-180 transition-transform duration-500" />
            <span className="text-[10px] font-black uppercase tracking-widest">Retry</span>
          </button>
        </motion.div>
      );
    }

    return this.props.children;
  }
}
