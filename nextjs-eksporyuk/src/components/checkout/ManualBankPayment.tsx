'use client'

import { Check, AlertCircle, ChevronDown, Building } from 'lucide-react'

interface BankAccount {
  id: string
  bankName: string
  bankCode: string
  accountNumber: string
  accountName: string
  branch?: string
  isActive: boolean
  customLogoUrl?: string
}

interface ManualBankPaymentProps {
  bankAccounts: BankAccount[]
  selectedChannel: string
  onSelectChannel: (bankCode: string) => void
  isExpanded: boolean
  onToggleExpanded: () => void
  primaryColor?: string
  primaryBgColor?: string
}

export default function ManualBankPayment({
  bankAccounts,
  selectedChannel,
  onSelectChannel,
  isExpanded,
  onToggleExpanded,
  primaryColor = '#f97316',
  primaryBgColor = '#fff7ed'
}: ManualBankPaymentProps) {
  
  // Helper function to get logo URL
  const getLogoUrl = (code: string, customLogoUrl?: string) => {
    if (customLogoUrl) {
      return customLogoUrl
    }
    
    const baseUrl = '/images/payment-logos'
    const logos: { [key: string]: string } = {
      'BCA': `${baseUrl}/bca.svg`,
      'MANDIRI': `${baseUrl}/mandiri.svg`,
      'BNI': `${baseUrl}/bni.svg`,
      'BRI': `${baseUrl}/bri.svg`,
      'BSI': `${baseUrl}/bsi.svg`,
      'JAGO': `${baseUrl}/jago.svg`,
      'CIMB': `${baseUrl}/cimb.svg`,
      'PERMATA': `${baseUrl}/permata.svg`,
      'BTN': `${baseUrl}/btn.svg`,
      'DANAMON': `${baseUrl}/danamon.svg`,
      'SAHABAT_SAMPOERNA': `${baseUrl}/sahabat-sampoerna.svg`,
    }
    
    return logos[code] || `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48'%3E%3Crect width='48' height='48' fill='%230066CC'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='16' fill='white' font-family='Arial'%3E${code.substring(0, 3)}%3C/text%3E%3C/svg%3E`
  }

  const activeBankAccounts = bankAccounts.filter(acc => acc.isActive)

  if (activeBankAccounts.length === 0) {
    return null
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={onToggleExpanded}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Building className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          <span className="font-semibold text-gray-900 dark:text-white">Transfer Bank Manual</span>
          <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 px-2 py-1 rounded-full font-medium">
            Gratis Fee
          </span>
        </div>
        <ChevronDown className={`h-5 w-5 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
      </button>
      
      {isExpanded && (
        <div className="p-4 border-t bg-gray-50 dark:bg-gray-900/50">
          <div className="flex items-start gap-2 mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-yellow-800 dark:text-yellow-200">
              <p className="font-semibold">Aktivasi Manual - Bebas Biaya Merchant!</p>
              <p className="text-xs mt-1 opacity-90">Transfer ke rekening di bawah, lalu konfirmasi ke admin</p>
            </div>
          </div>
          
          <div className="space-y-2">
            {activeBankAccounts.map((account) => (
              <button
                key={account.id}
                type="button"
                onClick={() => onSelectChannel(account.bankCode)}
                className="relative w-full p-4 rounded-lg border-2 transition-all hover:shadow-md text-left"
                style={{
                  borderColor: selectedChannel === account.bankCode ? primaryColor : '#e5e7eb',
                  backgroundColor: selectedChannel === account.bankCode ? primaryBgColor : 'transparent',
                }}
              >
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 flex items-center justify-center bg-white rounded-lg flex-shrink-0 border shadow-sm">
                    <img 
                      src={getLogoUrl(account.bankCode, account.customLogoUrl)} 
                      alt={account.bankName}
                      className="max-h-full max-w-full object-contain p-1"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                      }}
                    />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 dark:text-white">{account.bankName}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 font-mono tracking-wide">
                      {account.accountNumber}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      a.n. {account.accountName}
                    </p>
                    {account.branch && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                        Cabang {account.branch}
                      </p>
                    )}
                  </div>
                </div>
                {selectedChannel === account.bankCode && (
                  <div 
                    className="absolute top-3 right-3 rounded-full p-1"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <Check className="h-4 w-4 text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
