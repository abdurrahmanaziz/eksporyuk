'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { Save, Loader2, Settings as SettingsIcon, DollarSign, Award, Lock, Users, BookOpen } from 'lucide-react'

type CourseSettings = {
  id: string
  defaultMentorCommission: number
  defaultAffiliateCommission: number
  minWithdrawalAmount: number
  withdrawalProcessingDays: number
  maxWithdrawalPerDay: number
  withdrawalMethods: string[]
  autoApproveCourses: boolean
  autoApproveEnrollments: boolean
  defaultCourseVisibility: string
  requireCertificateCompletion: boolean
  certificateMinScore: number
  enableAffiliateProgram: boolean
  enableMentorProgram: boolean
  // Mentor Permissions
  mentorCanCreateGroup: boolean
  mentorCanCreateCourse: boolean
  mentorCanCreateMaterial: boolean
  mentorCanEditOwnCourse: boolean
  mentorCanDeleteOwnCourse: boolean
  mentorCanViewAnalytics: boolean
}

export default function CourseSettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<CourseSettings | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }
    if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
      router.push('/dashboard')
      return
    }
    if (status === 'authenticated') {
      fetchSettings()
    }
  }, [status, session, router])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/settings/course')
      
      if (res.ok) {
        const data = await res.json()
        setSettings(data.settings)
      } else {
        toast.error('Gagal memuat settings')
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
      toast.error('Gagal memuat settings')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!settings) return

    try {
      setSaving(true)
      const res = await fetch('/api/admin/settings/course', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })

      if (res.ok) {
        toast.success('Settings berhasil disimpan')
      } else {
        toast.error('Gagal menyimpan settings')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('Gagal menyimpan settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!settings) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Settings tidak ditemukan</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <SettingsIcon className="h-8 w-8" />
            Course Settings
          </h1>
          <p className="text-muted-foreground mt-1">
            Kelola pengaturan umum untuk sistem kursus
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Menyimpan...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Simpan
            </>
          )}
        </Button>
      </div>

      <div className="space-y-6">
        {/* Commission Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Pengaturan Komisi
            </CardTitle>
            <CardDescription>
              Komisi default untuk mentor dan affiliate
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="mentorCommission">Komisi Mentor Default (%)</Label>
                <Input
                  id="mentorCommission"
                  type="number"
                  min="0"
                  max="100"
                  value={settings.defaultMentorCommission}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      defaultMentorCommission: parseFloat(e.target.value) || 0,
                    })
                  }
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Persentase komisi mentor dari sisa setelah affiliate
                </p>
              </div>
              <div>
                <Label htmlFor="affiliateCommission">Komisi Affiliate Default (%)</Label>
                <Input
                  id="affiliateCommission"
                  type="number"
                  min="0"
                  max="100"
                  value={settings.defaultAffiliateCommission}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      defaultAffiliateCommission: parseFloat(e.target.value) || 0,
                    })
                  }
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Persentase komisi affiliate dari harga course
                </p>
              </div>
            </div>
            
            {/* Commission Flow Explanation */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
              <h4 className="font-semibold text-blue-800 mb-2">📊 Alur Pembagian Komisi Course</h4>
              <div className="text-sm text-blue-700 space-y-1">
                <p>1. <strong>Harga Course</strong> (misal: Rp 500.000)</p>
                <p>2. <strong>Dikurangi Komisi Affiliate</strong> ({settings.defaultAffiliateCommission}%) = Rp {(500000 * settings.defaultAffiliateCommission / 100).toLocaleString('id-ID')}</p>
                <p>3. <strong>Sisa</strong> = Rp {(500000 - (500000 * settings.defaultAffiliateCommission / 100)).toLocaleString('id-ID')}</p>
                <p>4. <strong>Komisi Mentor</strong> ({settings.defaultMentorCommission}% dari sisa) = Rp {((500000 - (500000 * settings.defaultAffiliateCommission / 100)) * settings.defaultMentorCommission / 100).toLocaleString('id-ID')}</p>
                <p>5. <strong>Ekspor Yuk</strong> = Rp {((500000 - (500000 * settings.defaultAffiliateCommission / 100)) - ((500000 - (500000 * settings.defaultAffiliateCommission / 100)) * settings.defaultMentorCommission / 100)).toLocaleString('id-ID')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Mentor Permissions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Hak Akses Mentor
            </CardTitle>
            <CardDescription>
              Atur kemampuan dan batasan mentor dalam platform
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="mentorCanCreateGroup">Mentor Bisa Buat Grup</Label>
                <p className="text-xs text-muted-foreground">
                  Mentor dapat membuat grup diskusi untuk course mereka
                </p>
              </div>
              <Switch
                id="mentorCanCreateGroup"
                checked={settings.mentorCanCreateGroup}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, mentorCanCreateGroup: checked })
                }
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="mentorCanCreateCourse">Mentor Bisa Buat Kelas</Label>
                <p className="text-xs text-muted-foreground">
                  Mentor dapat membuat course/kelas baru
                </p>
              </div>
              <Switch
                id="mentorCanCreateCourse"
                checked={settings.mentorCanCreateCourse}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, mentorCanCreateCourse: checked })
                }
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="mentorCanCreateMaterial">Mentor Bisa Buat Materi</Label>
                <p className="text-xs text-muted-foreground">
                  Mentor dapat menambahkan modul dan materi ke course
                </p>
              </div>
              <Switch
                id="mentorCanCreateMaterial"
                checked={settings.mentorCanCreateMaterial}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, mentorCanCreateMaterial: checked })
                }
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="mentorCanEditOwnCourse">Mentor Bisa Edit Course Sendiri</Label>
                <p className="text-xs text-muted-foreground">
                  Mentor dapat mengedit course yang mereka buat
                </p>
              </div>
              <Switch
                id="mentorCanEditOwnCourse"
                checked={settings.mentorCanEditOwnCourse}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, mentorCanEditOwnCourse: checked })
                }
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="mentorCanDeleteOwnCourse">Mentor Bisa Hapus Course Sendiri</Label>
                <p className="text-xs text-muted-foreground">
                  Mentor dapat menghapus course yang mereka buat (hati-hati!)
                </p>
              </div>
              <Switch
                id="mentorCanDeleteOwnCourse"
                checked={settings.mentorCanDeleteOwnCourse}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, mentorCanDeleteOwnCourse: checked })
                }
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="mentorCanViewAnalytics">Mentor Bisa Lihat Analytics</Label>
                <p className="text-xs text-muted-foreground">
                  Mentor dapat melihat statistik dan analytics course mereka
                </p>
              </div>
              <Switch
                id="mentorCanViewAnalytics"
                checked={settings.mentorCanViewAnalytics}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, mentorCanViewAnalytics: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Withdrawal Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Pengaturan Withdrawal
            </CardTitle>
            <CardDescription>
              Atur batasan dan proses withdrawal
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="minWithdrawal">Minimum Withdrawal (Rp)</Label>
                <Input
                  id="minWithdrawal"
                  type="number"
                  min="0"
                  value={settings.minWithdrawalAmount}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      minWithdrawalAmount: parseFloat(e.target.value) || 0,
                    })
                  }
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Jumlah minimum untuk melakukan withdrawal
                </p>
              </div>
              <div>
                <Label htmlFor="maxWithdrawal">Maximum per Hari (Rp)</Label>
                <Input
                  id="maxWithdrawal"
                  type="number"
                  min="0"
                  value={settings.maxWithdrawalPerDay}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      maxWithdrawalPerDay: parseFloat(e.target.value) || 0,
                    })
                  }
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Batasan withdrawal maksimal per hari
                </p>
              </div>
              <div>
                <Label htmlFor="processingDays">Waktu Proses (Hari)</Label>
                <Input
                  id="processingDays"
                  type="number"
                  min="1"
                  value={settings.withdrawalProcessingDays}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      withdrawalProcessingDays: parseInt(e.target.value) || 1,
                    })
                  }
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Estimasi hari kerja untuk proses withdrawal
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Course & Enrollment Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Pengaturan Course & Enrollment
            </CardTitle>
            <CardDescription>
              Atur approval otomatis dan visibilitas default
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="autoApproveCourses">Auto Approve Course Baru</Label>
                <p className="text-xs text-muted-foreground">
                  Course baru otomatis di-approve tanpa review admin
                </p>
              </div>
              <Switch
                id="autoApproveCourses"
                checked={settings.autoApproveCourses}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, autoApproveCourses: checked })
                }
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="autoApproveEnrollments">Auto Approve Enrollment</Label>
                <p className="text-xs text-muted-foreground">
                  Enrollment student otomatis di-approve
                </p>
              </div>
              <Switch
                id="autoApproveEnrollments"
                checked={settings.autoApproveEnrollments}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, autoApproveEnrollments: checked })
                }
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="requireCertificateCompletion">Require Completion untuk Certificate</Label>
                <p className="text-xs text-muted-foreground">
                  Student harus menyelesaikan course untuk mendapat sertifikat
                </p>
              </div>
              <Switch
                id="requireCertificateCompletion"
                checked={settings.requireCertificateCompletion}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, requireCertificateCompletion: checked })
                }
              />
            </div>

            <Separator />

            <div>
              <Label htmlFor="certificateMinScore">Minimum Score untuk Certificate (%)</Label>
              <Input
                id="certificateMinScore"
                type="number"
                min="0"
                max="100"
                value={settings.certificateMinScore}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    certificateMinScore: parseInt(e.target.value) || 0,
                  })
                }
              />
              <p className="text-xs text-muted-foreground mt-1">
                Score minimum quiz/assignment untuk mendapat sertifikat
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Program Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Program Settings</CardTitle>
            <CardDescription>
              Enable/disable program affiliate dan mentor
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="enableAffiliateProgram">Enable Affiliate Program</Label>
                <p className="text-xs text-muted-foreground">
                  Aktifkan program affiliate untuk course
                </p>
              </div>
              <Switch
                id="enableAffiliateProgram"
                checked={settings.enableAffiliateProgram}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, enableAffiliateProgram: checked })
                }
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="enableMentorProgram">Enable Mentor Program</Label>
                <p className="text-xs text-muted-foreground">
                  Aktifkan program mentor untuk membuat course
                </p>
              </div>
              <Switch
                id="enableMentorProgram"
                checked={settings.enableMentorProgram}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, enableMentorProgram: checked })
                }
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg">
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Menyimpan...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Simpan Semua Settings
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
