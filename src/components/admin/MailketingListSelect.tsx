'use client'

import { useState, useEffect } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, AlertCircle, ExternalLink, RefreshCw, Mail, Plus } from 'lucide-react'
import { toast } from 'sonner'

interface MailketingList {
  id: string
  name: string
  description?: string
  created_at?: string
  usage?: {
    memberships: number
    products: number
    courses: number
    total: number
  }
}

interface MailketingListSelectProps {
  value: string
  onChange: (listId: string, listName: string) => void
  listNameValue?: string
  onListNameChange?: (name: string) => void
  disabled?: boolean
  className?: string
  showUsageInfo?: boolean
  allowManualInput?: boolean
  label?: string
}

export function MailketingListSelect({
  value,
  onChange,
  listNameValue = '',
  onListNameChange,
  disabled = false,
  className = '',
  showUsageInfo = true,
  allowManualInput = true,
  label = 'Mailketing List'
}: MailketingListSelectProps) {
  const [lists, setLists] = useState<MailketingList[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isConfigured, setIsConfigured] = useState(true)
  const [showManualInput, setShowManualInput] = useState(false)

  const fetchLists = async () => {
    try {
      setLoading(true)
      setError(null)

      const res = await fetch('/api/admin/mailketing/lists')
      const data = await res.json()

      if (data.success) {
        setLists(data.lists || [])
        setIsConfigured(true)
      } else {
        if (data.message?.includes('belum dikonfigurasi') || data.message?.includes('not configured')) {
          setIsConfigured(false)
        }
        setError(data.message || 'Gagal memuat daftar list')
        setLists([])
      }
    } catch (err) {
      console.error('Failed to fetch Mailketing lists:', err)
      setError('Gagal terhubung ke server')
      setLists([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLists()
  }, [])

  const handleSelect = (listId: string) => {
    if (listId === 'NONE') {
      onChange('', '')
      return
    }
    if (listId === 'MANUAL') {
      setShowManualInput(true)
      return
    }
    
    const selectedList = lists.find(l => l.id === listId)
    onChange(listId, selectedList?.name || '')
  }

  // If not configured, show setup message
  if (!isConfigured && !loading) {
    return (
      <div className={`space-y-2 ${className}`}>
        <Label>{label}</Label>
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-800">Mailketing Belum Dikonfigurasi</p>
              <p className="text-sm text-yellow-700 mt-1">
                Silakan konfigurasi API key Mailketing di halaman Integrasi terlebih dahulu.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => window.open('/admin/settings/integrations', '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Buka Pengaturan
              </Button>
            </div>
          </div>
        </div>
        
        {/* Fallback manual input */}
        {allowManualInput && (
          <div className="space-y-2 mt-4 pt-4 border-t">
            <p className="text-sm text-muted-foreground">Atau masukkan ID list secara manual:</p>
            <Input
              placeholder="Masukkan List ID"
              value={value}
              onChange={(e) => onChange(e.target.value, listNameValue)}
              disabled={disabled}
            />
            <Input
              placeholder="Nama List (opsional)"
              value={listNameValue}
              onChange={(e) => onListNameChange?.(e.target.value)}
              disabled={disabled}
            />
          </div>
        )}
      </div>
    )
  }

  // Show manual input mode
  if (showManualInput) {
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="flex items-center justify-between">
          <Label>{label} (Manual)</Label>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowManualInput(false)}
          >
            ← Kembali ke Dropdown
          </Button>
        </div>
        <Input
          placeholder="Masukkan List ID"
          value={value}
          onChange={(e) => onChange(e.target.value, listNameValue)}
          disabled={disabled}
        />
        <Input
          placeholder="Nama List"
          value={listNameValue}
          onChange={(e) => onListNameChange?.(e.target.value)}
          disabled={disabled}
        />
        <p className="text-xs text-muted-foreground">
          Masukkan List ID dari dashboard Mailketing Anda
        </p>
      </div>
    )
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchLists}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>
      
      {loading ? (
        <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Memuat daftar list...</span>
        </div>
      ) : error ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <span className="text-sm text-red-700">{error}</span>
          </div>
          <Button variant="outline" size="sm" onClick={fetchLists}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Coba Lagi
          </Button>
        </div>
      ) : (
        <>
          <Select
            value={value || 'NONE'}
            onValueChange={handleSelect}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder="Pilih Mailketing List" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="NONE">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">— Tidak ada —</span>
                </div>
              </SelectItem>
              
              {lists.map((list) => (
                <SelectItem key={list.id} value={list.id}>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-blue-600" />
                    <span>{list.name}</span>
                    {showUsageInfo && list.usage && list.usage.total > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {list.usage.total} produk
                      </Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
              
              {allowManualInput && (
                <SelectItem value="MANUAL">
                  <div className="flex items-center gap-2 text-blue-600">
                    <Plus className="h-4 w-4" />
                    <span>Input Manual</span>
                  </div>
                </SelectItem>
              )}
            </SelectContent>
          </Select>
          
          {value && value !== 'NONE' && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>List ID:</span>
              <code className="px-1.5 py-0.5 bg-muted rounded text-xs">{value}</code>
            </div>
          )}
        </>
      )}

      <p className="text-xs text-muted-foreground">
        Pembeli akan otomatis ditambahkan ke list ini setelah pembelian
      </p>
    </div>
  )
}

export default MailketingListSelect