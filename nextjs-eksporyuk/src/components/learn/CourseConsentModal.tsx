'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Shield, Scale, AlertTriangle, FileText, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'

interface CourseConsentModalProps {
  isOpen: boolean
  onClose: () => void
  onConsent: () => void
  courseTitle: string
  courseId: string
  userName: string
  userEmail: string
}

// Teks persetujuan resmi berdasarkan UU Hak Cipta
const CONSENT_TEXT = `PERNYATAAN PERSETUJUAN HAK CIPTA

Dengan mengakses dan mengikuti kelas/course ini, saya yang bertanda tangan di bawah ini menyatakan bahwa:

1. PEMAHAMAN HAK CIPTA
   Saya memahami bahwa seluruh materi, audio, video, dan konten dalam kelas ini dilindungi oleh Undang-Undang Nomor 28 Tahun 2014 tentang Hak Cipta.

2. LARANGAN PEREKAMAN & PENYEBARAN
   Saya DILARANG melakukan:
   • Perekaman layar (screen recording) atau audio
   • Penggandaan (copy/duplicate) materi dalam bentuk apapun
   • Pengambilan gambar (screenshot) materi pembelajaran
   • Penyebaran sebagian atau seluruh materi kepada pihak lain
   • Download atau menyimpan video tanpa izin tertulis

3. SANKSI PELANGGARAN
   Saya memahami bahwa pelanggaran terhadap ketentuan di atas dapat dikenakan:
   • Sanksi pidana sesuai Pasal 9 dan Pasal 113 UU Hak Cipta
   • Pidana penjara maksimal 4 tahun dan/atau denda maksimal Rp1.000.000.000
   • Pencabutan akses keanggotaan tanpa pengembalian biaya
   • Tuntutan ganti rugi secara perdata

4. KEKUATAN HUKUM
   Persetujuan elektronik ini memiliki kekuatan hukum yang sama dengan persetujuan tertulis sesuai dengan UU No. 11 Tahun 2008 tentang Informasi dan Transaksi Elektronik (ITE) jo. UU No. 19 Tahun 2016.

Dengan mencentang kotak persetujuan dan mengklik tombol "Saya Setuju & Lanjutkan", saya menyatakan telah membaca, memahami, dan menyetujui seluruh ketentuan di atas.`

export default function CourseConsentModal({
  isOpen,
  onClose,
  onConsent,
  courseTitle,
  courseId,
  userName,
  userEmail
}: CourseConsentModalProps) {
  const [agreed, setAgreed] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!agreed) {
      toast.error('Anda harus menyetujui ketentuan terlebih dahulu')
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch('/api/courses/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId,
          consentText: CONSENT_TEXT
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Gagal menyimpan persetujuan')
      }

      toast.success('Persetujuan berhasil disimpan')
      onConsent()
    } catch (error) {
      console.error('Error submitting consent:', error)
      toast.error(error instanceof Error ? error.message : 'Gagal menyimpan persetujuan')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
        <DialogHeader className="pb-4 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Scale className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <DialogTitle className="text-xl">Persetujuan Hak Cipta</DialogTitle>
              <DialogDescription className="text-sm mt-1">
                Harap baca dan setujui ketentuan sebelum mengakses materi
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-4">
          {/* Course Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium text-blue-900">{courseTitle}</p>
                <p className="text-sm text-blue-700 mt-1">
                  Peserta: <strong>{userName}</strong> ({userEmail})
                </p>
              </div>
            </div>
          </div>

          {/* Consent Text */}
          <ScrollArea className="h-[300px] rounded-lg border bg-gray-50 p-4">
            <pre className="text-sm whitespace-pre-wrap font-sans leading-relaxed text-gray-800">
              {CONSENT_TEXT}
            </pre>
          </ScrollArea>

          {/* Warning */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-red-800">
                <strong>PERINGATAN:</strong> Persetujuan ini tercatat secara elektronik dengan timestamp, 
                alamat IP, dan dapat digunakan sebagai bukti hukum jika terjadi pelanggaran.
              </p>
            </div>
          </div>

          {/* Checkbox Agreement */}
          <div className="flex items-start gap-3 mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <Checkbox
              id="consent-checkbox"
              checked={agreed}
              onCheckedChange={(checked) => setAgreed(checked === true)}
              className="mt-0.5"
            />
            <Label 
              htmlFor="consent-checkbox" 
              className="text-sm leading-relaxed cursor-pointer text-green-900"
            >
              Saya telah membaca, memahami, dan <strong>menyetujui seluruh ketentuan</strong> di atas. 
              Saya bertanggung jawab penuh atas segala tindakan yang melanggar ketentuan tersebut.
            </Label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Batal
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!agreed || submitting}
            className="bg-green-600 hover:bg-green-700 gap-2"
          >
            {submitting ? (
              <>
                <span className="animate-spin">⏳</span>
                Menyimpan...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4" />
                Saya Setuju & Lanjutkan
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
