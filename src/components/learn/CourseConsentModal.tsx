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
      <DialogContent className="max-w-3xl max-h-[95vh] overflow-hidden p-0">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 px-6 py-5">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
              <Scale className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white">Persetujuan Hak Cipta</h2>
              <p className="text-blue-100 text-sm mt-1">
                Harap baca dan setujui ketentuan sebelum mengakses materi
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 py-5 space-y-5 overflow-y-auto max-h-[calc(95vh-180px)]">
          {/* Course Info Card */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="p-2.5 bg-blue-100 rounded-lg">
                <FileText className="h-5 w-5 text-blue-700" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900 text-lg">{courseTitle}</h3>
                <div className="flex items-center gap-2 mt-2 text-sm">
                  <span className="text-blue-700">Peserta:</span>
                  <span className="font-medium text-blue-900">{userName}</span>
                  <span className="text-blue-400">•</span>
                  <span className="text-blue-600">{userEmail}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="h-5 w-5 text-gray-700" />
              <h3 className="font-semibold text-gray-900 text-lg">PERNYATAAN PERSETUJUAN HAK CIPTA</h3>
            </div>
            
            <ScrollArea className="h-[320px] rounded-xl border-2 border-gray-200 bg-white">
              <div className="p-6 space-y-6">
                <p className="text-gray-700 leading-relaxed">
                  Dengan mengakses dan mengikuti kelas/course ini, saya yang bertanda tangan di bawah ini menyatakan bahwa:
                </p>

                {/* Point 1 */}
                <div className="space-y-2">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-700 font-bold text-sm">1</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-2">PEMAHAMAN HAK CIPTA</h4>
                      <p className="text-gray-700 text-sm leading-relaxed">
                        Saya memahami bahwa seluruh materi, audio, video, dan konten dalam kelas ini dilindungi oleh 
                        Undang-Undang Nomor 28 Tahun 2014 tentang Hak Cipta.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Point 2 */}
                <div className="space-y-2">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                      <span className="text-amber-700 font-bold text-sm">2</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-2">LARANGAN PEREKAMAN & PENYEBARAN</h4>
                      <p className="text-gray-700 text-sm mb-2">Saya DILARANG melakukan:</p>
                      <ul className="space-y-1.5 text-sm text-gray-700 ml-1">
                        <li className="flex items-start gap-2">
                          <span className="text-amber-500 mt-1">•</span>
                          <span>Perekaman layar (screen recording) atau audio</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-amber-500 mt-1">•</span>
                          <span>Penggandaan (copy/duplicate) materi dalam bentuk apapun</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-amber-500 mt-1">•</span>
                          <span>Pengambilan gambar (screenshot) materi pembelajaran</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-amber-500 mt-1">•</span>
                          <span>Penyebaran sebagian atau seluruh materi kepada pihak lain</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-amber-500 mt-1">•</span>
                          <span>Download atau menyimpan video tanpa izin tertulis</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Point 3 */}
                <div className="space-y-2">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                      <span className="text-red-700 font-bold text-sm">3</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-2">SANKSI PELANGGARAN</h4>
                      <p className="text-gray-700 text-sm mb-2">Saya memahami bahwa pelanggaran terhadap ketentuan di atas dapat dikenakan:</p>
                      <ul className="space-y-1.5 text-sm text-gray-700 ml-1">
                        <li className="flex items-start gap-2">
                          <span className="text-red-500 mt-1">•</span>
                          <span>Sanksi pidana sesuai Pasal 9 dan Pasal 113 UU Hak Cipta</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-red-500 mt-1">•</span>
                          <span>Pidana penjara maksimal 4 tahun dan/atau denda maksimal Rp1.000.000.000</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-red-500 mt-1">•</span>
                          <span>Pencabutan akses keanggotaan tanpa pengembalian biaya</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-red-500 mt-1">•</span>
                          <span>Tuntutan ganti rugi secara perdata</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Point 4 */}
                <div className="space-y-2">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-700 font-bold text-sm">4</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-2">KEKUATAN HUKUM</h4>
                      <p className="text-gray-700 text-sm leading-relaxed">
                        Persetujuan elektronik ini memiliki kekuatan hukum yang sama dengan persetujuan tertulis 
                        sesuai dengan UU No. 11 Tahun 2008 tentang Informasi dan Transaksi Elektronik (ITE) 
                        jo. UU No. 19 Tahun 2016.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <p className="text-sm text-gray-600 leading-relaxed italic">
                    Dengan mencentang kotak persetujuan dan mengklik tombol "Saya Setuju & Lanjutkan", 
                    saya menyatakan telah membaca, memahami, dan menyetujui seluruh ketentuan di atas.
                  </p>
                </div>
              </div>
            </ScrollArea>
          </div>

          {/* Warning Box */}
          <div className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-red-900 mb-1.5 text-sm">PERINGATAN</h4>
                <p className="text-xs text-red-800 leading-relaxed">
                  Persetujuan ini tercatat secara elektronik dengan timestamp, alamat IP, dan dapat digunakan 
                  sebagai bukti hukum jika terjadi pelanggaran.
                </p>
              </div>
            </div>
          </div>

          {/* Checkbox Agreement */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-5 shadow-sm">
            <div className="flex items-start gap-4">
              <Checkbox
                id="consent-checkbox"
                checked={agreed}
                onCheckedChange={(checked) => setAgreed(checked === true)}
                className="mt-1 h-5 w-5 border-2 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
              />
              <Label 
                htmlFor="consent-checkbox" 
                className="text-sm leading-relaxed cursor-pointer text-green-900 flex-1"
              >
                <span className="font-medium">
                  ☑️ Saya telah membaca, memahami, dan <strong className="text-green-800">menyetujui seluruh ketentuan</strong> di atas.
                </span>
                <br />
                <span className="text-xs text-green-700 mt-1 inline-block">
                  Saya bertanggung jawab penuh atas segala tindakan yang melanggar ketentuan tersebut.
                </span>
              </Label>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-gray-50 border-t flex justify-between items-center gap-3">
          <p className="text-xs text-gray-500 flex-1">
            © 2025 Ekspor Yuk. Dilindungi Hak Cipta.
          </p>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={onClose} 
              disabled={submitting}
              className="min-w-[100px]"
            >
              Batal
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={!agreed || submitting}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 min-w-[180px] gap-2 shadow-lg shadow-green-500/30"
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
        </div>
      </DialogContent>
    </Dialog>
  )
}
