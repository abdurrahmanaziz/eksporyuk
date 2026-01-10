'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface CreateGroupModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function CreateGroupModal({ isOpen, onClose, onSuccess }: CreateGroupModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'PUBLIC' as 'PUBLIC' | 'PRIVATE' | 'HIDDEN',
    avatar: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (!formData.name.trim()) {
      setError('Nama grup wajib diisi')
      return
    }

    try {
      setLoading(true)
      const response = await fetch('/api/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Gagal membuat grup')
      }

      onSuccess()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold">Buat Grup Baru</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <Label htmlFor="name">Nama Grup *</Label>
            <Input
              id="name"
              type="text"
              placeholder="Masukkan nama grup"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="mt-1"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Deskripsi</Label>
            <Textarea
              id="description"
              placeholder="Jelaskan tujuan dan topik diskusi grup"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="mt-1"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="type">Tipe Grup</Label>
            <Select
              value={formData.type}
              onValueChange={(value: 'PUBLIC' | 'PRIVATE' | 'HIDDEN') => 
                setFormData({ ...formData, type: value })
              }
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PUBLIC">
                  <div>
                    <div className="font-medium">Publik</div>
                    <div className="text-sm text-gray-500">
                      Siapa saja bisa melihat dan bergabung
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="PRIVATE">
                  <div>
                    <div className="font-medium">Privat</div>
                    <div className="text-sm text-gray-500">
                      Perlu persetujuan untuk bergabung
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="HIDDEN">
                  <div>
                    <div className="font-medium">Tersembunyi</div>
                    <div className="text-sm text-gray-500">
                      Hanya bisa bergabung dengan undangan
                    </div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="avatar">URL Avatar (opsional)</Label>
            <Input
              id="avatar"
              type="url"
              placeholder="https://example.com/avatar.jpg"
              value={formData.avatar}
              onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
              className="mt-1"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={loading}
            >
              {loading ? 'Membuat...' : 'Buat Grup'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}