'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { toast } from 'sonner'

interface ReportDialogProps {
  isOpen: boolean
  onClose: () => void
  type: 'POST' | 'COMMENT' | 'USER' | 'GROUP'
  targetId: string
  targetName?: string
}

const REPORT_REASONS = {
  POST: [
    'Spam atau menyesatkan',
    'Pelecehan atau perundungan',
    'Ujaran kebencian',
    'Kekerasan atau konten berbahaya',
    'Konten dewasa',
    'Informasi palsu',
    'Lainnya'
  ],
  COMMENT: [
    'Spam atau menyesatkan',
    'Pelecehan atau perundungan',
    'Ujaran kebencian',
    'Tidak relevan atau di luar topik',
    'Lainnya'
  ],
  USER: [
    'Pelecehan atau perundungan',
    'Peniruan identitas',
    'Ujaran kebencian',
    'Aktivitas mencurigakan',
    'Lainnya'
  ],
  GROUP: [
    'Konten tidak pantas',
    'Spam atau penipuan',
    'Pelecehan',
    'Melanggar pedoman komunitas',
    'Lainnya'
  ]
}

export default function ReportDialog({
  isOpen,
  onClose,
  type,
  targetId,
  targetName
}: ReportDialogProps) {
  const [reason, setReason] = useState('')
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!reason) {
      toast.error('Silakan pilih alasan')
      return
    }

    setIsSubmitting(true)

    try {
      const payload: any = {
        type,
        reason,
        description
      }

      // Set target ID based on type
      if (type === 'POST') payload.postId = targetId
      else if (type === 'COMMENT') payload.commentId = targetId
      else if (type === 'USER') payload.userId = targetId
      else if (type === 'GROUP') payload.groupId = targetId

      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!res.ok) throw new Error('Failed to submit report')

      toast.success('Laporan berhasil dikirim')
      onClose()
      setReason('')
      setDescription('')
    } catch (error) {
      console.error('Submit report error:', error)
      toast.error('Gagal mengirim laporan')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Laporkan {type === 'POST' ? 'Postingan' : type === 'COMMENT' ? 'Komentar' : type === 'USER' ? 'Pengguna' : 'Grup'}</DialogTitle>
          <DialogDescription>
            {targetName && `Melaporkan: ${targetName}`}
            <br />
            Bantu kami memahami masalah dengan {type === 'POST' ? 'postingan' : type === 'COMMENT' ? 'komentar' : type === 'USER' ? 'pengguna' : 'grup'} ini.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Alasan</Label>
            <RadioGroup value={reason} onValueChange={setReason}>
              {REPORT_REASONS[type].map((r) => (
                <div key={r} className="flex items-center space-x-2">
                  <RadioGroupItem value={r} id={r} />
                  <Label htmlFor={r} className="font-normal cursor-pointer">
                    {r}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Detail tambahan (opsional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Berikan konteks lebih lanjut tentang laporan ini..."
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Batal
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!reason || isSubmitting}
            className="bg-red-600 hover:bg-red-700"
          >
            {isSubmitting ? 'Mengirim...' : 'Kirim Laporan'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
