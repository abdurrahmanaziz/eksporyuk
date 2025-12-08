"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ResponsivePageWrapper from "@/components/layout/ResponsivePageWrapper";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface MembershipPlan {
  id: string;
  name: string;
  slug: string;
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

export default function CreateProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [membershipPlans, setMembershipPlans] = useState<MembershipPlan[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    shortDescription: "",
    price: 0,
    originalPrice: 0,
    productType: "DIGITAL",
    productStatus: "DRAFT",
    accessLevel: "PUBLIC",
    category: "",
    tags: [] as string[],
    thumbnail: "",
    
    // SEO
    seoMetaTitle: "",
    seoMetaDescription: "",
    seoKeywords: "",
    ctaButtonText: "Beli Sekarang",
    
    // Event fields
    eventDate: "",
    eventEndDate: "",
    eventDuration: 0,
    eventUrl: "",
    meetingId: "",
    meetingPassword: "",
    eventVisibility: "PUBLIC",
    eventPassword: "",
    maxParticipants: 0,
    
    // Upsale settings
    enableUpsale: true,
    upsaleDiscount: 0,
    upsaleMessage: "",
    
    // Content
    groupId: "",
    stock: 0,
    
    // Marketing
    salesPageUrl: "",
    trackingPixels: "",
    
    // Settings
    isActive: true,
    isFeatured: false,
    commissionType: "PERCENTAGE",
    affiliateCommissionRate: 30,
  });

  const [selectedMemberships, setSelectedMemberships] = useState<string[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [faqs, setFaqs] = useState<{ question: string; answer: string }[]>([]);
  const [testimonials, setTestimonials] = useState<{ name: string; role: string; content: string; rating: number }[]>([]);
  const [bonuses, setBonuses] = useState<{ title: string; description: string; value?: number }[]>([]);
  const [downloadableFiles, setDownloadableFiles] = useState<{ title: string; url: string; type: string; size?: string }[]>([]);
  const [tagInput, setTagInput] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [membershipRes, coursesRes, groupsRes] = await Promise.all([
        fetch("/api/admin/membership-plans"),
        fetch("/api/admin/courses"),
        fetch("/api/admin/groups"),
      ]);

      if (membershipRes.ok) {
        const data = await membershipRes.json();
        setMembershipPlans(data.plans || []);
      }
      if (coursesRes.ok) {
        const data = await coursesRes.json();
        setCourses(data.courses || []);
      }
      if (groupsRes.ok) {
        const data = await groupsRes.json();
        setGroups(data.groups || []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  };

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    
    // Auto-generate slug from name
    if (field === "name" && !formData.slug) {
      setFormData((prev) => ({ ...prev, slug: generateSlug(value) }));
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name || !formData.description || formData.price < 0) {
      toast.error("Nama, deskripsi, dan harga wajib diisi");
      return;
    }

    if (!formData.thumbnail) {
      toast.error("Thumbnail wajib diisi");
      return;
    }

    setLoading(true);

    try {
      // Parse tracking pixels if not empty
      let parsedPixels = null;
      if (formData.trackingPixels.trim()) {
        try {
          parsedPixels = JSON.parse(formData.trackingPixels);
        } catch (e) {
          toast.error("Format tracking pixels invalid. Harus JSON array.");
          setLoading(false);
          return;
        }
      }

      const productData: any = {
        ...formData,
        price: Number(formData.price),
        originalPrice: Number(formData.originalPrice) || null,
        stock: Number(formData.stock) || null,
        affiliateCommissionRate: Number(formData.affiliateCommissionRate) || 30,
        
        // Arrays as JSON
        tags: formData.tags.length > 0 ? formData.tags : null,
        images: images.length > 0 ? images : null,
        faqs: faqs.length > 0 ? JSON.stringify(faqs) : null,
        testimonials: testimonials.length > 0 ? JSON.stringify(testimonials) : null,
        bonuses: bonuses.length > 0 ? JSON.stringify(bonuses) : null,
        downloadableFiles: downloadableFiles.length > 0 ? JSON.stringify(downloadableFiles) : null,
        trackingPixels: parsedPixels ? JSON.stringify(parsedPixels) : null,
        
        // SEO fields
        seoMetaTitle: formData.seoMetaTitle || null,
        seoMetaDescription: formData.seoMetaDescription || null,
        seoKeywords: formData.seoKeywords || null,
        ctaButtonText: formData.ctaButtonText || "Beli Sekarang",
        
        // Marketing
        salesPageUrl: formData.salesPageUrl || null,
        
        // Event fields
        eventDuration: formData.eventDuration || null,
        maxParticipants: formData.maxParticipants || null,
        eventDate: formData.eventDate || null,
        eventEndDate: formData.eventEndDate || null,
        eventUrl: formData.eventUrl || null,
        meetingId: formData.meetingId || null,
        meetingPassword: formData.meetingPassword || null,
        eventPassword: formData.eventPassword || null,
        eventVisibility: formData.productType === "EVENT" ? formData.eventVisibility : null,
        
        // Upsale
        upsaleTargetMemberships: selectedMemberships.length > 0 ? JSON.stringify(selectedMemberships) : null,
        upsaleMessage: formData.upsaleMessage || null,
        upsaleDiscount: Number(formData.upsaleDiscount) || 0,
        
        // Content
        courseIds: selectedCourses.length > 0 ? selectedCourses : null,
        groupId: formData.groupId || null,
      };

      const response = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create product");
      }

      toast.success("Produk berhasil dibuat!");
      router.push("/admin/products");
    } catch (error: any) {
      toast.error(error.message || "Gagal membuat produk");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ResponsivePageWrapper>
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/products">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Tambah Produk</h1>
            <p className="text-muted-foreground">
              Buat produk digital, event, atau bundle kelas baru
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={onSubmit} className="space-y-6">
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="basic">Info Dasar</TabsTrigger>
            <TabsTrigger value="pricing">Harga & SEO</TabsTrigger>
            <TabsTrigger value="content">Konten & Media</TabsTrigger>
            <TabsTrigger value="marketing">Marketing</TabsTrigger>
            <TabsTrigger value="upsale">Upsale</TabsTrigger>
            <TabsTrigger value="settings">Pengaturan</TabsTrigger>
          </TabsList>

          {/* Tab 1: Basic Info */}
          <TabsContent value="basic" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Informasi Dasar</CardTitle>
                <CardDescription>Informasi umum tentang produk</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="productType">Tipe Produk *</Label>
                    <Select
                      value={formData.productType}
                      onValueChange={(value) => handleChange("productType", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DIGITAL">Digital Product</SelectItem>
                        <SelectItem value="COURSE_BUNDLE">Bundle Kelas</SelectItem>
                        <SelectItem value="EBOOK">Ebook</SelectItem>
                        <SelectItem value="TEMPLATE">Template/Resource</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="productStatus">Status Produk *</Label>
                    <Select
                      value={formData.productStatus}
                      onValueChange={(value) => handleChange("productStatus", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DRAFT">Draft - Belum Publish</SelectItem>
                        <SelectItem value="PUBLISHED">Published - Aktif Dijual</SelectItem>
                        <SelectItem value="COMING_SOON">Coming Soon</SelectItem>
                        <SelectItem value="ARCHIVED">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accessLevel">Level Akses *</Label>
                  <Select
                    value={formData.accessLevel}
                    onValueChange={(value) => handleChange("accessLevel", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PUBLIC">Public - Semua Orang</SelectItem>
                      <SelectItem value="MEMBER_ONLY">Member Only</SelectItem>
                      <SelectItem value="PREMIUM_ONLY">Premium Member Only</SelectItem>
                      <SelectItem value="PRIVATE">Private - Invitation Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Kategori</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => handleChange("category", e.target.value)}
                    placeholder="e.g., Ekspor, Training, Digital"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Nama Produk *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    placeholder="Masukkan nama produk"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug">Slug *</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => handleChange("slug", e.target.value)}
                    placeholder="slug-produk"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    URL-friendly identifier (otomatis dari nama)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Deskripsi *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleChange("description", e.target.value)}
                    placeholder="Jelaskan produk Anda..."
                    rows={5}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price">Harga (IDR) *</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => handleChange("price", e.target.value)}
                    placeholder="0"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tags">Tags Produk</Label>
                  <div className="flex gap-2">
                    <Input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (tagInput.trim()) {
                            handleChange("tags", [...formData.tags, tagInput.trim()]);
                            setTagInput("");
                          }
                        }
                      }}
                      placeholder="Ketik tag dan tekan Enter"
                    />
                  </div>
                  {formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="gap-1">
                          {tag}
                          <button
                            onClick={() => {
                              handleChange("tags", formData.tags.filter((_, i) => i !== index));
                            }}
                            className="ml-1 hover:bg-destructive/20 rounded-full"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Kata kunci untuk memudahkan pencarian
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 2: Pricing & SEO */}
          <TabsContent value="pricing" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Harga & Monetisasi</CardTitle>
                <CardDescription>Atur harga dan diskon produk</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Harga Jual (IDR) *</Label>
                    <Input
                      id="price"
                      type="number"
                      value={formData.price}
                      onChange={(e) => handleChange("price", e.target.value)}
                      placeholder="499000"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="originalPrice">Harga Asli (IDR)</Label>
                    <Input
                      id="originalPrice"
                      type="number"
                      value={formData.originalPrice}
                      onChange={(e) => handleChange("originalPrice", e.target.value)}
                      placeholder="799000"
                    />
                    <p className="text-xs text-muted-foreground">
                      Tampilkan harga coret untuk diskon
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stock">Stock/Kuota</Label>
                  <Input
                    id="stock"
                    type="number"
                    value={formData.stock}
                    onChange={(e) => handleChange("stock", e.target.value)}
                    placeholder="0 = unlimited"
                  />
                  <p className="text-xs text-muted-foreground">
                    Batasi jumlah pembelian (0 atau kosong = unlimited)
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>SEO & Marketing</CardTitle>
                <CardDescription>Optimasi untuk search engine</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="seoMetaTitle">SEO Title</Label>
                  <Input
                    id="seoMetaTitle"
                    value={formData.seoMetaTitle}
                    onChange={(e) => handleChange("seoMetaTitle", e.target.value)}
                    placeholder="Judul untuk SEO (max 60 karakter)"
                    maxLength={60}
                  />
                  <p className="text-xs text-muted-foreground">
                    Kosongkan untuk gunakan judul produk
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="seoMetaDescription">SEO Description</Label>
                  <Textarea
                    id="seoMetaDescription"
                    value={formData.seoMetaDescription}
                    onChange={(e) => handleChange("seoMetaDescription", e.target.value)}
                    placeholder="Deskripsi untuk SEO (max 160 karakter)"
                    rows={3}
                    maxLength={160}
                  />
                  <p className="text-xs text-muted-foreground">
                    {formData.seoMetaDescription.length}/160 karakter
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="seoKeywords">SEO Keywords</Label>
                  <Input
                    id="seoKeywords"
                    value={formData.seoKeywords}
                    onChange={(e) => handleChange("seoKeywords", e.target.value)}
                    placeholder="ekspor, training, digital marketing"
                  />
                  <p className="text-xs text-muted-foreground">
                    Pisahkan dengan koma
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ctaButtonText">Teks Tombol CTA</Label>
                  <Input
                    id="ctaButtonText"
                    value={formData.ctaButtonText}
                    onChange={(e) => handleChange("ctaButtonText", e.target.value)}
                    placeholder="Beli Sekarang"
                  />
                  <p className="text-xs text-muted-foreground">
                    Text untuk tombol pembelian
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 3: Upsale Settings */}
          <TabsContent value="upsale" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Pengaturan Upsale</CardTitle>
                <CardDescription>
                  Tawarkan upgrade ke membership setelah pembelian
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <Label className="text-base">Aktifkan Upsale</Label>
                    <p className="text-sm text-muted-foreground">
                      Tampilkan penawaran membership setelah checkout
                    </p>
                  </div>
                  <Switch
                    checked={formData.enableUpsale}
                    onCheckedChange={(checked) => handleChange("enableUpsale", checked)}
                  />
                </div>

                {formData.enableUpsale && (
                  <>
                    <div className="space-y-2">
                      <Label>Target Membership Plans</Label>
                      <p className="text-sm text-muted-foreground mb-3">
                        Pilih membership yang akan ditawarkan
                      </p>
                      <div className="space-y-2 border rounded-md p-4 max-h-60 overflow-y-auto">
                        {membershipPlans.length === 0 ? (
                          <p className="text-sm text-muted-foreground">Belum ada membership plan</p>
                        ) : (
                          membershipPlans.map((plan) => (
                            <div key={plan.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`membership-${plan.id}`}
                                checked={selectedMemberships.includes(plan.id)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedMemberships([...selectedMemberships, plan.id]);
                                  } else {
                                    setSelectedMemberships(
                                      selectedMemberships.filter((id) => id !== plan.id)
                                    );
                                  }
                                }}
                              />
                              <label
                                htmlFor={`membership-${plan.id}`}
                                className="text-sm font-medium leading-none cursor-pointer"
                              >
                                {plan.name}
                              </label>
                            </div>
                          ))
                        )}
                      </div>
                      {selectedMemberships.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {selectedMemberships.map((id) => {
                            const plan = membershipPlans.find((p) => p.id === id);
                            return plan ? (
                              <Badge key={id} variant="secondary">
                                {plan.name}
                              </Badge>
                            ) : null;
                          })}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="upsaleDiscount">Diskon Upsale (%)</Label>
                      <Input
                        id="upsaleDiscount"
                        type="number"
                        min="0"
                        max="100"
                        value={formData.upsaleDiscount}
                        onChange={(e) => handleChange("upsaleDiscount", e.target.value)}
                        placeholder="0"
                      />
                      <p className="text-xs text-muted-foreground">
                        Berikan diskon khusus untuk upsale (0-100%)
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="upsaleMessage">Pesan Upsale</Label>
                      <Textarea
                        id="upsaleMessage"
                        value={formData.upsaleMessage}
                        onChange={(e) => handleChange("upsaleMessage", e.target.value)}
                        placeholder="Upgrade ke membership sekarang dan dapatkan akses penuh!"
                        rows={3}
                      />
                      <p className="text-xs text-muted-foreground">
                        Pesan persuasif untuk mendorong upgrade
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 4: Content & Media */}
          <TabsContent value="content" className="space-y-4">
            {/* Courses & Groups */}
            <Card>
              <CardHeader>
                <CardTitle>Akses & Integrasi</CardTitle>
                <CardDescription>Kelas dan grup yang didapat setelah pembelian</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Kelas (Courses)</Label>
                  <p className="text-sm text-muted-foreground mb-3">
                    Pilih kelas yang termasuk dalam produk ini
                  </p>
                  <div className="space-y-2 border rounded-md p-4 max-h-60 overflow-y-auto">
                    {courses.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Belum ada kelas</p>
                    ) : (
                      courses.map((course) => (
                        <div key={course.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`course-${course.id}`}
                            checked={selectedCourses.includes(course.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedCourses([...selectedCourses, course.id]);
                              } else {
                                setSelectedCourses(
                                  selectedCourses.filter((id) => id !== course.id)
                                );
                              }
                            }}
                          />
                          <label
                            htmlFor={`course-${course.id}`}
                            className="text-sm font-medium leading-none cursor-pointer"
                          >
                            {course.title}
                          </label>
                        </div>
                      ))
                    )}
                  </div>
                  {selectedCourses.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedCourses.map((id) => {
                        const course = courses.find((c) => c.id === id);
                        return course ? (
                          <Badge key={id} variant="secondary">
                            {course.title}
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="groupId">Grup Komunitas</Label>
                  <Select
                    value={formData.groupId || "none"}
                    onValueChange={(value) => handleChange("groupId", value === "none" ? "" : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih grup (opsional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Tidak ada</SelectItem>
                      {groups.map((group) => (
                        <SelectItem key={group.id} value={group.id}>
                          {group.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Pembeli produk otomatis join grup ini
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Thumbnail & Gallery */}
            <Card>
              <CardHeader>
                <CardTitle>Media Produk</CardTitle>
                <CardDescription>Thumbnail dan gallery images</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="thumbnail">Thumbnail URL *</Label>
                  <Input
                    id="thumbnail"
                    value={formData.thumbnail}
                    onChange={(e) => handleChange("thumbnail", e.target.value)}
                    placeholder="https://example.com/image.jpg"
                  />
                  <p className="text-xs text-muted-foreground">
                    Rekomendasi ukuran: 1280x720px
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Gallery Images (Opsional)</Label>
                  <div className="space-y-2">
                    {images.map((img, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={img}
                          onChange={(e) => {
                            const newImages = [...images];
                            newImages[index] = e.target.value;
                            setImages(newImages);
                          }}
                          placeholder="https://example.com/gallery-image.jpg"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          onClick={() => {
                            setImages(images.filter((_, i) => i !== index));
                          }}
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setImages([...images, ""])}
                    >
                      + Tambah Gambar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* FAQ Builder */}
            <Card>
              <CardHeader>
                <CardTitle>FAQ Produk</CardTitle>
                <CardDescription>Pertanyaan umum tentang produk</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {faqs.map((faq, index) => (
                  <div key={index} className="p-4 border rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>FAQ #{index + 1}</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setFaqs(faqs.filter((_, i) => i !== index));
                        }}
                      >
                        Hapus
                      </Button>
                    </div>
                    <Input
                      value={faq.question}
                      onChange={(e) => {
                        const newFaqs = [...faqs];
                        newFaqs[index].question = e.target.value;
                        setFaqs(newFaqs);
                      }}
                      placeholder="Pertanyaan"
                    />
                    <Textarea
                      value={faq.answer}
                      onChange={(e) => {
                        const newFaqs = [...faqs];
                        newFaqs[index].answer = e.target.value;
                        setFaqs(newFaqs);
                      }}
                      placeholder="Jawaban"
                      rows={2}
                    />
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setFaqs([...faqs, { question: "", answer: "" }])}
                >
                  + Tambah FAQ
                </Button>
              </CardContent>
            </Card>

            {/* Testimonials */}
            <Card>
              <CardHeader>
                <CardTitle>Testimoni</CardTitle>
                <CardDescription>Testimoni pelanggan</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {testimonials.map((testi, index) => (
                  <div key={index} className="p-4 border rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Testimoni #{index + 1}</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setTestimonials(testimonials.filter((_, i) => i !== index));
                        }}
                      >
                        Hapus
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        value={testi.name}
                        onChange={(e) => {
                          const newTesti = [...testimonials];
                          newTesti[index].name = e.target.value;
                          setTestimonials(newTesti);
                        }}
                        placeholder="Nama"
                      />
                      <Input
                        value={testi.role}
                        onChange={(e) => {
                          const newTesti = [...testimonials];
                          newTesti[index].role = e.target.value;
                          setTestimonials(newTesti);
                        }}
                        placeholder="Role/Jabatan"
                      />
                    </div>
                    <Textarea
                      value={testi.content}
                      onChange={(e) => {
                        const newTesti = [...testimonials];
                        newTesti[index].content = e.target.value;
                        setTestimonials(newTesti);
                      }}
                      placeholder="Isi testimoni"
                      rows={2}
                    />
                    <Input
                      type="number"
                      min="1"
                      max="5"
                      value={testi.rating}
                      onChange={(e) => {
                        const newTesti = [...testimonials];
                        newTesti[index].rating = parseInt(e.target.value) || 5;
                        setTestimonials(newTesti);
                      }}
                      placeholder="Rating (1-5)"
                    />
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setTestimonials([...testimonials, { name: "", role: "", content: "", rating: 5 }])}
                >
                  + Tambah Testimoni
                </Button>
              </CardContent>
            </Card>

            {/* Bonuses */}
            <Card>
              <CardHeader>
                <CardTitle>Bonus / Add-ons</CardTitle>
                <CardDescription>Bonus tambahan yang didapat</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {bonuses.map((bonus, index) => (
                  <div key={index} className="p-4 border rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Bonus #{index + 1}</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setBonuses(bonuses.filter((_, i) => i !== index));
                        }}
                      >
                        Hapus
                      </Button>
                    </div>
                    <Input
                      value={bonus.title}
                      onChange={(e) => {
                        const newBonuses = [...bonuses];
                        newBonuses[index].title = e.target.value;
                        setBonuses(newBonuses);
                      }}
                      placeholder="Judul bonus"
                    />
                    <Textarea
                      value={bonus.description}
                      onChange={(e) => {
                        const newBonuses = [...bonuses];
                        newBonuses[index].description = e.target.value;
                        setBonuses(newBonuses);
                      }}
                      placeholder="Deskripsi bonus"
                      rows={2}
                    />
                    <Input
                      type="number"
                      value={bonus.value || ""}
                      onChange={(e) => {
                        const newBonuses = [...bonuses];
                        newBonuses[index].value = e.target.value ? parseInt(e.target.value) : undefined;
                        setBonuses(newBonuses);
                      }}
                      placeholder="Nilai bonus (opsional, Rp)"
                    />
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setBonuses([...bonuses, { title: "", description: "" }])}
                >
                  + Tambah Bonus
                </Button>
              </CardContent>
            </Card>

            {/* Downloadable Files */}
            <Card>
              <CardHeader>
                <CardTitle>File Download</CardTitle>
                <CardDescription>Ebook, template, atau resource yang bisa didownload</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {downloadableFiles.map((file, index) => (
                  <div key={index} className="p-4 border rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>File #{index + 1}</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setDownloadableFiles(downloadableFiles.filter((_, i) => i !== index));
                        }}
                      >
                        Hapus
                      </Button>
                    </div>
                    <Input
                      value={file.title}
                      onChange={(e) => {
                        const newFiles = [...downloadableFiles];
                        newFiles[index].title = e.target.value;
                        setDownloadableFiles(newFiles);
                      }}
                      placeholder="Nama file (e.g., Ebook Panduan Ekspor)"
                    />
                    <Input
                      value={file.url}
                      onChange={(e) => {
                        const newFiles = [...downloadableFiles];
                        newFiles[index].url = e.target.value;
                        setDownloadableFiles(newFiles);
                      }}
                      placeholder="URL file (Google Drive, Dropbox, dll)"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        value={file.type}
                        onChange={(e) => {
                          const newFiles = [...downloadableFiles];
                          newFiles[index].type = e.target.value;
                          setDownloadableFiles(newFiles);
                        }}
                        placeholder="Tipe (PDF, ZIP, MP4)"
                      />
                      <Input
                        value={file.size || ""}
                        onChange={(e) => {
                          const newFiles = [...downloadableFiles];
                          newFiles[index].size = e.target.value;
                          setDownloadableFiles(newFiles);
                        }}
                        placeholder="Ukuran (e.g., 2.5MB)"
                      />
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setDownloadableFiles([...downloadableFiles, { title: "", url: "", type: "", size: "" }])}
                >
                  + Tambah File
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 5: Marketing */}
          <TabsContent value="marketing" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Marketing & Analytics</CardTitle>
                <CardDescription>Tracking pixels dan salespage URL</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="salesPageUrl">Custom Salespage URL</Label>
                  <Input
                    id="salesPageUrl"
                    value={formData.salesPageUrl}
                    onChange={(e) => handleChange("salesPageUrl", e.target.value)}
                    placeholder="https://salespage.com/produk"
                  />
                  <p className="text-xs text-muted-foreground">
                    Link ke salespage eksternal (opsional)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Tracking Pixels</Label>
                  <p className="text-sm text-muted-foreground mb-3">
                    Facebook Pixel, Google Analytics, dll untuk remarketing
                  </p>
                  <Textarea
                    value={formData.trackingPixels}
                    onChange={(e) => handleChange("trackingPixels", e.target.value)}
                    placeholder={'Contoh JSON:\n[{"platform": "facebook", "pixelId": "123456789"}, {"platform": "google", "pixelId": "UA-123456"}]'}
                    rows={5}
                  />
                  <p className="text-xs text-muted-foreground">
                    Format JSON array untuk tracking pixels
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 5: Settings */}
          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Pengaturan Lanjutan</CardTitle>
                <CardDescription>Komisi, status, dan pengaturan lainnya</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="commissionType">Tipe Komisi</Label>
                  <Select
                    value={formData.commissionType}
                    onValueChange={(value) => handleChange("commissionType", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PERCENTAGE">Persentase (%)</SelectItem>
                      <SelectItem value="FLAT">Flat (IDR)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="affiliateCommissionRate">
                    {formData.commissionType === "PERCENTAGE"
                      ? "Komisi Affiliate (%)"
                      : "Komisi Affiliate (IDR)"}
                  </Label>
                  <Input
                    id="affiliateCommissionRate"
                    type="number"
                    value={formData.affiliateCommissionRate}
                    onChange={(e) => handleChange("affiliateCommissionRate", e.target.value)}
                    placeholder={formData.commissionType === "PERCENTAGE" ? "30" : "50000"}
                  />
                  <p className="text-xs text-muted-foreground">
                    {formData.commissionType === "PERCENTAGE"
                      ? "Persentase komisi untuk affiliate (default 30%)"
                      : "Jumlah tetap komisi untuk affiliate (dalam IDR)"}
                  </p>
                </div>

                <div className="space-y-4 border-t pt-4">
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <Label className="text-base">Produk Aktif</Label>
                      <p className="text-sm text-muted-foreground">
                        Produk dapat dibeli oleh user
                      </p>
                    </div>
                    <Switch
                      checked={formData.isActive}
                      onCheckedChange={(checked) => handleChange("isActive", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <Label className="text-base">Featured Product</Label>
                      <p className="text-sm text-muted-foreground">
                        Tampilkan di homepage sebagai featured
                      </p>
                    </div>
                    <Switch
                      checked={formData.isFeatured}
                      onCheckedChange={(checked) => handleChange("isFeatured", checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/admin/products")}
            disabled={loading}
          >
            Batal
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Simpan Produk
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
    </ResponsivePageWrapper>
  );
}
