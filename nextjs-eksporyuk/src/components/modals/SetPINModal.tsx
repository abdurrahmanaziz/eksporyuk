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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
              <Shield className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <DialogTitle className="text-xl">
                {hasExistingPin ? 'Ubah PIN Penarikan' : 'Atur PIN Penarikan'}
              </DialogTitle>
              <DialogDescription className="text-sm">
                PIN digunakan untuk keamanan setiap penarikan dana
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {hasExistingPin && (
            <div>
              <Label className="flex items-center gap-2 mb-2">
                <Lock className="h-4 w-4" />
                PIN Lama
              </Label>
              <div className="relative">
                <Input
                  type={showPins ? 'text' : 'password'}
                  value={currentPin}
                  onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, '').slice(0, pinLength))}
                  placeholder={`Masukkan PIN lama (${pinLength} digit)`}
                  maxLength={pinLength}
                  className="pr-10 text-center text-2xl tracking-widest"
                  autoFocus
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
          )}

          <div>
            <Label className="flex items-center gap-2 mb-2">
              <Shield className="h-4 w-4" />
              PIN Baru
            </Label>
            <div className="relative">
              <Input
                type={showPins ? 'text' : 'password'}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, pinLength))}
                placeholder={`${pinLength} digit angka`}
                maxLength={pinLength}
                className="pr-10 text-center text-2xl tracking-widest"
                autoFocus={!hasExistingPin}
              />
              <button
                type="button"
                onClick={() => setShowPins(!showPins)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPins ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {newPin.length}/{pinLength} digit
            </p>
          </div>

          <div>
            <Label className="flex items-center gap-2 mb-2">
              <Shield className="h-4 w-4" />
              Konfirmasi PIN
            </Label>
            <Input
              type={showPins ? 'text' : 'password'}
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, pinLength))}
              placeholder={`Ulangi ${pinLength} digit PIN`}
              maxLength={pinLength}
              className="text-center text-2xl tracking-widest"
            />
            {confirmPin && newPin !== confirmPin && (
              <p className="text-xs text-red-500 mt-1">PIN tidak cocok</p>
            )}
            {confirmPin && newPin === confirmPin && confirmPin.length === pinLength && (
              <p className="text-xs text-green-500 mt-1">✓ PIN cocok</p>
            )}
          </div>

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-900">
            <h4 className="font-semibold mb-1">💡 Tips Keamanan:</h4>
            <ul className="space-y-0.5 text-xs">
              <li>• Jangan gunakan PIN yang mudah ditebak (123456, tanggal lahir)</li>
              <li>• Simpan PIN Anda dengan aman</li>
              <li>• Jangan bagikan PIN kepada siapapun</li>
            </ul>
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
              disabled={loading || !newPin || newPin !== confirmPin || newPin.length !== pinLength}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  Menyimpan...
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4 mr-2" />
                  Simpan PIN
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
