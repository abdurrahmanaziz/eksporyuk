'use client'

import { useState } from 'react'
import { POST_BACKGROUNDS, BACKGROUND_CATEGORIES, PostBackground } from '@/lib/post-backgrounds'
import { Button } from '@/components/ui/button'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { X, Palette } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BackgroundSelectorProps {
  selectedBackground: PostBackground | null
  onSelect: (background: PostBackground | null) => void
  disabled?: boolean
}

export default function BackgroundSelector({
  selectedBackground,
  onSelect,
  disabled = false,
}: BackgroundSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState<string>('export')

  const handleSelect = (background: PostBackground) => {
    onSelect(background)
    setIsOpen(false)
  }

  const handleClear = () => {
    onSelect(null)
    setIsOpen(false)
  }

  const filteredBackgrounds = POST_BACKGROUNDS.filter(
    bg => bg.category === activeCategory
  )

  if (!isOpen) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(true)}
        disabled={disabled}
        className={cn(
          "flex items-center gap-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100",
          selectedBackground && "text-indigo-600 bg-indigo-50 hover:bg-indigo-100"
        )}
      >
        <Palette className="w-4 h-4" />
        <span className="text-sm">
          {selectedBackground ? 'Ganti Background' : 'Background'}
        </span>
      </Button>
    )
  }

  return (
    <div className="border rounded-lg bg-white shadow-sm p-3 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <Palette className="w-4 h-4" />
          Pilih Background
        </h4>
        <div className="flex items-center gap-2">
          {selectedBackground && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="text-xs text-red-500 hover:text-red-600 hover:bg-red-50 h-7 px-2"
            >
              Hapus
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
            className="h-7 w-7 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Category Tabs */}
      <Tabs value={activeCategory} onValueChange={setActiveCategory}>
        <TabsList className="w-full h-auto flex-wrap gap-1 bg-gray-100 p-1">
          {BACKGROUND_CATEGORIES.map((cat) => (
            <TabsTrigger
              key={cat.id}
              value={cat.id}
              className="text-xs px-2 py-1 data-[state=active]:bg-white"
            >
              {cat.icon} {cat.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {BACKGROUND_CATEGORIES.map((cat) => (
          <TabsContent key={cat.id} value={cat.id} className="mt-3">
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
              {POST_BACKGROUNDS.filter(bg => bg.category === cat.id).map((bg) => (
                <button
                  key={bg.id}
                  type="button"
                  onClick={() => handleSelect(bg)}
                  className={cn(
                    "w-full aspect-square rounded-lg transition-all duration-200 hover:scale-105 hover:ring-2 hover:ring-indigo-400",
                    selectedBackground?.id === bg.id && "ring-2 ring-indigo-600 ring-offset-2"
                  )}
                  style={bg.style}
                  title={bg.name}
                >
                  <span className="sr-only">{bg.name}</span>
                </button>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Preview */}
      {selectedBackground && (
        <div className="pt-2 border-t">
          <p className="text-xs text-gray-500 mb-2">Preview:</p>
          <div
            className="rounded-lg p-4 min-h-[80px] flex items-center justify-center"
            style={selectedBackground.style}
          >
            <p
              className="text-center font-medium"
              style={{ color: selectedBackground.textColor }}
            >
              Contoh teks postingan Anda
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

// Compact version for inline use
export function BackgroundSelectorInline({
  selectedBackground,
  onSelect,
  disabled = false,
}: BackgroundSelectorProps) {
  return (
    <ScrollArea className="w-full whitespace-nowrap">
      <div className="flex gap-2 pb-2">
        {/* Clear button */}
        <button
          type="button"
          onClick={() => onSelect(null)}
          disabled={disabled}
          className={cn(
            "flex-shrink-0 w-8 h-8 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:border-gray-400 hover:text-gray-500 transition-colors",
            !selectedBackground && "border-indigo-500 text-indigo-500"
          )}
          title="Tanpa background"
        >
          <X className="w-4 h-4" />
        </button>
        
        {/* Background options */}
        {POST_BACKGROUNDS.slice(0, 12).map((bg) => (
          <button
            key={bg.id}
            type="button"
            onClick={() => onSelect(bg)}
            disabled={disabled}
            className={cn(
              "flex-shrink-0 w-8 h-8 rounded-lg transition-all hover:scale-110",
              selectedBackground?.id === bg.id && "ring-2 ring-indigo-600 ring-offset-1"
            )}
            style={bg.style}
            title={bg.name}
          />
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  )
}
