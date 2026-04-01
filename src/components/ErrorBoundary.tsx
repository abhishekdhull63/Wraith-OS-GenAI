import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary caught error]', error, errorInfo);
    this.setState({
       error,
       errorInfo
    });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-[999999999] bg-red-950 p-8 flex flex-col items-start justify-start overflow-auto">
          <h1 className="text-white text-3xl font-bold bg-red-600 px-4 py-2 border-l-4 border-white mb-6 uppercase tracking-widest shadow-lg">
            CRITICAL RENDER FAILURE
          </h1>
          
          <div className="bg-black/50 border border-red-500/30 p-6 rounded-lg w-full max-w-6xl shadow-2xl">
             <h2 className="text-red-400 font-mono text-xl font-bold mb-2">ERROR MESSAGE:</h2>
             <pre className="text-white font-mono whitespace-pre-wrap bg-black/80 p-4 rounded border border-red-500/20 mb-6">
               {this.state.error?.message || 'Unknown Error'}
             </pre>

             <h2 className="text-red-400 font-mono text-xl font-bold mb-2">STACK TRACE:</h2>
             <pre className="text-gray-300 font-mono text-xs whitespace-pre-wrap bg-black/80 p-4 rounded border border-red-500/20 overflow-x-auto">
               {this.state.error?.stack || 'No stack trace available.'}
             </pre>

             {this.state.errorInfo && (
                <>
                   <h2 className="text-red-400 font-mono text-xl font-bold mt-6 mb-2">COMPONENT STACK:</h2>
                   <pre className="text-amber-300 font-mono text-xs whitespace-pre-wrap bg-black/80 p-4 rounded border border-red-500/20 overflow-x-auto">
                     {this.state.errorInfo.componentStack}
                   </pre>
                </>
             )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
