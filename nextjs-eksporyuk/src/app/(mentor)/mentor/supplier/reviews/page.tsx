'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Building2, 
  MapPin, 
  Eye, 
  Clock,
  CheckCircle,
  AlertCircle,
  Package
} from 'lucide-react';

interface SupplierReview {
  id: string;
  companyName: string;
  slug: string;
  logo: string | null;
  supplierType: string | null;
  status: string;
  province: string;
  city: string;
  businessCategory: string | null;
  user: {
    id: string;
    name: string;
    email: string;
    whatsapp: string | null;
  };
  assessment: {
    totalScore: number;
    maxScore: number;
    percentage: number;
    isCompleted: boolean;
  } | null;
  productsCount: number;
  mentorReviewedAt: string | null;
  mentorNotes: string | null;
  createdAt: string;
}

export default function MentorSupplierReviewsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<SupplierReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session || session.user.role !== 'MENTOR') {
      router.push('/mentor/dashboard');
      return;
    }

    fetchSuppliers(activeTab);
  }, [session, status, activeTab]);

  const fetchSuppliers = async (status: string) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/mentor/supplier/reviews?status=${status}`);
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 403) {
          setIsAuthorized(false);
          setError(data.error || 'You are not authorized to review suppliers');
        } else {
          throw new Error(data.error || 'Failed to fetch suppliers');
        }
        return;
      }

      setIsAuthorized(true);
      setSuppliers(data.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: any; label: string }> = {
      WAITING_REVIEW: { variant: 'secondary', label: 'Waiting Review' },
      RECOMMENDED_BY_MENTOR: { variant: 'default', label: 'Recommended' },
      ONBOARDING: { variant: 'outline', label: 'Onboarding' },
      LIMITED: { variant: 'destructive', label: 'Limited' }
    };

    const config = statusMap[status] || { variant: 'outline', label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getSupplierTypeBadge = (type: string | null) => {
    if (!type) return null;
    const colors: Record<string, string> = {
      PRODUSEN: 'bg-blue-100 text-blue-800',
      PABRIK: 'bg-green-100 text-green-800',
      TRADER: 'bg-purple-100 text-purple-800',
      AGGREGATOR: 'bg-orange-100 text-orange-800'
    };
    
    return (
      <Badge className={colors[type] || 'bg-gray-100 text-gray-800'}>
        {type}
      </Badge>
    );
  };

  if (status === 'loading' || loading) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (isAuthorized === false) {
    return (
      <div className="container py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error || 'You are not authorized to review suppliers. Please contact an administrator.'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Supplier Reviews</h1>
        <p className="text-muted-foreground">
          Review and assess supplier applications assigned to you
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="WAITING_REVIEW">Pending</TabsTrigger>
          <TabsTrigger value="RECOMMENDED_BY_MENTOR">Recommended</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {suppliers.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No suppliers assigned to you yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {suppliers.map((supplier) => (
                <Card key={supplier.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        {supplier.logo ? (
                          <img
                            src={supplier.logo}
                            alt={supplier.companyName}
                            className="w-16 h-16 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
                            <Building2 className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <CardTitle className="text-xl mb-2">
                            {supplier.companyName}
                          </CardTitle>
                          <div className="flex items-center gap-2 flex-wrap">
                            {getStatusBadge(supplier.status)}
                            {getSupplierTypeBadge(supplier.supplierType)}
                            {supplier.businessCategory && (
                              <Badge variant="outline">{supplier.businessCategory}</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button onClick={() => router.push(`/mentor/supplier/reviews/${supplier.id}`)}>
                        <Eye className="h-4 w-4 mr-2" />
                        Review
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{supplier.city}, {supplier.province}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <span>{supplier.productsCount} Products</span>
                      </div>
                      {supplier.assessment && (
                        <div className="flex items-center gap-2">
                          {supplier.assessment.isCompleted ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <Clock className="h-4 w-4 text-orange-600" />
                          )}
                          <span>
                            Assessment: {supplier.assessment.percentage.toFixed(0)}%
                          </span>
                        </div>
                      )}
                    </div>

                    {supplier.mentorReviewedAt && (
                      <div className="mt-4 pt-4 border-t">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <CheckCircle className="h-4 w-4" />
                          <span>
                            Reviewed on {new Date(supplier.mentorReviewedAt).toLocaleDateString()}
                          </span>
                        </div>
                        {supplier.mentorNotes && (
                          <p className="mt-2 text-sm text-muted-foreground italic">
                            "{supplier.mentorNotes.substring(0, 150)}{supplier.mentorNotes.length > 150 ? '...' : ''}"
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
