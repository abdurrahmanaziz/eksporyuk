'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { Loader2, Percent, DollarSign, Edit, Save, X, TrendingUp, Package, CreditCard, ArrowRightLeft, Lightbulb } from 'lucide-react'
import { convertCommissionRate, calculateEquivalentRates, validateCommissionRate, formatCommissionRate, getSuggestedRates } from '@/lib/commission-converter'

interface CommissionItem {
  id: string
  title: string
  price: number
  commissionType: 'FLAT' | 'PERCENTAGE'
  affiliateCommissionRate: number
  equivalentPercentage: string
  isActive: boolean
  duration?: string
  productType?: string
}

interface CommissionData {
  memberships: CommissionItem[]
  products: CommissionItem[]
  statistics: {
    memberships: any
    products: any
    combined: any
  }
}

export default function CommissionSettingsManager() {
  const [data, setData] = useState<CommissionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [editingItem, setEditingItem] = useState<{
    id: string
    type: 'membership' | 'product'
    commissionType: 'FLAT' | 'PERCENTAGE'
    rate: number
    price: number
  } | null>(null)
  const [bulkUpdateMode, setBulkUpdateMode] = useState<{
    type: 'memberships' | 'products'
    commissionType: 'FLAT' | 'PERCENTAGE'
    rate: number
  } | null>(null)

  // Load commission settings
  const fetchCommissionSettings = async () => {
    try {
      const response = await fetch('/api/admin/commission/settings')
      const result = await response.json()
      
      if (result.success) {
        setData(result.data)
      } else {
        toast.error('Failed to load commission settings')
      }
    } catch (error) {
      toast.error('Error loading commission settings')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCommissionSettings()
  }, [])

  // Update commission for single item
  const updateCommission = async (
    itemId: string, 
    itemType: 'membership' | 'product',
    commissionType: 'FLAT' | 'PERCENTAGE',
    rate: number
  ) => {
    setUpdating(itemId)
    
    try {
      const payload = {
        [itemType + 'Id']: itemId,
        commissionType,
        affiliateCommissionRate: rate
      }

      const response = await fetch('/api/admin/commission/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const result = await response.json()

      if (result.success) {
        toast.success(result.message)
        await fetchCommissionSettings() // Refresh data
        setEditingItem(null)
      } else {
        toast.error(result.error || 'Failed to update commission')
      }
    } catch (error) {
      toast.error('Error updating commission')
    } finally {
      setUpdating(null)
    }
  }

  // Bulk update commission
  const bulkUpdateCommission = async (
    itemType: 'memberships' | 'products',
    commissionType: 'FLAT' | 'PERCENTAGE',
    rate: number
  ) => {
    try {
      const items = data?.[itemType] || []
      const payload = {
        [itemType === 'memberships' ? 'membershipIds' : 'productIds']: items.map(item => item.id),
        commissionType,
        affiliateCommissionRate: rate
      }

      const response = await fetch('/api/admin/commission/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const result = await response.json()

      if (result.success) {
        toast.success(result.message)
        await fetchCommissionSettings()
      } else {
        toast.error(result.error || 'Failed to bulk update commission')
      }
    } catch (error) {
      toast.error('Error bulk updating commission')
    }
  }

  const renderCommissionItem = (item: CommissionItem, type: 'membership' | 'product') => {
    const isEditing = editingItem?.id === item.id
    
    return (
      <Card key={item.id} className="mb-4">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex-1">
              <h4 className="font-medium">{item.title}</h4>
              <p className="text-sm text-gray-600">
                Rp {item.price.toLocaleString('id-ID')}
                {item.duration && ` • ${item.duration}`}
                {item.productType && ` • ${item.productType}`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={item.isActive ? 'default' : 'secondary'}>
                {item.isActive ? 'Active' : 'Inactive'}
              </Badge>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setEditingItem({
                  id: item.id,
                  type,
                  commissionType: item.commissionType,
                  rate: item.affiliateCommissionRate,
                  price: item.price
                })}
              >
                <Edit className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {isEditing ? (
            <div className="space-y-3 bg-gray-50 p-3 rounded">
              <div>
                <Label>Commission Type</Label>
                <Select
                  value={editingItem.commissionType}
                  onValueChange={(value: 'FLAT' | 'PERCENTAGE') => {
                    const convertedRate = convertCommissionRate(
                      editingItem.rate,
                      editingItem.commissionType,
                      value,
                      editingItem.price
                    )
                    setEditingItem(prev => prev ? {
                      ...prev, 
                      commissionType: value,
                      rate: Math.round(convertedRate * 100) / 100 // Round to 2 decimal places
                    } : null)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FLAT">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        FLAT (Rupiah)
                      </div>
                    </SelectItem>
                    <SelectItem value="PERCENTAGE">
                      <div className="flex items-center gap-2">
                        <Percent className="w-4 h-4" />
                        PERCENTAGE (%)
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                
                {/* Conversion Helper */}
                {(() => {
                  const equivalent = calculateEquivalentRates(
                    editingItem.rate,
                    editingItem.commissionType,
                    editingItem.price
                  )
                  const targetType = editingItem.commissionType === 'FLAT' ? 'PERCENTAGE' : 'FLAT'
                  const targetRate = editingItem.commissionType === 'FLAT' 
                    ? equivalent.equivalentPercentage 
                    : equivalent.equivalentFlat
                  
                  return (
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                      <ArrowRightLeft className="w-3 h-3" />
                      <span>
                        Auto-convert to {targetType}: {formatCommissionRate(targetRate || 0, targetType)}
                      </span>
                    </div>
                  )
                })()}
              </div>

              <div>
                <Label>
                  Rate {editingItem.commissionType === 'FLAT' ? '(Rp)' : '(%)'}
                </Label>
                <Input
                  type="number"
                  value={editingItem.rate}
                  onChange={(e) => 
                    setEditingItem(prev => prev ? {...prev, rate: Number(e.target.value)} : null)
                  }
                  min="0"
                  max={editingItem.commissionType === 'PERCENTAGE' ? "100" : undefined}
                  step={editingItem.commissionType === 'PERCENTAGE' ? "0.1" : "1000"}
                />
                
                {/* Validation */}
                {(() => {
                  const validation = validateCommissionRate(
                    editingItem.rate,
                    editingItem.commissionType,
                    editingItem.price
                  )
                  if (!validation.isValid) {
                    return (
                      <div className="text-red-500 text-xs mt-1">
                        {validation.error}
                      </div>
                    )
                  }
                  return null
                })()}

                {/* Suggested Rates */}
                {(() => {
                  const suggestions = getSuggestedRates(editingItem.price)
                  const suggestionType = editingItem.commissionType
                  return (
                    <div className="flex items-center gap-2 text-xs text-blue-600 mt-1">
                      <Lightbulb className="w-3 h-3" />
                      <span>Suggested:</span>
                      {suggestionType === 'FLAT' ? (
                        <div className="flex gap-1">
                          <button 
                            className="hover:underline"
                            onClick={() => setEditingItem(prev => prev ? {...prev, rate: suggestions.conservative.flat} : null)}
                          >
                            Rp {suggestions.conservative.flat.toLocaleString('id-ID')} (10%)
                          </button>
                          <span>|</span>
                          <button 
                            className="hover:underline"
                            onClick={() => setEditingItem(prev => prev ? {...prev, rate: suggestions.moderate.flat} : null)}
                          >
                            Rp {suggestions.moderate.flat.toLocaleString('id-ID')} (20%)
                          </button>
                          <span>|</span>
                          <button 
                            className="hover:underline"
                            onClick={() => setEditingItem(prev => prev ? {...prev, rate: suggestions.aggressive.flat} : null)}
                          >
                            Rp {suggestions.aggressive.flat.toLocaleString('id-ID')} (30%)
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-1">
                          <button 
                            className="hover:underline"
                            onClick={() => setEditingItem(prev => prev ? {...prev, rate: suggestions.conservative.percentage} : null)}
                          >
                            {suggestions.conservative.percentage}%
                          </button>
                          <span>|</span>
                          <button 
                            className="hover:underline"
                            onClick={() => setEditingItem(prev => prev ? {...prev, rate: suggestions.moderate.percentage} : null)}
                          >
                            {suggestions.moderate.percentage}%
                          </button>
                          <span>|</span>
                          <button 
                            className="hover:underline"
                            onClick={() => setEditingItem(prev => prev ? {...prev, rate: suggestions.aggressive.percentage} : null)}
                          >
                            {suggestions.aggressive.percentage}%
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })()}
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => updateCommission(
                    editingItem.id,
                    editingItem.type,
                    editingItem.commissionType,
                    editingItem.rate
                  )}
                  disabled={updating === editingItem.id}
                >
                  {updating === editingItem.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEditingItem(null)}
                >
                  <X className="w-4 h-4" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge variant={item.commissionType === 'FLAT' ? 'default' : 'secondary'}>
                  {item.commissionType === 'FLAT' ? (
                    <DollarSign className="w-3 h-3 mr-1" />
                  ) : (
                    <Percent className="w-3 h-3 mr-1" />
                  )}
                  {item.commissionType}
                </Badge>
                <span className="font-medium">
                  {item.commissionType === 'FLAT' 
                    ? `Rp ${item.affiliateCommissionRate.toLocaleString('id-ID')}`
                    : `${item.affiliateCommissionRate}%`
                  }
                </span>
              </div>
              <div className="text-sm text-gray-600">
                ≈ {item.equivalentPercentage}% of price
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center p-8">
        <p>Failed to load commission settings</p>
        <Button onClick={fetchCommissionSettings} className="mt-4">
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Items</p>
                <p className="text-2xl font-bold">{data.statistics.combined.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">FLAT Commission</p>
                <p className="text-2xl font-bold">{data.statistics.combined.flatCommission}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Percent className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Percentage Commission</p>
                <p className="text-2xl font-bold">{data.statistics.combined.percentageCommission}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="memberships" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="memberships">
            Memberships ({data.memberships.length})
          </TabsTrigger>
          <TabsTrigger value="products">
            Products ({data.products.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="memberships" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Membership Commission Settings</CardTitle>
              <CardDescription>
                Manage commission rates and types for all membership plans
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data.memberships.length === 0 ? (
                <p className="text-center py-8 text-gray-500">No memberships found</p>
              ) : (
                data.memberships.map(item => renderCommissionItem(item, 'membership'))
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Product Commission Settings</CardTitle>
              <CardDescription>
                Manage commission rates and types for all products
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data.products.length === 0 ? (
                <p className="text-center py-8 text-gray-500">No products found</p>
              ) : (
                data.products.map(item => renderCommissionItem(item, 'product'))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}