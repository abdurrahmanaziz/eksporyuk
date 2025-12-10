'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Crown, Medal, Star, TrendingUp, Clock, Award, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LeaderboardEntry {
  rank: number
  userId: string
  name: string
  avatar?: string | null
  points: number // Total earnings in IDR
  conversions: number
  isCurrentUser?: boolean
}

interface LeaderboardData {
  allTime: LeaderboardEntry[]
  weekly: LeaderboardEntry[]
  currentUserRank?: {
    allTime?: number
    weekly?: number
  }
  currentMonth?: string
}

interface ModernLeaderboardProps {
  data: LeaderboardData
  showAllTime?: boolean // Admin only
  currentUserId?: string
  onRefresh?: () => void
  isLoading?: boolean
}

const formatCurrency = (amount: number) => {
  if (amount >= 1000000000) {
    return `${(amount / 1000000000).toFixed(1)}M`
  }
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1)}Jt`
  }
  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(0)}K`
  }
  return amount.toLocaleString('id-ID')
}

const getInitials = (name: string) => {
  if (!name) return '?'
  const words = name.trim().split(' ')
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
}

// Avatar component with random colors
const Avatar = ({ 
  name, 
  avatar, 
  size = 'md',
  rank 
}: { 
  name: string
  avatar?: string | null
  size?: 'sm' | 'md' | 'lg' | 'xl'
  rank?: number
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-lg',
    xl: 'w-20 h-20 text-xl md:w-24 md:h-24 md:text-2xl'
  }

  const colors = [
    'bg-gradient-to-br from-pink-400 to-rose-500',
    'bg-gradient-to-br from-violet-400 to-purple-500',
    'bg-gradient-to-br from-blue-400 to-indigo-500',
    'bg-gradient-to-br from-cyan-400 to-teal-500',
    'bg-gradient-to-br from-emerald-400 to-green-500',
    'bg-gradient-to-br from-amber-400 to-orange-500',
  ]

  const colorIndex = name ? name.charCodeAt(0) % colors.length : 0

  // Rank badge colors
  const rankBadgeColors: Record<number, string> = {
    1: 'bg-gradient-to-r from-yellow-400 to-amber-500 text-white',
    2: 'bg-gradient-to-r from-gray-300 to-gray-400 text-gray-800',
    3: 'bg-gradient-to-r from-amber-600 to-amber-700 text-white',
  }

  return (
    <div className="relative inline-flex">
      {avatar ? (
        <img 
          src={avatar} 
          alt={name}
          className={cn(
            sizeClasses[size],
            'rounded-full object-cover ring-2 ring-white/30'
          )}
        />
      ) : (
        <div className={cn(
          sizeClasses[size],
          colors[colorIndex],
          'rounded-full flex items-center justify-center font-bold text-white ring-2 ring-white/30'
        )}>
          {getInitials(name)}
        </div>
      )}
      
      {/* Rank badge for top 3 */}
      {rank && rank <= 3 && (
        <div className={cn(
          'absolute -bottom-1 -right-1 rounded-full flex items-center justify-center',
          size === 'xl' ? 'w-7 h-7 md:w-8 md:h-8' : 'w-5 h-5',
          rankBadgeColors[rank]
        )}>
          {rank === 1 ? (
            <Crown className={size === 'xl' ? 'w-4 h-4' : 'w-3 h-3'} />
          ) : (
            <span className={size === 'xl' ? 'text-xs font-bold' : 'text-[10px] font-bold'}>{rank}</span>
          )}
        </div>
      )}
    </div>
  )
}

// Podium component for top 3
const Podium = ({ entries, currentUserId }: { entries: LeaderboardEntry[], currentUserId?: string }) => {
  // Reorder for podium display: [2nd, 1st, 3rd]
  const podiumOrder = [
    entries.find(e => e.rank === 2),
    entries.find(e => e.rank === 1),
    entries.find(e => e.rank === 3),
  ].filter(Boolean) as LeaderboardEntry[]

  const podiumHeights = {
    1: 'h-28 md:h-32',
    2: 'h-20 md:h-24', 
    3: 'h-14 md:h-16',
  }

  const podiumColors = {
    1: 'from-yellow-500/30 to-amber-600/30',
    2: 'from-gray-400/30 to-gray-500/30',
    3: 'from-amber-700/30 to-amber-800/30',
  }

  return (
    <div className="flex items-end justify-center gap-2 md:gap-4 py-6 md:py-8">
      {podiumOrder.map((entry, index) => {
        const isCurrentUser = entry.userId === currentUserId
        
        return (
          <motion.div 
            key={entry.userId}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.15, duration: 0.5, ease: 'easeOut' }}
            className="flex flex-col items-center"
          >
            {/* Avatar and name */}
            <motion.div 
              className={cn(
                'flex flex-col items-center mb-2',
                isCurrentUser && 'scale-105'
              )}
              whileHover={{ scale: 1.05 }}
            >
              <div className={cn(
                'relative',
                entry.rank === 1 && 'animate-pulse'
              )}>
                {entry.rank === 1 && (
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2">
                    <Crown className="w-6 h-6 text-yellow-400 animate-bounce" />
                  </div>
                )}
                <Avatar 
                  name={entry.name} 
                  avatar={entry.avatar} 
                  size={entry.rank === 1 ? 'xl' : 'lg'}
                  rank={entry.rank}
                />
              </div>
              
              <p className={cn(
                'mt-2 text-xs md:text-sm font-semibold text-center truncate max-w-[80px] md:max-w-[100px]',
                isCurrentUser ? 'text-yellow-300' : 'text-white'
              )}>
                {entry.name.split(' ')[0]}
              </p>
              
              <div className={cn(
                'mt-1 px-2 py-0.5 rounded-full text-[10px] md:text-xs font-bold',
                entry.rank === 1 
                  ? 'bg-yellow-500/20 text-yellow-300' 
                  : 'bg-white/10 text-white/80'
              )}>
                Rp {formatCurrency(entry.points)}
              </div>
            </motion.div>

            {/* Podium stand */}
            <motion.div 
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              transition={{ delay: index * 0.15 + 0.3, duration: 0.4 }}
              className={cn(
                'w-16 md:w-24 rounded-t-xl bg-gradient-to-t flex items-end justify-center pb-2',
                podiumHeights[entry.rank as 1 | 2 | 3],
                podiumColors[entry.rank as 1 | 2 | 3]
              )}
            >
              <span className="text-2xl md:text-4xl font-black text-white/40">{entry.rank}</span>
            </motion.div>
          </motion.div>
        )
      })}
    </div>
  )
}

// List item for ranks 4+
const LeaderboardItem = ({ 
  entry, 
  index,
  currentUserId 
}: { 
  entry: LeaderboardEntry
  index: number
  currentUserId?: string
}) => {
  const isCurrentUser = entry.userId === currentUserId

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className={cn(
        'flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-2xl',
        isCurrentUser 
          ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30'
          : 'bg-white/5 hover:bg-white/10 transition-colors'
      )}
    >
      {/* Rank */}
      <div className={cn(
        'w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-sm md:text-base font-bold',
        isCurrentUser ? 'bg-yellow-500 text-white' : 'bg-white/10 text-white/60'
      )}>
        {entry.rank}
      </div>

      {/* Avatar */}
      <Avatar name={entry.name} avatar={entry.avatar} size="md" />

      {/* Name and conversions */}
      <div className="flex-1 min-w-0">
        <p className={cn(
          'font-semibold truncate text-sm md:text-base',
          isCurrentUser ? 'text-yellow-300' : 'text-white'
        )}>
          {entry.name}
        </p>
        <p className="text-xs text-white/50">
          {entry.conversions.toLocaleString('id-ID')} konversi
        </p>
      </div>

      {/* Points */}
      <div className={cn(
        'text-right px-3 py-1.5 rounded-full text-xs md:text-sm font-bold',
        isCurrentUser 
          ? 'bg-yellow-500/20 text-yellow-300'
          : 'bg-violet-500/20 text-violet-300'
      )}>
        Rp {formatCurrency(entry.points)}
      </div>
    </motion.div>
  )
}

// User rank overview banner
const UserRankBanner = ({ 
  rank, 
  total,
  tab
}: { 
  rank?: number
  total: number
  tab: 'weekly' | 'allTime'
}) => {
  if (!rank) return null

  const percentile = Math.round((1 - rank / total) * 100)
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-gradient-to-r from-orange-500/20 to-yellow-500/20 border border-orange-500/30 rounded-2xl p-4 mb-4"
    >
      <div className="flex items-center gap-3">
        <div className="bg-orange-500 rounded-xl p-2">
          <Trophy className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <p className="text-orange-300 font-bold">
            #{rank} <span className="text-white/60 font-normal">dari {total} affiliate</span>
          </p>
          <p className="text-xs text-white/50">
            Kamu lebih baik dari {percentile}% affiliate {tab === 'weekly' ? 'minggu ini' : 'sepanjang masa'}!
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-black text-orange-400">#{rank}</div>
          <p className="text-[10px] text-white/50 uppercase tracking-wider">Peringkat</p>
        </div>
      </div>
    </motion.div>
  )
}

// Main component
export default function ModernLeaderboard({
  data,
  showAllTime = true,
  currentUserId,
  onRefresh,
  isLoading = false
}: ModernLeaderboardProps) {
  const [activeTab, setActiveTab] = useState<'weekly' | 'allTime'>('weekly')
  
  const currentData = activeTab === 'weekly' ? data.weekly : data.allTime
  const topThree = currentData.filter(e => e.rank <= 3)
  const restOfList = currentData.filter(e => e.rank > 3)

  // Get current user rank
  const currentUserRank = activeTab === 'weekly' 
    ? data.currentUserRank?.weekly 
    : data.currentUserRank?.allTime

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 p-4 md:p-6">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-2 mb-2"
          >
            <Trophy className="w-6 h-6 md:w-8 md:h-8 text-yellow-400" />
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Leaderboard
            </h1>
          </motion.div>
          
          {/* Refresh indicator */}
          {onRefresh && (
            <motion.button
              onClick={onRefresh}
              disabled={isLoading}
              className="text-xs text-white/50 hover:text-white/80 transition-colors flex items-center gap-1 mx-auto"
            >
              <Clock className={cn('w-3 h-3', isLoading && 'animate-spin')} />
              {isLoading ? 'Memperbarui...' : 'Update otomatis 30 detik'}
            </motion.button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex justify-center mb-4">
          <div className="bg-white/10 rounded-full p-1 inline-flex">
            <button
              onClick={() => setActiveTab('weekly')}
              className={cn(
                'px-5 md:px-8 py-2 rounded-full text-sm font-semibold transition-all duration-300',
                activeTab === 'weekly'
                  ? 'bg-white text-violet-600 shadow-lg'
                  : 'text-white/70 hover:text-white'
              )}
            >
              Mingguan
            </button>
            {showAllTime && (
              <button
                onClick={() => setActiveTab('allTime')}
                className={cn(
                  'px-5 md:px-8 py-2 rounded-full text-sm font-semibold transition-all duration-300',
                  activeTab === 'allTime'
                    ? 'bg-white text-violet-600 shadow-lg'
                    : 'text-white/70 hover:text-white'
                )}
              >
                Sepanjang Masa
              </button>
            )}
          </div>
        </div>

        {/* User rank banner (for affiliate) */}
        {currentUserId && (
          <UserRankBanner 
            rank={currentUserRank}
            total={currentData.length}
            tab={activeTab}
          />
        )}

        {/* Podium for top 3 */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {topThree.length > 0 && (
              <Podium entries={topThree} currentUserId={currentUserId} />
            )}

            {/* Rest of list */}
            <div className="space-y-2 md:space-y-3 pb-20">
              {restOfList.map((entry, index) => (
                <LeaderboardItem 
                  key={entry.userId}
                  entry={entry}
                  index={index}
                  currentUserId={currentUserId}
                />
              ))}
              
              {currentData.length === 0 && (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-white/20 mx-auto mb-3" />
                  <p className="text-white/50">Belum ada data leaderboard</p>
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Countdown or info */}
        {activeTab === 'weekly' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed bottom-4 left-4 right-4 md:relative md:bottom-auto md:left-auto md:right-auto"
          >
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-3 text-center max-w-lg mx-auto">
              <p className="text-xs text-white/60">
                <Clock className="w-3 h-3 inline-block mr-1" />
                Reset setiap hari Senin 00:00 WIB
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
