'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertTriangle, Users, Clock, Check, X, Search, Plus, Edit, Trash2, Eye, RefreshCw, Calendar, CreditCard } from 'lucide-react'
import { toast } from 'sonner'

interface UserMembership {
  id: string
  user: {
    id: string
    name: string
    email: string
    avatar?: string
  }
  membership: {
    id: string
    name: string
    duration: string
    price: number
  }
  status: string
  startDate: string
  endDate: string
  isActive: boolean
  autoRenew: boolean
  price?: number
  activatedAt?: string
  transaction?: {
    id: string
    amount: number
    status: string
  }
}

interface Membership {
  id: string
  name: string
  duration: string
  price: number
  description: string
  isActive: boolean
  _count: {
    userMemberships: number
  }
}

interface MembershipStats {
  id: string
  name: string
  price: number
  duration: string
  active: number
  expired: number
  pending: number
  total: number
}

export default function AdminMembershipPage() {
  const { data: session } = useSession()
  const [userMemberships, setUserMemberships] = useState<UserMembership[]>([])
  const [memberships, setMemberships] = useState<Membership[]>([])
  const [membershipStats, setMembershipStats] = useState<MembershipStats[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [planFilter, setPlanFilter] = useState('ALL')
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    expired: 0,
    pending: 0,
    revenue: 0
  })
  const [selectedMembership, setSelectedMembership] = useState<UserMembership | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Fetch user memberships
      const membershipResponse = await fetch('/api/admin/membership')
      if (membershipResponse.ok) {
        const membershipData = await membershipResponse.json()
        setUserMemberships(membershipData.userMemberships || [])
        setStats(membershipData.stats || stats)
      }

      // Fetch membership plans
      const plansResponse = await fetch('/api/admin/membership/plans')
      if (plansResponse.ok) {
        const plansData = await plansResponse.json()
        setMemberships(plansData.memberships || [])
      }

      // Fetch membership stats per plan
      const statsResponse = await fetch('/api/admin/membership/stats')
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setMembershipStats(statsData.stats || [])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to load membership data')
    } finally {
      setLoading(false)
    }
  }

  const filteredMemberships = userMemberships.filter(membership => {
    const matchesSearch = 
      membership.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      membership.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      membership.membership.name.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'ALL' || membership.status === statusFilter
    const matchesPlan = planFilter === 'ALL' || membership.membership.id === planFilter
    
    return matchesSearch && matchesStatus && matchesPlan
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800'
      case 'EXPIRED': return 'bg-red-100 text-red-800'
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'CANCELLED': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID')
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(amount)
  }

  const updateMembershipStatus = async (id: string, status: string) => {
    try {
      const response = await fetch(`/api/admin/membership/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      })

      if (response.ok) {
        toast.success('Membership status updated successfully')
        fetchData()
      } else {
        toast.error('Failed to update membership status')
      }
    } catch (error) {
      console.error('Error updating membership status:', error)
      toast.error('Failed to update membership status')
    }
  }

  const extendMembership = async (id: string, days: number) => {
    try {
      const response = await fetch(`/api/admin/membership/${id}/extend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ days })
      })

      if (response.ok) {
        toast.success(`Membership extended by ${days} days`)
        fetchData()
      } else {
        toast.error('Failed to extend membership')
      }
    } catch (error) {
      console.error('Error extending membership:', error)
      toast.error('Failed to extend membership')
    }
  }

  if (!session || session.user.role !== 'ADMIN') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-[400px]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Access Denied
            </CardTitle>
            <CardDescription>
              You need admin privileges to access this page.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading membership data...</p>
        </div>
      </div>
    )
  }

  return (
    <ResponsivePageWrapper>
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Membership Management</h1>
          <p className="text-muted-foreground">Manage user memberships and subscription plans</p>
        </div>
        <Button onClick={fetchData} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <Check className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expired</CardTitle>
            <X className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.expired}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <span className="text-sm text-muted-foreground">IDR</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.revenue)}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="langganan" className="space-y-4">
        <TabsList>
          <TabsTrigger value="langganan">
            <Calendar className="h-4 w-4 mr-2" />
            Langganan
          </TabsTrigger>
          <TabsTrigger value="memberships">
            <Users className="h-4 w-4 mr-2" />
            User Memberships
          </TabsTrigger>
          <TabsTrigger value="plans">
            <CreditCard className="h-4 w-4 mr-2" />
            Membership Plans
          </TabsTrigger>
        </TabsList>

        {/* Tab Langganan - Overview per paket */}
        <TabsContent value="langganan" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ringkasan Langganan per Paket</CardTitle>
              <CardDescription>
                Lihat jumlah member aktif dan expired untuk setiap paket membership
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                {membershipStats.map((stat) => (
                  <Card key={stat.id} className="border-2">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">{stat.name}</CardTitle>
                      <CardDescription>
                        {formatCurrency(stat.price)} / {stat.duration.replace('_', ' ')}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Total Member</span>
                        <Badge variant="outline" className="text-lg font-bold">{stat.total}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm flex items-center gap-1">
                          <Check className="h-4 w-4 text-green-600" />
                          Aktif
                        </span>
                        <Badge className="bg-green-100 text-green-800">{stat.active}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm flex items-center gap-1">
                          <X className="h-4 w-4 text-red-600" />
                          Expired
                        </span>
                        <Badge className="bg-red-100 text-red-800">{stat.expired}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm flex items-center gap-1">
                          <Clock className="h-4 w-4 text-yellow-600" />
                          Pending
                        </span>
                        <Badge className="bg-yellow-100 text-yellow-800">{stat.pending}</Badge>
                      </div>
                      <div className="pt-2 border-t">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full"
                          onClick={() => {
                            setPlanFilter(stat.id)
                            setStatusFilter('ALL')
                          }}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Lihat Detail
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Summary Table */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-4">Daftar Member Expired (Perlu Followup)</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Paket</TableHead>
                      <TableHead>Expired Sejak</TableHead>
                      <TableHead>Hari</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userMemberships
                      .filter(m => m.status === 'EXPIRED')
                      .sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime())
                      .slice(0, 10)
                      .map((membership) => {
                        const daysExpired = Math.floor((new Date().getTime() - new Date(membership.endDate).getTime()) / (1000 * 60 * 60 * 24))
                        return (
                          <TableRow key={membership.id}>
                            <TableCell>
                              <div className="font-medium">{membership.user.name}</div>
                              <div className="text-sm text-muted-foreground">{membership.user.email}</div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{membership.membership.name}</Badge>
                            </TableCell>
                            <TableCell>{formatDate(membership.endDate)}</TableCell>
                            <TableCell>
                              <Badge className={daysExpired > 30 ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}>
                                {daysExpired} hari
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedMembership(membership)
                                    setDialogOpen(true)
                                  }}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => extendMembership(membership.id, 30)}
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                  </TableBody>
                </Table>
                {userMemberships.filter(m => m.status === 'EXPIRED').length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    Tidak ada member expired saat ini
                  </div>
                )}
                {userMemberships.filter(m => m.status === 'EXPIRED').length > 10 && (
                  <div className="text-center py-4">
                    <Button 
                      variant="outline"
                      onClick={() => {
                        setStatusFilter('EXPIRED')
                        setPlanFilter('ALL')
                      }}
                    >
                      Lihat Semua ({userMemberships.filter(m => m.status === 'EXPIRED').length} member expired)
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="memberships" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-4 flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <Label htmlFor="search">Search</Label>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Search by name, email, or membership..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                <div>
                  <Label>Filter Paket</Label>
                  <Select value={planFilter} onValueChange={setPlanFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Semua Paket</SelectItem>
                      {memberships.map((plan) => (
                        <SelectItem key={plan.id} value={plan.id}>{plan.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Status Filter</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Status</SelectItem>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="EXPIRED">Expired</SelectItem>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="CANCELLED">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Memberships Table */}
          <Card>
            <CardHeader>
              <CardTitle>User Memberships ({filteredMemberships.length})</CardTitle>
              <CardDescription>
                All user memberships and their current status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Membership</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMemberships.map((membership) => (
                    <TableRow key={membership.id}>
                      <TableCell>
                        <div className="font-medium">{membership.user.name}</div>
                        <div className="text-sm text-muted-foreground">{membership.user.email}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{membership.membership.name}</div>
                        <div className="text-sm text-muted-foreground">{membership.membership.duration}</div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(membership.status)}>
                          {membership.status}
                        </Badge>
                        {!membership.isActive && (
                          <div className="text-xs text-red-500 mt-1">Inactive</div>
                        )}
                      </TableCell>
                      <TableCell>{formatDate(membership.startDate)}</TableCell>
                      <TableCell>
                        <div>{formatDate(membership.endDate)}</div>
                        {new Date(membership.endDate) < new Date() && (
                          <div className="text-xs text-red-500">Expired</div>
                        )}
                      </TableCell>
                      <TableCell>
                        {membership.price ? formatCurrency(membership.price) : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedMembership(membership)
                              setDialogOpen(true)
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          
                          {membership.status === 'PENDING' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateMembershipStatus(membership.id, 'ACTIVE')}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                          
                          {membership.status === 'ACTIVE' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => extendMembership(membership.id, 30)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {filteredMemberships.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No memberships found matching your criteria
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plans" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Membership Plans ({memberships.length})</CardTitle>
              <CardDescription>
                Available membership plans and their usage statistics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Plan Name</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Active Users</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {memberships.map((plan) => (
                    <TableRow key={plan.id}>
                      <TableCell>
                        <div className="font-medium">{plan.name}</div>
                        <div className="text-sm text-muted-foreground line-clamp-2">
                          {plan.description}
                        </div>
                      </TableCell>
                      <TableCell>{plan.duration}</TableCell>
                      <TableCell>{formatCurrency(plan.price)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {plan._count.userMemberships} users
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={plan.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                          {plan.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Membership Detail Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Membership Details</DialogTitle>
            <DialogDescription>
              Complete information about this membership
            </DialogDescription>
          </DialogHeader>
          
          {selectedMembership && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">User Information</Label>
                <div className="p-3 border rounded">
                  <div className="font-medium">{selectedMembership.user.name}</div>
                  <div className="text-sm text-muted-foreground">{selectedMembership.user.email}</div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">Membership Plan</Label>
                <div className="p-3 border rounded">
                  <div className="font-medium">{selectedMembership.membership.name}</div>
                  <div className="text-sm text-muted-foreground">{selectedMembership.membership.duration}</div>
                  <div className="text-sm">{formatCurrency(selectedMembership.membership.price)}</div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">Status & Dates</Label>
                <div className="p-3 border rounded space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Status:</span>
                    <Badge className={getStatusColor(selectedMembership.status)}>
                      {selectedMembership.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Start:</span>
                    <span>{formatDate(selectedMembership.startDate)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>End:</span>
                    <span>{formatDate(selectedMembership.endDate)}</span>
                  </div>
                  {selectedMembership.activatedAt && (
                    <div className="flex justify-between text-sm">
                      <span>Activated:</span>
                      <span>{formatDate(selectedMembership.activatedAt)}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">Payment Information</Label>
                <div className="p-3 border rounded space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Amount Paid:</span>
                    <span>{selectedMembership.price ? formatCurrency(selectedMembership.price) : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Auto Renew:</span>
                    <span>{selectedMembership.autoRenew ? 'Yes' : 'No'}</span>
                  </div>
                  {selectedMembership.transaction && (
                    <div className="flex justify-between text-sm">
                      <span>Transaction:</span>
                      <span className="text-blue-600">{selectedMembership.transaction.id}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Close
            </Button>
            {selectedMembership?.status === 'ACTIVE' && (
              <Button onClick={() => extendMembership(selectedMembership.id, 30)}>
                Extend 30 Days
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
    </ResponsivePageWrapper>
  )
}