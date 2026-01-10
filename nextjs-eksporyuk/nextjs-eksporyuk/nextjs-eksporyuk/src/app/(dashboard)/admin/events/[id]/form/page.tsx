"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Save, Loader2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import FileUpload from "@/components/FileUpload";

interface Event {
  id: string;
  name: string;
  slug: string;
  salesPageUrl?: string;
  formLogo?: string;
  formBanner?: string;
  formDescription?: string;
}

export default function EventFormPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;
  
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    salesPageUrl: "",
    formLogo: "",
    formBanner: "",
    formDescription: "",
  });

  useEffect(() => {
    fetchEvent();
  }, [eventId]);

  const fetchEvent = async () => {
    try {
      const response = await fetch(`/api/admin/events/${eventId}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch event");
      }
      
      const data = await response.json();
      setEvent(data);
      setFormData({
        salesPageUrl: data.salesPageUrl || "",
        formLogo: data.formLogo || "",
        formBanner: data.formBanner || "",
        formDescription: data.formDescription || "",
      });
    } catch (error) {
      toast.error("Gagal memuat event");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      const response = await fetch(`/api/admin/events/${eventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save");
      }

      toast.success("Pengaturan form berhasil disimpan");
      fetchEvent();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <ResponsivePageWrapper>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </ResponsivePageWrapper>
    );
  }

  if (!event) {
    return (
      <ResponsivePageWrapper>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-800">Event tidak ditemukan</p>
          </CardContent>
        </Card>
      </ResponsivePageWrapper>
    );
  }

  return (
    <ResponsivePageWrapper>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin/events">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">{event.name}</h1>
              <p className="text-sm text-muted-foreground">Pengaturan Form & Sales Page</p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="salespage" className="w-full">
          <TabsList>
            <TabsTrigger value="salespage">Sales Page</TabsTrigger>
            <TabsTrigger value="form">Pengaturan Form</TabsTrigger>
          </TabsList>

          {/* Sales Page Tab */}
          <TabsContent value="salespage" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Sales Page URL</CardTitle>
                <CardDescription>
                  Link ke halaman penjualan eksternal untuk event ini
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="salesPageUrl">URL Halaman Penjualan</Label>
                  <Input
                    id="salesPageUrl"
                    type="url"
                    placeholder="https://example.com/sales-page"
                    value={formData.salesPageUrl}
                    onChange={(e) =>
                      setFormData({ ...formData, salesPageUrl: e.target.value })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Jika ada, link ini akan ditampilkan di menu event
                  </p>
                </div>

                {formData.salesPageUrl && (
                  <div className="pt-4">
                    <Button
                      variant="outline"
                      onClick={() => window.open(formData.salesPageUrl, "_blank")}
                      className="w-full"
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Buka Sales Page
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Form Configuration Tab */}
          <TabsContent value="form" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Pengaturan Form Registrasi</CardTitle>
                <CardDescription>
                  Sesuaikan tampilan form registrasi event
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Form Logo */}
                <div className="space-y-2">
                  <Label>Logo Form</Label>
                  <FileUpload
                    onUploadComplete={(url) =>
                      setFormData({ ...formData, formLogo: url })
                    }
                    bucket="events"
                  />
                  {formData.formLogo && (
                    <div className="mt-2">
                      <img
                        src={formData.formLogo}
                        alt="Form Logo"
                        className="h-16 w-auto rounded"
                      />
                    </div>
                  )}
                </div>

                {/* Form Banner */}
                <div className="space-y-2">
                  <Label>Banner Form</Label>
                  <FileUpload
                    onUploadComplete={(url) =>
                      setFormData({ ...formData, formBanner: url })
                    }
                    bucket="events"
                  />
                  {formData.formBanner && (
                    <div className="mt-2">
                      <img
                        src={formData.formBanner}
                        alt="Form Banner"
                        className="w-full h-32 object-cover rounded"
                      />
                    </div>
                  )}
                </div>

                {/* Form Description */}
                <div className="space-y-2">
                  <Label htmlFor="formDescription">Deskripsi Form</Label>
                  <Textarea
                    id="formDescription"
                    placeholder="Masukkan deskripsi yang akan ditampilkan di form registrasi..."
                    value={formData.formDescription}
                    onChange={(e) =>
                      setFormData({ ...formData, formDescription: e.target.value })
                    }
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Save Button */}
        <div className="flex gap-2">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="gap-2"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            <Save className="h-4 w-4" />
            Simpan Perubahan
          </Button>
          <Link href="/admin/events">
            <Button variant="outline">Batal</Button>
          </Link>
        </div>
      </div>
    </ResponsivePageWrapper>
  );
}
