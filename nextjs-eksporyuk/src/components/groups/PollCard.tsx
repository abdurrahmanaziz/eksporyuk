'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { CheckCircle2, Clock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { toast } from 'sonner'

interface PollCardProps {
  post: any
  onVote?: () => void
}

export default function PollCard({ post, onVote }: PollCardProps) {
  const { data: session } = useSession()
  const [voting, setVoting] = useState(false)
  const [metadata, setMetadata] = useState<any>({})
  
  useEffect(() => {
    if (post.metadata) {
      setMetadata(typeof post.metadata === 'string' ? JSON.parse(post.metadata) : post.metadata)
    }
  }, [post.metadata])

  const handleVote = async (optionIndex: number) => {
    setVoting(true)
    try {
      const res = await fetch(`/api/posts/${post.id}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ optionIndex })
      })

      if (res.ok) {
        const data = await res.json()
        setMetadata(JSON.parse(data.post.metadata))
        toast.success('Suara Anda telah dicatat')
        onVote?.()
      } else {
        toast.error('Gagal mencatat suara')
      }
    } catch (error) {
      console.error('Vote error:', error)
      toast.error('Gagal mencatat suara')
    } finally {
      setVoting(false)
    }
  }

  const totalVotes = Object.keys(metadata.votes || {}).length
  const userVote = session?.user?.id ? metadata.votes?.[session.user.id] : undefined
  const hasVoted = userVote !== undefined
  const isExpired = metadata.endsAt && new Date(metadata.endsAt) < new Date()

  const options = []
  for (let i = 0; i < (metadata.totalOptions || 0); i++) {
    const optionText = metadata[`option_${i}`]
    const votes = metadata[`option_${i}_votes`] || 0
    const percentage = totalVotes > 0 ? (votes / totalVotes) * 100 : 0
    
    options.push({
      index: i,
      text: optionText,
      votes,
      percentage
    })
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                  Polling
                </Badge>
                {isExpired && (
                  <Badge variant="secondary">Selesai</Badge>
                )}
              </div>
              <h3 className="text-lg font-semibold">{metadata.question}</h3>
            </div>
          </div>

          <div className="space-y-3">
            {options.map((option) => {
              const isSelected = userVote === option.index
              
              return (
                <div key={option.index}>
                  {hasVoted || isExpired ? (
                    // Show results
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className={isSelected ? 'font-semibold' : ''}>
                            {option.text}
                          </span>
                          {isSelected && (
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                          )}
                        </div>
                        <span className="font-semibold">
                          {option.percentage.toFixed(1)}%
                        </span>
                      </div>
                      <Progress 
                        value={option.percentage} 
                        className="h-2"
                      />
                      <p className="text-xs text-gray-500">
                        {option.votes} suara
                      </p>
                    </div>
                  ) : (
                    // Show voting button
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => handleVote(option.index)}
                      disabled={voting || isExpired}
                    >
                      {option.text}
                    </Button>
                  )}
                </div>
              )
            })}
          </div>

          <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t">
            <div className="flex items-center gap-4">
              <span>{totalVotes} suara</span>
              {metadata.endsAt && !isExpired && (
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  Berakhir {formatDistanceToNow(new Date(metadata.endsAt), {
                    addSuffix: true,
                    locale: idLocale
                  })}
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
