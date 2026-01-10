'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import {
  User,
  Mail,
  Phone,
  ShoppingBag,
  Calendar,
  DollarSign,
  Tag,
  UserCheck,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Copy,
  Check,
} from 'lucide-react'

interface OrderDetailModalProps {
  order: any
  open: boolean
  onClose: () => void
}

export default function OrderDetailModal({ order, open, onClose }: OrderDetailModalProps) {
  const [copied, setCopied] = useState(false)

  if (!order) return null

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return 'bg-green-500'
      case 'PENDING':
        return 'bg-yellow-500'
      case 'FAILED':
        return 'bg-red-500'
      case 'REFUNDED':
        return 'bg-gray-500'
      default:
        return 'bg-gray-400'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return <CheckCircle2 className="w-5 h-5" />
      case 'PENDING':
        return <Clock className="w-5 h-5" />
      case 'FAILED':
        return <XCircle className="w-5 h-5" />
      case 'REFUNDED':
        return <AlertCircle className="w-5 h-5" />
      default:
        return <AlertCircle className="w-5 h-5" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return 'Selesai'
      case 'PENDING':
        return 'Menunggu Pembayaran'
      case 'FAILED':
        return 'Gagal'
      case 'REFUNDED':
        return 'Refund'
      default:
        return status
    }
  }

  const getTypeText = (type: string) => {
    switch (type) {
      case 'MEMBERSHIP':
        return 'Membership'
      case 'PRODUCT':
        return 'Produk'
      case 'EVENT':
        return 'Event'
      default:
        return type
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const productName = order.membership?.membership?.name || order.product?.name || 'N/A'
  const productPrice = order.membership?.membership?.price || order.product?.price || 0

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[98vw] w-full max-h-[92vh] overflow-y-auto bg-white">
        <DialogHeader className="border-b border-gray-200 pb-3">
          <DialogTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <div className="w-7 h-7 bg-orange-500 rounded flex items-center justify-center">
              <ShoppingBag className="w-4 h-4 text-white" />
            </div>
            Detail Order
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 p-1">
          {/* Order Status & Info */}
          <div className="grid grid-cols-4 gap-3">
            <div className={`${getStatusColor(order.status)} bg-opacity-10 rounded-lg p-3 border ${getStatusColor(order.status)} border-opacity-20`}>
              <div className="flex items-center gap-2">
                <div className={`${getStatusColor(order.status)} p-2 rounded text-white flex-shrink-0`}>
                  {getStatusIcon(order.status)}
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500">Status Order</p>
                  <p className="text-base font-semibold text-gray-900">{getStatusText(order.status)}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-orange-500 rounded flex items-center justify-center text-white flex-shrink-0">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500">Tipe Order</p>
                  <p className="font-semibold text-base text-gray-900">{getTypeText(order.type)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-orange-500 rounded flex items-center justify-center text-white flex-shrink-0">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500">Total Bayar</p>
                  <p className="font-semibold text-base text-gray-900">Rp {Number(order.amount).toLocaleString('id-ID')}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gray-800 rounded flex items-center justify-center text-white flex-shrink-0">
                  <Calendar className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500">Tanggal</p>
                  <p className="font-semibold text-sm text-gray-900">
                    {new Date(order.createdAt).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Layout */}
          <div className="space-y-4">
            {/* Row 1 - Product Info and Customer Info */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Product Info */}
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <h3 className="text-base font-bold mb-3 flex items-center gap-2 text-gray-900">
                  <div className="w-7 h-7 bg-orange-500 rounded flex items-center justify-center">
                    <ShoppingBag className="w-4 h-4 text-white" />
                  </div>
                  Informasi Produk
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Nama Produk</span>
                    <span className="font-semibold text-sm text-gray-900">{productName}</span>
                  </div>
                  {order.membership?.membership?.duration && (
                    <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                      <span className="text-sm text-gray-600">Durasi</span>
                      <Badge className="text-xs bg-orange-500 text-white border-0">
                        {order.membership.membership.duration}
                      </Badge>
                    </div>
                  )}
                  <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Harga Produk</span>
                    <span className="font-semibold text-sm text-gray-900">Rp {Number(productPrice).toLocaleString('id-ID')}</span>
                  </div>
                  {order.coupon && (
                    <>
                      <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                        <span className="text-sm text-gray-600">Kode Kupon</span>
                        <Badge variant="secondary" className="font-mono text-xs bg-orange-50 text-orange-600 border border-orange-200">
                          {order.coupon.code}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                        <span className="text-sm text-gray-600">Diskon</span>
                        <span className="font-semibold text-sm text-red-600">
                          - Rp {Number(order.discountAmount || 0).toLocaleString('id-ID')}
                        </span>
                      </div>
                    </>
                  )}
                  <div className="bg-orange-50 rounded-lg p-3 border border-orange-200 mt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-base font-bold text-gray-900">Total Bayar</span>
                      <span className="text-lg font-bold text-orange-600">
                        Rp {Number(order.amount).toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Customer Info */}
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <h3 className="text-base font-bold mb-3 flex items-center gap-2 text-gray-900">
                  <div className="w-7 h-7 bg-orange-500 rounded flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  Data Pembeli
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 border border-gray-200">
                    <div className="w-10 h-10 bg-orange-500 rounded flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500">Nama Lengkap</p>
                      <p className="font-semibold text-sm text-gray-900 truncate">{order.user?.name || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 border border-gray-200">
                    <div className="w-10 h-10 bg-gray-800 rounded flex items-center justify-center flex-shrink-0">
                      <Mail className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500">Email</p>
                      <p className="font-semibold text-sm text-gray-900 truncate">{order.user?.email || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 border border-gray-200">
                    <div className="w-10 h-10 bg-gray-800 rounded flex items-center justify-center flex-shrink-0">
                      <Phone className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500">WhatsApp</p>
                      <p className="font-semibold text-sm text-gray-900 truncate">{order.user?.whatsapp || order.user?.phone || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Row 2 - Affiliate Info (Full Width) */}
            {order.affiliateConversion && order.affiliateConversion.affiliate ? (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <h3 className="text-base font-bold mb-3 flex items-center gap-2 text-gray-900">
                  <div className="w-7 h-7 bg-orange-500 rounded flex items-center justify-center">
                    <UserCheck className="w-4 h-4 text-white" />
                  </div>
                  Data Affiliate
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-white border border-gray-200">
                    <div className="w-9 h-9 bg-orange-500 rounded flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500">Nama Affiliate</p>
                      <p className="font-semibold text-sm text-gray-900 truncate">{order.affiliateConversion.affiliate.user?.name || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-white border border-gray-200">
                    <div className="w-9 h-9 bg-gray-800 rounded flex items-center justify-center flex-shrink-0">
                      <Mail className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500">Email Affiliate</p>
                      <p className="font-semibold text-sm text-gray-900 truncate">{order.affiliateConversion.affiliate.user?.email || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-white border border-gray-200">
                    <div className="w-9 h-9 bg-orange-500 rounded flex items-center justify-center flex-shrink-0">
                      <DollarSign className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-500">Komisi</p>
                      <p className="font-bold text-base text-orange-600">
                        Rp {Number(order.affiliateConversion.commissionAmount).toLocaleString('id-ID')}
                      </p>
                      <p className="text-xs text-gray-600">
                        Rate: <span className="font-semibold">{Number(order.affiliateConversion.commissionRate)}%</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-white border border-gray-200">
                    <div className="w-9 h-9 bg-gray-800 rounded flex items-center justify-center flex-shrink-0">
                      <Tag className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500">Kode Affiliate</p>
                      <p className="font-bold font-mono text-sm text-gray-900 truncate">{order.affiliateConversion.affiliate.affiliateCode}</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-500">Tidak ada data affiliate</p>
              </div>
            )}

            {/* Row 3 - Revenue Split (Full Width) */}
            {order.status === 'SUCCESS' && (
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <h3 className="text-base font-bold mb-3 text-gray-900 flex items-center gap-2">
                  <div className="w-7 h-7 bg-orange-500 rounded flex items-center justify-center">
                    <DollarSign className="w-4 h-4 text-white" />
                  </div>
                  Bagi Hasil
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {order.affiliateShare && (
                    <div className="text-center p-3 bg-orange-50 rounded-lg border border-orange-200">
                      <p className="text-xs text-gray-600 mb-1">Affiliate</p>
                      <p className="text-sm font-bold text-orange-600">
                        Rp {Number(order.affiliateShare).toLocaleString('id-ID')}
                      </p>
                    </div>
                  )}
                  {order.companyFee && (
                    <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-xs text-gray-600 mb-1">Admin Fee</p>
                      <p className="text-sm font-bold text-gray-900">
                        Rp {Number(order.companyFee).toLocaleString('id-ID')}
                      </p>
                    </div>
                  )}
                  {order.founderShare && (
                    <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-xs text-gray-600 mb-1">Founder</p>
                      <p className="text-sm font-bold text-gray-900">
                        Rp {Number(order.founderShare).toLocaleString('id-ID')}
                      </p>
                    </div>
                  )}
                  {order.coFounderShare && (
                    <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-xs text-gray-600 mb-1">Co-Founder</p>
                      <p className="text-sm font-bold text-gray-900">
                        Rp {Number(order.coFounderShare).toLocaleString('id-ID')}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 justify-end pt-3 border-t border-gray-200">
            <Button 
              variant="outline" 
              onClick={onClose} 
              className="border border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold px-4 text-sm"
            >
              Tutup
            </Button>
            {order.status === 'PENDING' && (
              <Button className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-4 text-sm">
                Update Status
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
