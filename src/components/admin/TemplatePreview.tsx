'use client'

import { ArrowLeft, Edit, MessageSquare } from 'lucide-react'

export default function TemplatePreview({
  type,
  template,
  onClose,
  onEdit,
}: {
  type: 'email' | 'whatsapp'
  template: any
  onClose: () => void
  onEdit: () => void
}) {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-900 mb-2 flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali
          </button>
          <h2 className="text-xl font-bold text-gray-900">Preview Template</h2>
        </div>
        <button
          onClick={onEdit}
          className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 flex items-center gap-2"
        >
          <Edit className="w-4 h-4" />
          Edit Template
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{template.name}</h3>
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
              {template.category}
            </span>
            <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded">
              {template.roleTarget}
            </span>
            <span className={`px-2 py-1 text-xs font-medium rounded ${
              template.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {template.isActive ? 'Aktif' : 'Nonaktif'}
            </span>
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg p-6">
          {type === 'email' ? (
            <div>
              <div className="mb-6 pb-4 border-b">
                <p className="text-sm text-gray-600 mb-1">Subject:</p>
                <p className="text-lg font-semibold">{template.subject}</p>
              </div>
              <div 
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: template.body }}
              />
            </div>
          ) : (
            <div className="bg-green-50 p-6 rounded-lg">
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare className="w-6 h-6 text-green-600" />
                <span className="font-semibold text-green-800 text-lg">WhatsApp Message</span>
              </div>
              <p className="whitespace-pre-wrap text-gray-800 text-base leading-relaxed">
                {template.message}
              </p>
            </div>
          )}
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 text-sm text-gray-600">
          <div>
            <p className="font-medium">Digunakan:</p>
            <p>{template.usageCount}x</p>
          </div>
          <div>
            <p className="font-medium">Dibuat:</p>
            <p>{new Date(template.createdAt).toLocaleDateString('id-ID', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
