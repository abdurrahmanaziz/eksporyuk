'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  Send
} from 'lucide-react';

export default function MentorSupplierReviewDetailPage({ params }: { params: { id: string } }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [supplier, setSupplier] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notes, setNotes] = useState('');
  const [recommendation, setRecommendation] = useState<string | null>(null);

  useEffect(() => {
    if (session) {
      fetchSupplierDetail();
    }
  }, [session, params.id]);

  const fetchSupplierDetail = async () => {
    try {
      const res = await fetch(`/api/mentor/supplier/reviews/${params.id}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      setSupplier(data.data);
      setNotes(data.data.mentorNotes || '');
    } catch (err: any) {
      alert(err.message);
      router.push('/mentor/supplier/reviews');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!recommendation) {
      alert('Please select a recommendation');
      return;
    }

    if (!notes.trim()) {
      alert('Please provide review notes');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch(`/api/mentor/supplier/reviews/${params.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes, recommendation })
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      alert('Review submitted successfully');
      router.push('/mentor/supplier/reviews');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="container py-8">Loading...</div>;
  }

  if (!supplier) {
    return <div className="container py-8">Supplier not found</div>;
  }

  const latestAssessment = supplier.assessments?.[0];

  return (
    <div className="container py-8">
      <Button
        variant="ghost"
        onClick={() => router.push('/mentor/supplier/reviews')}
        className="mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Reviews
      </Button>

      <div className="grid gap-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl mb-2">{supplier.companyName}</CardTitle>
                <div className="flex gap-2">
                  <Badge>{supplier.status}</Badge>
                  {supplier.supplierType && <Badge variant="outline">{supplier.supplierType}</Badge>}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium">Contact Person</p>
                <p className="text-muted-foreground">{supplier.user.name}</p>
              </div>
              <div>
                <p className="font-medium">Location</p>
                <p className="text-muted-foreground">{supplier.city}, {supplier.province}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Assessment */}
        {latestAssessment && (
          <Card>
            <CardHeader>
              <CardTitle>Assessment Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Overall Score</span>
                  <span className="text-2xl font-bold">
                    {latestAssessment.totalScore} / {latestAssessment.maxScore}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full"
                    style={{ width: `${latestAssessment.percentage}%` }}
                  />
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {latestAssessment.percentage.toFixed(1)}%
                </p>
              </div>

              <div className="space-y-3">
                {latestAssessment.answers?.map((answer: any, idx: number) => (
                  <div key={idx} className="border-l-2 border-primary pl-3">
                    <p className="font-medium text-sm">{answer.question?.question}</p>
                    <p className="text-sm text-muted-foreground">{answer.answer}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Score: {answer.score} / {answer.question?.maxScore}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Review Form */}
        <Card>
          <CardHeader>
            <CardTitle>Submit Your Review</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="font-medium mb-2 block">Recommendation *</label>
              <div className="grid grid-cols-3 gap-3">
                <Button
                  variant={recommendation === 'APPROVE' ? 'default' : 'outline'}
                  onClick={() => setRecommendation('APPROVE')}
                  className="w-full"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve
                </Button>
                <Button
                  variant={recommendation === 'REQUEST_CHANGES' ? 'default' : 'outline'}
                  onClick={() => setRecommendation('REQUEST_CHANGES')}
                  className="w-full"
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Request Changes
                </Button>
                <Button
                  variant={recommendation === 'REJECT' ? 'default' : 'outline'}
                  onClick={() => setRecommendation('REJECT')}
                  className="w-full"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
              </div>
            </div>

            <div>
              <label className="font-medium mb-2 block">Review Notes *</label>
              <Textarea
                placeholder="Provide detailed notes about your review decision..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={6}
              />
            </div>

            <Button
              onClick={handleSubmitReview}
              disabled={submitting || !recommendation || !notes.trim()}
              className="w-full"
            >
              <Send className="h-4 w-4 mr-2" />
              {submitting ? 'Submitting...' : 'Submit Review'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
