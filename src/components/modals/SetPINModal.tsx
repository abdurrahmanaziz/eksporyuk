'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Shield, Eye, EyeOff, Lock } from 'lucide-react'
import { toast } from 'sonner'

interface SetPINModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  hasExistingPin?: boolean
}

export default function SetPINModal({ open, onClose, onSuccess, hasExistingPin = false }: SetPINModalProps) {
  const [currentPin, setCurrentPin] = useState('')
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [showPins, setShowPins] = useState(false)
  const [loading, setLoading] = useState(false)
  const [pinLength, setPinLength] = useState(6)

  // Fetch PIN length from settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/settings/withdrawal')
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (hasExistingPin && !currentPin) {
      toast.error('PIN lama harus diisi')
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

      const response = await fetch('/api/user/withdrawal-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pin: newPin,
          currentPin: hasExistingPin ? currentPin : undefined,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(data.message)
        setCurrentPin('')
        setNewPin('')
        setConfirmPin('')
        onSuccess()
        onClose()
      } else {
        toast.error(data.error || 'Gagal menyimpan PIN')
      }
    } catch (error) {
      console.error('Error setting PIN:', error)
      toast.error('Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setCurrentPin('')
    setNewPin('')
    setConfirmPin('')
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-gradient-to-br from-blue-50 via-white to-blue-50 border-0 shadow-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                {hasExistingPin ? 'Ubah PIN Penarikan' : 'Atur PIN Penarikan'}
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-600">
                PIN digunakan untuk keamanan setiap penarikan dana
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          {hasExistingPin && (
            <div>
              <Label className="flex items-center gap-2 mb-3 text-sm font-semibold text-gray-700">
                <Lock className="h-4 w-4 text-blue-500" />
                PIN Lama
              </Label>
              <div className="relative">
                <Input
                  type={showPins ? 'text' : 'password'}
                  value={currentPin}
                  onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, '').slice(0, pinLength))}
                  placeholder={`Masukkan PIN lama (${pinLength} digit)`}
                  maxLength={pinLength}
                  className="pr-12 text-center text-2xl tracking-widest h-14 border-2 border-gray-200 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 rounded-xl transition-all"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPins(!showPins)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-500 transition-colors"
                >
                  {showPins ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
          )}

          <div>
            <Label className="flex items-center gap-2 mb-3 text-sm font-semibold text-gray-700">
              <Shield className="h-4 w-4 text-green-500" />
              PIN Baru
            </Label>
            <div className="relative">
              <Input
                type={showPins ? 'text' : 'password'}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, pinLength))}
                placeholder={`${pinLength} digit angka`}
                maxLength={pinLength}
                className="pr-12 text-center text-2xl tracking-widest h-14 border-2 border-gray-200 focus:border-green-400 focus:ring-4 focus:ring-green-100 rounded-xl transition-all"
                autoFocus={!hasExistingPin}
              />
              <button
                type="button"
                onClick={() => setShowPins(!showPins)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-green-500 transition-colors"
              >
                {showPins ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {/* PIN strength indicator */}
            <div className="flex space-x-1 mt-2">
              {Array.from({ length: pinLength }).map((_, index) => (
                <div
                  key={index}
                  className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${
                    newPin.length > index ? 'bg-green-400' : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {newPin.length}/{pinLength} digit
            </p>
          </div>

          <div>
            <Label className="flex items-center gap-2 mb-3 text-sm font-semibold text-gray-700">
              <Shield className="h-4 w-4 text-green-500" />
              Konfirmasi PIN
            </Label>
            <Input
              type={showPins ? 'text' : 'password'}
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, pinLength))}
              placeholder={`Ulangi ${pinLength} digit PIN`}
              maxLength={pinLength}
              className="text-center text-2xl tracking-widest h-14 border-2 border-gray-200 focus:border-green-400 focus:ring-4 focus:ring-green-100 rounded-xl transition-all"
            />
            {confirmPin && (
              <div className={`text-xs mt-2 flex items-center gap-2 ${newPin === confirmPin ? 'text-green-600' : 'text-red-500'}`}>
                <div className={`w-2 h-2 rounded-full ${newPin === confirmPin ? 'bg-green-400' : 'bg-red-400'}`} />
                {newPin === confirmPin ? 'PIN cocok' : 'PIN tidak cocok'}
              </div>
            )}
          </div>

          {/* Enhanced Security Info */}
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-900">
                <h4 className="font-semibold mb-2">🔐 Tips Keamanan:</h4>
                <ul className="space-y-1 text-xs">
                  <li>• Jangan gunakan PIN yang mudah ditebak (123456, tanggal lahir)</li>
                  <li>• Simpan PIN Anda dengan aman dan jangan bagikan ke siapapun</li>
                  <li>• PIN akan diperlukan setiap kali melakukan penarikan dana</li>
                </ul>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-3 sm:gap-3 pt-2">
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
              disabled={loading || !newPin || newPin !== confirmPin || newPin.length !== pinLength}
              className="flex-1 h-12 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl disabled:opacity-50"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Menyimpan...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  {hasExistingPin ? 'Update PIN' : 'Simpan PIN'}
                </div>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
