"use client"

import * as React from "react"
import { Upload, X } from "lucide-react"
import { Button } from "./button"
import { cn } from "@/lib/utils"

interface FileUploadProps {
  value?: string
  onChange: (file: File | null) => void
  accept?: string
  maxSize?: number // in MB
  className?: string
  label?: string
}

export function FileUpload({
  value,
  onChange,
  accept = "image/*",
  maxSize = 5,
  className,
  label = "Upload File"
}: FileUploadProps) {
  const [preview, setPreview] = React.useState<string | null>(value || null)
  const [error, setError] = React.useState<string | null>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    if (value) {
      setPreview(value)
    }
  }, [value])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      setError(`File size must be less than ${maxSize}MB`)
      return
    }

    setError(null)

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    onChange(file)
  }

  const handleRemove = () => {
    setPreview(null)
    setError(null)
    onChange(null)
    if (inputRef.current) {
      inputRef.current.value = ""
    }
  }

  return (
    <div className={cn("space-y-2", className)}>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
        id="file-upload"
      />

      {preview ? (
        <div className="relative w-full h-32 border rounded-lg overflow-hidden bg-muted">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-full object-cover"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2"
            onClick={handleRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <label
          htmlFor="file-upload"
          className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
        >
          <Upload className="h-8 w-8 text-muted-foreground mb-2" />
          <span className="text-sm text-muted-foreground">{label}</span>
          <span className="text-xs text-muted-foreground">Max {maxSize}MB</span>
        </label>
      )}

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  )
}
