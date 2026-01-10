'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Shield, ShieldCheck, ShieldOff, UserCheck, Building2, Calendar, User } from 'lucide-react'
import { toast } from 'sonner'

interface MentorData {
  id: string
  name: string
  email: string
  username: string
  isAuthorizedSupplierReviewer: boolean
  supplierReviewerAuthorizedAt: string | null
  supplierReviewerAuthorizedBy: string | null
  authorizerName: string | null
  assignedSuppliersCount: number
}

interface SupplierData {
  id: string
  companyName: string
  status: string
  type: string
  assignedMentorId?: string | null
}

export default function AuthorizedMentorsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [mentors, setMentors] = useState<MentorData[]>([])
  const [suppliers, setSuppliers] = useState<SupplierData[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [selectedMentor, setSelectedMentor] = useState<MentorData | null>(null)
  const [selectedSupplier, setSelectedSupplier] = useState('')
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      router.push('/auth/login')
      return
    }

    fetchMentors()
    fetchSuppliers()
  }, [session, status, router])

  const fetchMentors = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/supplier/authorized-mentors?filter=${activeTab}`)
      
      if (!response.ok) throw new Error('Failed to fetch mentors')
      
      const data = await response.json()
      setMentors(data.mentors || [])
    } catch (error) {
      console.error('Error fetching mentors:', error)
      toast.error('Failed to load mentors')
    } finally {
      setLoading(false)
    }
  }

  const fetchSuppliers = async () => {
    try {
      // Fetch suppliers that are in ONBOARDING or WAITING_REVIEW status
      const response = await fetch('/api/admin/supplier/verifications')
      
      if (!response.ok) throw new Error('Failed to fetch suppliers')
      
      const data = await response.json()
      setSuppliers(data.suppliers || [])
    } catch (error) {
      console.error('Error fetching suppliers:', error)
    }
  }

  useEffect(() => {
    if (session?.user?.role === 'ADMIN') {
      fetchMentors()
    }
  }, [activeTab, session])

  const handleToggleAuthorization = async (mentor: MentorData) => {
    try {
      setProcessing(true)
      const response = await fetch('/api/admin/supplier/authorized-mentors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mentorId: mentor.id,
          authorize: !mentor.isAuthorizedSupplierReviewer
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update authorization')
      }

      const data = await response.json()
      
      toast.success(
        data.mentor.isAuthorizedSupplierReviewer 
          ? `${mentor.name} is now authorized to review suppliers`
          : `${mentor.name}'s authorization has been revoked`
      )

      fetchMentors()
    } catch (error) {
      console.error('Error toggling authorization:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update authorization')
    } finally {
      setProcessing(false)
    }
  }

  const handleAssignSupplier = async () => {
    if (!selectedMentor || !selectedSupplier) {
      toast.error('Please select a supplier')
      return
    }

    try {
      setProcessing(true)
      const response = await fetch('/api/admin/supplier/assign-mentor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplierId: selectedSupplier,
          mentorId: selectedMentor.id
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to assign supplier')
      }

      const data = await response.json()
      
      toast.success(`Supplier assigned to ${selectedMentor.name} for review`)
      
      setAssignDialogOpen(false)
      setSelectedSupplier('')
      setSelectedMentor(null)
      fetchMentors()
      fetchSuppliers()
    } catch (error) {
      console.error('Error assigning supplier:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to assign supplier')
    } finally {
      setProcessing(false)
    }
  }

  const openAssignDialog = (mentor: MentorData) => {
    if (!mentor.isAuthorizedSupplierReviewer) {
      toast.error('Please authorize this mentor first')
      return
    }
    setSelectedMentor(mentor)
    setAssignDialogOpen(true)
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading mentors...</p>
        </div>
      </div>
    )
  }

  if (!session?.user || session.user.role !== 'ADMIN') {
    return null
  }

  const filteredMentors = mentors.filter(mentor => {
    if (activeTab === 'authorized') return mentor.isAuthorizedSupplierReviewer
    if (activeTab === 'not-authorized') return !mentor.isAuthorizedSupplierReviewer
    return true
  })

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Authorized Mentors</h1>
        <p className="text-muted-foreground">
          Manage which mentors can review and assess supplier applications
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="all">
            <Shield className="w-4 h-4 mr-2" />
            All Mentors
          </TabsTrigger>
          <TabsTrigger value="authorized">
            <ShieldCheck className="w-4 h-4 mr-2" />
            Authorized
          </TabsTrigger>
          <TabsTrigger value="not-authorized">
            <ShieldOff className="w-4 h-4 mr-2" />
            Not Authorized
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          <Card>
            <CardHeader>
              <CardTitle>Mentor List</CardTitle>
              <CardDescription>
                {filteredMentors.length} mentor{filteredMentors.length !== 1 ? 's' : ''} found
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredMentors.length === 0 ? (
                <div className="text-center py-12">
                  <Shield className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No mentors found in this category</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mentor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Assigned Suppliers</TableHead>
                      <TableHead>Authorized By</TableHead>
                      <TableHead>Authorized At</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMentors.map((mentor) => (
                      <TableRow key={mentor.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{mentor.name}</div>
                            <div className="text-sm text-muted-foreground">{mentor.email}</div>
                            <div className="text-xs text-muted-foreground">@{mentor.username}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {mentor.isAuthorizedSupplierReviewer ? (
                            <Badge className="bg-green-500">
                              <ShieldCheck className="w-3 h-3 mr-1" />
                              Authorized
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              <ShieldOff className="w-3 h-3 mr-1" />
                              Not Authorized
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-muted-foreground" />
                            <span>{mentor.assignedSuppliersCount}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {mentor.authorizerName ? (
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm">{mentor.authorizerName}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {mentor.supplierReviewerAuthorizedAt ? (
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm">
                                {new Date(mentor.supplierReviewerAuthorizedAt).toLocaleDateString('id-ID')}
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant={mentor.isAuthorizedSupplierReviewer ? "destructive" : "default"}
                              onClick={() => handleToggleAuthorization(mentor)}
                              disabled={processing}
                            >
                              {mentor.isAuthorizedSupplierReviewer ? 'Revoke' : 'Authorize'}
                            </Button>
                            {mentor.isAuthorizedSupplierReviewer && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openAssignDialog(mentor)}
                                disabled={processing}
                              >
                                <UserCheck className="w-4 h-4 mr-1" />
                                Assign Supplier
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Assign Supplier Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Supplier to Mentor</DialogTitle>
            <DialogDescription>
              Select a supplier to assign to {selectedMentor?.name} for review
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="supplier">Supplier</Label>
              <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                <SelectTrigger id="supplier">
                  <SelectValue placeholder="Select a supplier..." />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.filter((s: any) => !s.assignedMentorId || s.assignedMentorId === selectedMentor?.id).map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.companyName} - {supplier.type}
                      {supplier.status && (
                        <Badge variant="outline" className="ml-2">
                          {supplier.status}
                        </Badge>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setAssignDialogOpen(false)
                setSelectedSupplier('')
                setSelectedMentor(null)
              }}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAssignSupplier}
              disabled={!selectedSupplier || processing}
            >
              {processing ? 'Assigning...' : 'Assign Supplier'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
