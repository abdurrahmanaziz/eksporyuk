'use client'

import { useState, useRef, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Mail, Shield, Clock, CheckCircle, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'

interface ForgotPINModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function ForgotPINModal({ open, onClose, onSuccess }: ForgotPINModalProps) {
  const [step, setStep] = useState<'request' | 'verify'>('request')
  const [loading, setLoading] = useState(false)
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', ''])
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [showPins, setShowPins] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [pinLength, setPinLength] = useState(6)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Fetch PIN length from settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/admin/settings/withdrawal')
        const data = await response.json()
        if (data.settings) {
          setPinLength(data.settings.withdrawalPinLength || 6)
        }
      } catch (error) {
        console.error('Error fetching settings:', error)
      }
    }
    if (open) {
      fetchSettings()
    }
  }, [open])

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const handleRequestCode = async () => {
    try {
      setLoading(true)

      const response = await fetch('/api/user/withdrawal-pin/forgot', {
        method: 'POST',
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(data.message)
        setStep('verify')
        setCountdown(900) // 15 minutes
      } else {
        toast.error(data.error || 'Gagal mengirim kode verifikasi')
      }
    } catch (error) {
      console.error('Error requesting code:', error)
      toast.error('Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  const handleCodeChange = (index: number, value: string) => {
    if (value && !/^\d$/.test(value)) return

    const newCode = [...verificationCode]
    newCode[index] = value
    setVerificationCode(newCode)

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !verificationCode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handleCodePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    const newCode = [...verificationCode]
    
    for (let i = 0; i < pastedData.length; i++) {
      newCode[i] = pastedData[i]
    }
    
    setVerificationCode(newCode)
    
    // Focus last filled input or next empty
    const nextIndex = Math.min(pastedData.length, 5)
    inputRefs.current[nextIndex]?.focus()
  }

  const handleResetPIN = async () => {
    const code = verificationCode.join('')

    if (code.length !== 6) {
      toast.error('Kode verifikasi harus 6 digit')
      return
    }

    if (!newPin) {
      toast.error('PIN baru harus diisi')
      return
    }

    if (newPin.length !== pinLength) {
      toast.error(`PIN harus ${pinLength} digit`)
      return
    }

    if (!/^\d+$/.test(newPin)) {
      toast.error('PIN hanya boleh berisi angka')
      return
    }

    if (newPin !== confirmPin) {
      toast.error('PIN baru dan konfirmasi tidak cocok')
      return
    }

    try {
      setLoading(true)

      const response = await fetch('/api/user/withdrawal-pin/forgot', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verificationCode: code,
          newPin,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(data.message)
        handleClose()
        onSuccess()
      } else {
        toast.error(data.error || 'Gagal mereset PIN')
      }
    } catch (error) {
      console.error('Error resetting PIN:', error)
      toast.error('Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setStep('request')
    setVerificationCode(['', '', '', '', '', ''])
    setNewPin('')
    setConfirmPin('')
    setCountdown(0)
    onClose()
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
              <Mail className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <DialogTitle className="text-xl">Lupa PIN?</DialogTitle>
              <DialogDescription className="text-sm">
                {step === 'request' 
                  ? 'Kami akan kirim kode verifikasi ke email Anda'
                  : 'Masukkan kode verifikasi dan PIN baru'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {step === 'request' ? (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-900">
                <p className="font-semibold mb-2">📧 Cara Reset PIN:</p>
                <ol className="space-y-1 text-xs ml-4">
                  <li>1. Klik tombol "Kirim Kode Verifikasi"</li>
                  <li>2. Cek email Anda untuk kode 6 digit</li>
                  <li>3. Masukkan kode dan buat PIN baru</li>
                  <li>4. Selesai! PIN Anda berhasil direset</li>
                </ol>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs text-yellow-900">
                <p>
                  <strong>⚠️ Catatan:</strong> Kode verifikasi akan dikirim ke email terdaftar Anda 
                  dan berlaku selama 15 menit.
                </p>
              </div>

              <Button
                onClick={handleRequestCode}
                disabled={loading}
                className="w-full bg-orange-600 hover:bg-orange-700"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    Mengirim...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Kirim Kode Verifikasi
                  </>
                )}
              </Button>
            </>
          ) : (
            <>
              {/* Countdown Timer */}
              {countdown > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                  <div className="flex items-center justify-center gap-2 text-green-700">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm font-semibold">
                      Kode berlaku: {formatTime(countdown)}
                    </span>
                  </div>
                </div>
              )}

              {/* Verification Code Input */}
              <div>
                <Label className="text-sm mb-2 block">Kode Verifikasi (6 Digit)</Label>
                <div className="flex gap-2 justify-center" onPaste={handleCodePaste}>
                  {verificationCode.map((digit, index) => (
                    <Input
                      key={index}
                      ref={(el) => {
                        inputRefs.current[index] = el
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleCodeChange(index, e.target.value)}
                      onKeyDown={(e) => handleCodeKeyDown(index, e)}
                      className="w-12 h-14 text-center text-2xl font-bold"
                      autoFocus={index === 0}
                    />
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Cek email Anda untuk kode verifikasi
                </p>
              </div>

              {/* New PIN Input */}
              <div>
                <Label className="flex items-center gap-2 mb-2">
                  <Shield className="h-4 w-4" />
                  PIN Baru ({pinLength} digit)
                </Label>
                <div className="relative">
                  <Input
                    type={showPins ? 'text' : 'password'}
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, pinLength))}
                    placeholder={`Masukkan PIN baru`}
                    maxLength={pinLength}
                    className="pr-10 text-center text-xl tracking-widest"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPins(!showPins)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPins ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm PIN Input */}
              <div>
                <Label className="flex items-center gap-2 mb-2">
                  <Shield className="h-4 w-4" />
                  Konfirmasi PIN Baru
                </Label>
                <Input
                  type={showPins ? 'text' : 'password'}
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, pinLength))}
                  placeholder="Ulangi PIN baru"
                  maxLength={pinLength}
                  className="text-center text-xl tracking-widest"
                />
                {confirmPin && newPin !== confirmPin && (
                  <p className="text-xs text-red-500 mt-1">PIN tidak cocok</p>
                )}
                {confirmPin && newPin === confirmPin && confirmPin.length === pinLength && (
                  <p className="text-xs text-green-500 mt-1 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" /> PIN cocok
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep('request')}
                  className="flex-1"
                >
                  Kirim Ulang Kode
                </Button>
                <Button
                  onClick={handleResetPIN}
                  disabled={loading || !newPin || newPin !== confirmPin || newPin.length !== pinLength || verificationCode.join('').length !== 6}
                  className="flex-1 bg-orange-600 hover:bg-orange-700"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                      Mereset...
                    </>
                  ) : (
                    <>
                      <Shield className="h-4 w-4 mr-2" />
                      Reset PIN
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
