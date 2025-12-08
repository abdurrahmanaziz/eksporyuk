'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  FileText, 
  Clock, 
  Mail, 
  Bell, 
  Inbox, 
  Check,
  Sparkles,
  Zap,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'

interface ReminderTemplate {
  id: string
  name: string
  description: string
  category: string
  triggerType: string
  delayAmount: number
  delayUnit: string
  emailEnabled: boolean
  whatsappEnabled: boolean
  pushEnabled: boolean
  inAppEnabled: boolean
  emailSubject: string
  emailBody: string
  emailCTA: string
  emailCTALink: string
  whatsappMessage: string
  pushTitle: string
  pushBody: string
  inAppTitle: string
  inAppBody: string
  inAppLink: string
  preferredTime: string
  avoidWeekends: boolean
  sequenceOrder: number
}

interface TemplateCategory {
  id: string
  name: string
  description: string
  icon: string
  templates: ReminderTemplate[]
}

interface ReminderTemplatePickerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectTemplate: (template: ReminderTemplate) => void
  membershipId: string
  onApplyAll?: () => void
}

export default function ReminderTemplatePicker({
  open,
  onOpenChange,
  onSelectTemplate,
  membershipId,
  onApplyAll,
}: ReminderTemplatePickerProps) {
  const [categories, setCategories] = useState<TemplateCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [applyingAll, setApplyingAll] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('welcome')

  useEffect(() => {
    if (open) {
      fetchTemplates()
    }
  }, [open])

  const fetchTemplates = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/membership-reminder-templates')
      if (res.ok) {
        const data = await res.json()
        setCategories(data.grouped || [])
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
      toast.error('Gagal memuat templates')
    } finally {
      setLoading(false)
    }
  }

  const handleApplyAllTemplates = async () => {
    if (!confirm('Apakah Anda yakin ingin menerapkan SEMUA template ke membership ini? Template yang sudah ada tidak akan diganti.')) {
      return
    }

    try {
      setApplyingAll(true)
      
      // Get all templates
      const allTemplates: ReminderTemplate[] = []
      categories.forEach(cat => {
        allTemplates.push(...cat.templates)
      })

      // Create reminders one by one
      let successCount = 0
      let errorCount = 0

      for (const template of allTemplates) {
        try {
          const res = await fetch(`/api/admin/membership-plans/${membershipId}/reminders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: template.name,
              description: template.description,
              triggerType: template.triggerType,
              delayAmount: template.delayAmount,
              delayUnit: template.delayUnit,
              
              emailEnabled: template.emailEnabled,
              whatsappEnabled: false, // Disabled since no WA integration
              pushEnabled: template.pushEnabled,
              inAppEnabled: template.inAppEnabled,
              
              emailSubject: template.emailSubject,
              emailBody: template.emailBody,
              emailCTA: template.emailCTA,
              emailCTALink: template.emailCTALink,
              
              whatsappMessage: '',
              whatsappCTA: '',
              whatsappCTALink: '',
              
              pushTitle: template.pushTitle,
              pushBody: template.pushBody,
              pushIcon: '',
              pushClickAction: '',
              
              inAppTitle: template.inAppTitle,
              inAppBody: template.inAppBody,
              inAppLink: template.inAppLink,
              
              preferredTime: template.preferredTime,
              timezone: 'Asia/Jakarta',
              daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
              avoidWeekends: template.avoidWeekends,
              conditions: {},
              stopIfCondition: {},
              stopOnAction: false,
              sequenceOrder: template.sequenceOrder,
              
              isActive: true,
            }),
          })

          if (res.ok) {
            successCount++
          } else {
            errorCount++
          }
        } catch {
          errorCount++
        }
      }

      if (successCount > 0) {
        toast.success(`${successCount} reminder berhasil dibuat!`)
        onApplyAll?.()
        onOpenChange(false)
      }
      if (errorCount > 0) {
        toast.error(`${errorCount} reminder gagal dibuat`)
      }

    } catch (error) {
      console.error('Error applying all templates:', error)
      toast.error('Gagal menerapkan templates')
    } finally {
      setApplyingAll(false)
    }
  }

  const getCategoryIcon = (icon: string) => {
    switch (icon) {
      case '👋': return '👋'
      case '🎯': return '🎯'
      case '💪': return '💪'
      case '⏰': return '⏰'
      case '🔄': return '🔄'
      case '🚀': return '🚀'
      default: return '📋'
    }
  }

  const getTriggerLabel = (type: string) => {
    switch (type) {
      case 'AFTER_PURCHASE': return 'Setelah Pembelian'
      case 'BEFORE_EXPIRY': return 'Sebelum Expired'
      case 'ON_SPECIFIC_DATE': return 'Tanggal Spesifik'
      case 'CONDITIONAL': return 'Conditional'
      default: return type
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Pilih Template Reminder
          </DialogTitle>
          <DialogDescription>
            Pilih template siap pakai atau terapkan semua sekaligus
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-muted-foreground">Memuat templates...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Quick Action */}
            <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                      <Sparkles className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">Terapkan Semua Template</p>
                      <p className="text-sm text-muted-foreground">
                        Buat semua {categories.reduce((acc, cat) => acc + cat.templates.length, 0)} reminder sekaligus
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={handleApplyAllTemplates}
                    disabled={applyingAll}
                    className="gap-2"
                  >
                    {applyingAll ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Menerapkan...
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4" />
                        Terapkan Semua
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Category Tabs */}
            <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
              <TabsList className="flex flex-wrap h-auto gap-1 p-1">
                {categories.map((cat) => (
                  <TabsTrigger 
                    key={cat.id} 
                    value={cat.id}
                    className="gap-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    <span>{getCategoryIcon(cat.icon)}</span>
                    <span>{cat.name}</span>
                    <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                      {cat.templates.length}
                    </Badge>
                  </TabsTrigger>
                ))}
              </TabsList>

              {categories.map((cat) => (
                <TabsContent key={cat.id} value={cat.id} className="mt-4">
                  <div className="mb-4">
                    <p className="text-sm text-muted-foreground">{cat.description}</p>
                  </div>

                  <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-3">
                      {cat.templates.map((template) => (
                        <Card 
                          key={template.id} 
                          className="cursor-pointer hover:border-primary/50 transition-colors"
                          onClick={() => onSelectTemplate(template)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-semibold">{template.name}</h4>
                                  <Badge variant="outline" className="text-xs">
                                    {getTriggerLabel(template.triggerType)} +{template.delayAmount} {template.delayUnit}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                  {template.description}
                                </p>
                                
                                {/* Channels */}
                                <div className="flex items-center gap-2">
                                  {template.emailEnabled && (
                                    <Badge variant="secondary" className="gap-1 text-xs">
                                      <Mail className="h-3 w-3" /> Email
                                    </Badge>
                                  )}
                                  {template.pushEnabled && (
                                    <Badge variant="secondary" className="gap-1 text-xs">
                                      <Bell className="h-3 w-3" /> Push
                                    </Badge>
                                  )}
                                  {template.inAppEnabled && (
                                    <Badge variant="secondary" className="gap-1 text-xs">
                                      <Inbox className="h-3 w-3" /> In-App
                                    </Badge>
                                  )}
                                </div>

                                {/* Preview */}
                                {template.emailSubject && (
                                  <div className="mt-2 p-2 bg-muted/50 rounded text-xs">
                                    <p className="font-medium text-muted-foreground">Subject:</p>
                                    <p className="text-foreground">{template.emailSubject}</p>
                                  </div>
                                )}
                              </div>

                              <Button
                                size="sm"
                                variant="outline"
                                className="ml-4"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onSelectTemplate(template)
                                }}
                              >
                                <Check className="h-4 w-4 mr-1" />
                                Pilih
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>
              ))}
            </Tabs>

            {/* Info */}
            <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
              <CardContent className="p-3 flex items-start gap-2 text-sm">
                <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-blue-800 dark:text-blue-200">
                  <p>
                    Template menggunakan shortcodes seperti <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">{'{name}'}</code>, 
                    <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded mx-1">{'{plan_name}'}</code>, dll yang akan otomatis diganti dengan data member.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
