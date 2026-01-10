'use client'

import { useState, useEffect } from 'react'
import { List, RefreshCw, ExternalLink, Check } from 'lucide-react'

interface MailketingList {
  id: string
  name: string
  description?: string
  subscriber_count: number
}

interface MailketingListSelectorProps {
  value: string | null
  listName: string | null
  onChange: (listId: string | null, listName: string | null) => void
  disabled?: boolean
}

export default function MailketingListSelector({
  value,
  listName,
  onChange,
  disabled = false
}: MailketingListSelectorProps) {
  const [lists, setLists] = useState<MailketingList[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadLists()
  }, [])

  const loadLists = async () => {
    try {
      setLoading(true)
      setError('')
      
      const response = await fetch('/api/admin/mailketing/lists')
      const data = await response.json()

      if (data.success) {
        setLists(data.lists || [])
      } else {
        setError(data.message || 'Gagal memuat lists')
      }
    } catch (error: any) {
      console.error('Error loading lists:', error)
      setError('Terjadi kesalahan saat memuat lists')
    } finally {
      setLoading(false)
    }
  }

  const handleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value
    if (selectedId === '') {
      onChange(null, null)
    } else {
      const selectedList = lists.find(list => list.id === selectedId)
      onChange(selectedId, selectedList?.name || null)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          Mailketing List
        </label>
        <button
          type="button"
          onClick={loadLists}
          disabled={loading}
          className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <select
        value={value || ''}
        onChange={handleSelect}
        disabled={disabled || loading}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
      >
        <option value="">Tidak ada (skip auto-add)</option>
        {lists.map((list) => (
          <option key={list.id} value={list.id}>
            {list.name} ({list.subscriber_count} subscribers)
          </option>
        ))}
      </select>

      {value && (
        <div className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 px-3 py-2 rounded">
          <Check className="w-3 h-3 text-green-600" />
          <span>
            List ID: <code className="bg-white px-1 py-0.5 rounded font-mono">{value}</code>
          </span>
        </div>
      )}

      {error && (
        <div className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded flex items-start gap-2">
          <span className="flex-1">{error}</span>
          <a
            href="/admin/integrations"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            Setup
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}

      <div className="text-xs text-gray-500 bg-blue-50 px-3 py-2 rounded">
        <div className="flex items-start gap-2">
          <List className="w-3 h-3 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium text-blue-900 mb-1">Cara kerja:</p>
            <ul className="space-y-0.5 text-blue-800">
              <li>• Pilih list untuk auto-add user setelah pembelian</li>
              <li>• User akan otomatis subscribe ke list ini</li>
              <li>• Buat list di <a href="https://app.mailketing.co.id" target="_blank" rel="noopener noreferrer" className="underline">Dashboard Mailketing</a></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
