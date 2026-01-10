'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Save,
  X,
  Eye,
  Code,
  Lightbulb,
  Info,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Copy,
  Smartphone,
  Monitor,
  Tablet,
  Tag,
  Plus,
  Trash2,
  Wand2
} from 'lucide-react'
import { toast } from 'sonner'

interface BrandedTemplate {
  id?: string
  name: string
  slug?: string
  description?: string
  category: string
  type: string
  roleTarget?: string
  subject: string
  content: string
  ctaText?: string
  ctaLink?: string
  priority: string
  isDefault: boolean
  isSystem: boolean
  isActive: boolean
  tags: string[]
  variables?: any
  usageCount?: number
  lastUsedAt?: string
  creator?: {
    name: string
    email: string
  }
  createdAt?: string
}

interface TemplateFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  template?: BrandedTemplate | null
  onSave: () => void
}

interface PreviewModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  template: BrandedTemplate | null
}

const CATEGORIES = [
  { value: 'SYSTEM', label: 'System', icon: '⚙️', color: 'gray' },
  { value: 'MEMBERSHIP', label: 'Membership', icon: '👑', color: 'blue' },
  { value: 'AFFILIATE', label: 'Affiliate', icon: '🤝', color: 'green' },
  { value: 'COURSE', label: 'Course', icon: '📚', color: 'purple' },
  { value: 'PAYMENT', label: 'Payment', icon: '💳', color: 'orange' },
  { value: 'MARKETING', label: 'Marketing', icon: '📢', color: 'pink' },
  { value: 'NOTIFICATION', label: 'Notification', icon: '🔔', color: 'yellow' },
]

const TEMPLATE_TYPES = [
  { value: 'EMAIL', label: 'Email', icon: '📧' },
  { value: 'WHATSAPP', label: 'WhatsApp', icon: '💬' },
  { value: 'SMS', label: 'SMS', icon: '📱' },
  { value: 'PUSH', label: 'Push Notification', icon: '🔔' },
]

const ROLE_TARGETS = [
  { value: 'ALL', label: 'All Users' },
  { value: 'ADMIN', label: 'Admin' },
  { value: 'AFFILIATE', label: 'Affiliate' },
  { value: 'MEMBER', label: 'Member' },
  { value: 'MENTOR', label: 'Mentor' },
  { value: 'SUPPLIER', label: 'Supplier' },
]

const PRIORITIES = [
  { value: 'HIGH', label: 'High', color: 'red' },
  { value: 'NORMAL', label: 'Normal', color: 'blue' },
  { value: 'LOW', label: 'Low', color: 'gray' },
]

// Common shortcodes for templates
const SHORTCODES = [
  { category: 'User Data', items: [
    { code: '{user.name}', desc: 'User full name' },
    { code: '{user.email}', desc: 'User email address' },
    { code: '{user.phone}', desc: 'User phone number' },
    { code: '{user.role}', desc: 'User role' },
    { code: '{user.membershipLevel}', desc: 'Membership level' },
    { code: '{user.affiliateCode}', desc: 'Affiliate code' },
    { code: '{user.totalEarnings}', desc: 'Total earnings' },
    { code: '{user.joinDate}', desc: 'Join date' },
  ]},
  { category: 'System Links', items: [
    { code: '{links.dashboard}', desc: 'Dashboard URL' },
    { code: '{links.profile}', desc: 'Profile URL' },
    { code: '{links.courses}', desc: 'Courses URL' },
    { code: '{links.affiliate}', desc: 'Affiliate URL' },
    { code: '{links.support}', desc: 'Support URL' },
    { code: '{links.unsubscribe}', desc: 'Unsubscribe URL' },
  ]},
  { category: 'Brand Info', items: [
    { code: '{brand.name}', desc: 'EksporYuk' },
    { code: '{brand.logo}', desc: 'Brand logo URL' },
    { code: '{brand.email}', desc: 'Contact email' },
    { code: '{brand.phone}', desc: 'Contact phone' },
    { code: '{brand.address}', desc: 'Company address' },
    { code: '{brand.website}', desc: 'Website URL' },
  ]},
  { category: 'Transaction', items: [
    { code: '{transaction.id}', desc: 'Transaction ID' },
    { code: '{transaction.amount}', desc: 'Amount' },
    { code: '{transaction.type}', desc: 'Transaction type' },
    { code: '{transaction.date}', desc: 'Transaction date' },
    { code: '{transaction.status}', desc: 'Status' },
  ]},
  { category: 'Course Data', items: [
    { code: '{course.title}', desc: 'Course title' },
    { code: '{course.instructor}', desc: 'Instructor name' },
    { code: '{course.progress}', desc: 'Progress percentage' },
    { code: '{course.nextLesson}', desc: 'Next lesson' },
    { code: '{course.certificate}', desc: 'Certificate URL' },
  ]},
  { category: 'Common', items: [
    { code: '{current.date}', desc: 'Current date' },
    { code: '{current.year}', desc: 'Current year' },
    { code: '{current.time}', desc: 'Current time' },
  ]}
]

export function TemplateFormModal({ open, onOpenChange, template, onSave }: TemplateFormModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<Partial<BrandedTemplate>>({
    name: '',
    description: '',
    category: 'NOTIFICATION',
    type: 'EMAIL',
    roleTarget: 'ALL',
    subject: '',
    content: '',
    ctaText: '',
    ctaLink: '',
    priority: 'NORMAL',
    isDefault: false,
    isSystem: false,
    isActive: true,
    tags: []
  })
  const [newTag, setNewTag] = useState('')

  useEffect(() => {
    if (template) {
      setFormData(template)
    } else {
      setFormData({
        name: '',
        description: '',
        category: 'NOTIFICATION',
        type: 'EMAIL',
        roleTarget: 'ALL',
        subject: '',
        content: '',
        ctaText: '',
        ctaLink: '',
        priority: 'NORMAL',
        isDefault: false,
        isSystem: false,
        isActive: true,
        tags: []
      })
    }
  }, [template, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = template?.id 
        ? `/api/admin/branded-templates/${template.id}`
        : '/api/admin/branded-templates'
      
      const method = template?.id ? 'PUT' : 'POST'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await res.json()

      if (data.success) {
        toast.success(data.message || `Template ${template?.id ? 'updated' : 'created'} successfully`)
        onSave()
        onOpenChange(false)
      } else {
        toast.error(data.error || `Failed to ${template?.id ? 'update' : 'create'} template`)
      }
    } catch (error) {
      console.error('Error saving template:', error)
      toast.error(`Failed to ${template?.id ? 'update' : 'create'} template`)
    } finally {
      setLoading(false)
    }
  }

  const addTag = () => {
    if (newTag.trim() && !formData.tags?.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), newTag.trim()]
      }))
      setNewTag('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(tag => tag !== tagToRemove) || []
    }))
  }

  const insertShortcode = (code: string) => {
    const textarea = document.querySelector('textarea[name="content"]') as HTMLTextAreaElement
    if (textarea) {
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const text = formData.content || ''
      const before = text.substring(0, start)
      const after = text.substring(end)
      const newContent = before + code + after
      
      setFormData(prev => ({ ...prev, content: newContent }))
      
      // Reset cursor position after the inserted shortcode
      setTimeout(() => {
        textarea.focus()
        textarea.setSelectionRange(start + code.length, start + code.length)
      }, 0)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {template?.id ? 'Edit Template' : 'Create New Template'}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="details" className="flex-1 overflow-hidden">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Template Details</TabsTrigger>
            <TabsTrigger value="content">Content & Shortcodes</TabsTrigger>
            <TabsTrigger value="settings">Advanced Settings</TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[60vh] mt-4">
            <form onSubmit={handleSubmit} className="space-y-6 pr-4">
              
              {/* Template Details Tab */}
              <TabsContent value="details" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Template Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Welcome Email Template"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="category">Category *</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map(cat => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.icon} {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="type">Template Type *</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TEMPLATE_TYPES.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.icon} {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="roleTarget">Target Role</Label>
                    <Select
                      value={formData.roleTarget || 'ALL'}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, roleTarget: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLE_TARGETS.map(role => (
                          <SelectItem key={role.value} value={role.value}>
                            {role.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of when this template is used..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="subject">Subject Line *</Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder="e.g., Welcome to EksporYuk, {user.name}!"
                    required
                  />
                </div>

                {/* Tags */}
                <div>
                  <Label>Tags</Label>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        placeholder="Add a tag..."
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                      />
                      <Button type="button" onClick={addTag} size="sm">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    {formData.tags && formData.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {formData.tags.map(tag => (
                          <Badge key={tag} variant="outline" className="flex items-center gap-1">
                            <Tag className="w-3 h-3" />
                            {tag}
                            <Button
                              type="button"
                              onClick={() => removeTag(tag)}
                              size="sm"
                              variant="ghost"
                              className="h-auto p-0 ml-1"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              {/* Content & Shortcodes Tab */}
              <TabsContent value="content" className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="content">Email Content *</Label>
                    <p className="text-xs text-gray-500 mb-2">
                      Tulis teks biasa saja (tanpa HTML). Header, logo, dan footer EksporYuk akan otomatis ditambahkan.
                    </p>
                    <Textarea
                      id="content"
                      name="content"
                      value={formData.content}
                      onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                      placeholder="Enter your email content here. Use shortcodes for dynamic data..."
                      rows={15}
                      className="font-mono text-sm"
                      required
                    />
                    
                    {/* CTA Section */}
                    <div className="grid grid-cols-2 gap-3 mt-4">
                      <div>
                        <Label htmlFor="ctaText">CTA Button Text</Label>
                        <Input
                          id="ctaText"
                          value={formData.ctaText || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, ctaText: e.target.value }))}
                          placeholder="e.g., Get Started"
                        />
                      </div>
                      <div>
                        <Label htmlFor="ctaLink">CTA Link</Label>
                        <Input
                          id="ctaLink"
                          value={formData.ctaLink || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, ctaLink: e.target.value }))}
                          placeholder="e.g., {links.dashboard}"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium mb-3 block">
                      Available Shortcodes
                      <span className="text-xs text-gray-500 ml-2">Click to insert</span>
                    </Label>
                    <ScrollArea className="h-[400px] border rounded-md p-3">
                      {SHORTCODES.map((category, idx) => (
                        <div key={idx} className="mb-4">
                          <h4 className="font-medium text-sm text-gray-700 mb-2 flex items-center gap-2">
                            <Wand2 className="w-4 h-4" />
                            {category.category}
                          </h4>
                          <div className="space-y-1 ml-2">
                            {category.items.map((item, itemIdx) => (
                              <div
                                key={itemIdx}
                                className="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer group"
                                onClick={() => insertShortcode(item.code)}
                              >
                                <div>
                                  <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                                    {item.code}
                                  </code>
                                  <p className="text-xs text-gray-600 mt-1">
                                    {item.desc}
                                  </p>
                                </div>
                                <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </ScrollArea>
                  </div>
                </div>

                <Alert>
                  <Lightbulb className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Template Guidelines:</strong>
                    <ul className="mt-2 text-sm space-y-1">
                      <li>• Use shortcodes untuk data dinamis seperti {'{user.name}'} dan {'{links.dashboard}'}</li>
                      <li>• Tulis konten dalam teks biasa (tanpa HTML) - branding, logo header, dan footer akan otomatis ditambahkan</li>
                      <li>• Gunakan paragraf kosong untuk memisahkan section</li>
                      <li>• CTA button akan ditampilkan sebagai tombol branded jika diisi</li>
                    </ul>
                  </AlertDescription>
                </Alert>
              </TabsContent>

              {/* Advanced Settings Tab */}
              <TabsContent value="settings" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="priority">Priority Level</Label>
                    <Select
                      value={formData.priority}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PRIORITIES.map(priority => (
                          <SelectItem key={priority.value} value={priority.value}>
                            <span className={`inline-block w-2 h-2 rounded-full mr-2 bg-${priority.color}-500`}></span>
                            {priority.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="isActive">Active Status</Label>
                      <p className="text-sm text-gray-600">
                        Inactive templates won't be available for selection
                      </p>
                    </div>
                    <Switch
                      id="isActive"
                      checked={formData.isActive}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="isDefault">Default Template</Label>
                      <p className="text-sm text-gray-600">
                        Mark as default template for this category and type
                      </p>
                    </div>
                    <Switch
                      id="isDefault"
                      checked={formData.isDefault}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isDefault: checked }))}
                    />
                  </div>

                  {formData.isSystem && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        This is a system template. Some settings cannot be modified.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </TabsContent>
            </form>
          </ScrollArea>
        </Tabs>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {template?.id ? 'Update Template' : 'Create Template'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function TemplatePreviewModal({ open, onOpenChange, template }: PreviewModalProps) {
  const [previewData, setPreviewData] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [device, setDevice] = useState<'mobile' | 'tablet' | 'desktop'>('desktop')

  useEffect(() => {
    if (open && template) {
      loadPreview()
    }
  }, [open, template])

  const loadPreview = async () => {
    if (!template?.id) return

    try {
      setLoading(true)
      const res = await fetch(`/api/admin/branded-templates/${template.id}/preview`)
      const data = await res.json()

      if (data.success) {
        setPreviewData(data.data.html)
      } else {
        toast.error('Failed to load preview')
      }
    } catch (error) {
      console.error('Error loading preview:', error)
      toast.error('Failed to load preview')
    } finally {
      setLoading(false)
    }
  }

  const getDeviceClass = () => {
    switch (device) {
      case 'mobile': return 'max-w-sm'
      case 'tablet': return 'max-w-md'
      default: return 'max-w-2xl'
    }
  }

  if (!template) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Preview: {template.name}
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                variant={device === 'mobile' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDevice('mobile')}
              >
                <Smartphone className="w-4 h-4" />
              </Button>
              <Button
                variant={device === 'tablet' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDevice('tablet')}
              >
                <Tablet className="w-4 h-4" />
              </Button>
              <Button
                variant={device === 'desktop' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDevice('desktop')}
              >
                <Monitor className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex justify-center min-h-[500px]">
          {loading ? (
            <div className="flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : (
            <div className={`${getDeviceClass()} transition-all duration-300`}>
              <div className="border border-gray-300 bg-white rounded-lg overflow-hidden shadow-lg">
                {previewData ? (
                  <div dangerouslySetInnerHTML={{ __html: previewData }} />
                ) : (
                  <div className="p-8 text-center text-gray-500">
                    <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No preview available</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}