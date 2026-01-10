'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'
import { Mail, Loader2, CheckCircle2, RefreshCw, AlertCircle, ShieldCheck, LogOut } from 'lucide-react'

interface EmailVerificationModalProps {
  onComplete?: () => void
}

export default function EmailVerificationModal({ onComplete }: EmailVerificationModalProps) {
  const { data: session, status, update } = useSession()
  const [isOpen, setIsOpen] = useState(false)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [checking, setChecking] = useState(false)
  const [currentEmail, setCurrentEmail] = useState<string>('')
  const [emailMismatch, setEmailMismatch] = useState(false)

  // Check if email is Gmail (no verification needed for Gmail users)
  const isGmailUser = session?.user?.email?.endsWith('@gmail.com') || false

  useEffect(() => {
    // Hanya tampilkan jika user sudah login, bukan admin, email belum verified, dan BUKAN Gmail user
    if (status === 'authenticated' && session?.user) {
      const isAdmin = session.user.role === 'ADMIN' || session.user.role === 'SUPER_ADMIN'
      
      if (!isAdmin && !session.user.emailVerified && !isGmailUser) {
        // Fetch current email from database
        fetchCurrentEmail()
        setIsOpen(true)
      } else if (session.user.emailVerified || isGmailUser) {
        // Close modal if email is now verified OR if Gmail user
        setIsOpen(false)
      }
    }
  }, [session, status, isGmailUser])

  // Auto-check verification status every 10 seconds when modal is open
  useEffect(() => {
    if (!isOpen) return

    const interval = setInterval(async () => {
      try {
        const response = await fetch('/api/member/check-email-verified')
        const data = await response.json()
        
        if (data.verified) {
          // Email verified! Update session and close modal
          await update()
          toast.success('Email berhasil diverifikasi!')
          setIsOpen(false)
          onComplete?.()
        }
      } catch (error) {
        // Silent fail - user can manually check
        console.log('Auto-check failed:', error)
      }
    }, 10000) // Check every 10 seconds

    return () => clearInterval(interval)
  }, [isOpen, update, onComplete])

  const fetchCurrentEmail = async () => {
    try {
      const response = await fetch('/api/user/profile')
      const data = await response.json()
      if (data.user?.email) {
        setCurrentEmail(data.user.email)
        // Check if email in session differs from database
        if (session?.user?.email && data.user.email !== session.user.email) {
          setEmailMismatch(true)
        }
      }
    } catch (error) {
      console.error('Failed to fetch current email:', error)
      setCurrentEmail(session?.user?.email || '')
    }
  }

  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const handleSendVerification = async () => {
    setSending(true)
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
        // Still set countdown to prevent spam
        setCountdown(60)
        return
      }

      if (data.success) {
        toast.success('Email verifikasi telah dikirim!')
        if (data.warning) {
          toast.info(data.warning, { duration: 5000 })
        }
        setSent(true)
        setCountdown(60) // 60 second cooldown
      } else {
        toast.error(data.error || 'Gagal mengirim email')
      }
    } catch (error) {
      console.error('Resend verification error:', error)
      toast.error('Terjadi kesalahan koneksi. Silakan coba lagi.')
    } finally {
      setSending(false)
    }
  }

  const handleCheckVerification = async () => {
    setChecking(true)
    try {
      const response = await fetch('/api/member/check-email-verified')
      const data = await response.json()

      if (data.verified) {
        toast.success('Email berhasil diverifikasi!')
        // Update session
        await update()
        setIsOpen(false)
        onComplete?.()
      } else {
        toast.error('Email belum diverifikasi. Silakan cek inbox Anda.')
      }
    } catch (error) {
      toast.error('Gagal memeriksa status verifikasi')
    } finally {
      setChecking(false)
    }
  }

  if (!isOpen) return null

  const displayEmail = currentEmail || session?.user?.email

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100">
            <Mail className="h-8 w-8 text-orange-600" />
          </div>
          <DialogTitle className="text-xl font-bold text-center">
            Verifikasi Email Anda
          </DialogTitle>
          <DialogDescription className="text-center">
            Verifikasi email diperlukan untuk mengakses semua fitur EksporYuk
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Email Mismatch Warning */}
          {emailMismatch && (
            <Alert className="border-amber-200 bg-amber-50">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800 text-sm">
                <p className="font-semibold mb-2">⚠️ Email Anda telah diubah oleh Admin</p>
                <p className="mb-3">
                  Email lama: <span className="line-through text-gray-500">{session?.user?.email}</span><br />
                  Email baru: <strong className="text-amber-900">{currentEmail}</strong>
                </p>
                <p className="mb-3">
                  Silakan <strong>logout dan login ulang</strong> untuk melanjutkan dengan email baru.
                </p>
                <Button
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                  size="sm"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout Sekarang
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Normal flow when no email mismatch */}
          {!emailMismatch && (
            <>
              {/* Email display */}
              <div className="bg-muted/50 rounded-lg p-4 text-center">
                <p className="text-sm text-muted-foreground mb-1">Email Anda:</p>
                <p className="font-medium text-lg">{displayEmail}</p>
              </div>

              {/* Instructions */}
              <Alert className="border-blue-200 bg-blue-50">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800 text-sm">
                  <p className="font-semibold mb-2">📧 Cara Verifikasi Email:</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Klik tombol "Kirim Email Verifikasi" di bawah</li>
                    <li>Buka <strong>Gmail</strong> Anda di <a href="https://gmail.com" target="_blank" rel="noopener" className="underline">gmail.com</a></li>
                    <li><strong className="text-amber-700">⚠️ CEK FOLDER SPAM / PROMOSI!</strong> Email mungkin masuk ke sana</li>
                    <li>Cari email dari <strong>EksporYuk (noreply@eksporyuk.com)</strong></li>
                    <li>Klik link "Verifikasi Email" di dalam email</li>
                    <li>Kembali ke sini dan klik "Sudah Verifikasi"</li>
                  </ol>
                </AlertDescription>
              </Alert>

              {/* Sent confirmation */}
              {sent && (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800 text-sm">
                    <p className="font-semibold mb-2">✅ Email verifikasi telah dikirim ke:</p>
                    <p className="font-mono bg-white px-2 py-1 rounded mb-3">{displayEmail}</p>
                    
                    <p className="font-semibold text-amber-700 mb-2">⚠️ PENTING - CEK 3 TEMPAT INI:</p>
                    <ol className="list-decimal list-inside space-y-1 ml-2">
                      <li><strong>Inbox</strong> - Email utama Gmail</li>
                      <li><strong className="text-red-600">Spam/Sampah</strong> - Periksa folder spam!</li>
                      <li><strong className="text-purple-600">Promosi</strong> - Tab promosi Gmail</li>
                    </ol>
                    
                    <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded">
                      <p className="text-xs text-amber-800">
                        💡 <strong>Tips:</strong> Jika email di folder Spam, tandai sebagai "Bukan Spam" 
                        agar email berikutnya masuk ke Inbox.
                      </p>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Actions */}
              <div className="flex flex-col gap-3">
                {!sent ? (
                  <Button
                    onClick={handleSendVerification}
                    disabled={sending}
                    className="w-full bg-orange-500 hover:bg-orange-600"
                  >
                    {sending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Mengirim...
                      </>
                    ) : (
                      <>
                        <Mail className="mr-2 h-4 w-4" />
                        Kirim Email Verifikasi
                      </>
                    )}
                  </Button>
                ) : (
                  <>
                    <Button
                      onClick={handleCheckVerification}
                      disabled={checking}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      {checking ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Memeriksa...
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="mr-2 h-4 w-4" />
                          Sudah Verifikasi
                        </>
                      )}
                    </Button>

                    <Button
                      onClick={() => window.open('https://mail.google.com/mail/u/0/#search/from%3Anoreply%40eksporyuk.com', '_blank')}
                      variant="outline"
                      className="w-full border-blue-300 text-blue-700 hover:bg-blue-50"
                    >
                      <Mail className="mr-2 h-4 w-4" />
                      Buka Gmail Sekarang
                    </Button>

                    <Button
                      onClick={handleSendVerification}
                      disabled={sending || countdown > 0}
                      variant="outline"
                      className="w-full"
                    >
                      {sending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Mengirim...
                        </>
                      ) : countdown > 0 ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Kirim Ulang ({countdown}s)
                        </>
                      ) : (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Kirim Ulang Email
                        </>
                      )}
                    </Button>
                  </>
                )}
              </div>

              {/* Help text */}
              <p className="text-xs text-center text-muted-foreground">
                <strong>Email tidak sampai setelah 5 menit?</strong><br/>
                1. Pastikan email Gmail Anda benar<br/>
                2. Cek folder <strong className="text-red-600">Spam</strong> dan <strong className="text-purple-600">Promosi</strong><br/>
                3. Klik "Kirim Ulang Email" di atas<br/>
                4. Hubungi support jika masih bermasalah
              </p>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
