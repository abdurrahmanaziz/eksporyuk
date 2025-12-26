'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
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
} from '@/components/ui/dialog';
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  DollarSign, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  Download,
  Search,
  Filter,
  Loader2,
  ShoppingBag,
  ExternalLink,
  Eye,
  User,
  Package,
  CreditCard,
  Calendar,
  Tag,
  Share2,
  Percent,
  CheckSquare,
  Square,
  XCircle,
  RefreshCw,
  Bell,
  AlertCircle,
  Copy,
  Send,
  MessageCircle
} from 'lucide-react';

// WhatsApp Icon Component
const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
  </svg>
);

interface Transaction {
  id: string;
  invoiceNumber?: string | null;
  type: string;
  status: string;
  amount: number;
  description?: string | null;
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  paymentMethod: string | null;
  paymentUrl: string | null;
  reference: string | null;
  affiliateId: string | null;
  affiliateShare: number | null;
  createdAt: string;
  paidAt: string | null;
  metadata?: any;
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
    reminders?: any;
  } | null;
  course?: {
    id: string;
    title: string;
    reminders?: any;
  } | null;
  membership?: {
    membership: {
      id: string;
      name: string;
      duration?: string;
      reminders?: any;
    }
  } | null;
  // UserMembership linked to transaction (for determining membership tier)
  userMembership?: {
    id: string;
    membershipId: string;
    userId: string;
    transactionId?: string;
    membership?: {
      id: string;
      name: string;
      duration?: string;
    }
  } | null;
  coupon?: {
    code: string;
  } | null;
  affiliateConversion?: {
    commissionAmount: number;
    paidOut: boolean;
    affiliate: {
      user: {
        id: string;
        name: string;
        email: string;
        whatsapp: string | null;
      }
    }
  } | null;
  // Virtual affiliate data from metadata (for PENDING transactions)
  affiliateFromMetadata?: {
    name: string | null;
    affiliateId: string | null;
    commissionAmount: number | null;
    affiliate?: {
      id: string;
      user: {
        id: string;
        name: string;
        email: string;
        whatsapp: string | null;
      }
    } | null;
  } | null;
}

interface FollowUpTemplate {
  id: string;
  title: string;
  description: string | null;
  whatsappMessage: string;
  sequenceOrder: number;
}

export default function AdminSalesPage() {
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkActionOpen, setBulkActionOpen] = useState(false);
  const [bulkAction, setBulkAction] = useState<string>('');
  const [processingBulk, setProcessingBulk] = useState(false);
  
  // Follow Up States
  const [followUpOpen, setFollowUpOpen] = useState(false);
  const [followUpTx, setFollowUpTx] = useState<Transaction | null>(null);
  const [followUpTemplates, setFollowUpTemplates] = useState<FollowUpTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [processedMessage, setProcessedMessage] = useState('');
  
  const [stats, setStats] = useState({
    total: { count: 0, amount: 0 },
    success: { count: 0, amount: 0 },
    pending: { count: 0, amount: 0 },
  });
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 0 });
  const [filters, setFilters] = useState({
    search: '',
    status: 'ALL',
    type: 'ALL',
    invoice: '',
    paymentMethod: 'ALL',
    dateFrom: '',
    dateTo: '',
  });

  useEffect(() => {
    fetchSales();
  }, [pagination.page, pagination.limit]);

  const fetchSales = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...filters,
      });

      const response = await fetch(`/api/admin/sales?${params}`);
      const data = await response.json();

      if (data.success) {
        // Debug: Log first transaction to verify affiliate data
        if (data.transactions.length > 0) {
          console.log('[Admin Sales] Sample transaction:', {
            id: data.transactions[0].id,
            amount: data.transactions[0].amount,
            affiliateConversion: data.transactions[0].affiliateConversion ? {
              affiliateName: data.transactions[0].affiliateConversion.affiliate?.user?.name,
              commissionAmount: data.transactions[0].affiliateConversion.commissionAmount,
            } : null
          });
        }
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

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await fetch('/api/admin/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filters }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        const csv = convertToCSV(data.data);
        downloadCSV(csv, `sales-${new Date().toISOString().split('T')[0]}.csv`);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setExporting(false);
    }
  };

  const convertToCSV = (data: Transaction[]) => {
    const headers = ['Invoice', 'Tanggal', 'Customer', 'Email', 'Phone', 'Tipe', 'Item', 'Amount', 'Status', 'Payment', 'Kupon', 'Affiliate', 'Komisi'];
    const rows = data.map(tx => [
      tx.invoiceNumber || tx.id.slice(0, 8).toUpperCase(),
      new Date(tx.createdAt).toLocaleString('id-ID'),
      tx.customerName || tx.user.name,
      tx.customerEmail || tx.user.email,
      tx.customerPhone || tx.user.phone || '',
      tx.type,
      tx.product?.name || tx.course?.title || tx.membership?.membership.name || '',
      Number(tx.amount),
      tx.status,
      tx.paymentMethod || '',
      tx.coupon?.code || '',
      tx.affiliateConversion?.affiliate.user.name || tx.affiliateFromMetadata?.name || tx.metadata?.affiliate_name || tx.metadata?.affiliateName || '',
      tx.status === 'SUCCESS' ? (tx.affiliateConversion?.commissionAmount || 0) : (tx.affiliateFromMetadata?.name ? 'Pending' : 0),
    ]);
    return [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
  };

  const downloadCSV = (csv: string, filename: string) => {
    const blob = new Blob([csv], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };

  const applyFilters = () => {
    setPagination({ ...pagination, page: 1 });
    setSelectedIds([]);
    fetchSales();
  };

  const handleSelectAll = () => {
    if (selectedIds.length === transactions.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(transactions.map(tx => tx.id));
    }
  };

  const handleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(selectedId => selectedId !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedIds.length === 0) return;

    setProcessingBulk(true);
    try {
      const response = await fetch('/api/admin/sales/bulk-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: bulkAction,
          transactionIds: selectedIds,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        const actionLabels: Record<string, string> = {
          SUCCESS: 'dikonfirmasi',
          PENDING: 'diubah ke pending',
          FAILED: 'dibatalkan',
          RESEND_NOTIFICATION: 'notifikasi terkirim'
        };
        const actionLabel = actionLabels[bulkAction] || 'diproses';
        
        toast.success(
          `Berhasil! ${selectedIds.length} transaksi ${actionLabel}`,
          {
            description: bulkAction === 'RESEND_NOTIFICATION' 
              ? 'WhatsApp notifikasi sedang dikirim ke customer'
              : 'Data telah diperbarui di database',
            duration: 5000
          }
        );
        
        setSelectedIds([]);
        setBulkActionOpen(false);
        setBulkAction('');
        fetchSales();
      } else {
        toast.error(
          'Gagal memproses bulk action',
          {
            description: data.message || 'Terjadi kesalahan saat memproses transaksi',
            duration: 5000
          }
        );
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error(
        'Terjadi kesalahan',
        {
          description: 'Gagal menghubungi server. Silakan coba lagi.',
          duration: 5000
        }
      );
    } finally {
      setProcessingBulk(false);
    }
  };

  const handleLimitChange = (newLimit: number) => {
    setPagination({ ...pagination, limit: newLimit, page: 1 });
    setSelectedIds([]);
  };

  // Fetch follow up templates for membership
  const fetchFollowUpTemplates = async (membershipId: string) => {
    setLoadingTemplates(true);
    try {
      const res = await fetch(`/api/admin/membership-plans/${membershipId}/follow-ups`);
      if (res.ok) {
        const data = await res.json();
        const templates = (data.followUps || []).filter((t: FollowUpTemplate) => t.whatsappMessage);
        setFollowUpTemplates(templates);
        if (templates.length > 0) {
          setSelectedTemplateId(templates[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
      setFollowUpTemplates([]);
    } finally {
      setLoadingTemplates(false);
    }
  };

  // Process template message with shortcodes
  const processTemplateMessage = (template: FollowUpTemplate | undefined, tx: Transaction) => {
    if (!template) return '';
    
    const productName = tx.product?.name || tx.course?.title || tx.membership?.membership.name || 'produk';
    const customerName = tx.customerName || tx.user.name || 'Pelanggan';
    const firstName = customerName.split(' ')[0];
    
    let message = template.whatsappMessage
      .replace(/\{name\}/g, customerName)
      .replace(/\{first_name\}/g, firstName)
      .replace(/\{email\}/g, tx.customerEmail || tx.user.email || '')
      .replace(/\{phone\}/g, tx.customerPhone || tx.user.phone || '')
      .replace(/\{whatsapp\}/g, tx.user.whatsapp || tx.customerPhone || '')
      .replace(/\{plan_name\}/g, productName)
      .replace(/\{plan_price\}/g, `Rp ${Number(tx.amount).toLocaleString('id-ID')}`)
      .replace(/\{affiliate_name\}/g, 'Admin EksporYuk')
      .replace(/\{affiliate_whatsapp\}/g, '')
      .replace(/\{payment_link\}/g, tx.paymentUrl || '')
      .replace(/\{order_date\}/g, new Date(tx.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }))
      .replace(/\{days_since_order\}/g, Math.floor((Date.now() - new Date(tx.createdAt).getTime()) / (1000 * 60 * 60 * 24)) + ' hari')
      .replace(/\{deadline\}/g, '');
    
    return message;
  };

  // Handle template selection change
  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const template = followUpTemplates.find(t => t.id === templateId);
    if (template && followUpTx) {
      setProcessedMessage(processTemplateMessage(template, followUpTx));
    }
  };

  // Open follow up dialog
  const handleFollowUp = async (tx: Transaction) => {
    setFollowUpTx(tx);
    setFollowUpOpen(true);
    setSelectedTemplateId('');
    setProcessedMessage('');
    setFollowUpTemplates([]);
    
    // Get membership ID
    const membershipId = tx.membership?.membership?.id;
    
    if (membershipId) {
      await fetchFollowUpTemplates(membershipId);
    } else {
      // No membership, use default message
      const productName = tx.product?.name || tx.course?.title || 'produk';
      const defaultMsg = tx.status === 'PENDING' 
        ? `Halo ${tx.customerName || tx.user.name}!\n\nKami dari EksporYuk ingin mengingatkan bahwa pesanan Anda untuk *${productName}* belum diselesaikan.\n\n*Detail Pesanan:*\n- Invoice: ${tx.invoiceNumber || tx.id.slice(0, 8).toUpperCase()}\n- Total: Rp ${Number(tx.amount).toLocaleString('id-ID')}\n\n${tx.paymentUrl ? `*Link Pembayaran:*\n${tx.paymentUrl}\n\n` : ''}Jika ada kendala saat pembayaran, silakan hubungi kami. Kami siap membantu!`
        : `Halo ${tx.customerName || tx.user.name}!\n\nTerima kasih sudah membeli *${productName}* di EksporYuk!\n\nPembayaran Anda sudah kami terima. Jika ada pertanyaan, silakan hubungi kami.\n\nSemoga sukses!`;
      setProcessedMessage(defaultMsg);
    }
  };

  // Send WhatsApp
  const sendWhatsApp = () => {
    if (!followUpTx || !processedMessage) return;
    
    const phone = followUpTx.customerPhone || followUpTx.user.whatsapp || followUpTx.user.phone || '';
    const cleanPhone = phone.replace(/\D/g, '');
    const waNumber = cleanPhone.startsWith('62') ? cleanPhone : `62${cleanPhone.replace(/^0/, '')}`;
    
    const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(processedMessage)}`;
    window.open(waUrl, '_blank');
    setFollowUpOpen(false);
    toast.success('WhatsApp dibuka');
  };

  // Copy message
  const copyMessage = () => {
    navigator.clipboard.writeText(processedMessage);
    toast.success('Pesan disalin ke clipboard');
  };

  const getProductName = (tx: Transaction) => {
    // Check description first (from Sejoli import) - shows actual paket name like "Kelas Eksporyuk 12 Bulan"
    if (tx.description) {
      return tx.description;
    }
    // Check metadata.productName (from Sejoli import)
    if (tx.metadata?.productName) {
      return tx.metadata.productName;
    }
    // Check membership relation
    if (tx.membership?.membership?.name) {
      return tx.membership.membership.name;
    }
    // Check metadata for membership name
    if (tx.type === 'MEMBERSHIP' && tx.metadata?.membershipName) {
      return tx.metadata.membershipName;
    }
    // Then product
    if (tx.product?.name) {
      return tx.product.name;
    }
    // Then course
    if (tx.course?.title) {
      return tx.course.title;
    }
    // Then event
    if (tx.event?.title) {
      return tx.event.title;
    }
    // Fallback based on type
    const typeLabels: Record<string, string> = {
      'MEMBERSHIP': 'Membership',
      'EVENT': 'Event',
      'PRODUCT': 'Produk Digital',
      'COURSE': 'Kursus Online',
    };
    return typeLabels[tx.type] || tx.type || '-';
  };

  // Get specific product type for filtering (maps MEMBERSHIP to MEMBERSHIP_SIX_MONTHS, MEMBERSHIP_TWELVE_MONTHS, MEMBERSHIP_LIFETIME)
  const getProductType = (tx: Transaction): string => {
    // If transaction has a linked UserMembership, use that to determine type
    if (tx.userMembership) {
      const duration = tx.userMembership.membership?.duration;
      
      if (duration) {
        if (duration === 'SIX_MONTHS' || duration === '6') return 'MEMBERSHIP_SIX_MONTHS';
        if (duration === 'TWELVE_MONTHS' || duration === '12') return 'MEMBERSHIP_TWELVE_MONTHS';
        if (duration === 'LIFETIME' || duration === '999') return 'MEMBERSHIP_LIFETIME';
      }
      return 'MEMBERSHIP';
    }
    
    // Fallback: check metadata (for older transactions)
    if (tx.type === 'MEMBERSHIP') {
      // Get duration from membership relation, metadata membershipTier, or metadata duration
      const tier = tx.metadata?.membershipTier;
      const duration = tx.membership?.membership?.duration || tx.metadata?.membershipDuration;
      
      // Handle membershipTier from Sejoli import (e.g., '6_MONTH', '12_MONTH', 'LIFETIME')
      if (tier) {
        if (tier === '6_MONTH' || tier === 'SIX_MONTH') return 'MEMBERSHIP_SIX_MONTHS';
        if (tier === '12_MONTH' || tier === 'TWELVE_MONTH') return 'MEMBERSHIP_TWELVE_MONTHS';
        if (tier === 'LIFETIME') return 'MEMBERSHIP_LIFETIME';
      }
      
      // Handle enum formats like SIX_MONTHS, TWELVE_MONTHS, LIFETIME
      if (duration) {
        if (duration === 'SIX_MONTHS' || duration === '6') return 'MEMBERSHIP_SIX_MONTHS';
        if (duration === 'TWELVE_MONTHS' || duration === 'ONE_YEAR' || duration === '12') return 'MEMBERSHIP_TWELVE_MONTHS';
        if (duration === 'LIFETIME' || duration === '999') return 'MEMBERSHIP_LIFETIME';
      }
      
      // Fallback to general MEMBERSHIP if we can't determine duration
      return 'MEMBERSHIP';
    }
    
    // For other types, return as-is
    return tx.type;
  };

  // Get affiliate name from various sources
  const getAffiliateName = (tx: Transaction): string | null => {
    // 1. From affiliateConversion (for SUCCESS transactions with conversion)
    if (tx.affiliateConversion?.affiliate?.user?.name) {
      return tx.affiliateConversion.affiliate.user.name;
    }
    // 2. From affiliateFromMetadata (virtual data from API)
    if (tx.affiliateFromMetadata?.name) {
      return tx.affiliateFromMetadata.name;
    }
    // 3. From metadata directly (Sejoli import)
    if (tx.metadata?.affiliate_name) {
      return tx.metadata.affiliate_name;
    }
    if (tx.metadata?.affiliateName) {
      return tx.metadata.affiliateName;
    }
    return null;
  };

  // Get transaction type label with membership duration or event category
  const getTransactionTypeLabel = (tx: Transaction) => {
    if (tx.type === 'MEMBERSHIP') {
      // Get duration from membership relation, metadata membershipTier, or metadata duration
      const tier = tx.metadata?.membershipTier;
      const duration = tx.membership?.membership?.duration || tx.metadata?.membershipDuration;
      
      // Handle membershipTier from Sejoli import
      if (tier) {
        const tierLabels: Record<string, string> = {
          '1_MONTH': '1 Bulan',
          '3_MONTH': '3 Bulan',
          '6_MONTH': '6 Bulan',
          '12_MONTH': '1 Tahun',
          'LIFETIME': 'Selamanya',
          'FREE': 'Gratis',
        };
        const tierText = tierLabels[tier] || tier;
        return `Membership ${tierText}`;
      }
      
      if (duration) {
        // Convert enum to readable format
        const durationLabels: Record<string, string> = {
          'ONE_MONTH': '1 Bulan',
          'THREE_MONTHS': '3 Bulan',
          'SIX_MONTHS': '6 Bulan',
          'TWELVE_MONTHS': '1 Tahun',
          'LIFETIME': 'Selamanya',
          // Fallback untuk angka jika disimpan sebagai number
          '1': '1 Bulan',
          '3': '3 Bulan',
          '6': '6 Bulan',
          '12': '1 Tahun',
          '999': 'Selamanya',
        };
        const durationText = durationLabels[duration] || durationLabels[String(duration)] || `${duration} Bulan`;
        return `Membership ${durationText}`;
      }
      return 'Membership';
    }
    
    if (tx.type === 'EVENT') {
      // Get event category from metadata
      const eventCategory = tx.metadata?.eventCategory;
      
      const categoryLabels: Record<string, string> = {
        'WEBINAR': 'Webinar',
        'KOPDAR': 'Kopdar/Meetup',
        'WORKSHOP': 'Workshop',
        'TRADE_EXPO': 'Trade Expo',
      };
      
      const categoryText = eventCategory ? categoryLabels[eventCategory] || eventCategory : 'Event';
      return categoryText;
    }
    
    if (tx.type === 'PRODUCT') {
      // Get product category from metadata
      const productCategory = tx.metadata?.productCategory;
      
      const categoryLabels: Record<string, string> = {
        'JASA_WEBSITE': 'Jasa Website',
        'JASA_DESIGN': 'Jasa Design',
        'JASA_LEGAL': 'Jasa Legal',
        'UMROH': 'Paket Umroh',
        'MERCHANDISE': 'Merchandise',
        'DONASI': 'Donasi',
      };
      
      return categoryLabels[productCategory] || 'Produk/Jasa';
    }
    
    if (tx.type === 'COURSE') {
      return 'Kursus Online';
    }
    
    const labels: Record<string, string> = {
      'CREDIT_TOPUP': 'Top Up Kredit',
      'SUPPLIER_REGISTRATION': 'Pendaftaran Supplier',
    };
    return labels[tx.type] || tx.type;
  };

  const getPaymentUrl = (tx: Transaction) => {
    // Priority: metadata.xenditVANumber (if starts with http), paymentUrl, reference
    const xenditVA = tx.metadata?.xenditVANumber;
    if (xenditVA && xenditVA.startsWith('http')) {
      return xenditVA;
    }
    if (tx.paymentUrl) {
      return tx.paymentUrl;
    }
    if (tx.reference && tx.reference.startsWith('http')) {
      return tx.reference;
    }
    return null;
  };

  return (
    <ResponsivePageWrapper>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <ShoppingBag className="w-8 h-8 text-blue-600" />
                Laporan Penjualan
              </h1>
              <p className="text-gray-600 mt-1">Monitor semua transaksi produk, membership, dan course</p>
            </div>
            <Button onClick={handleExport} disabled={exporting} className="bg-green-600 hover:bg-green-700">
              {exporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
              Export CSV
            </Button>
          </div>

          {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-5 w-5" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Rp {stats.total.amount.toLocaleString('id-ID')}</div>
              <p className="text-xs opacity-75">{stats.total.count} transaksi</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Success</CardTitle>
              <CheckCircle className="h-5 w-5" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Rp {stats.success.amount.toLocaleString('id-ID')}</div>
              <p className="text-xs opacity-75">{stats.success.count} berhasil</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-5 w-5" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Rp {stats.pending.amount.toLocaleString('id-ID')}</div>
              <p className="text-xs opacity-75">{stats.pending.count} pending</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Conversion</CardTitle>
              <TrendingUp className="h-5 w-5" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.total.count > 0 ? ((stats.success.count / stats.total.count) * 100).toFixed(1) : 0}%
              </div>
              <p className="text-xs opacity-75">Tingkat keberhasilan</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="shadow-lg border-0">
          <CardHeader className="bg-gray-50">
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filter & Pencarian
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <Input
                placeholder="Cari nama atau email..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
              <Input
                placeholder="Cari invoice..."
                value={filters.invoice}
                onChange={(e) => setFilters({ ...filters, invoice: e.target.value })}
              />
              <select
                value={filters.paymentMethod}
                onChange={(e) => setFilters({ ...filters, paymentMethod: e.target.value })}
                className="px-3 py-2 border rounded-md"
              >
                <option value="ALL">Semua Metode Pembayaran</option>
                <option value="VA">Virtual Account</option>
                <option value="EWALLET">E-Wallet</option>
                <option value="QRIS">QRIS</option>
                <option value="RETAIL">Retail</option>
                <option value="MANUAL">Manual Transfer</option>
              </select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="px-3 py-2 border rounded-md"
              >
                <option value="ALL">Semua Status</option>
                <option value="PENDING">Pending</option>
                <option value="SUCCESS">Success</option>
                <option value="FAILED">Failed</option>
                <option value="EXPIRED">Expired</option>
              </select>
              <select
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                className="px-3 py-2 border rounded-md"
              >
                <option value="ALL">Semua Tipe Produk</option>
                <optgroup label="Membership">
                  <option value="MEMBERSHIP">Semua Membership</option>
                  <option value="MEMBERSHIP_SIX_MONTHS">Membership 6 Bulan</option>
                  <option value="MEMBERSHIP_TWELVE_MONTHS">Membership 12 Bulan</option>
                  <option value="MEMBERSHIP_LIFETIME">Membership Lifetime</option>
                </optgroup>
                <optgroup label="Produk Digital">
                  <option value="PRODUCT">Semua Produk Digital</option>
                </optgroup>
                <optgroup label="Kursus">
                  <option value="COURSE">Semua Kursus</option>
                </optgroup>
                <optgroup label="Lainnya">
                  <option value="CREDIT_TOPUP">Top Up Kredit Affiliate</option>
                  <option value="SUPPLIER_REGISTRATION">Pendaftaran Supplier</option>
                  <option value="EVENT">Tiket Event</option>
                </optgroup>
              </select>
              <Input
                type="date"
                placeholder="Dari tanggal"
                value={filters.dateFrom}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
              />
              <Input
                type="date"
                placeholder="Sampai tanggal"
                value={filters.dateTo}
                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
              />
              <Button onClick={applyFilters} className="bg-blue-600">
                <Search className="w-4 h-4 mr-2" />
                Cari
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Bulk Actions Bar */}
        {selectedIds.length > 0 && (
          <Card className="shadow-lg border-2 border-blue-500 bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Badge variant="default" className="text-lg px-4 py-2">
                    {selectedIds.length} transaksi dipilih
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedIds([])}
                  >
                    Batal Pilih
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="bg-green-600 text-white hover:bg-green-700"
                    onClick={() => { setBulkAction('SUCCESS'); setBulkActionOpen(true); }}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Sukses
                  </Button>
                  <Button
                    variant="outline"
                    className="bg-yellow-600 text-white hover:bg-yellow-700"
                    onClick={() => { setBulkAction('PENDING'); setBulkActionOpen(true); }}
                  >
                    <Clock className="w-4 h-4 mr-2" />
                    Pending
                  </Button>
                  <Button
                    variant="outline"
                    className="bg-red-600 text-white hover:bg-red-700"
                    onClick={() => { setBulkAction('FAILED'); setBulkActionOpen(true); }}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Batalkan
                  </Button>
                  <Button
                    variant="outline"
                    className="bg-orange-600 text-white hover:bg-orange-700"
                    onClick={() => { setBulkAction('RESEND_NOTIFICATION'); setBulkActionOpen(true); }}
                  >
                    <Bell className="w-4 h-4 mr-2" />
                    Kirim Notifikasi
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Table */}
        <Card className="shadow-lg border-0">
          <CardHeader className="bg-gray-50">
            <div className="flex items-center justify-between">
              <CardTitle>Transaksi ({pagination.total})</CardTitle>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">Tampilkan:</span>
                <select
                  value={pagination.limit}
                  onChange={(e) => handleLimitChange(Number(e.target.value))}
                  className="px-3 py-1 border rounded-md text-sm"
                >
                  <option value={50}>50 data</option>
                  <option value={100}>100 data</option>
                  <option value={200}>200 data</option>
                  <option value={9999}>Semua data</option>
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleSelectAll}
                        className="h-8 w-8 p-0"
                      >
                        {selectedIds.length === transactions.length && transactions.length > 0 ? (
                          <CheckSquare className="w-5 h-5 text-blue-600" />
                        ) : (
                          <Square className="w-5 h-5" />
                        )}
                      </Button>
                    </TableHead>
                    <TableHead className="w-[130px]">Invoice</TableHead>
                    <TableHead className="w-[200px]">Tipe Produk</TableHead>
                    <TableHead className="w-[180px]">Pembeli</TableHead>
                    <TableHead className="w-[140px]">Affiliate</TableHead>
                    <TableHead className="w-[110px]">Jumlah</TableHead>
                    <TableHead className="w-[110px]">Komisi</TableHead>
                    <TableHead className="w-[90px]">Follow Up</TableHead>
                    <TableHead className="w-[90px]">Status</TableHead>
                    <TableHead className="w-[90px]">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((tx) => {
                    const paymentUrl = getPaymentUrl(tx);
                    const productName = getProductName(tx);
                    const isSelected = selectedIds.includes(tx.id);
                    
                    return (
                      <TableRow key={tx.id} className={isSelected ? 'bg-blue-50' : ''}>
                        {/* Checkbox */}
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSelectOne(tx.id)}
                            className="h-8 w-8 p-0"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-5 h-5 text-blue-600" />
                            ) : (
                              <Square className="w-5 h-5" />
                            )}
                          </Button>
                        </TableCell>
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
                        </TableCell>

                        {/* Tipe Produk */}
                        <TableCell>
                          <div className="space-y-1.5">
                            {/* Product Badge & Name */}
                            <div className="space-y-1">
                              <Badge 
                                variant="outline" 
                                className={
                                  tx.type === 'MEMBERSHIP' ? 'bg-purple-50 text-purple-700 border-purple-300 font-semibold text-xs' :
                                  tx.type === 'COURSE' ? 'bg-blue-50 text-blue-700 border-blue-300 text-xs' :
                                  tx.type === 'EVENT' ? 'bg-orange-50 text-orange-700 border-orange-300 text-xs' :
                                  'bg-green-50 text-green-700 border-green-300 text-xs'
                                }
                              >
                                {tx.type === 'MEMBERSHIP' ? 'Membership' :
                                 tx.type === 'EVENT' ? 'Event' :
                                 tx.type === 'PRODUCT' ? 'Produk Digital' :
                                 tx.type === 'COURSE' ? 'Kursus' : tx.type}
                              </Badge>
                              
                              {/* Product Name - Nama/Judul dari Membership/Produk */}
                              <div className="text-sm font-medium text-gray-900">{productName}</div>
                              
                              {/* Payment Button if pending */}
                              {paymentUrl && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 px-2 text-xs bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100 mt-1"
                                  onClick={() => window.open(paymentUrl, '_blank')}
                                  title="Buka Link Pembayaran"
                                >
                                  <CreditCard className="w-3 h-3 mr-1" />
                                  Bayar
                                </Button>
                              )}
                            </div>
                          </div>
                        </TableCell>

                        {/* Pembeli */}
                        <TableCell>
                          <div className="flex items-start gap-2">
                            <User className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                            <div className="font-medium text-sm">{tx.customerName || tx.user.name}</div>
                          </div>
                        </TableCell>

                        {/* Affiliate */}
                        <TableCell className="text-sm">
                          {tx.affiliateConversion ? (
                            <div className="font-medium text-gray-900">
                              {tx.affiliateConversion.affiliate.user.name}
                            </div>
                          ) : tx.affiliateFromMetadata?.name ? (
                            <div className="font-medium text-gray-700">
                              {tx.affiliateFromMetadata.name}
                              {tx.status === 'PENDING' && (
                                <span className="block text-xs text-amber-500">(pending)</span>
                              )}
                            </div>
                          ) : tx.affiliateId ? (
                            <div className="text-xs text-gray-500">
                              ID: {tx.affiliateId}
                            </div>
                          ) : (tx.metadata?.affiliate_name || tx.metadata?.affiliateName) ? (
                            <div className="font-medium text-gray-700">
                              {tx.metadata?.affiliate_name || tx.metadata?.affiliateName}
                              {tx.status === 'PENDING' && (
                                <span className="block text-xs text-amber-500">(pending)</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>

                        {/* Jumlah */}
                        <TableCell>
                          <div className="font-bold text-green-600">
                            Rp {Number(tx.amount).toLocaleString('id-ID')}
                          </div>
                        </TableCell>

                        {/* Komisi */}
                        <TableCell>
                          {tx.affiliateConversion ? (
                            <div className="font-semibold text-sm text-orange-600">
                              Rp {Number(tx.affiliateConversion.commissionAmount).toLocaleString('id-ID')}
                            </div>
                          ) : tx.status === 'PENDING' && (tx.affiliateFromMetadata?.name || tx.metadata?.affiliate_name || tx.metadata?.affiliateName) ? (
                            <div className="text-xs text-gray-400 italic">
                              Setelah bayar
                            </div>
                          ) : tx.affiliateShare ? (
                            <div className="font-semibold text-sm text-orange-600">
                              Rp {Number(tx.affiliateShare).toLocaleString('id-ID')}
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>

                        {/* Follow Up */}
                        <TableCell>
                          {(tx.customerPhone || tx.user.whatsapp || tx.user.phone) && ['SUCCESS', 'PENDING'].includes(tx.status) ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 gap-1 text-green-600 border-green-300 hover:bg-green-50"
                              onClick={() => handleFollowUp(tx)}
                              title={tx.status === 'PENDING' ? 'Follow up untuk ingatkan pembayaran' : 'Follow up pembeli'}
                            >
                              <WhatsAppIcon className="w-4 h-4" />
                              <span className="text-xs">WA</span>
                            </Button>
                          ) : (
                            <span className="text-xs text-gray-400">-</span>
                          )}
                        </TableCell>

                        {/* Status */}
                        <TableCell>
                          <Badge 
                            variant={
                              tx.status === 'SUCCESS' ? 'default' : 
                              tx.status === 'PENDING' ? 'secondary' : 
                              'destructive'
                            }
                            className={
                              tx.status === 'SUCCESS' ? 'bg-green-500' :
                              tx.status === 'PENDING' ? 'bg-yellow-500' :
                              'bg-red-500'
                            }
                          >
                            {tx.status}
                          </Badge>
                        </TableCell>

                        {/* Aksi */}
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 gap-1"
                            onClick={() => {
                              setSelectedTransaction(tx);
                              setDetailOpen(true);
                            }}
                          >
                            <Eye className="w-3 h-3" />
                            <span className="text-xs">Detail</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}

            {pagination.totalPages > 1 && (
              <div className="flex justify-between items-center mt-6 pt-6 border-t">
                <div className="text-sm text-gray-600">
                  Menampilkan {(pagination.page - 1) * pagination.limit + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} dari {pagination.total} data
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPagination({ ...pagination, page: 1 })}
                    disabled={pagination.page === 1}
                  >
                    First
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                    disabled={pagination.page === 1}
                  >
                    Previous
                  </Button>
                  <span className="px-4 py-2 text-sm">
                    Halaman {pagination.page} dari {pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                    disabled={pagination.page === pagination.totalPages}
                  >
                    Next
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPagination({ ...pagination, page: pagination.totalPages })}
                    disabled={pagination.page === pagination.totalPages}
                  >
                    Last
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bulk Action Confirmation Dialog */}
        <Dialog open={bulkActionOpen} onOpenChange={setBulkActionOpen}>
          <DialogContent className="sm:max-w-[550px] p-8">
            <DialogHeader className="pb-6">
              <DialogTitle className="flex items-center gap-4 text-xl mb-3">
                <div className={`p-3 rounded-full ${
                  bulkAction === 'SUCCESS' ? 'bg-green-100' :
                  bulkAction === 'PENDING' ? 'bg-yellow-100' :
                  bulkAction === 'FAILED' ? 'bg-red-100' :
                  'bg-blue-100'
                }`}>
                  <AlertCircle className={`w-6 h-6 ${
                    bulkAction === 'SUCCESS' ? 'text-green-600' :
                    bulkAction === 'PENDING' ? 'text-yellow-600' :
                    bulkAction === 'FAILED' ? 'text-red-600' :
                    'text-blue-600'
                  }`} />
                </div>
                Konfirmasi Bulk Action
              </DialogTitle>
              <DialogDescription className="text-base pl-14">
                Anda akan melakukan aksi pada <span className="font-semibold text-gray-900">{selectedIds.length} transaksi</span>
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-5 py-2">
              {/* Action Description */}
              <div className={`p-5 rounded-lg border-l-4 ${
                bulkAction === 'SUCCESS' ? 'bg-green-50 border-green-500' :
                bulkAction === 'PENDING' ? 'bg-yellow-50 border-yellow-500' :
                bulkAction === 'FAILED' ? 'bg-red-50 border-red-500' :
                'bg-blue-50 border-blue-500'
              }`}>
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 mb-1">
                      {bulkAction === 'SUCCESS' && '✓ Konfirmasi Pembayaran'}
                      {bulkAction === 'PENDING' && '⏱ Ubah ke Status Pending'}
                      {bulkAction === 'FAILED' && '✗ Batalkan Transaksi'}
                      {bulkAction === 'RESEND_NOTIFICATION' && '📩 Kirim Ulang Notifikasi'}
                    </p>
                    <p className="text-sm text-gray-600">
                      {bulkAction === 'SUCCESS' && 'Mengubah status transaksi menjadi SUKSES dan mengirim notifikasi konfirmasi'}
                      {bulkAction === 'PENDING' && 'Mengubah status transaksi menjadi MENUNGGU PEMBAYARAN'}
                      {bulkAction === 'FAILED' && 'Membatalkan transaksi yang dipilih secara permanen'}
                      {bulkAction === 'RESEND_NOTIFICATION' && 'Mengirim ulang notifikasi WhatsApp ke customer'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Warning Messages */}
              {bulkAction === 'SUCCESS' && (
                <div className="flex gap-4 p-5 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="text-3xl">⚠️</div>
                  <div className="flex-1">
                    <p className="font-medium text-amber-900 mb-2">Perhatian!</p>
                    <p className="text-sm text-amber-700 leading-relaxed">
                      Pastikan pembayaran benar-benar sudah diterima sebelum mengkonfirmasi. Tindakan ini akan mengaktifkan akses customer.
                    </p>
                  </div>
                </div>
              )}
              
              {bulkAction === 'FAILED' && (
                <div className="flex gap-4 p-5 bg-red-50 border border-red-200 rounded-lg">
                  <div className="text-3xl">🚨</div>
                  <div className="flex-1">
                    <p className="font-medium text-red-900 mb-2">Peringatan!</p>
                    <p className="text-sm text-red-700 leading-relaxed">
                      Transaksi yang dibatalkan tidak dapat dikembalikan. Pastikan keputusan Anda sudah benar.
                    </p>
                  </div>
                </div>
              )}

              {bulkAction === 'RESEND_NOTIFICATION' && (
                <div className="flex gap-4 p-5 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="text-3xl">📱</div>
                  <div className="flex-1">
                    <p className="font-medium text-blue-900 mb-2">Info</p>
                    <p className="text-sm text-blue-700 leading-relaxed">
                      Notifikasi WhatsApp akan dikirim ke nomor yang terdaftar di setiap transaksi.
                    </p>
                  </div>
                </div>
              )}

              {/* Transaction Count Badge */}
              <div className="flex items-center justify-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <Package className="w-5 h-5 text-gray-600" />
                <span className="text-sm text-gray-600">Total transaksi:</span>
                <span className="font-bold text-lg text-gray-900">{selectedIds.length}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-6 border-t mt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setBulkActionOpen(false);
                  setBulkAction('');
                }}
                disabled={processingBulk}
                className="flex-1 h-11"
              >
                Batal
              </Button>
              <Button
                onClick={handleBulkAction}
                disabled={processingBulk}
                className={`flex-1 h-11 ${
                  bulkAction === 'SUCCESS' ? 'bg-green-600 hover:bg-green-700' :
                  bulkAction === 'PENDING' ? 'bg-yellow-600 hover:bg-yellow-700' :
                  bulkAction === 'FAILED' ? 'bg-red-600 hover:bg-red-700' :
                  'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {processingBulk ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Proses Sekarang
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Detail Transaction Modal */}
        <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-blue-600" />
                Detail Transaksi
              </DialogTitle>
              <DialogDescription>
                Informasi lengkap transaksi pembayaran
              </DialogDescription>
            </DialogHeader>

            {selectedTransaction && (
              <div className="space-y-6">
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
                    {selectedTransaction.paidAt && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Dibayar:</span>
                        <span className="text-green-600">{new Date(selectedTransaction.paidAt).toLocaleString('id-ID')}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Status:</span>
                      <Badge 
                        variant={
                          selectedTransaction.status === 'SUCCESS' ? 'default' : 
                          selectedTransaction.status === 'PENDING' ? 'secondary' : 
                          'destructive'
                        }
                        className={
                          selectedTransaction.status === 'SUCCESS' ? 'bg-green-500' :
                          selectedTransaction.status === 'PENDING' ? 'bg-yellow-500' :
                          'bg-red-500'
                        }
                      >
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
                      Data Pembeli
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
                        {getTransactionTypeLabel(selectedTransaction)}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Nama Produk:</span>
                      <span className="font-medium">{getProductName(selectedTransaction)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Harga:</span>
                      <span className="font-bold text-green-600">
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
                      <span className="font-medium">{selectedTransaction.paymentMethod || '-'}</span>
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
                  </CardContent>
                </Card>

                {/* Affiliate Info - show for both SUCCESS (with commission) and PENDING (name only) */}
                {(selectedTransaction.affiliateConversion || getAffiliateName(selectedTransaction)) && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Share2 className="w-4 h-4" />
                        Informasi Affiliate
                        {selectedTransaction.status === 'PENDING' && (
                          <Badge variant="outline" className="text-amber-500 border-amber-300">Pending</Badge>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Nama Affiliate:</span>
                        <span className="font-medium">
                          {getAffiliateName(selectedTransaction) || '-'}
                        </span>
                      </div>
                      {selectedTransaction.status === 'SUCCESS' && selectedTransaction.affiliateConversion ? (
                        <>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Komisi:</span>
                            <span className="font-bold text-orange-600">
                              Rp {Number(selectedTransaction.affiliateConversion.commissionAmount).toLocaleString('id-ID')}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Status Komisi:</span>
                            <Badge 
                              variant={selectedTransaction.affiliateConversion.paidOut ? 'default' : 'secondary'}
                            >
                              {selectedTransaction.affiliateConversion.paidOut ? 'PAID' : 'PENDING'}
                            </Badge>
                          </div>
                        </>
                      ) : selectedTransaction.status === 'PENDING' ? (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Komisi:</span>
                          <span className="text-gray-400 italic text-xs">Dihitung setelah pembayaran</span>
                        </div>
                      ) : null}
                    </CardContent>
                  </Card>
                )}

                {/* Quick Actions */}
                <Card className="border-2 border-blue-100 bg-gradient-to-br from-blue-50 to-white">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2 text-blue-700">
                      <Calendar className="w-4 h-4" />
                      Quick Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* Follow Up Customer */}
                      {(selectedTransaction.customerPhone || selectedTransaction.user.whatsapp || selectedTransaction.user.phone) && (
                        <Button
                          className="w-full gap-2 bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg transition-all"
                          onClick={() => handleFollowUp(selectedTransaction)}
                        >
                          <MessageCircle className="w-4 h-4" />
                          Follow Up Pembeli
                        </Button>
                      )}
                      
                      {/* Follow Up Affiliate */}
                      {selectedTransaction.affiliateConversion && selectedTransaction.affiliateConversion.affiliate.user.whatsapp && (
                        <Button
                          variant="outline"
                          className="w-full gap-2 border-orange-300 text-orange-700 hover:bg-orange-50 shadow-sm hover:shadow-md transition-all"
                          onClick={() => {
                            const affiliate = selectedTransaction.affiliateConversion!.affiliate.user;
                            const message = `Halo ${affiliate.name}! 🎉\n\nSelamat! Ada komisi baru untuk Anda:\n\n💰 Komisi: Rp ${Number(selectedTransaction.affiliateConversion!.commissionAmount).toLocaleString('id-ID')}\n📦 Produk: ${getProductName(selectedTransaction)}\n🧾 Invoice: ${selectedTransaction.invoiceNumber || selectedTransaction.id.slice(0, 8).toUpperCase()}\n\nTerima kasih atas kontribusi Anda! 🙌`;
                            
                            const phone = affiliate.whatsapp!.replace(/\D/g, '');
                            const waNumber = phone.startsWith('62') ? phone : `62${phone.replace(/^0/, '')}`;
                            const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`;
                            window.open(waUrl, '_blank');
                          }}
                        >
                          <Share2 className="w-4 h-4" />
                          Follow Up Affiliate
                        </Button>
                      )}
                      
                      {/* Payment Link */}
                      {getPaymentUrl(selectedTransaction) && (
                        <Button
                          variant="outline"
                          className="w-full gap-2 border-blue-300 text-blue-700 hover:bg-blue-50 shadow-sm hover:shadow-md transition-all"
                          onClick={() => window.open(getPaymentUrl(selectedTransaction)!, '_blank')}
                        >
                          <ExternalLink className="w-4 h-4" />
                          Lihat Payment Link
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Follow Up Dialog */}
        <Dialog open={followUpOpen} onOpenChange={setFollowUpOpen}>
          <DialogContent className="max-w-2xl p-0 overflow-hidden">
            {/* Header with gradient */}
            <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                  <WhatsAppIcon className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">Follow Up WhatsApp</h2>
                  {followUpTx && (
                    <p className="text-green-100 text-sm mt-0.5">
                      Kirim pesan ke <span className="font-medium text-white">{followUpTx.customerName || followUpTx.user.name}</span>
                      {followUpTx.status === 'PENDING' && ' • Menunggu Pembayaran'}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Customer Info Card */}
              {followUpTx && (
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-lg">
                    {(followUpTx.customerName || followUpTx.user.name)?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{followUpTx.customerName || followUpTx.user.name}</p>
                    <p className="text-sm text-gray-500 truncate">{followUpTx.customerPhone || followUpTx.user.phone || followUpTx.user.whatsapp || 'No phone'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Invoice</p>
                    <p className="font-mono text-sm font-medium text-gray-900">{followUpTx.invoiceNumber || followUpTx.id.slice(0, 8).toUpperCase()}</p>
                  </div>
                </div>
              )}

              {/* Template Dropdown */}
              {loadingTemplates ? (
                <div className="flex items-center justify-center py-8">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-green-500" />
                    <span className="text-sm text-gray-500">Memuat template...</span>
                  </div>
                </div>
              ) : followUpTemplates.length > 0 ? (
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-700">Pilih Template Pesan</Label>
                  <Select value={selectedTemplateId} onValueChange={handleTemplateChange}>
                    <SelectTrigger className="h-12 text-base border-gray-200 focus:ring-green-500 focus:border-green-500">
                      <SelectValue placeholder="Pilih template follow up..." />
                    </SelectTrigger>
                    <SelectContent>
                      {followUpTemplates.map((template, idx) => (
                        <SelectItem key={template.id} value={template.id} className="py-3">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-green-100 text-green-700 text-xs flex items-center justify-center font-medium">
                              {idx + 1}
                            </span>
                            <span>{template.title}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-amber-800">Template Tidak Tersedia</p>
                      <p className="text-sm text-amber-700 mt-1">
                        {followUpTx?.membership?.membership?.id 
                          ? 'Belum ada template follow up untuk membership ini. Pesan default akan digunakan.'
                          : 'Produk ini bukan membership. Pesan default akan digunakan.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Preview Message */}
              {processedMessage && (
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-700">Preview Pesan</Label>
                  <div className="relative">
                    <div className="p-5 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl max-h-[280px] overflow-y-auto shadow-inner">
                      {/* WhatsApp chat bubble style */}
                      <div className="bg-white rounded-lg rounded-tl-none p-4 shadow-sm border border-green-100">
                        <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{processedMessage}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1 h-12 gap-2 text-base border-gray-200 hover:bg-gray-50"
                  onClick={copyMessage}
                  disabled={!processedMessage}
                >
                  <Copy className="w-5 h-5" />
                  Copy Pesan
                </Button>
                <Button
                  className="flex-1 h-12 gap-2 text-base bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-lg shadow-green-500/25"
                  onClick={sendWhatsApp}
                  disabled={!processedMessage}
                >
                  <Send className="w-5 h-5" />
                  Kirim via WhatsApp
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
    </ResponsivePageWrapper>
  );
}
