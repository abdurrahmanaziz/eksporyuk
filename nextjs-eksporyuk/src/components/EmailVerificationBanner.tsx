'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Mail, Loader2, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

export default function EmailVerificationBanner() {
  const { data: session, status, update } = useSession()
  const [resending, setResending] = useState(false)
  const [justResent, setJustResent] = useState(false)

  if (status === 'loading') return null
  if (!session?.user) return null
  if (session.user.emailVerified) return null

  const handleResend = async () => {
    setResending(true)
    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST'
      })

      const data = await response.json()

      // Handle rate limiting
      if (response.status === 429) {
        toast.error(data.error || 'Terlalu banyak permintaan. Silakan coba lagi nanti.')
        if (data.details) {
          toast.info(data.details)
        }
        return
      }

      if (data.success) {
        toast.success('Email verifikasi telah dikirim!')
        if (data.warning) {
          toast.info(data.warning, { duration: 5000 })
        }
        setJustResent(true)
        setTimeout(() => setJustResent(false), 60000) // Reset after 1 minute
      } else {
        toast.error(data.error || 'Gagal mengirim email')
      }
    } catch (error) {
      console.error('Resend verification error:', error)
      toast.error('Terjadi kesalahan koneksi. Silakan coba lagi.')
    } finally {
      setResending(false)
    }
  }

  return (
    <Alert className="mb-6 border-orange-200 bg-orange-50">
      <Mail className="h-5 w-5 text-orange-600" />
      <AlertTitle className="text-orange-900 font-bold">
        Email Belum Diverifikasi
      </AlertTitle>
      <AlertDescription className="text-orange-800">
        <p className="mb-3">
          Verifikasi email Anda untuk mengakses semua fitur membership. 
          Cek inbox Gmail Anda dan klik link verifikasi.
        </p>
        <div className="flex gap-2">
          <Button
            onClick={handleResend}
            disabled={resending || justResent}
            size="sm"
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            {resending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {justResent && <CheckCircle2 className="mr-2 h-4 w-4" />}
            {justResent ? 'Email Terkirim' : 'Kirim Ulang Email'}
          </Button>
        </div>
        {justResent && (
          <p className="text-xs mt-2 text-orange-700">
            Cek inbox Gmail Anda. Jika tidak ada, cek folder Spam.
          </p>
        )}
      </AlertDescription>
    </Alert>
  )
}
