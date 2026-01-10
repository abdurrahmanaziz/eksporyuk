'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { CheckCircle, AlertCircle, Printer, Home } from 'lucide-react'
import Link from 'next/link'

interface Certificate {
  id: string
  certificateNumber: string
  studentName: string
  courseName: string
  completedAt: string
  issuedAt: string
  isValid: boolean
  user: {
    name: string
    image: string | null
  }
  course: {
    title: string
    mentor: {
      user: {
        name: string
      }
    }
  }
}

export default function VerifyCertificatePage() {
  const params = useParams()
  const [certificate, setCertificate] = useState<Certificate | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCertificate = async () => {
      try {
        const res = await fetch(`/api/certificates/verify/${params.certificateNumber}`)
        
        if (res.status === 404) {
          setError('Sertifikat tidak ditemukan')
          setLoading(false)
          return
        }
        
        if (res.status === 410) {
          setError('Sertifikat ini tidak lagi valid')
          setLoading(false)
          return
        }

        if (!res.ok) throw new Error('Gagal memverifikasi sertifikat')
        
        const data = await res.json()
        setCertificate(data.certificate)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchCertificate()
  }, [params.certificateNumber])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Memverifikasi sertifikat...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-8 max-w-md text-center">
          <div className="flex justify-center mb-4">
            <AlertCircle className="w-16 h-16 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-red-800 mb-2">Verifikasi Gagal</h2>
          <p className="text-red-600 mb-6">{error}</p>
          <Link
            href="/"
            className="inline-block bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 font-semibold"
          >
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    )
  }

  if (!certificate) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Verification Success Badge */}
        <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6 mb-8 text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-green-800 mb-2">Sertifikat Terverifikasi</h1>
          <p className="text-green-700">Sertifikat ini asli dan valid</p>
        </div>

        {/* Certificate Display */}
        <div className="bg-white rounded-lg shadow-2xl overflow-hidden border-4 border-amber-500 print:border-0">
          {/* Header */}
          <div className="bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 p-12 text-center text-white print:bg-white print:text-gray-900">
            <div className="mb-6 text-5xl">🏆</div>
            <h2 className="text-4xl font-bold mb-4 print:text-gray-900">Sertifikat Penyelesaian</h2>
            <p className="text-amber-100 text-lg print:text-gray-600">Dengan ini kami sertifikasi bahwa</p>
          </div>

          {/* Body */}
          <div className="p-12 text-center print:p-8">
            <h3 className="text-4xl font-bold text-gray-900 mb-8 print:text-3xl">
              {certificate.user.name}
            </h3>
            
            <p className="text-gray-600 text-lg mb-6 print:text-base">
              telah berhasil menyelesaikan kursus
            </p>
            
            <h4 className="text-3xl font-bold text-indigo-600 mb-12 print:text-2xl">
              {certificate.course.title}
            </h4>

            <div className="border-t-2 border-gray-300 pt-8 mb-8 print:border-gray-400">
              <div className="grid grid-cols-2 gap-8 max-w-2xl mx-auto">
                <div>
                  <p className="text-sm text-gray-600 mb-1 print:text-xs">Diselesaikan Pada</p>
                  <p className="font-semibold text-gray-900 print:text-gray-800">
                    {new Date(certificate.completedAt).toLocaleDateString('id-ID', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1 print:text-xs">Dikeluarkan Pada</p>
                  <p className="font-semibold text-gray-900 print:text-gray-800">
                    {new Date(certificate.issuedAt).toLocaleDateString('id-ID', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t-2 border-gray-300 pt-8 print:border-gray-400">
              <div className="max-w-md mx-auto">
                <div>
                  <div className="h-px bg-gray-400 mb-2 print:bg-gray-600" />
                  <p className="font-semibold text-gray-900 print:text-gray-800">
                    {certificate.course.mentor.user.name}
                  </p>
                  <p className="text-sm text-gray-600 print:text-gray-700">Instruktur Kursus</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-12 py-6 border-t print:bg-white print:border-gray-300">
            <div className="flex justify-between items-center text-sm print:text-xs">
              <div>
                <p className="text-gray-600 print:text-gray-700">Nomor Sertifikat</p>
                <p className="font-mono font-semibold text-gray-900 print:text-gray-800">
                  {certificate.certificateNumber}
                </p>
              </div>
              <div className="text-right">
                <p className="text-gray-600 print:text-gray-700">Status</p>
                <p className={`font-semibold ${certificate.isValid ? 'text-green-600' : 'text-red-600'}`}>
                  {certificate.isValid ? '✓ VALID' : '✗ TIDAK VALID'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6 print:hidden">
          <h3 className="font-semibold text-gray-900 mb-4">Detail Verifikasi</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Peserta:</span>
              <span className="font-semibold">{certificate.user.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Kursus:</span>
              <span className="font-semibold">{certificate.course.title}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Instruktur:</span>
              <span className="font-semibold">{certificate.course.mentor.user.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">ID Sertifikat:</span>
              <span className="font-mono font-semibold">{certificate.certificateNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Diverifikasi Pada:</span>
              <span className="font-semibold">
                {new Date().toLocaleDateString('id-ID', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex gap-4 justify-center print:hidden">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 font-semibold transition"
          >
            <Printer className="w-5 h-5" />
            Cetak Sertifikat
          </button>
          <Link
            href="/my-courses"
            className="flex items-center gap-2 border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 font-semibold transition"
          >
            <Home className="w-5 h-5" />
            Kembali ke Kursus
          </Link>
        </div>
      </div>
    </div>
  )
}
