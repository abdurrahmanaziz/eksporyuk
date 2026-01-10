"use client";

import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, X, Maximize2 } from "lucide-react";
import Image from "next/image";
import { Slider } from "@/components/ui/slider";

interface FileUploadProps {
  label: string;
  value?: string;
  onChange: (value: string) => void;
  accept?: string;
  type?: "logo" | "banner";
  maxSize?: number; // in MB
  previewWidth?: number;
  previewHeight?: number;
  allowResize?: boolean;
}

export default function FileUpload({
  label,
  value,
  onChange,
  accept = "image/*",
  type = "logo",
  maxSize = 5,
  previewWidth = 200,
  previewHeight = 100,
  allowResize = false
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState("");
  const [urlInput, setUrlInput] = useState(value || "");
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [logoSize, setLogoSize] = useState([100]); // Logo size percentage
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    setError("");
    setIsUploading(true);
    
    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      setError(`File size must be less than ${maxSize}MB`);
      setIsUploading(false);
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError("Please select a valid image file");
      setIsUploading(false);
      return;
    }

    try {
      // Create FormData
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);

      // Upload file
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      if (!data.url) {
        throw new Error('No URL returned from upload');
      }

      onChange(data.url);
      setUrlInput(data.url);
    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      onChange(urlInput.trim());
      setShowUrlInput(false);
    }
  };

  const handleRemove = () => {
    onChange("");
    setUrlInput("");
    setShowUrlInput(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const getSizeStyle = () => {
    if (type === "logo" && allowResize) {
      const scale = logoSize[0] / 100;
      return {
        transform: `scale(${scale})`,
        transformOrigin: 'center',
        maxWidth: `${previewWidth * scale}px`,
        maxHeight: `${previewHeight * scale}px`
      };
    }
    return {};
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">{label}</Label>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowUrlInput(!showUrlInput)}
            className="text-xs"
          >
            URL Input
          </Button>
          {value && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRemove}
              className="text-xs text-red-600 hover:text-red-700"
            >
              <X className="w-3 h-3 mr-1" />
              Remove
            </Button>
          )}
        </div>
      </div>

      {/* URL Input */}
      {showUrlInput && (
        <div className="flex gap-2">
          <Input
            type="url"
            placeholder="Masukkan URL gambar..."
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            className="flex-1"
          />
          <Button
            type="button"
            onClick={handleUrlSubmit}
            size="sm"
            disabled={!urlInput.trim()}
          >
            Apply
          </Button>
        </div>
      )}

      {/* File Upload Area */}
      <div
        className={`
          border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer
          ${isDragging ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${isUploading ? 'pointer-events-none opacity-50' : ''}
        `}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileInputChange}
          className="hidden"
        />

        {isUploading ? (
          <div className="space-y-2">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto" />
            <p className="text-sm text-gray-600">Uploading...</p>
            {uploadProgress > 0 && (
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <Upload className="w-8 h-8 text-gray-400 mx-auto" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-700">
                Klik untuk upload atau drag & drop
              </p>
              <p className="text-xs text-gray-500">
                {type === 'logo' ? 'Logo' : 'Banner'} • Max {maxSize}MB • {accept}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-2 rounded border">
          {error}
        </div>
      )}

      {/* Preview */}
      {value && (
        <div className="space-y-4">
          {/* Logo Size Control */}
          {type === "logo" && allowResize && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Maximize2 className="w-4 h-4" />
                <Label className="text-sm">Logo Size: {logoSize[0]}%</Label>
              </div>
              <Slider
                value={logoSize}
                onValueChange={setLogoSize}
                min={50}
                max={200}
                step={10}
                className="w-full"
              />
            </div>
          )}

          {/* Image Preview */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <Label className="text-xs text-gray-500 mb-2 block">Preview:</Label>
            <div className="flex justify-center">
              <div style={getSizeStyle()}>
                <Image
                  src={value}
                  alt={`${label} preview`}
                  width={previewWidth}
                  height={previewHeight}
                  className="rounded border object-contain"
                  style={{ 
                    maxWidth: previewWidth,
                    maxHeight: previewHeight,
                  }}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "/api/placeholder/200/100";
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}