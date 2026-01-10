'use client'

import { useState, useEffect } from 'react'
import { Clock } from 'lucide-react'

interface CountdownTimerProps {
  endDate: string
  primaryColor?: string
}

export default function CountdownTimer({ endDate, primaryColor = '#2563eb' }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  })
  const [isExpired, setIsExpired] = useState(false)

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(endDate).getTime() - new Date().getTime()

      if (difference <= 0) {
        setIsExpired(true)
        return
      }

      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60)
      })
    }

    calculateTimeLeft()
    const timer = setInterval(calculateTimeLeft, 1000)

    return () => clearInterval(timer)
  }, [endDate])

  if (isExpired) {
    return (
      <div className="bg-red-100 border-2 border-red-300 rounded-lg p-4 text-center">
        <p className="text-red-700 font-semibold">Pendaftaran Telah Ditutup</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-lg border-2 p-4 sm:p-6" style={{ borderColor: primaryColor }}>
      <div className="flex items-center justify-center gap-2 mb-3 sm:mb-4">
        <Clock className="h-5 w-5 sm:h-6 sm:w-6" style={{ color: primaryColor }} />
        <h3 className="text-base sm:text-lg font-bold" style={{ color: primaryColor }}>
          Waktu Terbatas!
        </h3>
      </div>
      
      <div className="grid grid-cols-4 gap-2 sm:gap-3">
        <div className="text-center">
          <div 
            className="text-white rounded-lg p-2 sm:p-3 mb-1 sm:mb-2"
            style={{ backgroundColor: primaryColor }}
          >
            <div className="text-xl sm:text-2xl md:text-3xl font-bold">
              {String(timeLeft.days).padStart(2, '0')}
            </div>
          </div>
          <div className="text-xs sm:text-sm font-medium text-gray-600">Hari</div>
        </div>

        <div className="text-center">
          <div 
            className="text-white rounded-lg p-2 sm:p-3 mb-1 sm:mb-2"
            style={{ backgroundColor: primaryColor }}
          >
            <div className="text-xl sm:text-2xl md:text-3xl font-bold">
              {String(timeLeft.hours).padStart(2, '0')}
            </div>
          </div>
          <div className="text-xs sm:text-sm font-medium text-gray-600">Jam</div>
        </div>

        <div className="text-center">
          <div 
            className="text-white rounded-lg p-2 sm:p-3 mb-1 sm:mb-2"
            style={{ backgroundColor: primaryColor }}
          >
            <div className="text-xl sm:text-2xl md:text-3xl font-bold">
              {String(timeLeft.minutes).padStart(2, '0')}
            </div>
          </div>
          <div className="text-xs sm:text-sm font-medium text-gray-600">Menit</div>
        </div>

        <div className="text-center">
          <div 
            className="text-white rounded-lg p-2 sm:p-3 mb-1 sm:mb-2"
            style={{ backgroundColor: primaryColor }}
          >
            <div className="text-xl sm:text-2xl md:text-3xl font-bold">
              {String(timeLeft.seconds).padStart(2, '0')}
            </div>
          </div>
          <div className="text-xs sm:text-sm font-medium text-gray-600">Detik</div>
        </div>
      </div>

      <p className="text-center text-xs sm:text-sm text-gray-600 mt-3 sm:mt-4 font-medium">
        Buruan daftar sebelum terlambat!
      </p>
    </div>
  )
}
