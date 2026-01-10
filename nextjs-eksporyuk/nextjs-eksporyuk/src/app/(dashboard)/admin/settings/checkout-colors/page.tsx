'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Loader2, Palette, Check } from 'lucide-react'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'
import { toast } from 'sonner'

interface ColorSettings {
  primary: string
  secondary: string
  accent: string
  success: string
  warning: string
}

export default function CheckoutColorsPage() {
  const [colors, setColors] = useState<ColorSettings>({
    primary: '#3b82f6',
    secondary: '#1e40af',
    accent: '#60a5fa',
    success: '#22c55e',
    warning: '#eab308',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchColors()
  }, [])

  const fetchColors = async () => {
    try {
      const response = await fetch('/api/settings/checkout-colors')
      if (response.ok) {
        const data = await response.json()
        setColors(data.colors)
      }
    } catch (error) {
      console.error('Error fetching colors:', error)
      toast.error('Gagal memuat pengaturan warna')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/settings/checkout-colors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(colors),
      })

      if (response.ok) {
        toast.success('Pengaturan warna berhasil disimpan!')
      } else {
        throw new Error('Failed to save')
      }
    } catch (error) {
      console.error('Error saving colors:', error)
      toast.error('Gagal menyimpan pengaturan warna')
    } finally {
      setSaving(false)
    }
  }

  const resetToDefault = () => {
    setColors({
      primary: '#3b82f6',
      secondary: '#1e40af',
      accent: '#60a5fa',
      success: '#22c55e',
      warning: '#eab308',
    })
    toast.info('Reset ke warna default')
  }

  if (loading) {
    return (
      <ResponsivePageWrapper>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </ResponsivePageWrapper>
    )
  }

  return (
    <ResponsivePageWrapper>
      <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Palette className="h-8 w-8" />
          Pengaturan Warna Checkout
        </h1>
        <p className="text-muted-foreground mt-2">
          Atur warna untuk halaman checkout (Product, Course, Membership)
        </p>
      </div>

      {/* Preview Card */}
      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
          <CardDescription>Lihat tampilan warna yang dipilih</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {/* Selected Payment Option Preview */}
            <div 
              className="p-4 rounded-lg border-2 relative"
              style={{ 
                borderColor: colors.primary, 
                backgroundColor: `${colors.primary}10` 
              }}
            >
              <p className="font-semibold">Selected Payment Option</p>
              <p className="text-sm text-gray-500">Bank Transfer</p>
              <div 
                className="absolute top-2 right-2 rounded-full p-1"
                style={{ backgroundColor: colors.primary }}
              >
                <Check className="h-3 w-3 text-white" />
              </div>
            </div>

            {/* Buy Button Preview */}
            <button
              className="p-4 rounded-lg text-white font-bold"
              style={{ backgroundColor: colors.primary }}
            >
              Beli Sekarang
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Color Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Pengaturan Warna</CardTitle>
          <CardDescription>Pilih warna untuk setiap elemen</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Primary Color */}
            <div className="space-y-2">
              <Label htmlFor="primary">Primary Color</Label>
              <div className="flex gap-2">
                <Input
                  id="primary"
                  type="color"
                  value={colors.primary}
                  onChange={(e) => setColors({ ...colors, primary: e.target.value })}
                  className="w-20 h-10 cursor-pointer"
                />
                <Input
                  type="text"
                  value={colors.primary}
                  onChange={(e) => setColors({ ...colors, primary: e.target.value })}
                  className="flex-1 font-mono"
                  placeholder="#3b82f6"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Warna utama untuk border, button, dan highlight
              </p>
            </div>

            {/* Secondary Color */}
            <div className="space-y-2">
              <Label htmlFor="secondary">Secondary Color</Label>
              <div className="flex gap-2">
                <Input
                  id="secondary"
                  type="color"
                  value={colors.secondary}
                  onChange={(e) => setColors({ ...colors, secondary: e.target.value })}
                  className="w-20 h-10 cursor-pointer"
                />
                <Input
                  type="text"
                  value={colors.secondary}
                  onChange={(e) => setColors({ ...colors, secondary: e.target.value })}
                  className="flex-1 font-mono"
                  placeholder="#1e40af"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Warna untuk button hover state
              </p>
            </div>

            {/* Accent Color */}
            <div className="space-y-2">
              <Label htmlFor="accent">Accent Color</Label>
              <div className="flex gap-2">
                <Input
                  id="accent"
                  type="color"
                  value={colors.accent}
                  onChange={(e) => setColors({ ...colors, accent: e.target.value })}
                  className="w-20 h-10 cursor-pointer"
                />
                <Input
                  type="text"
                  value={colors.accent}
                  onChange={(e) => setColors({ ...colors, accent: e.target.value })}
                  className="flex-1 font-mono"
                  placeholder="#60a5fa"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Warna untuk aksen dan gradient
              </p>
            </div>

            {/* Success Color */}
            <div className="space-y-2">
              <Label htmlFor="success">Success Color</Label>
              <div className="flex gap-2">
                <Input
                  id="success"
                  type="color"
                  value={colors.success}
                  onChange={(e) => setColors({ ...colors, success: e.target.value })}
                  className="w-20 h-10 cursor-pointer"
                />
                <Input
                  type="text"
                  value={colors.success}
                  onChange={(e) => setColors({ ...colors, success: e.target.value })}
                  className="flex-1 font-mono"
                  placeholder="#22c55e"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Warna untuk pesan sukses
              </p>
            </div>

            {/* Warning Color */}
            <div className="space-y-2">
              <Label htmlFor="warning">Warning Color</Label>
              <div className="flex gap-2">
                <Input
                  id="warning"
                  type="color"
                  value={colors.warning}
                  onChange={(e) => setColors({ ...colors, warning: e.target.value })}
                  className="w-20 h-10 cursor-pointer"
                />
                <Input
                  type="text"
                  value={colors.warning}
                  onChange={(e) => setColors({ ...colors, warning: e.target.value })}
                  className="flex-1 font-mono"
                  placeholder="#eab308"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Warna untuk peringatan
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="flex-1"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Simpan Pengaturan
                </>
              )}
            </Button>
            <Button
              onClick={resetToDefault}
              variant="outline"
              disabled={saving}
            >
              Reset ke Default
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Palette className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              <p className="font-semibold text-blue-900 dark:text-blue-100">
                Informasi
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Warna yang Anda atur di sini akan diterapkan ke seluruh halaman checkout (Product, Course, Membership). 
                Perubahan akan langsung terlihat setelah disimpan.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
    </ResponsivePageWrapper>
  )
}
