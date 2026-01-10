'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'
import { ArrowLeft, CheckCircle, Clock } from 'lucide-react'

function DataDeletionContent() {
  const searchParams = useSearchParams()
  const confirmationCode = searchParams.get('code')

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          
          {/* Icon */}
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Permintaan Penghapusan Data
          </h1>

          {/* Description */}
          <p className="text-gray-600 mb-6">
            Permintaan penghapusan data Facebook Anda telah diterima dan sedang diproses.
          </p>

          {/* Confirmation Code */}
          {confirmationCode && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-500 mb-2">Kode Konfirmasi:</p>
              <p className="font-mono text-sm text-gray-900 break-all">
                {confirmationCode}
              </p>
            </div>
          )}

          {/* Status */}
          <div className="flex items-center justify-center gap-2 text-amber-600 mb-6">
            <Clock className="w-5 h-5" />
            <span className="text-sm font-medium">Status: Sedang Diproses</span>
          </div>

          {/* Info */}
          <div className="text-left bg-blue-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-900 mb-2">Informasi:</h3>
            <ul className="text-sm text-blue-800 space-y-2">
              <li>• Data Facebook Anda yang terhubung dengan akun Ekspor Yuk akan dihapus</li>
              <li>• Proses penghapusan membutuhkan waktu hingga 30 hari</li>
              <li>• Anda akan menerima konfirmasi via email setelah selesai</li>
              <li>• Simpan kode konfirmasi di atas untuk referensi</li>
            </ul>
          </div>

          {/* Contact */}
          <p className="text-sm text-gray-500 mb-6">
            Pertanyaan? Hubungi{' '}
            <a href="mailto:support@eksporyuk.com" className="text-orange-600 hover:underline">
              support@eksporyuk.com
            </a>
          </p>

          {/* Back Link */}
          <Link 
            href="/"
            className="inline-flex items-center text-orange-600 hover:text-orange-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali ke Beranda
          </Link>

        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 mt-6">
          © 2025 Ekspor Yuk. All rights reserved.
        </p>
      </div>
    </div>
  )
}

export default function DataDeletionStatusPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    }>
      <DataDeletionContent />
    </Suspense>
  )
}
