'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { BarChart3, Plus, X } from 'lucide-react'
import { toast } from 'sonner'

interface CreatePollProps {
  groupId: string
  onPollCreated?: () => void
}

export default function CreatePoll({ groupId, onPollCreated }: CreatePollProps) {
  const [showDialog, setShowDialog] = useState(false)
  const [question, setQuestion] = useState('')
  const [options, setOptions] = useState(['', ''])
  const [duration, setDuration] = useState(24) // hours
  const [creating, setCreating] = useState(false)

  const addOption = () => {
    if (options.length < 6) {
      setOptions([...options, ''])
    }
  }

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index))
    }
  }

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options]
    newOptions[index] = value
    setOptions(newOptions)
  }

  const handleCreatePoll = async () => {
    if (!question.trim()) {
      toast.error('Pertanyaan wajib diisi')
      return
    }

    const validOptions = options.filter(o => o.trim())
    if (validOptions.length < 2) {
      toast.error('Minimal 2 pilihan diperlukan')
      return
    }

    setCreating(true)
    try {
      const metadata: any = {
        question,
        duration: duration * 3600, // convert to seconds
        endsAt: new Date(Date.now() + duration * 3600 * 1000).toISOString()
      }

      // Add options
      validOptions.forEach((option, index) => {
        metadata[`option_${index}`] = option
        metadata[`option_${index}_votes`] = 0
      })
      metadata.totalOptions = validOptions.length
      metadata.votes = {}

      const res = await fetch(`/api/groups/${groupId}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: question,
          type: 'POLL',
          metadata: JSON.stringify(metadata)
        })
      })

      if (res.ok) {
        toast.success('Polling berhasil dibuat')
        setShowDialog(false)
        setQuestion('')
        setOptions(['', ''])
        setDuration(24)
        onPollCreated?.()
      } else {
        toast.error('Gagal membuat polling')
      }
    } catch (error) {
      console.error('Create poll error:', error)
      toast.error('Gagal membuat polling')
    } finally {
      setCreating(false)
    }
  }

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setShowDialog(true)}
        className="w-full"
      >
        <BarChart3 className="w-4 h-4 mr-2" />
        Buat Polling
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Buat Polling</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="question">Pertanyaan</Label>
              <Textarea
                id="question"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Apa pertanyaan Anda?"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Pilihan</Label>
              {options.map((option, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={option}
                    onChange={(e) => updateOption(index, e.target.value)}
                    placeholder={`Pilihan ${index + 1}`}
                  />
                  {options.length > 2 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeOption(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
              {options.length < 6 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addOption}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Tambah Pilihan
                </Button>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Durasi (jam)</Label>
              <Input
                id="duration"
                type="number"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                min="1"
                max="168"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDialog(false)}
              disabled={creating}
            >
              Batal
            </Button>
            <Button
              onClick={handleCreatePoll}
              disabled={creating}
            >
              {creating ? 'Membuat...' : 'Buat Polling'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
