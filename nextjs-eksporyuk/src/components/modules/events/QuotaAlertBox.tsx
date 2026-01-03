'use client'

import React from 'react'
import { AlertCircle, TrendingUp, Zap } from 'lucide-react'

interface QuotaAlertBoxProps {
  maxParticipants?: number | null
  paidCount: number
  eventName: string
  variant?: 'top' | 'product' | 'cta' // Different styles for different placements
  onUrgencyTriggered?: () => void
}

export function QuotaAlertBox({
  maxParticipants,
  paidCount,
  eventName,
  variant = 'top',
  onUrgencyTriggered
}: QuotaAlertBoxProps) {
  if (!maxParticipants) return null

  const percentFull = (paidCount / maxParticipants) * 100
  const remaining = maxParticipants - paidCount
  const isCritical = percentFull >= 95
  const isWarning = percentFull >= 80
  const isFull = percentFull >= 100

  // Determine styling based on quota status and variant
  let bgColor = 'bg-green-50'
  let borderColor = 'border-green-200'
  let iconColor = 'text-green-600'
  let textColor = 'text-green-900'
  let badgeColor = 'bg-green-100 text-green-700'
  let urgencyText = '✅ Tersedia'

  if (isFull) {
    bgColor = 'bg-red-50'
    borderColor = 'border-red-200'
    iconColor = 'text-red-600'
    textColor = 'text-red-900'
    badgeColor = 'bg-red-100 text-red-700'
    urgencyText = '🔴 PENUH'
  } else if (isCritical) {
    bgColor = 'bg-red-50'
    borderColor = 'border-red-300'
    iconColor = 'text-red-600'
    textColor = 'text-red-900'
    badgeColor = 'bg-red-100 text-red-700'
    urgencyText = '🔴 HAMPIR PENUH'
  } else if (isWarning) {
    bgColor = 'bg-orange-50'
    borderColor = 'border-orange-300'
    iconColor = 'text-orange-600'
    textColor = 'text-orange-900'
    badgeColor = 'bg-orange-100 text-orange-700'
    urgencyText = '⚠️ TERBATAS'
  }

  // Trigger analytics when entering critical zone
  React.useEffect(() => {
    if ((isWarning || isCritical || isFull) && onUrgencyTriggered) {
      onUrgencyTriggered()
    }
  }, [isWarning, isCritical, isFull, onUrgencyTriggered])

  // TOP VARIANT - Alert box style
  if (variant === 'top') {
    return (
      <div className={`${bgColor} border-2 ${borderColor} rounded-lg p-4 space-y-3`}>
        <div className="flex items-center gap-2">
          <AlertCircle className={`${iconColor} h-5 w-5 flex-shrink-0`} />
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${badgeColor}`}>
            {urgencyText}
          </span>
        </div>

        <div className={`${textColor}`}>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold">Kuota Peserta Terdaftar</span>
            <span className="text-lg font-bold">{paidCount}/{maxParticipants}</span>
          </div>

          <div className="w-full bg-gray-300 rounded-full h-2.5 overflow-hidden">
            <div
              className={`h-2.5 rounded-full transition-all ${
                isFull ? 'bg-red-600' : isCritical ? 'bg-red-500' : isWarning ? 'bg-orange-500' : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(percentFull, 100)}%` }}
            />
          </div>

          {isFull ? (
            <p className="text-sm font-bold mt-2 text-red-700">
              ❌ Event sudah penuh. Tidak bisa mendaftar lagi.
            </p>
          ) : (
            <p className="text-sm font-semibold mt-2">
              ⏱️ Sisa {remaining} tempat - pesan sekarang sebelum habis!
            </p>
          )}
        </div>

        {isWarning && (
          <div className={`text-xs ${textColor} bg-white/50 rounded p-2 flex items-start gap-2`}>
            <TrendingUp className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <span>Pendaftar terus bertambah setiap jam. Jangan sampai kehabisan!</span>
          </div>
        )}
      </div>
    )
  }

  // PRODUCT VARIANT - Compact style (below price)
  if (variant === 'product') {
    return (
      <div className={`${bgColor} border-l-4 ${borderColor} rounded px-4 py-3`}>
        <div className="flex items-center justify-between mb-1">
          <span className={`text-xs font-bold px-2 py-0.5 rounded ${badgeColor}`}>
            {urgencyText}
          </span>
          <span className={`text-sm font-bold ${textColor}`}>{paidCount}/{maxParticipants}</span>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden mb-2">
          <div
            className={`h-1.5 rounded-full transition-all ${
              isFull ? 'bg-red-600' : isCritical ? 'bg-red-500' : isWarning ? 'bg-orange-500' : 'bg-green-500'
            }`}
            style={{ width: `${Math.min(percentFull, 100)}%` }}
          />
        </div>

        <p className={`text-xs ${textColor} font-semibold`}>
          {isFull ? '❌ Penuh' : `⚡ Sisa ${remaining} tempat`}
        </p>
      </div>
    )
  }

  // CTA VARIANT - Bold, action-triggering style (above button)
  if (variant === 'cta') {
    if (!isWarning) return null // Only show when quota is tight

    return (
      <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-lg p-3 mb-4 text-white text-center space-y-1">
        <div className="flex items-center justify-center gap-2">
          <Zap className="h-4 w-4" />
          <span className="font-bold text-sm">JANGAN SAMPAI HABIS!</span>
          <Zap className="h-4 w-4" />
        </div>
        <p className="text-xs font-semibold">
          {remaining} tempat tersisa • {paidCount} sudah mendaftar
        </p>
      </div>
    )
  }

  return null
}
