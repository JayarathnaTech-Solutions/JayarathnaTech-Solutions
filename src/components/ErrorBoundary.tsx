import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
    children: ReactNode
}

interface State {
    error: Error | null
}

// Without this, any render error anywhere in the tree unmounts the entire
// app and leaves a blank page with nothing but the body background color —
// the only trace is a console error the user has to know to go find.
export class ErrorBoundary extends Component<Props, State> {
    state: State = { error: null }

    static getDerivedStateFromError(error: Error): State {
        return { error }
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        console.error('Uncaught render error:', error, info.componentStack)
    }

    render() {
        if (this.state.error) {
            return (
                <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-950 px-6 text-center text-white">
                    <h1 className="text-2xl font-bold">Something went wrong</h1>
                    <pre className="max-w-xl overflow-auto whitespace-pre-wrap rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-left text-xs text-red-300">
                        {this.state.error.message}
                        {this.state.error.stack ? `\n\n${this.state.error.stack}` : ''}
                    </pre>
                    <button
                        type="button"
                        onClick={() => window.location.reload()}
                        className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-500"
                    >
                        Reload
                    </button>
                </div>
            )
        }

        return this.props.children
    }
}
