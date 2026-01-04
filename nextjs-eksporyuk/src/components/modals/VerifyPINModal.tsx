'use client'

import { useState, useEffect, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Shield, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'

interface VerifyPINModalProps {
  open: boolean
  onClose: () => void
  onSuccess: (pin: string) => void
  amount: number
  onForgotPin?: () => void
}

export default function VerifyPINModal({ open, onClose, onSuccess, amount, onForgotPin }: VerifyPINModalProps) {
  const [pin, setPin] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [pinLength, setPinLength] = useState(6)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Fetch PIN length from settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/settings/withdrawal')
        const data = await response.json()
        if (data.settings) {
          const length = data.settings.withdrawalPinLength || 6
          setPinLength(length)
          setPin(new Array(length).fill(''))
        }
      } catch (error) {
        console.error('Error fetching settings:', error)
      }
    }
    if (open) {
      fetchSettings()
      setError('')
    }
  }, [open])

  // Auto-focus first input when modal opens
  useEffect(() => {
    if (open && inputRefs.current[0]) {
      setTimeout(() => inputRefs.current[0]?.focus(), 100)
    }
  }, [open])

  const handleChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return

    const newPin = [...pin]
    newPin[index] = value
    setPin(newPin)
    setError('')

    // Auto-focus next input
    if (value && index < pinLength - 1) {
      inputRefs.current[index + 1]?.focus()
    }

    // Auto-submit when all filled
    if (value && index === pinLength - 1 && newPin.every(d => d !== '')) {
      const pinString = newPin.join('')
      handleVerify(pinString)
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, pinLength)
    const newPin = [...pin]
    
    for (let i = 0; i < pastedData.length; i++) {
      newPin[i] = pastedData[i]
    }
    
    setPin(newPin)
    
    // Focus last filled input or next empty
    const nextIndex = Math.min(pastedData.length, pinLength - 1)
    inputRefs.current[nextIndex]?.focus()
    
    // Auto-submit if complete
    if (pastedData.length === pinLength) {
      handleVerify(pastedData)
    }
  }

  const handleVerify = async (pinString: string) => {
    try {
      setLoading(true)
      setError('')

      const response = await fetch('/api/user/withdrawal-pin', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pinString }),
      })

      const data = await response.json()

      if (response.ok) {
        onSuccess(pinString)
      } else {
        setError(data.error || 'PIN salah')
        setPin(new Array(pinLength).fill(''))
        inputRefs.current[0]?.focus()
      }
    } catch (error) {
      console.error('Error verifying PIN:', error)
      setError('Terjadi kesalahan')
      setPin(new Array(pinLength).fill(''))
      inputRefs.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const pinString = pin.join('')
    if (pinString.length === pinLength) {
      handleVerify(pinString)
    }
  }

  const handleClose = () => {
    setPin(new Array(pinLength).fill(''))
    setError('')
    onClose()
  }

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
              <Shield className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <DialogTitle className="text-xl">Verifikasi PIN</DialogTitle>
              <DialogDescription className="text-sm">
                Masukkan PIN untuk mengonfirmasi penarikan
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Amount Info */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 text-center border border-purple-200">
            <p className="text-sm text-gray-600 mb-1">Jumlah Penarikan</p>
            <p className="text-3xl font-bold text-purple-600">{formatRupiah(amount)}</p>
          </div>

          {/* PIN Input */}
          <div>
            <div className="flex gap-2 justify-center" onPaste={handlePaste}>
              {pin.map((digit, index) => (
                <Input
                  key={index}
                  ref={(el) => {
                    inputRefs.current[index] = el
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className={`w-12 h-14 text-center text-2xl font-bold ${
                    error ? 'border-red-500 shake' : 'border-gray-300'
                  }`}
                  disabled={loading}
                />
              ))}
            </div>

            {error && (
              <div className="flex items-center gap-2 mt-3 text-red-600 text-sm justify-center">
                <AlertTriangle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}

            {/* Forgot PIN Link */}
            {onForgotPin && (
              <div className="text-center mt-3">
                <button
                  type="button"
                  onClick={onForgotPin}
                  className="text-sm text-orange-600 hover:text-orange-700 font-medium hover:underline"
                >
                  Lupa PIN?
                </button>
              </div>
            )}
          </div>

          {/* Security Info */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-900">
            <div className="flex items-start gap-2">
              <Shield className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <div className="text-xs">
                <p className="font-semibold mb-1">Keamanan Penarikan</p>
                <p>PIN Anda dienkripsi dan tidak dapat dilihat oleh siapapun termasuk admin.</p>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={loading || pin.some(d => d === '')}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  Memverifikasi...
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4 mr-2" />
                  Konfirmasi Penarikan
                </>
              )}
            </Button>
          </DialogFooter>
        </form>

        <style jsx>{`
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
            20%, 40%, 60%, 80% { transform: translateX(4px); }
          }
          .shake {
            animation: shake 0.4s;
          }
        `}</style>
      </DialogContent>
    </Dialog>
  )
}
