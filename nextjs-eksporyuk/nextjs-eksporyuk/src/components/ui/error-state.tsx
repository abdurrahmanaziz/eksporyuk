'use client'

import { AlertCircle, CheckCircle, RefreshCw, Home, Info, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export type ErrorType = 'validation' | 'network' | 'server' | 'not-found' | 'permission' | 'general'

export interface ErrorStateProps {
  type?: ErrorType
  title?: string
  message?: string
  details?: string[]
  showRetry?: boolean
  showHome?: boolean
  onRetry?: () => void
  onHome?: () => void
  className?: string
}

const errorConfig: Record<ErrorType, { 
  icon: React.ReactNode
  color: string
  defaultTitle: string
  defaultMessage: string
}> = {
  validation: {
    icon: <Info className="h-6 w-6" />,
    color: 'text-blue-600 bg-blue-100 border-blue-200',
    defaultTitle: 'Data Tidak Valid',
    defaultMessage: 'Mohon periksa kembali data yang Anda masukkan'
  },
  network: {
    icon: <AlertTriangle className="h-6 w-6" />,
    color: 'text-orange-600 bg-orange-100 border-orange-200',
    defaultTitle: 'Koneksi Bermasalah',
    defaultMessage: 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.'
  },
  server: {
    icon: <AlertCircle className="h-6 w-6" />,
    color: 'text-red-600 bg-red-100 border-red-200',
    defaultTitle: 'Error Server',
    defaultMessage: 'Server sedang mengalami masalah. Silakan coba lagi nanti.'
  },
  'not-found': {
    icon: <AlertTriangle className="h-6 w-6" />,
    color: 'text-gray-600 bg-gray-100 border-gray-200',
    defaultTitle: 'Tidak Ditemukan',
    defaultMessage: 'Halaman atau data yang Anda cari tidak ditemukan'
  },
  permission: {
    icon: <AlertCircle className="h-6 w-6" />,
    color: 'text-purple-600 bg-purple-100 border-purple-200',
    defaultTitle: 'Akses Ditolak',
    defaultMessage: 'Anda tidak memiliki izin untuk mengakses fitur ini'
  },
  general: {
    icon: <AlertCircle className="h-6 w-6" />,
    color: 'text-red-600 bg-red-100 border-red-200',
    defaultTitle: 'Terjadi Kesalahan',
    defaultMessage: 'Terjadi kesalahan yang tidak terduga'
  }
}

export function ErrorState({
  type = 'general',
  title,
  message,
  details = [],
  showRetry = true,
  showHome = false,
  onRetry,
  onHome,
  className = ''
}: ErrorStateProps) {
  const config = errorConfig[type]
  const finalTitle = title || config.defaultTitle
  const finalMessage = message || config.defaultMessage

  return (
    <div className={`flex items-center justify-center p-4 ${className}`}>
      <Card className={`w-full max-w-md border ${config.color.split(' ')[2]}`}>
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-2 rounded-full ${config.color}`}>
              {config.icon}
            </div>
            <div>
              <CardTitle className="text-lg">{finalTitle}</CardTitle>
              <CardDescription>{finalMessage}</CardDescription>
            </div>
          </div>
        </CardHeader>
        
        {details.length > 0 && (
          <CardContent className="pt-0">
            <div className={`border rounded p-3 ${config.color.split(' ')[2]} ${config.color.split(' ')[1]}`}>
              <h4 className="font-medium mb-2">Detail Error:</h4>
              <ul className="space-y-1 text-sm">
                {details.map((detail, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-xs mt-1">•</span>
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        )}

        {(showRetry || showHome) && (
          <CardContent className={details.length > 0 ? "pt-0" : ""}>
            <div className="flex gap-2">
              {showRetry && onRetry && (
                <Button onClick={onRetry} size="sm" className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Coba Lagi
                </Button>
              )}
              {showHome && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={onHome || (() => window.location.href = '/dashboard')}
                  className="flex items-center gap-2"
                >
                  <Home className="h-4 w-4" />
                  Dashboard
                </Button>
              )}
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  )
}

// Success State Component
export interface SuccessStateProps {
  title?: string
  message?: string
  details?: string[]
  actionLabel?: string
  onAction?: () => void
  className?: string
}

export function SuccessState({
  title = "Berhasil!",
  message = "Operasi berhasil dilakukan",
  details = [],
  actionLabel,
  onAction,
  className = ''
}: SuccessStateProps) {
  return (
    <div className={`flex items-center justify-center p-4 ${className}`}>
      <Card className="w-full max-w-md border-green-200">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-100 rounded-full">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <CardTitle className="text-lg text-green-900">{title}</CardTitle>
              <CardDescription>{message}</CardDescription>
            </div>
          </div>
        </CardHeader>
        
        {details.length > 0 && (
          <CardContent className="pt-0">
            <div className="bg-green-50 border border-green-200 rounded p-3">
              <ul className="space-y-1 text-sm text-green-700">
                {details.map((detail, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-xs mt-1">✓</span>
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        )}

        {actionLabel && onAction && (
          <CardContent className={details.length > 0 ? "pt-0" : ""}>
            <Button onClick={onAction} className="w-full">
              {actionLabel}
            </Button>
          </CardContent>
        )}
      </Card>
    </div>
  )
}

// Validation Error Component
export interface ValidationErrorProps {
  errors: Record<string, string[]>
  title?: string
  className?: string
}

export function ValidationErrors({
  errors,
  title = "Form Validation Error",
  className = ''
}: ValidationErrorProps) {
  const errorEntries = Object.entries(errors).filter(([_, messages]) => messages.length > 0)
  
  if (errorEntries.length === 0) return null

  return (
    <div className={className}>
      <Card className="border-red-200 bg-red-50">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <CardTitle className="text-base text-red-900">{title}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            {errorEntries.map(([field, messages]) => (
              <div key={field}>
                <Badge variant="destructive" className="text-xs mb-1 capitalize">
                  {field}
                </Badge>
                <ul className="list-disc list-inside text-sm text-red-700 ml-2">
                  {messages.map((message, index) => (
                    <li key={index}>{message}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}