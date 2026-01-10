'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
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

export default function EditProductPage() {
  const router = useRouter()
  const params = useParams()
  const { data: session, status } = useSession()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)

  const productId = params?.id as string

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    price: '',
    minOrder: '',
    status: 'DRAFT' as 'DRAFT' | 'ACTIVE' | 'PENDING_REVIEW' | 'INACTIVE'
  })

  const [existingImages, setExistingImages] = useState<string[]>([])
  const [newImages, setNewImages] = useState<string[]>([])
  const [newImageFiles, setNewImageFiles] = useState<File[]>([])

  useEffect(() => {
    if (status === 'authenticated') {
      fetchProduct()
    } else if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/supplier/products')
    }
  }, [status, productId])

  const fetchProduct = async () => {
    try {
      const response = await fetch(`/api/supplier/products/${productId}`)
      
      if (response.ok) {
        const data = await response.json()
        const product = data.data

        setFormData({
          title: product.title || '',
          description: product.description || '',
          category: product.category || '',
          price: product.price ? product.price.toString() : '',
          minOrder: product.minOrder || '',
          status: product.status || 'DRAFT'
        })

        if (product.images && Array.isArray(product.images)) {
          setExistingImages(product.images)
        }
      } else {
        toast.error('Produk tidak ditemukan')
        router.push('/supplier/products')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Gagal memuat produk')
    } finally {
      setLoading(false)
    }
  }

  const handleNewImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    
    const totalImages = existingImages.length + newImages.length + files.length
    if (totalImages > 5) {
      toast.error('Maksimal 5 gambar')
      return
    }

    for (const file of files) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error(`${file.name} terlalu besar. Maksimal 2MB per gambar.`)
        return
      }
    }

    const previews = files.map(file => URL.createObjectURL(file))
    setNewImages([...newImages, ...previews])
    setNewImageFiles([...newImageFiles, ...files])
  }

  const removeExistingImage = (index: number) => {
    const updated = existingImages.filter((_, i) => i !== index)
    setExistingImages(updated)
  }

  const removeNewImage = (index: number) => {
    const updatedPreviews = newImages.filter((_, i) => i !== index)
    const updatedFiles = newImageFiles.filter((_, i) => i !== index)
    setNewImages(updatedPreviews)
    setNewImageFiles(updatedFiles)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title || !formData.description) {
      toast.error('Judul dan deskripsi wajib diisi')
      return
    }

    setSubmitting(true)

    try {
      let uploadedImageUrls: string[] = []
      
      if (newImageFiles.length > 0) {
        setUploading(true)
        const formDataImages = new FormData()
        newImageFiles.forEach(file => {
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
          setSubmitting(false)
          setUploading(false)
          return
        }
        setUploading(false)
      }

      const allImages = [...existingImages, ...uploadedImageUrls]

      const response = await fetch(`/api/supplier/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          price: formData.price ? parseFloat(formData.price) : null,
          images: allImages
        })
      })

      if (response.ok) {
        toast.success('Produk berhasil diupdate')
        router.push('/supplier/products')
      } else {
        const data = await response.json()
        toast.error(data.error || 'Gagal update produk')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Terjadi kesalahan')
    } finally {
      setSubmitting(false)
    }
  }

  if (status === 'loading' || loading) {
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
        <div>
          <Link href="/supplier/products" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Kembali ke Daftar Produk
          </Link>
          <h1 className="text-2xl font-bold">Edit Produk</h1>
          <p className="text-sm text-gray-500 mt-1">Update informasi produk Anda</p>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Informasi Produk</CardTitle>
              <CardDescription>Edit detail produk</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Nama Produk *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Nama produk"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Deskripsi Produk *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Deskripsi produk"
                  rows={6}
                  required
                />
                <p className="text-xs text-gray-500">{formData.description.length} karakter</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Kategori</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="Kategori"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Harga (Rp)</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minOrder">Minimum Order</Label>
                  <Input
                    id="minOrder"
                    value={formData.minOrder}
                    onChange={(e) => setFormData({ ...formData, minOrder: e.target.value })}
                    placeholder="Misal: 100 kg"
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
                      <SelectItem value="DRAFT">Draft</SelectItem>
                      <SelectItem value="ACTIVE">Aktif</SelectItem>
                      <SelectItem value="PENDING_REVIEW">Pending Review</SelectItem>
                      <SelectItem value="INACTIVE">Tidak Aktif</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Gambar Produk Saat Ini</Label>
                {existingImages.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {existingImages.map((image, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={image}
                          alt={`Existing ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeExistingImage(index)}
                          className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Tidak ada gambar</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Tambah Gambar Baru</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                  <div className="text-center">
                    <Upload className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 mb-1">Upload gambar tambahan</p>
                    <p className="text-xs text-gray-500 mb-4">Maksimal total 5 gambar</p>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleNewImageUpload}
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

                {newImages.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                    {newImages.map((image, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={image}
                          alt={`New ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeNewImage(index)}
                          className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={submitting || uploading}
                  className="flex-1"
                >
                  {submitting || uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {uploading ? 'Mengupload...' : 'Menyimpan...'}
                    </>
                  ) : (
                    'Update Produk'
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
