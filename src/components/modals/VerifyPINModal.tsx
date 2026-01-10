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
      <DialogContent className="sm:max-w-md bg-gradient-to-br from-purple-50 via-white to-purple-50 border-0 shadow-2xl">
        {/* Header dengan gradient */}
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 -mx-6 -mt-6 px-6 pt-6 pb-4 rounded-t-lg">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-white">
                Verifikasi PIN Penarikan
              </DialogTitle>
              <DialogDescription className="text-purple-100 mt-1">
                Masukkan PIN untuk mengonfirmasi penarikan dana
              </DialogDescription>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          {/* Amount Info with modern card design */}
          <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 backdrop-blur-sm rounded-xl p-6 text-center border border-purple-200/50 shadow-inner">
            <p className="text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">Jumlah Penarikan</p>
            <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              {formatRupiah(amount)}
            </p>
            <div className="mt-2 w-16 h-1 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full mx-auto"></div>
          </div>

          {/* PIN Input dengan modern styling */}
          <div>
            <p className="text-center text-sm font-semibold text-gray-700 mb-4">
              Masukkan PIN {pinLength} Digit Anda
            </p>
            <div className="flex gap-3 justify-center" onPaste={handlePaste}>
              {pin.map((digit, index) => (
                <div key={index} className="relative">
                  <Input
                    ref={(el) => {
                      inputRefs.current[index] = el
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className={`w-14 h-16 text-center text-2xl font-bold rounded-xl border-2 transition-all duration-200 ${
                      error 
                        ? 'border-red-400 bg-red-50 shake' 
                        : digit 
                        ? 'border-purple-400 bg-purple-50 shadow-lg' 
                        : 'border-gray-200 hover:border-purple-300 focus:border-purple-400 focus:ring-4 focus:ring-purple-100'
                    }`}
                    disabled={loading}
                  />
                  {digit && (
                    <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                  )}
                </div>
              ))}
            </div>

            {error && (
              <div className="flex items-center justify-center gap-2 mt-4 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3">
                <AlertTriangle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}

            {/* Progress indicator */}
            <div className="mt-4">
              <div className="flex justify-center space-x-2">
                {pin.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      pin[index] ? 'bg-purple-400 scale-125' : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Forgot PIN Link */}
            {onForgotPin && (
              <div className="text-center mt-6">
                <button
                  type="button"
                  onClick={onForgotPin}
                  className="text-sm text-purple-600 hover:text-purple-700 font-semibold hover:underline transition-colors px-4 py-2 rounded-lg hover:bg-purple-50"
                >
                  Lupa PIN? Reset di sini
                </button>
              </div>
            )}
          </div>

          {/* Security Info dengan modern design */}
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-900">
                <p className="font-semibold mb-1">🔒 Keamanan Terjamin</p>
                <p className="text-xs">PIN Anda dienkripsi dan tidak dapat dilihat oleh siapapun termasuk admin platform.</p>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 h-12 border-2 border-gray-200 hover:border-gray-300 transition-colors"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={loading || pin.some(d => d === '')}
              className="flex-1 h-12 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl disabled:opacity-50"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Memverifikasi...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Konfirmasi Penarikan
                </div>
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
