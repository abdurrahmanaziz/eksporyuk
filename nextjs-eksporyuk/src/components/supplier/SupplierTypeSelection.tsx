/**
 * SupplierTypeSelection Component
 * 
 * Step 0: Pilihan tipe supplier untuk onboarding process
 * Setelah pilih, status berubah DRAFT → ONBOARDING
 */

'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Factory, Building2, Store, Network } from 'lucide-react'

export type SupplierType = 'PRODUSEN' | 'PABRIK' | 'TRADER' | 'AGGREGATOR'

interface SupplierTypeOption {
  value: SupplierType
  label: string
  description: string
  icon: React.ElementType
  color: string
  features: string[]
}

const SUPPLIER_TYPES: SupplierTypeOption[] = [
  {
    value: 'PRODUSEN',
    label: 'Produsen',
    description: 'Saya memproduksi barang/produk untuk ekspor',
    icon: Factory,
    color: 'blue',
    features: [
      'Produksi langsung',
      'Kontrol kualitas penuh',
      'Customizable products',
      'MOQ fleksibel'
    ]
  },
  {
    value: 'PABRIK',
    label: 'Pabrik',
    description: 'Pabrik dengan mesin produksi berskala besar',
    icon: Building2,
    color: 'green',
    features: [
      'Kapasitas produksi tinggi',
      'Mesin modern & otomatis',
      'Sertifikasi standar',
      'Supply chain terintegrasi'
    ]
  },
  {
    value: 'TRADER',
    label: 'Trader',
    description: 'Pedagang/eksportir produk dari berbagai sumber',
    icon: Store,
    color: 'orange',
    features: [
      'Multi-kategori produk',
      'Network supplier luas',
      'Pengalaman ekspor',
      'Market knowledge'
    ]
  },
  {
    value: 'AGGREGATOR',
    label: 'Aggregator',
    description: 'Pengumpul produk dari berbagai supplier',
    icon: Network,
    color: 'purple',
    features: [
      'Konsolidasi produk',
      'Warehouse & logistik',
      'Quality control system',
      'Platform digital'
    ]
  }
]

interface SupplierTypeSelectionProps {
  onSelect: (type: SupplierType) => void
  selectedType?: SupplierType | null
  isSubmitting?: boolean
}

export default function SupplierTypeSelection({ 
  onSelect, 
  selectedType,
  isSubmitting = false
}: SupplierTypeSelectionProps) {
  const [hoveredType, setHoveredType] = useState<SupplierType | null>(null)

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Pilih Tipe Supplier Anda</h2>
        <p className="text-gray-600">
          Pilih kategori yang paling sesuai dengan bisnis Anda. Ini akan membantu kami 
          memahami kebutuhan dan memberikan assessment yang tepat.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {SUPPLIER_TYPES.map((type) => {
          const Icon = type.icon
          const isSelected = selectedType === type.value
          const isHovered = hoveredType === type.value
          
          return (
            <Card
              key={type.value}
              className={`
                cursor-pointer transition-all duration-200
                ${isSelected ? 'ring-2 ring-blue-500 border-blue-500 shadow-lg' : ''}
                ${isHovered && !isSelected ? 'border-gray-400 shadow-md' : ''}
              `}
              onMouseEnter={() => setHoveredType(type.value)}
              onMouseLeave={() => setHoveredType(null)}
              onClick={() => onSelect(type.value)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`
                      w-12 h-12 rounded-lg flex items-center justify-center
                      ${type.color === 'blue' ? 'bg-blue-100 text-blue-600' : ''}
                      ${type.color === 'green' ? 'bg-green-100 text-green-600' : ''}
                      ${type.color === 'orange' ? 'bg-orange-100 text-orange-600' : ''}
                      ${type.color === 'purple' ? 'bg-purple-100 text-purple-600' : ''}
                    `}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{type.label}</CardTitle>
                      {isSelected && (
                        <Badge className="mt-1 bg-blue-500">Terpilih</Badge>
                      )}
                    </div>
                  </div>
                </div>
                <CardDescription className="mt-2">
                  {type.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {type.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {selectedType && (
        <div className="flex justify-center pt-4">
          <Button
            size="lg"
            onClick={() => onSelect(selectedType)}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Menyimpan...' : 'Lanjutkan dengan Tipe Ini'}
          </Button>
        </div>
      )}

      <div className="text-center text-sm text-gray-500">
        <p>
          💡 Tips: Pilih kategori yang paling cocok. Anda tidak bisa mengubahnya setelah melanjutkan.
        </p>
      </div>
    </div>
  )
}
