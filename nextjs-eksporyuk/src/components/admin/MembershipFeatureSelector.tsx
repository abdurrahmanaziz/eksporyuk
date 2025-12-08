'use client'

import { useState, useEffect } from 'react'
import { FEATURE_DEFINITIONS, AVAILABLE_FEATURES } from '@/lib/features'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger 
} from '@/components/ui/accordion'
import {
  DollarSign, GraduationCap, Database, BarChart3, 
  Settings, Megaphone, Calendar, FileText, Users,
  Briefcase, Zap, Shield, Check
} from 'lucide-react'

interface FeatureConfig {
  featureKey: string
  enabled: boolean
  value: any
}

interface MembershipFeatureSelectorProps {
  selectedFeatures: FeatureConfig[]
  onFeaturesChange: (features: FeatureConfig[]) => void
  disabled?: boolean
}

// Group features by category
const groupFeaturesByCategory = () => {
  const grouped: { [category: string]: typeof FEATURE_DEFINITIONS[number][] } = {}
  
  FEATURE_DEFINITIONS.forEach(feature => {
    if (!grouped[feature.category]) {
      grouped[feature.category] = []
    }
    grouped[feature.category].push(feature)
  })
  
  return grouped
}

// Category icons
const categoryIcons: { [key: string]: any } = {
  'Keuangan': DollarSign,
  'Pendidikan': GraduationCap,
  'Administrasi': Shield,
  'Database': Database,
  'Analitik': BarChart3,
  'Operasional': Settings,
  'Marketing': Megaphone,
  'Event': Calendar,
  'Dokumen': FileText,
  'Komunitas': Users,
  'Bisnis': Briefcase,
  'Lanjutan': Zap
}

export default function MembershipFeatureSelector({
  selectedFeatures,
  onFeaturesChange,
  disabled = false
}: MembershipFeatureSelectorProps) {
  const groupedFeatures = groupFeaturesByCategory()
  
  // Check if feature is selected
  const isFeatureSelected = (featureKey: string) => {
    return selectedFeatures.some(f => f.featureKey === featureKey && f.enabled)
  }
  
  // Get feature config value
  const getFeatureValue = (featureKey: string) => {
    const feature = selectedFeatures.find(f => f.featureKey === featureKey)
    return feature?.value || null
  }
  
  // Toggle feature selection
  const toggleFeature = (featureKey: string, defaultValue: any) => {
    const existing = selectedFeatures.find(f => f.featureKey === featureKey)
    
    if (existing) {
      // Toggle off
      onFeaturesChange(selectedFeatures.filter(f => f.featureKey !== featureKey))
    } else {
      // Add new
      onFeaturesChange([
        ...selectedFeatures,
        { featureKey, enabled: true, value: defaultValue }
      ])
    }
  }
  
  // Update feature value
  const updateFeatureValue = (featureKey: string, newValue: any) => {
    onFeaturesChange(
      selectedFeatures.map(f => 
        f.featureKey === featureKey 
          ? { ...f, value: newValue }
          : f
      )
    )
  }
  
  // Select all in category
  const selectAllInCategory = (category: string) => {
    const categoryFeatures = groupedFeatures[category] || []
    const currentKeys = selectedFeatures.map(f => f.featureKey)
    
    const allSelected = categoryFeatures.every(f => currentKeys.includes(f.key))
    
    if (allSelected) {
      // Deselect all in category
      onFeaturesChange(
        selectedFeatures.filter(f => !categoryFeatures.some(cf => cf.key === f.featureKey))
      )
    } else {
      // Select all in category
      const newFeatures = [...selectedFeatures]
      categoryFeatures.forEach(feature => {
        if (!currentKeys.includes(feature.key)) {
          newFeatures.push({
            featureKey: feature.key,
            enabled: true,
            value: feature.defaultValue
          })
        }
      })
      onFeaturesChange(newFeatures)
    }
  }
  
  // Count selected in category
  const countSelectedInCategory = (category: string) => {
    const categoryFeatures = groupedFeatures[category] || []
    return categoryFeatures.filter(f => isFeatureSelected(f.key)).length
  }
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium text-gray-900">Pilih Fitur Akses</h4>
          <p className="text-sm text-gray-500">
            {selectedFeatures.length} fitur dipilih
          </p>
        </div>
        <Badge variant="outline" className="bg-blue-50 text-blue-700">
          <Check className="w-3 h-3 mr-1" />
          {selectedFeatures.length} Aktif
        </Badge>
      </div>
      
      <Accordion type="multiple" className="w-full space-y-2">
        {Object.entries(groupedFeatures).map(([category, features]) => {
          const Icon = categoryIcons[category] || Settings
          const selectedCount = countSelectedInCategory(category)
          const totalCount = features.length
          
          return (
            <AccordionItem 
              key={category} 
              value={category}
              className="border rounded-lg px-4 bg-white"
            >
              <AccordionTrigger className="hover:no-underline py-3">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-gray-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <span className="font-medium">{category}</span>
                    <span className="text-sm text-gray-500 ml-2">
                      ({selectedCount}/{totalCount})
                    </span>
                  </div>
                  {selectedCount > 0 && (
                    <Badge className="bg-green-100 text-green-700 mr-2">
                      {selectedCount} aktif
                    </Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-4">
                <div className="space-y-1 mb-3">
                  <button
                    type="button"
                    onClick={() => selectAllInCategory(category)}
                    disabled={disabled}
                    className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
                  >
                    {selectedCount === totalCount ? 'Batalkan Semua' : 'Pilih Semua'}
                  </button>
                </div>
                
                <div className="space-y-3">
                  {features.map(feature => (
                    <div 
                      key={feature.key}
                      className={`p-3 rounded-lg border transition-colors ${
                        isFeatureSelected(feature.key) 
                          ? 'border-blue-200 bg-blue-50' 
                          : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Checkbox
                          id={feature.key}
                          checked={isFeatureSelected(feature.key)}
                          onCheckedChange={() => toggleFeature(feature.key, feature.defaultValue)}
                          disabled={disabled}
                          className="mt-0.5"
                        />
                        <div className="flex-1">
                          <Label 
                            htmlFor={feature.key}
                            className="font-medium text-gray-900 cursor-pointer"
                          >
                            {feature.name}
                          </Label>
                          <p className="text-sm text-gray-500 mt-0.5">
                            {feature.description}
                          </p>
                          
                          {/* Show configurable options if selected */}
                          {isFeatureSelected(feature.key) && feature.defaultValue && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <FeatureValueEditor
                                featureKey={feature.key}
                                value={getFeatureValue(feature.key) || feature.defaultValue}
                                defaultValue={feature.defaultValue}
                                onChange={(newValue) => updateFeatureValue(feature.key, newValue)}
                                disabled={disabled}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          )
        })}
      </Accordion>
    </div>
  )
}

// Component for editing feature values
function FeatureValueEditor({
  featureKey,
  value,
  defaultValue,
  onChange,
  disabled
}: {
  featureKey: string
  value: any
  defaultValue: any
  onChange: (value: any) => void
  disabled: boolean
}) {
  if (!value || typeof value !== 'object') return null
  
  return (
    <div className="grid grid-cols-2 gap-3">
      {Object.entries(value).map(([key, val]) => {
        // Skip array/object for simple editing
        if (Array.isArray(val) || (typeof val === 'object' && val !== null)) {
          return (
            <div key={key} className="col-span-2">
              <Label className="text-xs text-gray-500 capitalize">{key.replace(/([A-Z])/g, ' $1')}</Label>
              <p className="text-sm text-gray-700">
                {Array.isArray(val) ? val.join(', ') : JSON.stringify(val)}
              </p>
            </div>
          )
        }
        
        // Boolean toggle
        if (typeof val === 'boolean') {
          return (
            <div key={key} className="flex items-center gap-2">
              <Checkbox
                id={`${featureKey}-${key}`}
                checked={val}
                onCheckedChange={(checked) => onChange({ ...value, [key]: checked })}
                disabled={disabled}
              />
              <Label 
                htmlFor={`${featureKey}-${key}`}
                className="text-xs text-gray-600 capitalize"
              >
                {key.replace(/([A-Z])/g, ' $1')}
              </Label>
            </div>
          )
        }
        
        // Number input
        if (typeof val === 'number') {
          return (
            <div key={key}>
              <Label className="text-xs text-gray-500 capitalize">
                {key.replace(/([A-Z])/g, ' $1')}
              </Label>
              <Input
                type="number"
                value={val}
                onChange={(e) => onChange({ ...value, [key]: parseInt(e.target.value) || 0 })}
                disabled={disabled}
                className="h-8 text-sm"
              />
            </div>
          )
        }
        
        // String input
        if (typeof val === 'string') {
          return (
            <div key={key}>
              <Label className="text-xs text-gray-500 capitalize">
                {key.replace(/([A-Z])/g, ' $1')}
              </Label>
              <Input
                type="text"
                value={val}
                onChange={(e) => onChange({ ...value, [key]: e.target.value })}
                disabled={disabled}
                className="h-8 text-sm"
              />
            </div>
          )
        }
        
        return null
      })}
    </div>
  )
}
