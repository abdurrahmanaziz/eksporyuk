'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Shield, Plus, X } from 'lucide-react'
import { toast } from 'sonner'

interface ModerationSettingsProps {
  groupId: string
}

export default function ModerationSettings({ groupId }: ModerationSettingsProps) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [bannedWords, setBannedWords] = useState<string[]>([])
  const [newWord, setNewWord] = useState('')
  const [requireApproval, setRequireApproval] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [groupId])

  const loadSettings = async () => {
    try {
      const res = await fetch(`/api/groups/${groupId}/moderation`)
      if (res.ok) {
        const data = await res.json()
        setBannedWords(data.bannedWords || [])
        setRequireApproval(data.requireApproval || false)
      }
    } catch (error) {
      console.error('Load settings error:', error)
    } finally {
      setLoading(false)
    }
  }

  const addBannedWord = () => {
    const word = newWord.trim().toLowerCase()
    if (!word) return
    
    if (bannedWords.includes(word)) {
      toast.error('Kata sudah ada dalam daftar')
      return
    }

    setBannedWords([...bannedWords, word])
    setNewWord('')
  }

  const removeBannedWord = (word: string) => {
    setBannedWords(bannedWords.filter(w => w !== word))
  }

  const saveSettings = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/groups/${groupId}/moderation`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bannedWords,
          requireApproval
        })
      })

      if (res.ok) {
        toast.success('Pengaturan moderasi disimpan')
      } else {
        toast.error('Gagal menyimpan pengaturan')
      }
    } catch (error) {
      console.error('Save settings error:', error)
      toast.error('Gagal menyimpan pengaturan')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Memuat...</div>
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            <CardTitle>Pengaturan Moderasi</CardTitle>
          </div>
          <CardDescription>
            Kelola kata-kata yang dilarang dan persetujuan postingan
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Banned Words */}
          <div className="space-y-4">
            <div>
              <Label>Kata yang Dilarang</Label>
              <p className="text-sm text-gray-500 mt-1">
                Postingan dengan kata-kata ini akan otomatis disensor
              </p>
            </div>

            <div className="flex gap-2">
              <Textarea
                value={newWord}
                onChange={(e) => setNewWord(e.target.value)}
                placeholder="Masukkan kata yang ingin dilarang"
                rows={1}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    addBannedWord()
                  }
                }}
              />
              <Button onClick={addBannedWord} size="sm">
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {bannedWords.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {bannedWords.map((word) => (
                  <Badge
                    key={word}
                    variant="secondary"
                    className="px-3 py-1"
                  >
                    {word}
                    <button
                      onClick={() => removeBannedWord(word)}
                      className="ml-2 hover:text-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Require Approval */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Persetujuan Postingan</Label>
              <p className="text-sm text-gray-500">
                Postingan dari member baru harus disetujui terlebih dahulu
              </p>
            </div>
            <Switch
              checked={requireApproval}
              onCheckedChange={setRequireApproval}
            />
          </div>

          <Button
            onClick={saveSettings}
            disabled={saving}
            className="w-full"
          >
            {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
