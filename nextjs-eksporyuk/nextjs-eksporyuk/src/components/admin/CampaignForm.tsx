'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, CheckCircle2 } from 'lucide-react'

// Helper function to replace shortcodes with sample data for preview
function replacePreviewShortcodes(content: string): string {
  if (!content) return ''
  
  const sampleData = {
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+62812345678',
    whatsapp: '+62812345678',
    membership_plan: 'Pro Member',
    membership_status: 'ACTIVE',
    transaction_id: 'TRX-2024-001',
    invoice_number: 'INV-2024-001',
    amount: 'Rp 500.000',
    payment_method: 'Bank Transfer',
    payment_status: 'COMPLETED',
    transaction_date: '30 November 2025',
    paid_at: '30 November 2025',
    expiry_date: '30 Desember 2025',
    product_name: 'Panduan Ekspor',
    course_name: 'Kelas Ekspor Pemula',
    membership_type: 'Pro Member',
    invoice_link: 'https://eksporyuk.com/invoice/TRX-2024-001',
    payment_link: 'https://eksporyuk.com/payment/TRX-2024-001',
    dashboard_link: 'https://eksporyuk.com/dashboard',
    profile_link: 'https://eksporyuk.com/profile',
    support_link: 'https://eksporyuk.com/support',
    unsubscribe_link: 'https://eksporyuk.com/unsubscribe/user123',
    company_name: 'EksporYuk',
    year: new Date().getFullYear().toString(),
    date: new Date().toLocaleDateString('id-ID')
  }
  
  let result = content
  Object.entries(sampleData).forEach(([key, value]) => {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value)
  })
  
  return result
}

export default function CampaignForm({
  mode,
  campaign,
  onSave,
  onCancel,
}: {
  mode: 'create' | 'edit'
  campaign?: any
  onSave: () => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState({
    name: campaign?.name || '',
    type: campaign?.type || 'EMAIL',
    targetType: campaign?.targetType || 'ALL',
    targetRoles: campaign?.targetRoles || [],
    targetMembershipIds: campaign?.targetMembershipIds || [],
    targetTransactionStatus: campaign?.targetTransactionStatus || [],
    targetTransactionType: campaign?.targetTransactionType || [],
    targetEventIds: campaign?.targetEventIds || [],
    emailSubject: campaign?.emailSubject || '',
    emailBody: campaign?.emailBody || '',
    emailCtaText: campaign?.emailCtaText || '',
    emailCtaLink: campaign?.emailCtaLink || '',
    whatsappMessage: campaign?.whatsappMessage || '',
    whatsappCtaText: campaign?.whatsappCtaText || '',
    whatsappCtaLink: campaign?.whatsappCtaLink || '',
    actionType: campaign?.status === 'SCHEDULED' ? 'schedule' : 'draft',
    scheduledAt: campaign?.scheduledAt ? new Date(campaign.scheduledAt).toISOString().slice(0, 16) : '',
  })
  
  const [saving, setSaving] = useState(false)
  const [previewAudience, setPreviewAudience] = useState<any>(null)
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [footerSettings, setFooterSettings] = useState<any>(null)

  // Load footer settings
  useEffect(() => {
    const loadFooterSettings = async () => {
      try {
        const res = await fetch('/api/admin/settings')
        if (res.ok) {
          const data = await res.json()
          if (data.success && data.settings) {
            setFooterSettings(data.settings)
          }
        }
      } catch (error) {
        console.error('Failed to load footer settings:', error)
      }
    }
    loadFooterSettings()
  }, [])

  const handlePreviewAudience = async () => {
    setLoadingPreview(true)
    try {
      const res = await fetch('/api/admin/broadcast/preview-audience', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetType: formData.targetType,
          targetRoles: formData.targetRoles,
          targetMembershipIds: formData.targetMembershipIds,
          targetTransactionStatus: formData.targetTransactionStatus,
          targetTransactionType: formData.targetTransactionType,
          targetEventIds: formData.targetEventIds,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setPreviewAudience(data)
      }
    } catch (error) {
      console.error('Preview error:', error)
    } finally {
      setLoadingPreview(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    
    try {
      // Validate scheduled date if action is schedule
      if (formData.actionType === 'schedule') {
        if (!formData.scheduledAt) {
          alert('Silakan pilih tanggal dan waktu untuk jadwal pengiriman')
          setSaving(false)
          return
        }
        
        const scheduledDate = new Date(formData.scheduledAt)
        const now = new Date()
        
        if (scheduledDate <= now) {
          alert('Waktu jadwal harus di masa depan')
          setSaving(false)
          return
        }
      }
      
      const endpoint = '/api/admin/broadcast'
      const method = mode === 'create' ? 'POST' : 'PUT'
      
      const payload: any = {
        ...formData,
        status: formData.actionType === 'schedule' ? 'SCHEDULED' : 'DRAFT',
        scheduledAt: formData.actionType === 'schedule' ? formData.scheduledAt : null,
      }
      
      if (mode === 'edit') {
        payload.id = campaign.id
      }
      
      // Remove actionType from payload (it's only for UI)
      delete payload.actionType

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        const actionText = formData.actionType === 'schedule' ? 'dijadwalkan' : (mode === 'create' ? 'disimpan sebagai draft' : 'diupdate')
        alert(`Campaign berhasil ${actionText}`)
        onSave()
      } else {
        const errorData = await res.json()
        alert(errorData.error || 'Gagal menyimpan campaign')
      }
    } catch (error) {
      console.error('Save campaign error:', error)
      alert('Terjadi kesalahan')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <button
          onClick={onCancel}
          className="text-gray-600 hover:text-gray-900 mb-2 flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali
        </button>
        <h2 className="text-xl font-bold text-gray-900">
          {mode === 'create' ? 'Buat' : 'Edit'} Broadcast Campaign
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Informasi Campaign</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nama Campaign *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Contoh: Promo Akhir Tahun"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipe Campaign *
              </label>
              <select
                required
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="EMAIL">Email</option>
                <option value="WHATSAPP">WhatsApp</option>
              </select>
            </div>
          </div>
        </div>

        {/* Target Audience */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Target Audience</h3>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipe Target *
            </label>
            <select
              required
              value={formData.targetType}
              onChange={(e) => setFormData({ ...formData, targetType: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Semua User</option>
              <option value="BY_ROLE">Berdasarkan Role</option>
              <option value="BY_MEMBERSHIP">Berdasarkan Membership</option>
              <option value="BY_GROUP">Berdasarkan Group</option>
              <option value="BY_COURSE">Berdasarkan Course</option>
              <option value="BY_TRANSACTION">Berdasarkan Transaksi</option>
              <option value="BY_EVENT">Berdasarkan Event</option>
              <option value="CUSTOM">Custom List</option>
            </select>
          </div>

          {/* Transaction Status Selector */}
          {formData.targetType === 'BY_TRANSACTION' && (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status Transaksi
                </label>
                <div className="space-y-2">
                  {['PENDING', 'COMPLETED', 'FAILED', 'EXPIRED'].map(status => (
                    <label key={status} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={(formData.targetTransactionStatus || []).includes(status)}
                        onChange={(e) => {
                          const current = formData.targetTransactionStatus || []
                          setFormData({
                            ...formData,
                            targetTransactionStatus: e.target.checked
                              ? [...current, status]
                              : current.filter(s => s !== status)
                          })
                        }}
                        className="mr-2"
                      />
                      <span>{status === 'PENDING' ? 'Menunggu Pembayaran' : status === 'COMPLETED' ? 'Selesai' : status === 'FAILED' ? 'Gagal' : 'Kadaluarsa'}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipe Transaksi
                </label>
                <div className="space-y-2">
                  {['COURSE', 'MEMBERSHIP', 'PRODUCT'].map(type => (
                    <label key={type} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={(formData.targetTransactionType || []).includes(type)}
                        onChange={(e) => {
                          const current = formData.targetTransactionType || []
                          setFormData({
                            ...formData,
                            targetTransactionType: e.target.checked
                              ? [...current, type]
                              : current.filter(t => t !== type)
                          })
                        }}
                        className="mr-2"
                      />
                      <span>{type === 'COURSE' ? 'Course' : type === 'MEMBERSHIP' ? 'Membership' : 'Produk'}</span>
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Event Selector - simplified for now */}
          {formData.targetType === 'BY_EVENT' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Event IDs (pisahkan dengan koma)
              </label>
              <input
                type="text"
                placeholder="event-1, event-2"
                value={(formData.targetEventIds || []).join(', ')}
                onChange={(e) => {
                  const ids = e.target.value.split(',').map(id => id.trim()).filter(Boolean)
                  setFormData({ ...formData, targetEventIds: ids })
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          <button
            type="button"
            onClick={handlePreviewAudience}
            disabled={loadingPreview}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
          >
            {loadingPreview ? 'Loading...' : 'Preview Audience'}
          </button>

          {previewAudience && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm font-medium text-blue-900">
                Total: {previewAudience.totalUsers} users
              </p>
              <p className="text-xs text-blue-700 mt-1">
                Email enabled: {previewAudience.emailEnabledUsers} | 
                WhatsApp enabled: {previewAudience.whatsappEnabledUsers}
              </p>
            </div>
          )}
        </div>

        {/* Content with Live Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form Column */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Konten Campaign</h3>

            {formData.type === 'EMAIL' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject Email *
                </label>
                <input
                  type="text"
                  required
                  value={formData.emailSubject}
                  onChange={(e) => setFormData({ ...formData, emailSubject: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Body Email *
                </label>
                <textarea
                  required
                  value={formData.emailBody}
                  onChange={(e) => setFormData({ ...formData, emailBody: e.target.value })}
                  rows={10}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Shortcode: {'{name}'}, {'{email}'}, {'{phone}'}, {'{membership_plan}'}, {'{transaction_id}'}, {'{amount}'}, {'{payment_status}'}, {'{invoice_number}'}, {'{product_name}'}, {'{course_name}'}, {'{paid_at}'}, {'{invoice_link}'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CTA Text
                  </label>
                  <input
                    type="text"
                    value={formData.emailCtaText}
                    onChange={(e) => setFormData({ ...formData, emailCtaText: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CTA Link
                  </label>
                  <input
                    type="url"
                    value={formData.emailCtaLink}
                    onChange={(e) => setFormData({ ...formData, emailCtaLink: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {formData.type === 'WHATSAPP' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pesan WhatsApp *
                </label>
                <textarea
                  required
                  value={formData.whatsappMessage}
                  onChange={(e) => setFormData({ ...formData, whatsappMessage: e.target.value })}
                  rows={10}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Karakter: {formData.whatsappMessage.length} | Shortcode: {'{name}'}, {'{email}'}, {'{phone}'}, {'{membership_plan}'}, {'{transaction_id}'}, {'{amount}'}, {'{payment_status}'}, {'{invoice_link}'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CTA Text
                  </label>
                  <input
                    type="text"
                    value={formData.whatsappCtaText}
                    onChange={(e) => setFormData({ ...formData, whatsappCtaText: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CTA Link
                  </label>
                  <input
                    type="url"
                    value={formData.whatsappCtaLink}
                    onChange={(e) => setFormData({ ...formData, whatsappCtaLink: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
            <p className="text-xs text-yellow-800 font-medium mb-2">Shortcode tersedia:</p>
            <p className="text-xs text-yellow-700">
              User: {'{name}'}, {'{email}'}, {'{phone}'}, {'{membership_plan}'}
              <br />
              Transaction: {'{transaction_id}'}, {'{amount}'}, {'{payment_status}'}, {'{invoice_number}'}, {'{product_name}'}, {'{course_name}'}, {'{paid_at}'}
              <br />
              Links: {'{invoice_link}'}, {'{payment_link}'}, {'{dashboard_link}'}, {'{unsubscribe_link}'}
            </p>
          </div>
          </div>

          {/* Preview Column */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Live Preview</h3>
            
            {formData.type === 'EMAIL' && (
              <div className="border border-gray-300 rounded-lg overflow-hidden">
                <div className="bg-gray-100 p-3 border-b border-gray-300">
                  <p className="text-xs text-gray-600 mb-1">Subject:</p>
                  <p className="text-sm font-medium text-gray-900">
                    {replacePreviewShortcodes(formData.emailSubject) || '(No subject)'}
                  </p>
                </div>
                <div className="p-4 bg-white min-h-[300px]">
                  <div className="prose prose-sm max-w-none">
                    {replacePreviewShortcodes(formData.emailBody)?.split('\n').map((line, i) => (
                      <p key={i} className="mb-2">{line || '\u00A0'}</p>
                    )) || <p className="text-gray-400 italic">(Empty content)</p>}
                  </div>
                  {formData.emailCtaText && (
                    <div className="mt-6">
                      <a 
                        href={formData.emailCtaLink || '#'} 
                        className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                      >
                        {formData.emailCtaText}
                      </a>
                    </div>
                  )}
                </div>
                {/* Email Footer - Dynamic from Settings */}
                <div className="bg-gray-50 border-t border-gray-200 p-6 text-center">
                  <div className="text-xs text-gray-600 space-y-2">
                    <p className="font-semibold text-gray-800">
                      {footerSettings?.emailFooterCompanyName || 'EksporYuk'}
                    </p>
                    <p>{footerSettings?.emailFooterDescription || 'Platform Edukasi & Mentoring Ekspor Terpercaya'}</p>
                    <p>
                      {footerSettings?.emailFooterAddress || 'Jakarta, Indonesia'} | {' '}
                      {footerSettings?.emailFooterSupportEmail || 'support@eksporyuk.com'}
                    </p>
                    <div className="flex justify-center gap-4 mt-3">
                      {footerSettings?.emailFooterWebsiteUrl && (
                        <a href={footerSettings.emailFooterWebsiteUrl} className="text-blue-600 hover:underline">
                          Website
                        </a>
                      )}
                      {footerSettings?.emailFooterInstagramUrl && (
                        <a href={footerSettings.emailFooterInstagramUrl} className="text-blue-600 hover:underline">
                          Instagram
                        </a>
                      )}
                      {footerSettings?.emailFooterFacebookUrl && (
                        <a href={footerSettings.emailFooterFacebookUrl} className="text-blue-600 hover:underline">
                          Facebook
                        </a>
                      )}
                      {footerSettings?.emailFooterLinkedinUrl && (
                        <a href={footerSettings.emailFooterLinkedinUrl} className="text-blue-600 hover:underline">
                          LinkedIn
                        </a>
                      )}
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-300">
                      <a href="{unsubscribe_link}" className="text-gray-500 hover:text-gray-700 underline text-xs">
                        Unsubscribe dari email ini
                      </a>
                    </div>
                    <p className="text-gray-400 mt-2">
                      © {new Date().getFullYear()} {footerSettings?.emailFooterCopyrightText || 'EksporYuk. All rights reserved.'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {formData.type === 'WHATSAPP' && (
              <div className="border border-gray-300 rounded-lg overflow-hidden">
                <div className="bg-gradient-to-b from-green-100 to-green-50 p-3 border-b border-gray-300">
                  <p className="text-xs text-gray-600 font-medium">WhatsApp Message Preview</p>
                </div>
                <div className="p-4 bg-[#e5ddd5] min-h-[300px]">
                  <div className="bg-white rounded-lg p-3 shadow-sm max-w-sm">
                    <div className="text-sm text-gray-900 whitespace-pre-wrap">
                      {replacePreviewShortcodes(formData.whatsappMessage) || <span className="text-gray-400 italic">(Empty message)</span>}
                    </div>
                    {formData.whatsappCtaText && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <a 
                          href={formData.whatsappCtaLink || '#'} 
                          className="text-blue-600 hover:underline text-sm font-medium"
                        >
                          🔗 {formData.whatsappCtaText}
                        </a>
                      </div>
                    )}
                    <p className="text-xs text-gray-400 mt-2 text-right">
                      {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  {/* WhatsApp Footer Info */}
                  <div className="mt-4 text-center">
                    <div className="inline-block bg-white/80 rounded-full px-3 py-1 text-xs text-gray-600">
                      <span className="text-green-600">✓</span> End-to-end encrypted
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!formData.type && (
              <div className="flex items-center justify-center h-[300px] text-gray-400">
                <p className="text-sm">Pilih tipe campaign untuk melihat preview</p>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Aksi Campaign</h3>
          
          <div className="space-y-4">
            {/* Action Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pilih Aksi *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className={`relative flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  formData.actionType === 'draft' ? 'border-blue-600 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                }`}>
                  <input
                    type="radio"
                    name="actionType"
                    value="draft"
                    checked={formData.actionType === 'draft'}
                    onChange={(e) => setFormData({ ...formData, actionType: e.target.value })}
                    className="mt-0.5"
                  />
                  <div className="ml-3">
                    <span className="block font-medium text-gray-900">
                      💾 Simpan sebagai Draft
                    </span>
                    <span className="block text-sm text-gray-600 mt-1">
                      Campaign akan disimpan dan bisa dikirim nanti
                    </span>
                  </div>
                </label>
                
                <label className={`relative flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  formData.actionType === 'schedule' ? 'border-blue-600 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                }`}>
                  <input
                    type="radio"
                    name="actionType"
                    value="schedule"
                    checked={formData.actionType === 'schedule'}
                    onChange={(e) => setFormData({ ...formData, actionType: e.target.value })}
                    className="mt-0.5"
                  />
                  <div className="ml-3">
                    <span className="block font-medium text-gray-900">
                      📅 Jadwalkan Pengiriman
                    </span>
                    <span className="block text-sm text-gray-600 mt-1">
                      Campaign akan dikirim otomatis sesuai jadwal
                    </span>
                  </div>
                </label>
              </div>
            </div>
            
            {/* Schedule Date Time */}
            {formData.actionType === 'schedule' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  ⏰ Pilih Tanggal & Waktu Pengiriman *
                </label>
                <input
                  type="datetime-local"
                  required={formData.actionType === 'schedule'}
                  value={formData.scheduledAt}
                  onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                  className="w-full md:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  min={new Date().toISOString().slice(0, 16)}
                />
                <p className="text-xs text-gray-600 mt-2">
                  Campaign akan otomatis terkirim pada waktu yang dijadwalkan (Zona Waktu: WIB)
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Menyimpan...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {formData.actionType === 'schedule' ? 'Jadwalkan Campaign' : 'Simpan Campaign'}
                </span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
