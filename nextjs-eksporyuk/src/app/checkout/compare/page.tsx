"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Loader2, ArrowLeft, Sparkles, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import AffiliatePartnerBadge from "@/components/checkout/AffiliatePartnerBadge";

interface MembershipPlan {
  id: string;
  slug: string;
  name: string;
  duration: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  features: string[];
  isBestSeller: boolean;
  isMostPopular: boolean;
  formLogo?: string;
  salesPageUrl?: string;
}

export default function CheckoutComparePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-gray-600">Loading comparison...</p>
        </div>
      </div>
    }>
      <CheckoutCompareContent />
    </Suspense>
  );
}

function CheckoutCompareContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [loading, setLoading] = useState(true);

  // Get plan slugs from URL (e.g., ?plans=silver,gold,platinum)
  const planSlugs = searchParams.get("plans")?.split(",") || [];
  const affiliateCode = searchParams.get("ref") || "";
  const couponCode = searchParams.get("coupon") || "";

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await fetch("/api/memberships/packages");
      const data = await response.json();

      if (data.success) {
        // Filter plans based on URL slugs (if provided)
        let filteredPlans = data.packages;

        if (planSlugs.length > 0) {
          filteredPlans = data.packages.filter((plan: MembershipPlan) =>
            planSlugs.includes(plan.slug)
          );
        }

        // Limit to 3 plans for comparison
        setPlans(filteredPlans.slice(0, 3));
      }
    } catch (error) {
      console.error("Error fetching plans:", error);
      toast.error("Failed to load membership plans");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = (slug: string) => {
    // Redirect to single checkout page
    const params = new URLSearchParams();
    if (affiliateCode) params.append("ref", affiliateCode);
    if (couponCode) params.append("coupon", couponCode);

    router.push(`/membership/${slug}?${params.toString()}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <Link href="/membership">
            <Button variant="ghost" className="mb-6">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to All Plans
            </Button>
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Compare Membership Plans
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Choose the perfect plan for your export business journey
          </p>
        </div>

        {/* Comparison Table */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {plans.map((plan) => {
            const finalPrice = couponCode ? plan.price * 0.9 : plan.price;
            const isPopular = plan.isBestSeller || plan.isMostPopular;

            return (
              <Card
                key={plan.id}
                className={`relative shadow-lg transition-transform hover:scale-105 ${
                  isPopular ? "border-2 border-blue-500 ring-4 ring-blue-100" : "border"
                }`}
              >
                {/* Popular Badge */}
                {plan.isBestSeller && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-yellow-500 text-white px-4 py-1 shadow-lg">
                      <Sparkles className="w-3 h-3 mr-1" />
                      Best Seller
                    </Badge>
                  </div>
                )}
                {plan.isMostPopular && !plan.isBestSeller && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-green-500 text-white px-4 py-1 shadow-lg">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      Most Popular
                    </Badge>
                  </div>
                )}

                <CardHeader className={isPopular ? "bg-blue-50" : ""}>
                  <div className="flex items-center justify-between mb-2">
                    {plan.formLogo && (
                      <img src={plan.formLogo} alt="Logo" className="h-10 w-10 rounded" />
                    )}
                  </div>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.duration}</CardDescription>
                </CardHeader>

                <CardContent className="pt-6">
                  {/* Pricing */}
                  <div className="mb-6">
                    {plan.originalPrice && (
                      <div className="text-lg text-gray-400 line-through">
                        Rp {plan.originalPrice.toLocaleString("id-ID")}
                      </div>
                    )}
                    <div className="text-4xl font-bold text-blue-600 mb-1">
                      Rp {finalPrice.toLocaleString("id-ID")}
                    </div>
                    {couponCode && (
                      <Badge variant="outline" className="text-green-600 text-xs">
                        Save Rp {(plan.price - finalPrice).toLocaleString("id-ID")}
                      </Badge>
                    )}
                  </div>

                  {/* Features */}
                  <div className="space-y-3 mb-6">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* CTA Button */}
                  <Button
                    size="lg"
                    className={`w-full ${
                      isPopular
                        ? "bg-blue-600 hover:bg-blue-700"
                        : "bg-gray-800 hover:bg-gray-900"
                    }`}
                    onClick={() => handleSelectPlan(plan.slug)}
                  >
                    Select {plan.name}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Feature Comparison Table */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Detailed Feature Comparison</CardTitle>
            <CardDescription>
              Compare all features side by side to make the best choice
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold">Feature</th>
                    {plans.map((plan) => (
                      <th key={plan.id} className="text-center py-3 px-4 font-semibold">
                        {plan.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* Extract unique features from all plans */}
                  {Array.from(
                    new Set(plans.flatMap((plan) => plan.features))
                  ).map((feature, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">{feature}</td>
                      {plans.map((plan) => (
                        <td key={plan.id} className="text-center py-3 px-4">
                          {plan.features.includes(feature) ? (
                            <CheckCircle2 className="w-5 h-5 text-green-500 mx-auto" />
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Footer CTA */}
        <div className="text-center mt-12">
          <AffiliatePartnerBadge className="mb-6" />
          <p className="text-gray-600 mb-4">
            Still not sure which plan is right for you?
          </p>
          <Link href="/contact">
            <Button variant="outline" size="lg">
              Contact Us for Help
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
