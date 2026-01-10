'use client'

import React, { ReactNode, useState } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: (error: Error, reset: () => void) => ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

// Error Boundary as a simple wrapper that logs errors
// For production error boundaries, consider using React's Error Boundary or a service like Sentry
export default function ErrorBoundary({ children, fallback, onError }: ErrorBoundaryProps) {
  const [error, setError] = useState<Error | null>(null)

  if (error) {
    const reset = () => setError(null)
    return (
      fallback?.(error, reset) || (
        <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
          <div className="bg-white rounded-2xl border border-red-200 p-8 max-w-md shadow-md">
            <div className="flex items-center justify-center mb-4">
              <AlertTriangle className="w-12 h-12 text-red-500" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 text-center mb-2">
              Terjadi Kesalahan
            </h2>
            <p className="text-sm text-gray-600 text-center mb-4">
              Maaf, halaman mengalami masalah. Silahkan coba lagi atau hubungi tim support.
            </p>
            {process.env.NODE_ENV === 'development' && (
              <details className="mt-4 p-3 bg-gray-100 rounded-lg text-xs text-gray-700 overflow-auto max-h-40">
                <summary className="cursor-pointer font-semibold mb-2">
                  Detail Error (Development Only)
                </summary>
                <pre className="whitespace-pre-wrap break-words">
                  {error?.toString()}
                </pre>
              </details>
            )}
            <Button
              onClick={reset}
              className="w-full mt-4 bg-blue-600 hover:bg-blue-700"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Coba Lagi
            </Button>
          </div>
        </div>
      )
    )
  }

  return <ErrorBoundaryInternal error={error} setError={setError} onError={onError}>{children}</ErrorBoundaryInternal>
}

interface ErrorBoundaryInternalProps {
  children: ReactNode
  error: Error | null
  setError: (error: Error | null) => void
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

class ErrorBoundaryInternal extends React.Component<ErrorBoundaryInternalProps> {
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by ErrorBoundary:', error, errorInfo)
    this.props.setError(error)
    this.props.onError?.(error, errorInfo)
  }

  render() {
    return this.props.children
  }
}
