'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  ArrowLeft, Shield, CheckCircle, FileText, Calendar,
  Globe, User, BookOpen, Download, AlertTriangle
} from 'lucide-react'
import { toast } from 'sonner'

type ConsentData = {
  id: string
  agreedAt: string
  ipAddress: string | null
  course: {
    id: string
    title: string
    slug: string
  }
  user: {
    id: string
    name: string
    email: string
    memberCode: string | null
  }
}

export default function CourseCopyrightPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const slug = params?.slug as string

  const [loading, setLoading] = useState(true)
  const [consent, setConsent] = useState<ConsentData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }

    if (status === 'authenticated' && slug) {
      fetchConsentData()
    }
  }, [status, slug])

  const fetchConsentData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/courses/${slug}/my-consent`)
      const data = await response.json()

      if (data.success) {
        setConsent(data.consent)
      } else {
        setError(data.error || 'Gagal memuat data')
      }
    } catch (error) {
      console.error('Error fetching consent:', error)
      setError('Gagal memuat data persetujuan')
    } finally {
      setLoading(false)
    }
  }

  const generateCertificatePdf = () => {
    if (!consent) return

    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      toast.error('Pop-up diblokir. Izinkan pop-up untuk mencetak.')
      return
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Surat Persetujuan Hak Cipta - ${consent.user.name}</title>
        <style>
          body { font-family: 'Times New Roman', serif; margin: 40px 60px; font-size: 14px; line-height: 1.6; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
          .header h1 { font-size: 20px; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 1px; }
          .header h2 { font-size: 16px; color: #333; margin-top: 5px; }
          .logo { font-size: 24px; margin-bottom: 10px; }
          .content { margin: 30px 0; }
          .field { margin: 15px 0; }
          .field-label { font-weight: bold; display: inline-block; width: 180px; }
          .field-value { display: inline-block; }
          .statement { background-color: #f9f9f9; border-left: 4px solid #2563eb; padding: 20px; margin: 25px 0; }
          .legal-box { background-color: #fff3cd; border: 1px solid #ffc107; padding: 15px 20px; margin: 25px 0; border-radius: 5px; }
          .signature-area { margin-top: 50px; }
          .signature-box { border: 1px dashed #999; padding: 20px; text-align: center; width: 250px; margin-top: 10px; }
          .footer { margin-top: 40px; font-size: 11px; color: #666; border-top: 1px solid #ddd; padding-top: 15px; }
          .badge { display: inline-block; background: #22c55e; color: white; padding: 5px 15px; border-radius: 20px; font-size: 12px; }
          @media print {
            body { margin: 20px 40px; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">📜</div>
          <h1>Surat Pernyataan Persetujuan</h1>
          <h2>Ketentuan Hak Cipta Materi Pembelajaran</h2>
        </div>
        
        <div class="content">
          <p>Yang bertanda tangan di bawah ini:</p>
          
          <div class="field">
            <span class="field-label">Nama Lengkap</span>
            <span class="field-value">: <strong>${consent.user.name}</strong></span>
          </div>
          <div class="field">
            <span class="field-label">Email</span>
            <span class="field-value">: ${consent.user.email}</span>
          </div>
          <div class="field">
            <span class="field-label">Kode Member</span>
            <span class="field-value">: ${consent.user.memberCode || '-'}</span>
          </div>
          <div class="field">
            <span class="field-label">Nama Kursus</span>
            <span class="field-value">: <strong>${consent.course.title}</strong></span>
          </div>
          
          <div class="statement">
            <p>Dengan ini menyatakan bahwa saya <strong>TELAH MEMBACA, MEMAHAMI, dan MENYETUJUI</strong> seluruh ketentuan Hak Cipta yang berlaku untuk materi pembelajaran pada kursus tersebut di atas.</p>
            
            <p>Saya memahami bahwa:</p>
            <ol>
              <li>Seluruh materi pembelajaran dilindungi oleh Undang-Undang Hak Cipta</li>
              <li>Materi hanya boleh digunakan untuk keperluan belajar pribadi</li>
              <li>Dilarang menyebarluaskan, menjual, atau menduplikasi materi tanpa izin</li>
              <li>Pelanggaran dapat dikenakan sanksi sesuai hukum yang berlaku</li>
            </ol>
          </div>

          <div class="legal-box">
            <strong>⚖️ Dasar Hukum:</strong><br/>
            UU No. 28 Tahun 2014 tentang Hak Cipta dan UU No. 11 Tahun 2008 tentang Informasi dan Transaksi Elektronik (UU ITE)
          </div>

          <div class="field">
            <span class="field-label">Tanggal Persetujuan</span>
            <span class="field-value">: ${new Date(consent.agreedAt).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'medium' })}</span>
          </div>
          <div class="field">
            <span class="field-label">IP Address</span>
            <span class="field-value">: ${consent.ipAddress || '-'}</span>
          </div>
          <div class="field">
            <span class="field-label">Status</span>
            <span class="field-value">: <span class="badge">✓ Tercatat Elektronik</span></span>
          </div>

          <div class="signature-area">
            <p>Demikian surat pernyataan ini dibuat dengan sebenar-benarnya.</p>
            <br/>
            <p>Yang Menyatakan,</p>
            <div class="signature-box">
              <em>(Persetujuan Elektronik)</em><br/><br/>
              <strong>${consent.user.name}</strong>
            </div>
          </div>
        </div>

        <div class="footer">
          <p>Dokumen ini digenerate secara otomatis oleh sistem Ekspor Yuk.</p>
          <p>Persetujuan elektronik ini merupakan bukti yang sah sesuai UU ITE.</p>
          <p>ID Consent: ${consent.id}</p>
        </div>

        <div class="no-print" style="margin-top: 20px; text-align: center;">
          <button onclick="window.print()" style="padding: 10px 20px; font-size: 14px; cursor: pointer; background: #2563eb; color: white; border: none; border-radius: 5px;">
            🖨️ Cetak / Save as PDF
          </button>
        </div>
      </body>
      </html>
    `

    printWindow.document.write(html)
    printWindow.document.close()
  }

  if (status === 'loading' || loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Skeleton className="h-8 w-64 mb-6" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    )
  }

  if (error || !consent) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center gap-4 mb-6">
          <Link href={`/learn/${slug}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Persetujuan Hak Cipta</h1>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
            <p className="text-muted-foreground text-center">
              {error || 'Anda belum menyetujui ketentuan Hak Cipta untuk kursus ini.'}
            </p>
            <Link href={`/learn/${slug}`}>
              <Button className="mt-4">Kembali ke Kelas</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href={`/learn/${slug}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Persetujuan Hak Cipta</h1>
            <p className="text-muted-foreground">{consent.course.title}</p>
          </div>
        </div>
        <Button onClick={generateCertificatePdf}>
          <Download className="h-4 w-4 mr-2" />
          Download PDF
        </Button>
      </div>

      {/* Status Card */}
      <Card className="mb-6 border-green-200 bg-green-50 dark:bg-green-950/20">
        <CardContent className="flex items-center gap-4 p-6">
          <div className="p-4 bg-green-100 dark:bg-green-900/50 rounded-full">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <div>
            <h3 className="font-semibold text-green-800 dark:text-green-400">
              Persetujuan Tercatat
            </h3>
            <p className="text-sm text-green-700 dark:text-green-500">
              Anda telah menyetujui ketentuan Hak Cipta untuk mengakses materi kursus ini
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Detail Persetujuan */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Detail Persetujuan
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Nama</p>
                <p className="font-medium">{consent.user.name}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Kode Member</p>
                <p className="font-medium">{consent.user.memberCode || '-'}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <BookOpen className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Kursus</p>
                <p className="font-medium">{consent.course.title}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Tanggal Persetujuan</p>
                <p className="font-medium">
                  {new Date(consent.agreedAt).toLocaleString('id-ID', {
                    dateStyle: 'full',
                    timeStyle: 'short'
                  })}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Globe className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">IP Address</p>
                <p className="font-medium font-mono text-sm">{consent.ipAddress || '-'}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">ID Persetujuan</p>
                <p className="font-medium font-mono text-xs">{consent.id}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ketentuan Hak Cipta */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Ketentuan Hak Cipta yang Disetujui
          </CardTitle>
          <CardDescription>
            Berikut adalah ketentuan yang telah Anda setujui
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">Perlindungan Hak Cipta</p>
                <p className="text-sm text-muted-foreground">
                  Seluruh materi pembelajaran dalam kursus ini dilindungi oleh Undang-Undang Hak Cipta No. 28 Tahun 2014
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">Penggunaan Pribadi</p>
                <p className="text-sm text-muted-foreground">
                  Materi hanya boleh digunakan untuk keperluan belajar pribadi dan tidak boleh disebarluaskan
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">Larangan Duplikasi</p>
                <p className="text-sm text-muted-foreground">
                  Dilarang keras merekam, menyalin, mengunduh, atau menduplikasi materi dalam bentuk apapun
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">Larangan Komersial</p>
                <p className="text-sm text-muted-foreground">
                  Dilarang menjual kembali, membagikan akses, atau menggunakan materi untuk kepentingan komersial
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">Sanksi Pelanggaran</p>
                <p className="text-sm text-muted-foreground">
                  Pelanggaran terhadap ketentuan ini dapat dikenakan sanksi hukum sesuai peraturan yang berlaku
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dasar Hukum */}
      <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-400">
            ⚖️ Dasar Hukum
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="font-medium text-amber-800 dark:text-amber-400">
              UU No. 28 Tahun 2014 tentang Hak Cipta
            </p>
            <p className="text-sm text-amber-700 dark:text-amber-500">
              Mengatur tentang perlindungan hak eksklusif pencipta atas karya ciptanya, termasuk materi pembelajaran digital.
            </p>
          </div>
          <Separator className="bg-amber-200" />
          <div>
            <p className="font-medium text-amber-800 dark:text-amber-400">
              UU No. 11 Tahun 2008 tentang ITE
            </p>
            <p className="text-sm text-amber-700 dark:text-amber-500">
              Persetujuan elektronik ini merupakan bukti yang sah secara hukum sesuai dengan ketentuan Informasi dan Transaksi Elektronik.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Footer Note */}
      <div className="mt-6 text-center text-sm text-muted-foreground">
        <p>
          Dokumen persetujuan ini tersimpan secara elektronik dan dapat digunakan sebagai bukti yang sah.
        </p>
        <p className="mt-1">
          Jika ada pertanyaan, silakan hubungi tim support.
        </p>
      </div>
    </div>
  )
}
