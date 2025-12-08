'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowLeft, Loader2, Upload, X } from 'lucide-react'
import { toast } from 'sonner'

export default function CreateProductPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    price: '',
    minOrder: '',
    status: 'DRAFT' as 'DRAFT' | 'ACTIVE' | 'PENDING_REVIEW'
  })

  const [images, setImages] = useState<string[]>([])
  const [imageFiles, setImageFiles] = useState<File[]>([])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/supplier/products/create')
    }
  }, [status])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    
    // Limit to 5 images
    if (images.length + files.length > 5) {
      toast.error('Maksimal 5 gambar')
      return
    }

    // Validate file size (max 2MB per image)
    for (const file of files) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error(`${file.name} terlalu besar. Maksimal 2MB per gambar.`)
        return
      }
    }

    // Create preview URLs
    const newImages = files.map(file => URL.createObjectURL(file))
    setImages([...images, ...newImages])
    setImageFiles([...imageFiles, ...files])
  }

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index)
    const newFiles = imageFiles.filter((_, i) => i !== index)
    setImages(newImages)
    setImageFiles(newFiles)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!formData.title || !formData.description) {
      toast.error('Judul dan deskripsi wajib diisi')
      return
    }

    setLoading(true)

    try {
      // Upload images first (if any)
      let uploadedImageUrls: string[] = []
      
      if (imageFiles.length > 0) {
        setUploading(true)
        const formDataImages = new FormData()
        imageFiles.forEach(file => {
          formDataImages.append('images', file)
        })

        const uploadResponse = await fetch('/api/upload/images', {
          method: 'POST',
          body: formDataImages
        })

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json()
          uploadedImageUrls = uploadData.urls || []
        } else {
          toast.error('Gagal upload gambar')
          setLoading(false)
          setUploading(false)
          return
        }
        setUploading(false)
      }

      // Create product
      const response = await fetch('/api/supplier/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          price: formData.price ? parseFloat(formData.price) : null,
          images: uploadedImageUrls
        })
      })

      if (response.ok) {
        toast.success('Produk berhasil ditambahkan')
        router.push('/supplier/products')
      } else {
        const data = await response.json()
        toast.error(data.error || 'Gagal menambahkan produk')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading') {
    return (
      <ResponsivePageWrapper>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </ResponsivePageWrapper>
    )
  }

  return (
    <ResponsivePageWrapper>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <Link href="/supplier/products" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Kembali ke Daftar Produk
          </Link>
          <h1 className="text-2xl font-bold">Tambah Produk Baru</h1>
          <p className="text-sm text-gray-500 mt-1">Lengkapi informasi produk yang akan Anda jual</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Informasi Produk</CardTitle>
              <CardDescription>Isi detail produk Anda dengan lengkap</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Nama Produk *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Contoh: Kopi Arabika Premium 1kg"
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Deskripsi Produk *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Jelaskan detail produk, keunggulan, spesifikasi, dll"
                  rows={6}
                  required
                />
                <p className="text-xs text-gray-500">
                  {formData.description.length} karakter
                </p>
              </div>

              {/* Category & Price */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Kategori</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="Contoh: Makanan & Minuman"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Harga (Rp)</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="50000"
                  />
                </div>
              </div>

              {/* Min Order & Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minOrder">Minimum Order</Label>
                  <Input
                    id="minOrder"
                    value={formData.minOrder}
                    onChange={(e) => setFormData({ ...formData, minOrder: e.target.value })}
                    placeholder="Contoh: 100 kg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: any) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DRAFT">Draft (Tidak Ditampilkan)</SelectItem>
                      <SelectItem value="ACTIVE">Aktif (Tampilkan Publik)</SelectItem>
                      <SelectItem value="PENDING_REVIEW">Pending Review</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Images Upload */}
              <div className="space-y-2">
                <Label>Gambar Produk</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                  <div className="text-center">
                    <Upload className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 mb-1">Upload gambar produk</p>
                    <p className="text-xs text-gray-500 mb-4">Maksimal 5 gambar, masing-masing 2MB</p>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                    />
                    <Label htmlFor="image-upload" className="cursor-pointer">
                      <Button type="button" variant="outline" size="sm" asChild>
                        <span>Pilih Gambar</span>
                      </Button>
                    </Label>
                  </div>
                </div>

                {/* Image Previews */}
                {images.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                    {images.map((image, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={image}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={loading || uploading}
                  className="flex-1"
                >
                  {loading || uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {uploading ? 'Mengupload gambar...' : 'Menyimpan...'}
                    </>
                  ) : (
                    'Simpan Produk'
                  )}
                </Button>
                <Link href="/supplier/products" className="flex-1">
                  <Button type="button" variant="outline" className="w-full">
                    Batal
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </ResponsivePageWrapper>
  )
}
