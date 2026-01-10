'use client'

import { useState } from 'react'
import { ArrowLeft, CheckCircle2, MessageSquare } from 'lucide-react'

const CATEGORIES = [
  { value: 'NOTIFICATION', label: 'Notification' },
  { value: 'MARKETING', label: 'Marketing' },
  { value: 'TRANSACTIONAL', label: 'Transactional' },
  { value: 'SYSTEM', label: 'System' },
]

const ROLE_TARGETS = [
  { value: 'ALL', label: 'Semua Role' },
  { value: 'ADMIN', label: 'Admin' },
  { value: 'MEMBER', label: 'Member' },
  { value: 'FREE', label: 'Free User' },
]

export default function TemplateForm({
  type,
  mode,
  template,
  onSave,
  onCancel,
}: {
  type: 'email' | 'whatsapp'
  mode: 'create' | 'edit'
  template?: any
  onSave: (data: any) => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState({
    name: template?.name || '',
    category: template?.category || 'NOTIFICATION',
    roleTarget: template?.roleTarget || 'ALL',
    isActive: template?.isActive ?? true,
    subject: template?.subject || '',
    body: template?.body || '',
    message: template?.message || '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <button
            onClick={onCancel}
            className="text-gray-600 hover:text-gray-900 mb-2 flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali
          </button>
          <h2 className="text-xl font-bold text-gray-900">
            {mode === 'create' ? 'Buat' : 'Edit'} Template {type === 'email' ? 'Email' : 'WhatsApp'}
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nama Template *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Contoh: Welcome Email"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kategori *
                </label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Target Role *
                </label>
                <select
                  required
                  value={formData.roleTarget}
                  onChange={(e) => setFormData({ ...formData, roleTarget: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {ROLE_TARGETS.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={formData.isActive ? 'true' : 'false'}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'true' })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="true">Aktif</option>
                <option value="false">Nonaktif</option>
              </select>
            </div>

            {type === 'email' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subject Email *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Subject email..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Body Email *
                  </label>
                  <textarea
                    required
                    value={formData.body}
                    onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                    rows={12}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                    placeholder="Isi email (support HTML)..."
                  />
                </div>
              </>
            )}

            {type === 'whatsapp' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pesan WhatsApp *
                </label>
                <textarea
                  required
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  rows={12}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Pesan WhatsApp..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  Karakter: {formData.message.length}
                </p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <CheckCircle2 className="w-4 h-4 inline-block mr-2" />
                Simpan Template
              </button>
            </div>
          </form>
        </div>

        {/* Live Preview */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Live Preview</h3>
          <div className="border border-gray-200 rounded-lg p-4">
            {type === 'email' ? (
              <div>
                <div className="mb-4 pb-4 border-b">
                  <p className="text-sm text-gray-600">Subject:</p>
                  <p className="font-semibold">{formData.subject || '(Subject kosong)'}</p>
                </div>
                <div 
                  className="prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: formData.body || '<p class="text-gray-400">Body kosong</p>' }}
                />
              </div>
            ) : (
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <MessageSquare className="w-5 h-5 text-green-600" />
                  <span className="font-semibold text-green-800">WhatsApp Message</span>
                </div>
                <p className="whitespace-pre-wrap text-gray-800">
                  {formData.message || '(Pesan kosong)'}
                </p>
              </div>
            )}
          </div>
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-800 font-medium mb-2">Shortcode tersedia:</p>
            <p className="text-xs text-blue-600">
              {'{name}'}, {'{email}'}, {'{membership_plan}'}, {'{phone}'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
