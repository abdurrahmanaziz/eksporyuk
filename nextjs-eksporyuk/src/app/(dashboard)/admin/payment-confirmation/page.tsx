'use client';

import { useState, useEffect } from 'react';
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
// Using Dialog for confirmation modals instead of AlertDialog
import { 
  Clock,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  Loader2,
  Eye,
  User,
  Package,
  CreditCard,
  Calendar,
  ExternalLink,
  AlertTriangle,
  FileText,
  Image as ImageIcon,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface Transaction {
  id: string;
  invoiceNumber?: string | null;
  type: string;
  status: string;
  amount: number;
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  paymentMethod: string | null;
  paymentUrl: string | null;
  reference: string | null;
  createdAt: string;
  paidAt: string | null;
  expiredAt: string | null;
  metadata?: any;
  notes?: string | null;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    whatsapp: string | null;
  };
  product?: {
    id: string;
    name: string;
  } | null;
  course?: {
    id: string;
    title: string;
  } | null;
  membership?: {
    membershipId: string;
    membership: {
      id: string;
      name: string;
      duration: number;
    }
  } | null;
  coupon?: {
    code: string;
  } | null;
  affiliateConversion?: {
    commissionAmount: number;
    affiliate: {
      user: {
        name: string;
      }
    }
  } | null;
}

export default function PaymentConfirmationPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    expired: 0,
  });
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 0 });
  const [filters, setFilters] = useState({
    search: '',
    status: 'PENDING',
  });

  // Check admin access
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
      router.push('/dashboard');
    }
  }, [status, session, router]);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'ADMIN') {
      fetchTransactions();
    }
  }, [pagination.page, status, session]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...filters,
      });

      const response = await fetch(`/api/admin/payment-confirmation?${params}`);
      const data = await response.json();

      if (data.success) {
        setTransactions(data.transactions);
        setStats(data.stats);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    setPagination({ ...pagination, page: 1 });
    fetchTransactions();
  };

  const handleConfirmPayment = async () => {
    if (!selectedTransaction) return;
    
    setProcessing(true);
    try {
      const response = await fetch(`/api/admin/sales/${selectedTransaction.id}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (data.success) {
        alert('✅ Pembayaran berhasil dikonfirmasi! Membership/produk telah diaktifkan.');
        setConfirmDialogOpen(false);
        setDetailOpen(false);
        fetchTransactions();
      } else {
        alert(`❌ Error: ${data.error || 'Gagal mengkonfirmasi pembayaran'}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Terjadi kesalahan saat mengkonfirmasi pembayaran');
    } finally {
      setProcessing(false);
    }
  };

  const handleRejectPayment = async () => {
    if (!selectedTransaction || !rejectReason.trim()) {
      alert('⚠️ Mohon isi alasan penolakan');
      return;
    }
    
    setProcessing(true);
    try {
      const response = await fetch(`/api/admin/sales/${selectedTransaction.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason }),
      });

      const data = await response.json();

      if (data.success) {
        alert('✅ Pembayaran berhasil ditolak. Notifikasi telah dikirim ke customer.');
        setRejectDialogOpen(false);
        setDetailOpen(false);
        setRejectReason('');
        fetchTransactions();
      } else {
        alert(`❌ Error: ${data.error || 'Gagal menolak pembayaran'}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Terjadi kesalahan saat menolak pembayaran');
    } finally {
      setProcessing(false);
    }
  };

  const getProductName = (tx: Transaction) => {
    if (tx.membership?.membership?.name) return tx.membership.membership.name;
    if (tx.product?.name) return tx.product.name;
    if (tx.course?.title) return tx.course.title;
    return tx.type || '-';
  };

  const getPaymentUrl = (tx: Transaction) => {
    const xenditVA = tx.metadata?.xenditVANumber;
    if (xenditVA && xenditVA.startsWith('http')) return xenditVA;
    if (tx.paymentUrl) return tx.paymentUrl;
    if (tx.reference && tx.reference.startsWith('http')) return tx.reference;
    return null;
  };

  const isExpired = (tx: Transaction) => {
    if (!tx.expiredAt) return false;
    return new Date(tx.expiredAt) < new Date();
  };

  if (status === 'loading') {
    return (
      <ResponsivePageWrapper>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </ResponsivePageWrapper>
    );
  }

  if (session?.user?.role !== 'ADMIN') {
    return null;
  }

  return (
    <ResponsivePageWrapper>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 p-8">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <ShieldCheck className="w-8 h-8 text-orange-600" />
              Konfirmasi Pembayaran Manual
            </h1>
            <p className="text-gray-600 mt-1">Approve atau reject transaksi pending yang memerlukan verifikasi</p>
          </div>
          <Button onClick={fetchTransactions} variant="outline" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-yellow-500 to-orange-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pending Payment</CardTitle>
              <Clock className="h-5 w-5" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pending}</div>
              <p className="text-xs opacity-75">Menunggu konfirmasi</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-red-500 to-red-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Expired</CardTitle>
              <AlertTriangle className="h-5 w-5" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.expired}</div>
              <p className="text-xs opacity-75">Melewati batas waktu</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Review</CardTitle>
              <FileText className="h-5 w-5" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs opacity-75">Transaksi butuh review</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="shadow-lg border-0">
          <CardHeader className="bg-gray-50">
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filter
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                placeholder="Cari email atau invoice..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="px-3 py-2 border rounded-md"
              >
                <option value="PENDING">Pending</option>
                <option value="ALL">Semua Status</option>
                <option value="SUCCESS">Success</option>
                <option value="FAILED">Failed</option>
              </select>
              <Button onClick={applyFilters} className="bg-orange-600 hover:bg-orange-700">
                <Search className="w-4 h-4 mr-2" />
                Cari
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="shadow-lg border-0">
          <CardHeader className="bg-gray-50">
            <CardTitle>Transaksi Pending ({pagination.total})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <p className="text-gray-600 text-lg">Tidak ada transaksi pending</p>
                <p className="text-gray-400 text-sm mt-2">Semua pembayaran sudah diproses</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[130px]">Invoice</TableHead>
                    <TableHead className="w-[200px]">Produk</TableHead>
                    <TableHead className="w-[180px]">Customer</TableHead>
                    <TableHead className="w-[110px]">Jumlah</TableHead>
                    <TableHead className="w-[100px]">Metode</TableHead>
                    <TableHead className="w-[90px]">Status</TableHead>
                    <TableHead className="w-[140px]">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((tx) => {
                    const expired = isExpired(tx);
                    const paymentUrl = getPaymentUrl(tx);
                    
                    return (
                      <TableRow key={tx.id} className={expired ? 'bg-red-50' : ''}>
                        {/* Invoice */}
                        <TableCell>
                          <div className="font-mono font-bold text-orange-600 text-sm">
                            {tx.invoiceNumber || `INV${tx.id.slice(0, 5).toUpperCase()}`}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {new Date(tx.createdAt).toLocaleDateString('id-ID', { 
                              day: '2-digit', 
                              month: 'short', 
                              year: 'numeric' 
                            })}
                          </div>
                          {expired && (
                            <Badge variant="destructive" className="text-xs mt-1">
                              EXPIRED
                            </Badge>
                          )}
                        </TableCell>

                        {/* Produk */}
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm text-gray-900 font-semibold">{getProductName(tx)}</div>
                            <div className="flex items-center gap-2">
                              <Badge 
                                variant="outline" 
                                className={
                                  tx.type === 'MEMBERSHIP' ? 'bg-purple-50 text-purple-700 border-purple-300' :
                                  tx.type === 'COURSE' ? 'bg-blue-50 text-blue-700 border-blue-300' :
                                  'bg-green-50 text-green-700 border-green-300'
                                }
                              >
                                {tx.type}
                              </Badge>
                              {paymentUrl && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0"
                                  onClick={() => window.open(paymentUrl, '_blank')}
                                  title="Link Pembayaran Xendit"
                                >
                                  <ExternalLink className="w-3 h-3 text-blue-600" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </TableCell>

                        {/* Customer */}
                        <TableCell>
                          <div className="flex items-start gap-2">
                            <User className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                            <div>
                              <div className="font-medium text-sm">{tx.customerName || tx.user.name}</div>
                              <div className="text-xs text-gray-500">{tx.customerEmail || tx.user.email}</div>
                            </div>
                          </div>
                        </TableCell>

                        {/* Jumlah */}
                        <TableCell>
                          <div className="font-bold text-green-600">
                            Rp {Number(tx.amount).toLocaleString('id-ID')}
                          </div>
                        </TableCell>

                        {/* Metode */}
                        <TableCell>
                          <div className="text-sm">{tx.paymentMethod || 'N/A'}</div>
                        </TableCell>

                        {/* Status */}
                        <TableCell>
                          <Badge 
                            variant="secondary"
                            className="bg-yellow-500 text-white"
                          >
                            {tx.status}
                          </Badge>
                        </TableCell>

                        {/* Aksi */}
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 gap-1 w-full"
                            onClick={() => {
                              setSelectedTransaction(tx);
                              setDetailOpen(true);
                            }}
                          >
                            <Eye className="w-3 h-3" />
                            <span className="text-xs">Review</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}

            {pagination.totalPages > 1 && (
              <div className="flex justify-between mt-6 pt-6 border-t">
                <div className="text-sm text-gray-600">
                  Halaman {pagination.page} dari {pagination.totalPages}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                    disabled={pagination.page === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                    disabled={pagination.page === pagination.totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Detail Transaction Modal */}
        <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-orange-600" />
                Review Pembayaran
              </DialogTitle>
              <DialogDescription>
                Verifikasi detail transaksi sebelum approve atau reject
              </DialogDescription>
            </DialogHeader>

            {selectedTransaction && (
              <div className="space-y-6">
                {/* Expired Warning */}
                {isExpired(selectedTransaction) && (
                  <Card className="border-2 border-red-500 bg-red-50">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3 text-red-700">
                        <AlertTriangle className="w-5 h-5" />
                        <div>
                          <div className="font-bold">Pembayaran Sudah Expired</div>
                          <div className="text-sm">
                            Expired pada: {new Date(selectedTransaction.expiredAt!).toLocaleString('id-ID')}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Invoice Info */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      Informasi Invoice
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Invoice Number:</span>
                      <span className="font-mono font-bold text-orange-600">
                        {selectedTransaction.invoiceNumber || `INV${selectedTransaction.id.slice(0, 8).toUpperCase()}`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Transaction ID:</span>
                      <span className="font-mono text-xs text-gray-500">{selectedTransaction.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tanggal:</span>
                      <span>{new Date(selectedTransaction.createdAt).toLocaleString('id-ID')}</span>
                    </div>
                    {selectedTransaction.expiredAt && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Expired At:</span>
                        <span className={isExpired(selectedTransaction) ? 'text-red-600 font-bold' : 'text-gray-700'}>
                          {new Date(selectedTransaction.expiredAt).toLocaleString('id-ID')}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Status:</span>
                      <Badge variant="secondary" className="bg-yellow-500 text-white">
                        {selectedTransaction.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Customer Info */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Data Customer
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Nama:</span>
                      <span className="font-medium">{selectedTransaction.customerName || selectedTransaction.user.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Email:</span>
                      <span>{selectedTransaction.customerEmail || selectedTransaction.user.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Phone:</span>
                      <span>{selectedTransaction.customerPhone || selectedTransaction.user.phone || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">WhatsApp:</span>
                      <span>{selectedTransaction.user.whatsapp || '-'}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Product Info */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      Detail Produk
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Tipe:</span>
                      <Badge 
                        variant="outline"
                        className={
                          selectedTransaction.type === 'MEMBERSHIP' ? 'bg-purple-50 text-purple-700 border-purple-300' :
                          selectedTransaction.type === 'COURSE' ? 'bg-blue-50 text-blue-700 border-blue-300' :
                          'bg-green-50 text-green-700 border-green-300'
                        }
                      >
                        {selectedTransaction.type}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Nama Produk:</span>
                      <span className="font-medium">{getProductName(selectedTransaction)}</span>
                    </div>
                    {selectedTransaction.membership && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Durasi:</span>
                        <span className="font-medium">{selectedTransaction.membership.membership.duration} bulan</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Harga:</span>
                      <span className="font-bold text-green-600 text-lg">
                        Rp {Number(selectedTransaction.amount).toLocaleString('id-ID')}
                      </span>
                    </div>
                    {selectedTransaction.coupon && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Kupon:</span>
                        <Badge variant="secondary" className="font-mono">
                          {selectedTransaction.coupon.code}
                        </Badge>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Payment Info */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      Informasi Pembayaran
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Metode:</span>
                      <span className="font-medium">{selectedTransaction.paymentMethod || 'Belum dipilih'}</span>
                    </div>
                    {getPaymentUrl(selectedTransaction) && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Link Pembayaran:</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(getPaymentUrl(selectedTransaction)!, '_blank')}
                          className="gap-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Buka Xendit
                        </Button>
                      </div>
                    )}
                    {selectedTransaction.reference && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Reference:</span>
                        <span className="font-mono text-xs">{selectedTransaction.reference}</span>
                      </div>
                    )}
                    {selectedTransaction.notes && (
                      <div className="pt-2 border-t">
                        <div className="text-gray-600 mb-1">Catatan:</div>
                        <div className="text-gray-700 bg-gray-50 p-2 rounded">{selectedTransaction.notes}</div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Affiliate Info */}
                {selectedTransaction.affiliateConversion && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Informasi Affiliate
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Nama Affiliate:</span>
                        <span className="font-medium">
                          {selectedTransaction.affiliateConversion.affiliate.user.name}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Komisi:</span>
                        <span className="font-bold text-orange-600">
                          Rp {Number(selectedTransaction.affiliateConversion.commissionAmount).toLocaleString('id-ID')}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Action Buttons */}
                <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-white">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2 text-orange-700">
                      <ShieldCheck className="w-4 h-4" />
                      Keputusan
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Confirm Button */}
                      <Button
                        className="w-full gap-2 bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg transition-all"
                        onClick={() => setConfirmDialogOpen(true)}
                        disabled={processing}
                      >
                        <CheckCircle className="w-4 h-4" />
                        Approve & Aktivasi
                      </Button>
                      
                      {/* Reject Button */}
                      <Button
                        variant="destructive"
                        className="w-full gap-2 shadow-md hover:shadow-lg transition-all"
                        onClick={() => setRejectDialogOpen(true)}
                        disabled={processing}
                      >
                        <XCircle className="w-4 h-4" />
                        Reject Pembayaran
                      </Button>
                    </div>

                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                      <p className="text-xs text-blue-700">
                        ⚠️ <strong>Perhatian:</strong> Approve akan langsung mengaktifkan membership/produk dan mengirim email konfirmasi. 
                        Reject akan membatalkan transaksi dan memberi notifikasi ke customer.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Confirm Dialog */}
        <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-5 h-5" />
                Konfirmasi Approve Pembayaran
              </DialogTitle>
              <DialogDescription className="space-y-2">
                <p>Anda akan approve pembayaran untuk:</p>
                {selectedTransaction && (
                  <div className="bg-gray-50 p-3 rounded-md space-y-1 text-sm">
                    <div><strong>Invoice:</strong> {selectedTransaction.invoiceNumber || `INV${selectedTransaction.id.slice(0, 8).toUpperCase()}`}</div>
                    <div><strong>Customer:</strong> {selectedTransaction.customerName || selectedTransaction.user.name}</div>
                    <div><strong>Produk:</strong> {getProductName(selectedTransaction)}</div>
                    <div><strong>Jumlah:</strong> Rp {Number(selectedTransaction.amount).toLocaleString('id-ID')}</div>
                  </div>
                )}
                <p className="text-red-600 font-semibold mt-3">
                  ⚠️ Tindakan ini akan langsung mengaktifkan membership/produk dan tidak bisa dibatalkan!
                </p>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmDialogOpen(false)} disabled={processing}>Batal</Button>
              <Button 
                onClick={handleConfirmPayment}
                disabled={processing}
                className="bg-green-600 hover:bg-green-700"
              >
                {processing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                Ya, Approve Sekarang
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reject Dialog */}
        <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <XCircle className="w-5 h-5" />
                Konfirmasi Reject Pembayaran
              </DialogTitle>
              <DialogDescription className="space-y-3">
                <p>Anda akan reject pembayaran untuk:</p>
                {selectedTransaction && (
                  <div className="bg-gray-50 p-3 rounded-md space-y-1 text-sm">
                    <div><strong>Invoice:</strong> {selectedTransaction.invoiceNumber || `INV${selectedTransaction.id.slice(0, 8).toUpperCase()}`}</div>
                    <div><strong>Customer:</strong> {selectedTransaction.customerName || selectedTransaction.user.name}</div>
                    <div><strong>Produk:</strong> {getProductName(selectedTransaction)}</div>
                  </div>
                )}
                <div className="pt-3">
                  <label className="block text-sm font-medium mb-2 text-gray-700">
                    Alasan Penolakan: <span className="text-red-600">*</span>
                  </label>
                  <Textarea
                    placeholder="Contoh: Bukti transfer tidak valid, nominal tidak sesuai, dll..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    rows={4}
                    className="w-full"
                  />
                </div>
                <p className="text-red-600 font-semibold">
                  ⚠️ Customer akan menerima email notifikasi penolakan dengan alasan ini!
                </p>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setRejectDialogOpen(false); setRejectReason(''); }} disabled={processing}>Batal</Button>
              <Button 
                onClick={handleRejectPayment}
                disabled={processing || !rejectReason.trim()}
                className="bg-red-600 hover:bg-red-700"
              >
                {processing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <XCircle className="w-4 h-4 mr-2" />}
                Ya, Reject Sekarang
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
    </ResponsivePageWrapper>
  );
}
