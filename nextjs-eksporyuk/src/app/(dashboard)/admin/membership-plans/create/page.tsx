"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ResponsivePageWrapper from "@/components/layout/ResponsivePageWrapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Save, Loader2, Check, Info } from "lucide-react";
import { toast } from "sonner";
import MembershipFeatureSelector from "@/components/admin/MembershipFeatureSelector";

interface FeatureConfig {
  featureKey: string;
  enabled: boolean;
  value: any;
}

interface Course {
  id: string;
  title: string;
  slug: string;
}

interface Group {
  id: string;
  name: string;
  slug: string;
}

interface Product {
  id: string;
  name: string;
  slug: string;
}

export default function CreateMembershipPlanPage() {
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    price: 0,
    duration: 30,
    durationType: "DAYS",
    status: "DRAFT",
    features: [] as string[],
    
    // Access & Benefits
    groupId: "",
    courses: [] as string[],
    products: [] as string[],
    benefits: [] as string[],
    
    // Marketing
    salesPageUrl: "",
    buttonText: "Beli Membership",
    formLogo: "",
    formBanner: "",
    
    // SEO
    metaTitle: "",
    metaDescription: "",
    metaKeywords: "",
    
    // Settings
    maxMembers: 0,
    autoRenewal: true,
    trialDays: 0,
    isVisible: true,
    showInGeneralCheckout: true,
  });

  const [featureInput, setFeatureInput] = useState("");
  const [benefitInput, setBenefitInput] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [selectedFeatures, setSelectedFeatures] = useState<FeatureConfig[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch courses
      const coursesRes = await fetch("/api/admin/courses");
      if (coursesRes.ok) {
        const coursesData = await coursesRes.json();
        setCourses(coursesData.courses || []);
      }
      
      // Fetch groups
      const groupsRes = await fetch("/api/admin/groups");
      if (groupsRes.ok) {
        const groupsData = await groupsRes.json();
        setGroups(groupsData.groups || []);
      }

      // Fetch products
      const productsRes = await fetch("/api/admin/products");
      if (productsRes.ok) {
        const productsData = await productsRes.json();
        setProducts(productsData.products || []);
      }
    } catch (error: any) {
      console.error("Load error:", error);
    }
  };

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.slug) {
      toast.error("Nama dan slug wajib diisi!");
      return;
    }

    try {
      setLoading(true);
      
      // Upload logo jika ada
      if (logoFile) {
        const logoFormData = new FormData();
        logoFormData.append('file', logoFile);
        const logoRes = await fetch('/api/upload', {
          method: 'POST',
          body: logoFormData,
        });
        if (logoRes.ok) {
          const logoData = await logoRes.json();
          formData.formLogo = logoData.url;
        }
      }

      // Upload banner jika ada
      if (bannerFile) {
        const bannerFormData = new FormData();
        bannerFormData.append('file', bannerFile);
        const bannerRes = await fetch('/api/upload', {
          method: 'POST',
          body: bannerFormData,
        });
        if (bannerRes.ok) {
          const bannerData = await bannerRes.json();
          formData.formBanner = bannerData.url;
        }
      }
      
      const response = await fetch("/api/admin/membership-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          membershipFeatures: selectedFeatures, // Include selected features
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Gagal membuat membership plan");
      }

      toast.success("Membership plan berhasil dibuat!");
      router.push("/admin/membership-plans");
      
    } catch (error: any) {
      toast.error(error.message || "Terjadi kesalahan");
      console.error("Create error:", error);
    } finally {
      setLoading(false);
    }
  };

  const addFeature = () => {
    if (featureInput.trim()) {
      setFormData({
        ...formData,
        features: [...formData.features, featureInput.trim()],
      });
      setFeatureInput("");
    }
  };

  const removeFeature = (index: number) => {
    setFormData({
      ...formData,
      features: formData.features.filter((_, i) => i !== index),
    });
  };

  const addBenefit = () => {
    if (benefitInput.trim()) {
      setFormData({
        ...formData,
        benefits: [...formData.benefits, benefitInput.trim()],
      });
      setBenefitInput("");
    }
  };

  const removeBenefit = (index: number) => {
    setFormData({
      ...formData,
      benefits: formData.benefits.filter((_, i) => i !== index),
    });
  };

  const toggleCourse = (courseId: string) => {
    const courses = formData.courses.includes(courseId)
      ? formData.courses.filter(id => id !== courseId)
      : [...formData.courses, courseId];
    setFormData({ ...formData, courses });
  };

  const toggleProduct = (productId: string) => {
    const products = formData.products.includes(productId)
      ? formData.products.filter(id => id !== productId)
      : [...formData.products, productId];
    setFormData({ ...formData, products });
  };

  return (
    <ResponsivePageWrapper>
    <div className="container mx-auto py-6 px-4 max-w-6xl">
      <div className="mb-6">
        <Link href="/admin/membership-plans">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </Button>
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Buat Membership Plan Baru</h1>
        <p className="text-gray-600">
          Buat paket membership dengan sistem tab yang mudah
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Tabs defaultValue="basic" className="space-y-6">
          <TabsList className="grid grid-cols-7 w-full">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="pricing">Pricing</TabsTrigger>
            <TabsTrigger value="access">Access</TabsTrigger>
            <TabsTrigger value="benefits">Benefits</TabsTrigger>
            <TabsTrigger value="marketing">Marketing</TabsTrigger>
            <TabsTrigger value="seo">SEO</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-bold text-gray-900">Informasi Dasar</h2>
                <p className="text-sm text-gray-600">
                  Informasi utama membership plan
                </p>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nama Membership *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      setFormData({
                        ...formData,
                        name,
                        slug: generateSlug(name),
                      });
                    }}
                    placeholder="Contoh: Premium Membership"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug">Slug *</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) =>
                      setFormData({ ...formData, slug: e.target.value })
                    }
                    placeholder="premium-membership"
                    required
                  />
                  <p className="text-sm text-gray-600">
                    URL: /membership/{formData.slug}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Deskripsi</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Deskripsi lengkap membership..."
                    rows={6}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) =>
                      setFormData({ ...formData, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DRAFT">Draft</SelectItem>
                      <SelectItem value="PUBLISHED">Published</SelectItem>
                      <SelectItem value="ARCHIVED">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="pricing" className="space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-bold text-gray-900">Harga & Durasi</h2>
                <p className="text-sm text-gray-600">
                  Pengaturan harga dan durasi membership
                </p>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Harga (Rp)</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        price: parseInt(e.target.value) || 0,
                      })
                    }
                    placeholder="299000"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="duration">Durasi</Label>
                    <Input
                      id="duration"
                      type="number"
                      value={formData.duration}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          duration: parseInt(e.target.value) || 0,
                        })
                      }
                      placeholder="30"
                      disabled={formData.durationType === "LIFETIME"}
                    />
                    {formData.durationType === "LIFETIME" && (
                      <p className="text-xs text-gray-600">
                        Durasi otomatis unlimited untuk lifetime
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="durationType">Tipe Durasi</Label>
                    <Select
                      value={formData.durationType}
                      onValueChange={(value) =>
                        setFormData({ ...formData, durationType: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DAYS">Hari</SelectItem>
                        <SelectItem value="MONTHS">Bulan</SelectItem>
                        <SelectItem value="YEARS">Tahun</SelectItem>
                        <SelectItem value="LIFETIME">Lifetime</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="trialDays">Trial Period (Hari)</Label>
                  <Input
                    id="trialDays"
                    type="number"
                    value={formData.trialDays}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        trialDays: parseInt(e.target.value) || 0,
                      })
                    }
                    placeholder="0"
                  />
                  <p className="text-sm text-gray-600">
                    0 = tidak ada trial period
                  </p>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-0.5">
                    <Label>Auto Renewal</Label>
                    <p className="text-sm text-gray-600">
                      Membership akan diperpanjang otomatis
                    </p>
                  </div>
                  <Switch
                    checked={formData.autoRenewal}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, autoRenewal: checked })
                    }
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Tab 3: Access */}
          <TabsContent value="access" className="space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-bold text-gray-900">Akses & Konten</h2>
                <p className="text-sm text-gray-600">
                  Atur akses member ke grup dan course
                </p>
              </div>
              <div className="p-6 space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="groupId">Grup Komunitas</Label>
                  <Select
                    value={formData.groupId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, groupId: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih grup..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NONE">Tidak ada grup</SelectItem>
                      {groups.map((group) => (
                        <SelectItem key={group.id} value={group.id}>
                          {group.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label>Course yang Dapat Diakses</Label>
                  <div className="border rounded-lg p-4 max-h-96 overflow-y-auto">
                    {courses.length === 0 ? (
                      <p className="text-sm text-gray-600 text-center py-4">
                        Tidak ada course tersedia
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {courses.map((course) => (
                          <div
                            key={course.id}
                            className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded-md"
                          >
                            <Checkbox
                              id={`course-${course.id}`}
                              checked={formData.courses.includes(course.id)}
                              onCheckedChange={() => toggleCourse(course.id)}
                            />
                            <Label
                              htmlFor={`course-${course.id}`}
                              className="flex-1 cursor-pointer font-normal"
                            >
                              {course.title}
                            </Label>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">
                    {formData.courses.length} course dipilih
                  </p>
                </div>

                <div className="space-y-3">
                  <Label>Produk yang Dapat Diakses</Label>
                  <div className="border rounded-lg p-4 max-h-96 overflow-y-auto">
                    {products.length === 0 ? (
                      <p className="text-sm text-gray-600 text-center py-4">
                        Tidak ada produk tersedia
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {products.map((product) => (
                          <div
                            key={product.id}
                            className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded-md"
                          >
                            <Checkbox
                              id={`product-${product.id}`}
                              checked={formData.products.includes(product.id)}
                              onCheckedChange={() => toggleProduct(product.id)}
                            />
                            <Label
                              htmlFor={`product-${product.id}`}
                              className="flex-1 cursor-pointer font-normal"
                            >
                              {product.name}
                            </Label>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">
                    {formData.products.length} produk dipilih
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="benefits" className="space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-bold text-gray-900">Fitur Akses Sistem</h2>
                <p className="text-sm text-gray-600">
                  Pilih fitur-fitur yang dapat diakses oleh member dengan paket ini
                </p>
              </div>
              <div className="p-6">
                <MembershipFeatureSelector
                  selectedFeatures={selectedFeatures}
                  onFeaturesChange={setSelectedFeatures}
                  disabled={loading}
                />
              </div>
            </div>

            {/* Legacy Text Benefits - Keep for display purposes */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-bold text-gray-900">Benefit Teks (Opsional)</h2>
                <p className="text-sm text-gray-600">
                  Tambahkan benefit teks untuk ditampilkan di halaman checkout
                </p>
              </div>
              <div className="p-6 space-y-6">
                <div className="space-y-3">
                  <Label>Features (Teks)</Label>
                  <div className="flex gap-2">
                    <Input
                      value={featureInput}
                      onChange={(e) => setFeatureInput(e.target.value)}
                      placeholder="Tambah fitur teks..."
                      onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addFeature())}
                    />
                    <Button type="button" onClick={addFeature} className="btn-primary">
                      Tambah
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.features.map((feature, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="gap-1 cursor-pointer"
                        onClick={() => removeFeature(index)}
                      >
                        {feature}
                        <span className="text-xs">×</span>
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Benefits (Teks)</Label>
                  <div className="flex gap-2">
                    <Input
                      value={benefitInput}
                      onChange={(e) => setBenefitInput(e.target.value)}
                      placeholder="Tambah benefit teks..."
                      onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addBenefit())}
                    />
                    <Button type="button" onClick={addBenefit} className="btn-primary">
                      Tambah
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {formData.benefits.map((benefit, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 p-2 border rounded-md group"
                      >
                        <Check className="h-4 w-4 text-green-600" />
                        <span className="flex-1">{benefit}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeBenefit(index)}
                          className="opacity-0 group-hover:opacity-100"
                        >
                          Hapus
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="marketing" className="space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-bold text-gray-900">Marketing & Sales</h2>
                <p className="text-sm text-gray-600">
                  Pengaturan sales page dan CTA
                </p>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="salesPageUrl">Sales Page URL</Label>
                  <Input
                    id="salesPageUrl"
                    value={formData.salesPageUrl}
                    onChange={(e) =>
                      setFormData({ ...formData, salesPageUrl: e.target.value })
                    }
                    placeholder="https://example.com/membership-premium"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="logo">Logo (Optional)</Label>
                  <Input
                    id="logo"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setLogoFile(file);
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setFormData({ ...formData, formLogo: reader.result as string });
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                  {formData.formLogo && (
                    <div className="mt-2">
                      <img src={formData.formLogo} alt="Logo preview" className="h-20 object-contain border rounded" />
                    </div>
                  )}
                  <p className="text-xs text-gray-600">
                    Logo akan ditampilkan di halaman checkout
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="banner">Banner (Optional)</Label>
                  <Input
                    id="banner"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setBannerFile(file);
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setFormData({ ...formData, formBanner: reader.result as string });
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                  {formData.formBanner && (
                    <div className="mt-2">
                      <img src={formData.formBanner} alt="Banner preview" className="h-32 w-full object-cover border rounded" />
                    </div>
                  )}
                  <p className="text-xs text-gray-600">
                    Banner akan ditampilkan di halaman checkout
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="buttonText">Teks Tombol CTA</Label>
                  <Input
                    id="buttonText"
                    value={formData.buttonText}
                    onChange={(e) =>
                      setFormData({ ...formData, buttonText: e.target.value })
                    }
                    placeholder="Beli Membership"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="formLogo">Logo URL (Optional)</Label>
                  <Input
                    id="formLogo"
                    value={formData.formLogo}
                    onChange={(e) =>
                      setFormData({ ...formData, formLogo: e.target.value })
                    }
                    placeholder="https://example.com/logo.png"
                  />
                  <p className="text-xs text-gray-600">
                    Logo akan ditampilkan di checkout page
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="formBanner">Banner URL (Optional)</Label>
                  <Input
                    id="formBanner"
                    value={formData.formBanner}
                    onChange={(e) =>
                      setFormData({ ...formData, formBanner: e.target.value })
                    }
                    placeholder="https://example.com/banner.png"
                  />
                  <p className="text-xs text-gray-600">
                    Banner akan ditampilkan di checkout page
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                  </span>
                  Automation & Smart Reminders
                </h2>
                <p className="text-sm text-gray-600">
                  Setup unlimited automated reminders setelah membership dibuat
                </p>
              </div>
              <div className="p-6">
                <div className="p-6 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <Info className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <p className="font-medium">💡 Smart Reminder tersedia setelah membership dibuat</p>
                      <p className="text-sm text-gray-600">
                        Setelah menyimpan membership ini, Anda dapat mengatur reminder automation dengan multi-channel delivery (Email, WhatsApp, Push, In-App) dari halaman edit.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Tab 6: SEO */}
          <TabsContent value="seo" className="space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-bold text-gray-900">SEO Settings</h2>
                <p className="text-sm text-gray-600">
                  Optimasi untuk search engine
                </p>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="metaTitle">Meta Title</Label>
                  <Input
                    id="metaTitle"
                    value={formData.metaTitle}
                    onChange={(e) =>
                      setFormData({ ...formData, metaTitle: e.target.value })
                    }
                    placeholder="Premium Membership - Akses Lengkap"
                  />
                  <p className="text-sm text-gray-600">
                    {formData.metaTitle.length}/60 karakter
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="metaDescription">Meta Description</Label>
                  <Textarea
                    id="metaDescription"
                    value={formData.metaDescription}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        metaDescription: e.target.value,
                      })
                    }
                    placeholder="Dapatkan akses penuh ke semua course dan grup eksklusif..."
                    rows={3}
                  />
                  <p className="text-sm text-gray-600">
                    {formData.metaDescription.length}/160 karakter
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="metaKeywords">Meta Keywords</Label>
                  <Input
                    id="metaKeywords"
                    value={formData.metaKeywords}
                    onChange={(e) =>
                      setFormData({ ...formData, metaKeywords: e.target.value })
                    }
                    placeholder="membership, premium, course, komunitas"
                  />
                  <p className="text-sm text-gray-600">
                    Pisahkan dengan koma
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-bold text-gray-900">Advanced Settings</h2>
                <p className="text-sm text-gray-600">
                  Pengaturan lanjutan membership
                </p>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="maxMembers">Max Members</Label>
                  <Input
                    id="maxMembers"
                    type="number"
                    value={formData.maxMembers}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        maxMembers: parseInt(e.target.value) || 0,
                      })
                    }
                    placeholder="0"
                  />
                  <p className="text-sm text-gray-600">
                    0 = unlimited members
                  </p>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-0.5">
                    <Label>Visible</Label>
                    <p className="text-sm text-gray-600">
                      Membership akan ditampilkan ke publik
                    </p>
                  </div>
                  <Switch
                    checked={formData.isVisible}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, isVisible: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-0.5">
                    <Label>Tampil di Checkout Umum</Label>
                    <p className="text-sm text-gray-600">
                      Tampilkan paket ini di halaman /membership
                    </p>
                  </div>
                  <Switch
                    checked={formData.showInGeneralCheckout}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, showInGeneralCheckout: checked })
                    }
                  />
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-4 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/admin/membership-plans")}
            disabled={loading}
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Batal
          </Button>
          <Button type="submit" disabled={loading} className="gap-2 btn-primary">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Simpan Membership
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
    </ResponsivePageWrapper>
  );
}
