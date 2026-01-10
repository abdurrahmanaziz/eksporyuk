'use client'

import { useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Global error:', error)
  }, [error])

  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-red-50">
          <div className="max-w-md w-full text-center p-6">
            <div className="bg-white rounded-lg shadow-lg p-8 border border-red-200">
              <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Sistem Error
              </h1>
              <p className="text-gray-600 mb-6">
                Aplikasi mengalami kesalahan sistem yang serius. Silakan muat ulang halaman.
              </p>
              
              <button
                onClick={reset}
                className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Muat Ulang Aplikasi
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}