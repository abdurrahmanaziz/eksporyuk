'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  FileCheck,
  CheckCircle,
  XCircle,
  Eye,
  Shield,
  AlertCircle,
  ExternalLink,
  UserCheck,
  MessageSquare,
  Ban,
  RotateCcw,
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import Image from 'next/image'

interface Supplier {
  id: string
  companyName: string
  slug: string
  logo?: string
  email?: string
  phone?: string
  province: string
  city: string
  legalityDoc?: string
  nibDoc?: string
  isVerified: boolean
  verifiedAt?: string
  status: string
  mentorReviewedBy?: string
  mentorReviewedAt?: string
  mentorNotes?: string
  mentorRecommendation?: string
  assignedMentorId?: string
  user: {
    id: string
    name: string
    email: string
  }
  supplierMembership: {
    package: {
      name: string
      type: string
    }
  } | null
  createdAt: string
}

export default function AdminSupplierVerificationsPage() {
  const { data: session } = useSession()
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('recommended')
  const [stats, setStats] = useState({
    total: 0,
    waitingReview: 0,
    recommended: 0,
    verified: 0,
  })

  useEffect(() => {
    fetchSuppliers()
  }, [statusFilter])

  const fetchSuppliers = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/supplier/verifications?status=${statusFilter}`)
      
      if (response.ok) {
        const data = await response.json()
        setSuppliers(data.data || [])
        setStats(data.stats || { total: 0, waitingReview: 0, recommended: 0, verified: 0 })
      } else {
        toast.error('Gagal memuat data verifikasi')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (supplierId: string, action: 'approve' | 'reject' | 'limit' | 'suspend') => {
    const confirmMessages = {
      approve: 'Approve verifikasi supplier ini?',
      reject: 'Reject verifikasi dan kirim kembali untuk revisi?',
      limit: 'Set status LIMITED untuk supplier ini?',
      suspend: 'Suspend supplier ini?',
    }

    if (!confirm(confirmMessages[action])) return

    let reason
    if (action === 'reject' || action === 'limit' || action === 'suspend') {
      const reasonPrompt = action === 'reject' ? 'Alasan penolakan:' : action === 'limit' ? 'Alasan LIMITED:' : 'Alasan suspend:'
      reason = prompt(reasonPrompt)
      if (!reason) return
    }

    try {
      const response = await fetch('/api/admin/supplier/verifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supplierId, action, reason }),
      })

      if (response.ok) {
        const successMessages = {
          approve: 'Berhasil menyetujui verifikasi',
          reject: 'Berhasil menolak dan mengirim kembali untuk revisi',
          limit: 'Berhasil set status LIMITED',
          suspend: 'Berhasil suspend supplier',
        }
        toast.success(successMessages[action] || 'Berhasil update status')
        fetchSuppliers()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Gagal mengupdate verifikasi')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Terjadi kesalahan')
    }
  }

  if (session?.user?.role !== 'ADMIN') {
    return (
      <ResponsivePageWrapper>
        <div className="text-center py-12">
          <p className="text-gray-500">Akses ditolak. Hanya admin.</p>
        </div>
      </ResponsivePageWrapper>
    )
  }

  return (
    <ResponsivePageWrapper>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Verifikasi Supplier</h1>
          <p className="text-sm text-gray-500 mt-1">Review mentor recommendations and approve supplier verifications</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileCheck className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Submission</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Waiting Mentor Review</p>
                  <p className="text-2xl font-bold">{stats.waitingReview}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <UserCheck className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Recommended by Mentor</p>
                  <p className="text-2xl font-bold">{stats.recommended}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Shield className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Terverifikasi</p>
                  <p className="text-2xl font-bold">{stats.verified}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters & Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <CardTitle>Daftar Verifikasi</CardTitle>
                <CardDescription>Review and approve supplier verifications</CardDescription>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-64">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recommended">Recommended (Need Action)</SelectItem>
                  <SelectItem value="pending">Waiting Mentor Review</SelectItem>
                  <SelectItem value="verified">Terverifikasi</SelectItem>
                  <SelectItem value="all">Semua</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Memuat data...</p>
              </div>
            ) : suppliers.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Tidak ada data verifikasi</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Lokasi</TableHead>
                      <TableHead>Membership</TableHead>
                      <TableHead>Mentor Review</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {suppliers.map((supplier) => (
                      <TableRow key={supplier.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {supplier.logo ? (
                              <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                                <Image
                                  src={supplier.logo}
                                  alt={supplier.companyName}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                            ) : (
                              <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                                <FileCheck className="w-5 h-5 text-gray-400" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium">{supplier.companyName}</p>
                              <p className="text-xs text-gray-500">{supplier.slug}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm font-medium">{supplier.user.name}</p>
                            <p className="text-xs text-gray-500">{supplier.user.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm">{supplier.province}</p>
                          <p className="text-xs text-gray-500">{supplier.city}</p>
                        </TableCell>
                        <TableCell>
                          {supplier.supplierMembership ? (
                            <Badge
                              variant={
                                supplier.supplierMembership.package.type === 'FREE'
                                  ? 'secondary'
                                  : 'default'
                              }
                            >
                              {supplier.supplierMembership.package.name}
                            </Badge>
                          ) : (
                            <Badge variant="outline">No Membership</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {supplier.mentorReviewedAt ? (
                            <div className="space-y-1">
                              <div className="flex items-center gap-1">
                                <UserCheck className="w-3 h-3 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">
                                  {new Date(supplier.mentorReviewedAt).toLocaleDateString('id-ID')}
                                </span>
                              </div>
                              {supplier.mentorRecommendation && (
                                <Badge 
                                  variant={supplier.mentorRecommendation === 'APPROVE' ? 'default' : supplier.mentorRecommendation === 'REJECT' ? 'destructive' : 'secondary'}
                                  className="text-xs"
                                >
                                  {supplier.mentorRecommendation}
                                </Badge>
                              )}
                              {supplier.mentorNotes && (
                                <p className="text-xs text-muted-foreground line-clamp-2" title={supplier.mentorNotes}>
                                  <MessageSquare className="w-3 h-3 inline mr-1" />
                                  {supplier.mentorNotes}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              {supplier.status === 'WAITING_REVIEW' ? 'Waiting...' : '-'}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {supplier.status === 'VERIFIED' ? (
                            <Badge variant="default" className="bg-green-500">
                              <Shield className="w-3 h-3 mr-1" />
                              Terverifikasi
                            </Badge>
                          ) : supplier.status === 'RECOMMENDED_BY_MENTOR' ? (
                            <Badge variant="default" className="bg-purple-500">
                              <UserCheck className="w-3 h-3 mr-1" />
                              Recommended
                            </Badge>
                          ) : supplier.status === 'WAITING_REVIEW' ? (
                            <Badge variant="outline" className="text-amber-600">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              Waiting Review
                            </Badge>
                          ) : supplier.status === 'LIMITED' ? (
                            <Badge variant="secondary" className="text-orange-600">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              Limited
                            </Badge>
                          ) : supplier.status === 'SUSPENDED' ? (
                            <Badge variant="destructive">
                              <Ban className="w-3 h-3 mr-1" />
                              Suspended
                            </Badge>
                          ) : (
                            <Badge variant="outline">
                              {supplier.status}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Link href={`/supplier/${supplier.slug}`} target="_blank">
                              <Button variant="ghost" size="sm" title="Lihat Profil">
                                <Eye className="w-4 h-4" />
                              </Button>
                            </Link>
                            
                            {/* Show actions only for RECOMMENDED_BY_MENTOR status */}
                            {supplier.status === 'RECOMMENDED_BY_MENTOR' && (
                              <>
                                {/* Approve if mentor recommended APPROVE */}
                                {supplier.mentorRecommendation === 'APPROVE' && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleAction(supplier.id, 'approve')}
                                    title="Final Approve → VERIFIED"
                                  >
                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                  </Button>
                                )}
                                
                                {/* Limit if mentor recommended APPROVE but admin wants to limit */}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleAction(supplier.id, 'limit')}
                                  title="Set LIMITED"
                                >
                                  <AlertCircle className="w-4 h-4 text-orange-600" />
                                </Button>

                                {/* Send back for revision */}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleAction(supplier.id, 'reject')}
                                  title="Send Back for Revision"
                                >
                                  <RotateCcw className="w-4 h-4 text-amber-600" />
                                </Button>
                                
                                {/* Suspend */}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleAction(supplier.id, 'suspend')}
                                  title="Suspend"
                                >
                                  <Ban className="w-4 h-4 text-red-600" />
                                </Button>
                              </>
                            )}

                            {/* For WAITING_REVIEW, show info only */}
                            {supplier.status === 'WAITING_REVIEW' && (
                              <span className="text-xs text-muted-foreground">Waiting mentor...</span>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ResponsivePageWrapper>
  )
}
