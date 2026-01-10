import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(num)
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(d)
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

export function generateShortCode(length: number = 8): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export function generateAffiliateCode(name: string): string {
  // Generate code from name, removing spaces and special chars
  const clean = name.toLowerCase().replace(/[^a-z0-9]/g, '')
  const random = Math.random().toString(36).substring(2, 6)
  return `${clean}-${random}`
}

export function calculateCommission(
  amount: number,
  rate: number
): number {
  return (amount * rate) / 100
}

export function calculateProfitSharing(amount: number): {
  founderShare: number
  coFounderShare: number
  companyFee: number
  netAmount: number
} {
  const companyFee = calculateCommission(amount, 15)
  const netAmount = amount - companyFee
  const founderShare = calculateCommission(netAmount, 60)
  const coFounderShare = calculateCommission(netAmount, 40)
  
  return {
    founderShare,
    coFounderShare,
    companyFee,
    netAmount,
  }
}

export function getTimeAgo(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const seconds = Math.floor((new Date().getTime() - d.getTime()) / 1000)
  
  let interval = seconds / 31536000
  if (interval > 1) return Math.floor(interval) + ' tahun lalu'
  
  interval = seconds / 2592000
  if (interval > 1) return Math.floor(interval) + ' bulan lalu'
  
  interval = seconds / 86400
  if (interval > 1) return Math.floor(interval) + ' hari lalu'
  
  interval = seconds / 3600
  if (interval > 1) return Math.floor(interval) + ' jam lalu'
  
  interval = seconds / 60
  if (interval > 1) return Math.floor(interval) + ' menit lalu'
  
  return 'Baru saja'
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
