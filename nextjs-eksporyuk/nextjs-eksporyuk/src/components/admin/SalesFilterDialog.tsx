'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Filter } from 'lucide-react'

interface SalesFilter {
  startDate: string
  endDate: string
  status: string
  type: string
  userId: string
  affiliateId: string
  productId: string
  search: string
  membershipName: string
  productName: string
  courseName: string
}

interface SalesFilterDialogProps {
  filters: SalesFilter
  onFilterChange: (filters: SalesFilter) => void
  users: Array<{ id: string; name: string; email: string }>
  affiliates: Array<{ id: string; user: { name: string; email: string } }>
}

export default function SalesFilterDialog({
  filters,
  onFilterChange,
  users,
  affiliates,
}: SalesFilterDialogProps) {
  const [open, setOpen] = useState(false)
  const [localFilters, setLocalFilters] = useState<SalesFilter>(filters)

  const handleApply = () => {
    onFilterChange(localFilters)
    setOpen(false)
  }

  const handleReset = () => {
    const resetFilters: SalesFilter = {
      startDate: '',
      endDate: '',
      status: 'ALL',
      type: 'ALL',
      userId: '',
      affiliateId: '',
      productId: '',
      search: '',
      membershipName: '',
      productName: '',
      courseName: '',
    }
    setLocalFilters(resetFilters)
    onFilterChange(resetFilters)
    setOpen(false)
  }

  const activeFilterCount = Object.values(localFilters).filter(
    (v) => v && v !== 'ALL' && v !== ''
  ).length

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button variant="outline" className="flex items-center gap-2">
          <Filter className="w-4 h-4" />
          Filter Data
          {activeFilterCount > 0 && (
            <span className="ml-1 px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Filter Data Penjualan</DialogTitle>
          <DialogDescription>
            Pilih kriteria filter untuk melihat data penjualan yang spesifik
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Date Presets */}
          <div>
            <Label className="mb-2 block">Periode Waktu</Label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const now = new Date()
                  setLocalFilters({
                    ...localFilters,
                    startDate: now.toISOString().split('T')[0],
                    endDate: now.toISOString().split('T')[0],
                  })
                }}
              >
                Hari Ini
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const now = new Date()
                  const last7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
                  setLocalFilters({
                    ...localFilters,
                    startDate: last7.toISOString().split('T')[0],
                    endDate: now.toISOString().split('T')[0],
                  })
                }}
              >
                7 Hari
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const now = new Date()
                  const last15 = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000)
                  setLocalFilters({
                    ...localFilters,
                    startDate: last15.toISOString().split('T')[0],
                    endDate: now.toISOString().split('T')[0],
                  })
                }}
              >
                15 Hari
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const now = new Date()
                  const last30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
                  setLocalFilters({
                    ...localFilters,
                    startDate: last30.toISOString().split('T')[0],
                    endDate: now.toISOString().split('T')[0],
                  })
                }}
              >
                30 Hari
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const now = new Date()
                  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
                  setLocalFilters({
                    ...localFilters,
                    startDate: firstDay.toISOString().split('T')[0],
                    endDate: now.toISOString().split('T')[0],
                  })
                }}
              >
                Bulan Ini
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const now = new Date()
                  const last3Months = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
                  setLocalFilters({
                    ...localFilters,
                    startDate: last3Months.toISOString().split('T')[0],
                    endDate: now.toISOString().split('T')[0],
                  })
                }}
              >
                3 Bulan
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const now = new Date()
                  const last6Months = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000)
                  setLocalFilters({
                    ...localFilters,
                    startDate: last6Months.toISOString().split('T')[0],
                    endDate: now.toISOString().split('T')[0],
                  })
                }}
              >
                6 Bulan
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const now = new Date()
                  const lastYear = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
                  setLocalFilters({
                    ...localFilters,
                    startDate: lastYear.toISOString().split('T')[0],
                    endDate: now.toISOString().split('T')[0],
                  })
                }}
              >
                1 Tahun
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const now = new Date()
                  const last2Years = new Date(now.getTime() - 730 * 24 * 60 * 60 * 1000)
                  setLocalFilters({
                    ...localFilters,
                    startDate: last2Years.toISOString().split('T')[0],
                    endDate: now.toISOString().split('T')[0],
                  })
                }}
              >
                2 Tahun
              </Button>
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Tanggal Mulai (Custom)</Label>
              <Input
                type="date"
                value={localFilters.startDate}
                onChange={(e) =>
                  setLocalFilters({ ...localFilters, startDate: e.target.value })
                }
              />
            </div>
            <div>
              <Label>Tanggal Akhir</Label>
              <Input
                type="date"
                value={localFilters.endDate}
                onChange={(e) =>
                  setLocalFilters({ ...localFilters, endDate: e.target.value })
                }
              />
            </div>
          </div>

          {/* Search */}
          <div>
            <Label>Pencarian (ID Order, Nama, Email)</Label>
            <Input
              placeholder="Cari berdasarkan ID order, nama pembeli, atau email..."
              value={localFilters.search}
              onChange={(e) =>
                setLocalFilters({ ...localFilters, search: e.target.value })
              }
            />
          </div>

          {/* Status */}
          <div>
            <Label>Status Order</Label>
            <select
              className="w-full p-2 border rounded-lg"
              value={localFilters.status}
              onChange={(e) =>
                setLocalFilters({ ...localFilters, status: e.target.value })
              }
            >
              <option value="ALL">Semua Status</option>
              <option value="PENDING">Menunggu Pembayaran</option>
              <option value="SUCCESS">Selesai</option>
              <option value="FAILED">Gagal</option>
              <option value="REFUNDED">Refund</option>
            </select>
          </div>

          {/* Type */}
          <div>
            <Label>Tipe Order</Label>
            <select
              className="w-full p-2 border rounded-lg"
              value={localFilters.type}
              onChange={(e) =>
                setLocalFilters({ ...localFilters, type: e.target.value })
              }
            >
              <option value="ALL">Semua Tipe</option>
              <option value="MEMBERSHIP">Membership</option>
              <option value="PRODUCT">Produk</option>
              <option value="EVENT">Event</option>
            </select>
          </div>

          {/* User */}
          <div>
            <Label>Pembeli</Label>
            <select
              className="w-full p-2 border rounded-lg"
              value={localFilters.userId}
              onChange={(e) =>
                setLocalFilters({ ...localFilters, userId: e.target.value })
              }
            >
              <option value="">Semua Pembeli</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.email})
                </option>
              ))}
            </select>
          </div>

          {/* Affiliate */}
          <div>
            <Label>Affiliate</Label>
            <select
              className="w-full p-2 border rounded-lg"
              value={localFilters.affiliateId}
              onChange={(e) =>
                setLocalFilters({ ...localFilters, affiliateId: e.target.value })
              }
            >
              <option value="">Semua Affiliate</option>
              {affiliates.map((affiliate) => (
                <option key={affiliate.id} value={affiliate.id}>
                  {affiliate.user.name} ({affiliate.user.email})
                </option>
              ))}
            </select>
          </div>

          {/* Membership Name Filter */}
          <div>
            <Label>Nama Paket/Membership</Label>
            <Input
              placeholder="Cari berdasarkan nama paket membership..."
              value={localFilters.membershipName}
              onChange={(e) =>
                setLocalFilters({ ...localFilters, membershipName: e.target.value })
              }
            />
          </div>

          {/* Product Name Filter */}
          <div>
            <Label>Nama Produk</Label>
            <Input
              placeholder="Cari berdasarkan nama produk..."
              value={localFilters.productName}
              onChange={(e) =>
                setLocalFilters({ ...localFilters, productName: e.target.value })
              }
            />
          </div>

          {/* Course Name Filter */}
          <div>
            <Label>Nama Kelas/Course</Label>
            <Input
              placeholder="Cari berdasarkan nama kelas..."
              value={localFilters.courseName}
              onChange={(e) =>
                setLocalFilters({ ...localFilters, courseName: e.target.value })
              }
            />
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={handleReset}>
            Reset Filter
          </Button>
          <Button onClick={handleApply}>Terapkan Filter</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
