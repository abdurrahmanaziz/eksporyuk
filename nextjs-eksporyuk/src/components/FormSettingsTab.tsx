'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Save, Upload, X } from 'lucide-react'
import FileUpload from '@/components/FileUpload'

interface FormSettings {
  formLogo?: string | null
  formBanner?: string | null
  formDescription?: string | null
}

interface MembershipPackage {
  id: string
  name: string
  formLogo?: string | null
  formBanner?: string | null
  formDescription?: string | null
}

interface FormSettingsTabProps {
  isOpen: boolean
  pkg: MembershipPackage
  onClose: () => void
  onSave: (settings: FormSettings) => Promise<void>
}

export default function FormSettingsTab({ isOpen, pkg, onClose, onSave }: FormSettingsTabProps) {
  const [formData, setFormData] = useState<FormSettings>({
    formLogo: pkg.formLogo || '',
    formBanner: pkg.formBanner || '',
    formDescription: pkg.formDescription || ''
  })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave(formData)
      alert('Pengaturan form berhasil disimpan!')
      onClose()
    } catch (error) {
      console.error('Error saving form settings:', error)
      alert('Gagal menyimpan pengaturan form')
    } finally {
      setSaving(false)
    }
  }

  const handleImageUrlChange = (field: 'formLogo' | 'formBanner', value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold">Pengaturan Form Checkout</h2>
            <p className="text-gray-600">Atur tampilan form checkout untuk paket: {pkg.name}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* Logo Setting */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Logo Form
              </CardTitle>
              <p className="text-sm text-gray-600">
                Logo yang akan ditampilkan di bagian atas form checkout. Kosongkan jika tidak ingin menampilkan logo.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <FileUpload
                label="Logo Form"
                value={formData.formLogo || ''}
                onChange={(value) => handleImageUrlChange('formLogo', value)}
                type="logo"
                maxSize={5}
                previewWidth={200}
                previewHeight={80}
                allowResize={true}
                accept="image/*"
              />
            </CardContent>
          </Card>

          {/* Banner Setting */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Banner Form
              </CardTitle>
              <p className="text-sm text-gray-600">
                Banner yang akan ditampilkan di form checkout. Kosongkan jika tidak ingin menampilkan banner.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <FileUpload
                label="Banner Form"
                value={formData.formBanner || ''}
                onChange={(value) => handleImageUrlChange('formBanner', value)}
                type="banner"
                maxSize={5}
                previewWidth={400}
                previewHeight={100}
                allowResize={false}
                accept="image/*"
              />
            </CardContent>
          </Card>

          {/* Description Setting */}
          <Card>
            <CardHeader>
              <CardTitle>Deskripsi Form</CardTitle>
              <p className="text-sm text-gray-600">
                Deskripsi atau arahan yang akan ditampilkan di form checkout untuk membantu pengguna.
              </p>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="formDescription">Deskripsi</Label>
                <Textarea
                  id="formDescription"
                  value={formData.formDescription || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, formDescription: e.target.value }))}
                  placeholder="Contoh: Pilih paket yang sesuai dengan kebutuhan bisnis Anda. Dapatkan akses penuh ke semua fitur dan panduan eksklusif."
                  rows={4}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Maksimal 300 karakter. Gunakan untuk memberikan informasi atau arahan kepada calon pembeli.
                </p>
              </div>

              {/* Description Preview */}
              {formData.formDescription && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Preview Deskripsi:</Label>
                  <p className="text-sm text-gray-700">{formData.formDescription}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={saving}
            >
              Batal
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Simpan Pengaturan
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}