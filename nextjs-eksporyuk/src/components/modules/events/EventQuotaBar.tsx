'use client'

import React from 'react'

interface EventQuotaBarProps {
  maxParticipants?: number | null
  currentCount: number
  eventName: string
  isEventFull?: boolean
}

export function EventQuotaBar({
  maxParticipants,
  currentCount,
  eventName,
  isEventFull = false
}: EventQuotaBarProps) {
  // If no quota limit, don't show bar
  if (!maxParticipants) {
    return null
  }

  const percentFull = (currentCount / maxParticipants) * 100
  const remaining = maxParticipants - currentCount
  const isCritical = percentFull >= 95
  const isWarning = percentFull >= 80

  // Determine color based on quota status
  let barColor = 'bg-blue-500'
  let textColor = 'text-gray-700'
  let statusLabel = 'Tersedia'

  if (percentFull >= 100) {
    barColor = 'bg-red-500'
    textColor = 'text-red-600'
    statusLabel = 'PENUH'
  } else if (isCritical) {
    barColor = 'bg-orange-500'
    textColor = 'text-orange-600'
    statusLabel = 'Hampir Penuh'
  } else if (isWarning) {
    barColor = 'bg-yellow-500'
    textColor = 'text-yellow-600'
    statusLabel = 'Terbatas'
  }

  return (
    <div className="space-y-3 p-4 rounded-lg bg-gray-50 border border-gray-200">
      {/* Header */}
      <div className="flex justify-between items-baseline">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-700">Kuota Peserta</span>
          <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
            percentFull >= 100 
              ? 'bg-red-100 text-red-700' 
              : isCritical
              ? 'bg-orange-100 text-orange-700'
              : isWarning
              ? 'bg-yellow-100 text-yellow-700'
              : 'bg-green-100 text-green-700'
          }`}>
            {statusLabel}
          </span>
        </div>
        <span className={`text-sm font-bold ${textColor}`}>
          {currentCount}/{maxParticipants}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-300 rounded-full h-3 overflow-hidden">
        <div
          className={`h-3 rounded-full transition-all duration-300 ${barColor}`}
          style={{ width: `${Math.min(percentFull, 100)}%` }}
        />
      </div>

      {/* Status Message */}
      <div className="flex justify-between items-center">
        <div className="text-xs text-gray-600">
          {percentFull >= 100 ? (
            <span className="text-red-600 font-semibold">
              ❌ Event sudah penuh - tidak bisa daftar
            </span>
          ) : remaining < 10 ? (
            <span className="text-orange-600 font-semibold">
              ⚠️ Hanya {remaining} tempat tersisa!
            </span>
          ) : percentFull >= 80 ? (
            <span className="text-yellow-600 font-semibold">
              ⏱️ Kursi terbatas ({remaining} tempat), jangan sampai terlewat
            </span>
          ) : (
            <span className="text-green-600">
              ✅ Tersedia {remaining} tempat
            </span>
          )}
        </div>
      </div>

      {/* Additional Info */}
      {percentFull >= 80 && (
        <div className="text-xs text-gray-600 border-t pt-2 mt-2">
          <p className="font-semibold mb-1">💡 Tip:</p>
          <p>Daftar sekarang sebelum kursi habis. Pendaftar baru terus bertambah setiap jam.</p>
        </div>
      )}
    </div>
  )
}

/**
 * Skeleton loader version for when data is still loading
 */
export function EventQuotaBarSkeleton() {
  return (
    <div className="space-y-3 p-4 rounded-lg bg-gray-50 border border-gray-200 animate-pulse">
      <div className="h-5 bg-gray-200 rounded w-1/3" />
      <div className="h-3 bg-gray-200 rounded-full w-full" />
      <div className="h-4 bg-gray-200 rounded w-1/2" />
    </div>
  )
}
