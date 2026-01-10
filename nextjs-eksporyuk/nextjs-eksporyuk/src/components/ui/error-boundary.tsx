'use client'

import { Component, ErrorInfo, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    this.setState({
      error,
      errorInfo
    })
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  private handleGoHome = () => {
    window.location.href = '/dashboard'
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-red-100 rounded-full">
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
                <div>
                  <CardTitle className="text-xl text-red-900">
                    Terjadi Kesalahan
                  </CardTitle>
                  <CardDescription>
                    Halaman ini mengalami error yang tidak terduga
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {this.state.error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-medium text-red-900 mb-2">Error Details:</h4>
                  <p className="text-sm text-red-700 font-mono">
                    {this.state.error.message}
                  </p>
                  {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                    <details className="mt-3">
                      <summary className="cursor-pointer text-sm text-red-600 hover:text-red-700">
                        Stack Trace (Development)
                      </summary>
                      <pre className="mt-2 text-xs text-red-600 overflow-auto bg-red-25 p-2 rounded border">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </div>
              )}
              
              <div className="flex flex-col sm:flex-row gap-3">
                <Button onClick={this.handleReset} className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Coba Lagi
                </Button>
                <Button variant="outline" onClick={this.handleGoHome} className="flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  Kembali ke Dashboard
                </Button>
              </div>

              <div className="text-sm text-gray-600">
                <p>Jika masalah berlanjut, silakan:</p>
                <ul className="list-disc ml-5 mt-2 space-y-1">
                  <li>Refresh halaman (Ctrl+R atau Cmd+R)</li>
                  <li>Bersihkan cache browser</li>
                  <li>Hubungi admin jika error terus terjadi</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary

// Simplified Error Fallback Component
export function ErrorFallback({ 
  error, 
  resetErrorBoundary,
  title = "Terjadi Kesalahan",
  description = "Halaman ini mengalami masalah"
}: {
  error: Error
  resetErrorBoundary: () => void
  title?: string
  description?: string
}) {
  return (
    <div className="flex items-center justify-center min-h-[400px] p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="h-6 w-6 text-red-600" />
            <CardTitle className="text-lg">{title}</CardTitle>
          </div>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
            <p className="text-sm text-red-700 font-mono">{error.message}</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={resetErrorBoundary} size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Coba Lagi
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.location.href = '/dashboard'}>
              Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}