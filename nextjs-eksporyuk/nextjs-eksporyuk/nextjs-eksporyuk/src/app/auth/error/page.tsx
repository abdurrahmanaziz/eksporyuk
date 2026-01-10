'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'
import { Suspense } from 'react'

const errorMessages: Record<string, string> = {
  Configuration: 'Ada masalah konfigurasi server. Hubungi administrator.',
  AccessDenied: 'Akses ditolak. Anda tidak memiliki izin untuk mengakses halaman ini.',
  Verification: 'Token verifikasi tidak valid atau sudah kadaluarsa.',
  OAuthSignin: 'Gagal memulai proses login dengan provider OAuth.',
  OAuthCallback: 'Gagal memproses callback dari provider OAuth.',
  OAuthCreateAccount: 'Gagal membuat akun OAuth.',
  EmailCreateAccount: 'Gagal membuat akun dengan email.',
  Callback: 'Gagal memproses callback autentikasi.',
  OAuthAccountNotLinked: 'Email sudah terdaftar dengan metode login yang berbeda.',
  EmailSignin: 'Gagal mengirim email verifikasi.',
  CredentialsSignin: 'Email atau password salah. Silakan coba lagi.',
  SessionRequired: 'Anda harus login untuk mengakses halaman ini.',
  Default: 'Terjadi kesalahan saat login. Silakan coba lagi.',
}

function ErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error') || 'Default'
  
  const errorMessage = errorMessages[error] || errorMessages.Default

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-lg p-8 border border-gray-200">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Gagal Login
            </h1>
            
            <p className="text-gray-600 mb-6">
              {errorMessage}
            </p>

            {error === 'CredentialsSignin' && (
              <div className="w-full mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-left">
                <p className="text-sm text-blue-800 font-medium mb-2">Tips:</p>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Pastikan email Anda sudah terdaftar</li>
                  <li>• Cek kembali password Anda</li>
                  <li>• Password bersifat case-sensitive</li>
                </ul>
              </div>
            )}

            <div className="flex flex-col gap-3 w-full">
              <Link
                href="/auth/login"
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-center"
              >
                Coba Login Lagi
              </Link>
              
              <Link
                href="/"
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium text-center"
              >
                Kembali ke Beranda
              </Link>
            </div>

            {(error === 'CredentialsSignin' || error === 'AccessDenied' || error === 'OAuthCreateAccount') && (
              <p className="mt-6 text-sm text-gray-600">
                Belum punya akun?{' '}
                <Link href="/auth/register" className="text-blue-600 hover:underline font-medium">
                  Daftar Sekarang
                </Link>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    }>
      <ErrorContent />
    </Suspense>
  )
}
