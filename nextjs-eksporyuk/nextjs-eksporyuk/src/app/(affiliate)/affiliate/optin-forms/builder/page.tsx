'use client'

import { useState, useRef } from 'react'
import { DndContext, DragOverlay, closestCenter, PointerSensor, useSensor, useSensors, DragStartEvent, DragEndEvent } from '@dnd-kit/core'
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Type, Mail, Phone, ChevronDown, CheckSquare, Image as ImageIcon, 
  Minus, Timer, AlignLeft, GripVertical, Upload, Eye, Save, ArrowLeft,
  Info, Settings, Lock, CheckCircle, Trash2, MoveUp, MoveDown, Copy, Undo, Redo
} from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface FormElement {
  id: string
  type: 'text' | 'email' | 'phone' | 'dropdown' | 'checkbox' | 'heading' | 'paragraph' | 'image' | 'divider' | 'countdown'
  label?: string
  placeholder?: string
  required?: boolean
  icon?: boolean
  content?: string
  imageFile?: File
  imageUrl?: string
  level?: number
  options?: string[]
  helperText?: string
  validateEmail?: boolean
}

// Sortable Element Component
function SortableFormElement({ element, index, isSelected, onClick, onDelete, onMoveUp, onMoveDown }: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ 
    id: element.id,
    data: { type: 'canvas-element', element }
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const renderContent = () => {
    switch (element.type) {
      case 'heading':
        return (
          <h2 className={`font-bold text-slate-900 leading-tight ${
            element.level === 1 ? 'text-2xl' : element.level === 2 ? 'text-xl' : 'text-lg'
          }`}>
            {element.content || 'Heading'}
          </h2>
        )

      case 'paragraph':
        return (
          <p className="text-slate-600 text-sm leading-relaxed">
            {element.content || 'Paragraph text'}
          </p>
        )

      case 'countdown':
        return (
          <div className="flex gap-2 justify-center">
            {['01', '12', '45', '30'].map((val, i) => (
              <div key={i} className="flex flex-col items-center bg-slate-100 rounded p-1.5 min-w-[44px]">
                <span className="text-lg font-bold text-slate-900 font-mono leading-none">{val}</span>
                <span className="text-[9px] text-slate-500 uppercase mt-0.5">
                  {['Days', 'Hrs', 'Min', 'Sec'][i]}
                </span>
              </div>
            ))}
          </div>
        )

      case 'text':
      case 'email':
      case 'phone':
        return (
          <>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex justify-between">
              {element.label || 'Label'} {element.required && <span className="text-red-500">*</span>}
            </label>
            <div className="relative">
              {element.icon && element.type === 'email' && (
                <Mail className="absolute left-3 top-2.5 text-slate-400 w-4 h-4" />
              )}
              <input
                type={element.type}
                placeholder={element.placeholder || 'Placeholder'}
                disabled
                className={`w-full ${element.icon ? 'pl-9' : 'px-3'} pr-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm pointer-events-none text-slate-900`}
              />
            </div>
          </>
        )

      case 'image':
        return element.imageUrl ? (
          <img src={element.imageUrl} alt="" className="w-full h-32 object-cover rounded" />
        ) : (
          <div className="w-full h-32 bg-slate-100 rounded flex items-center justify-center">
            <ImageIcon className="w-8 h-8 text-slate-400" />
          </div>
        )

      case 'divider':
        return <div className="border-t border-slate-200"></div>

      default:
        return null
    }
  }

  const wrapperClass = element.type === 'text' || element.type === 'email' || element.type === 'phone' 
    ? 'p-3 -mx-3' 
    : element.type === 'divider' 
    ? 'py-2' 
    : 'p-2 -mx-2'

  return (
    <div 
      ref={setNodeRef}
      style={style}
      onClick={onClick}
      className={`group relative ${wrapperClass} rounded border cursor-pointer transition-all ${
        isSelected 
          ? 'border-2 border-blue-500 bg-blue-50/50 ring-2 ring-blue-500/20' 
          : 'border border-transparent hover:border-blue-300 hover:bg-blue-50/30'
      }`}
    >
      {/* Drag Handle */}
      <div
        {...listeners}
        {...attributes}
        className="absolute right-0 top-0 hidden group-hover:flex gap-1 -translate-y-1/2 translate-x-2 bg-white shadow-sm border border-slate-200 rounded-lg p-1 z-10 cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="w-4 h-4 text-slate-400" />
      </div>

      {renderContent()}

      {/* Action Buttons */}
      {isSelected && (
        <div className="absolute -right-3 top-1/2 -translate-y-1/2 translate-x-full flex flex-col gap-1 pl-2 z-10">
          <button 
            onClick={(e) => { e.stopPropagation(); onMoveUp(); }} 
            className="size-7 flex items-center justify-center bg-white border border-slate-200 shadow-sm rounded text-slate-500 hover:text-blue-600"
          >
            <MoveUp className="w-4 h-4" />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onMoveDown(); }} 
            className="size-7 flex items-center justify-center bg-white border border-slate-200 shadow-sm rounded text-slate-500 hover:text-blue-600"
          >
            <MoveDown className="w-4 h-4" />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(); }} 
            className="size-7 flex items-center justify-center bg-white border border-slate-200 shadow-sm rounded text-red-500 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}

// Draggable Component Item
function DraggableComponent({ type, icon: Icon, label }: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ 
    id: `component-${type}`,
    data: { type: 'new-component', componentType: type }
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="group cursor-grab active:cursor-grabbing flex flex-col items-center gap-2 p-3 rounded-xl border border-slate-200 bg-white hover:border-blue-500 hover:shadow-md hover:shadow-blue-500/5 transition-all"
    >
      <Icon className="text-slate-600 group-hover:text-blue-600 w-5 h-5" />
      <span className="text-xs font-medium text-slate-600">{label}</span>
    </div>
  )
}

export default function OptinFormBuilderPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [formName] = useState('Summer Lead Gen')
  const [leadMagnetName] = useState('Ebook - Affiliate Marketing 101')
  const [coverImageUrl, setCoverImageUrl] = useState('https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=400')
  const [elements, setElements] = useState<FormElement[]>([
    { id: '1', type: 'heading', content: 'Master Affiliate Marketing in 30 Days', level: 1 },
    { id: '2', type: 'paragraph', content: 'Download this free comprehensive guide to start generating passive income. Learn the secrets top affiliates don\'t want you to know.' },
    { id: '3', type: 'countdown' },
    { id: '4', type: 'text', label: 'Full Name', placeholder: 'John Doe', required: false },
    { id: '5', type: 'email', label: 'Email Address', placeholder: 'you@company.com', required: true, icon: true, validateEmail: true },
  ])
  const [selectedElement, setSelectedElement] = useState<FormElement | null>(elements[1])
  const [activeTab, setActiveTab] = useState<'field' | 'style'>('field')
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const componentTypes = [
    { type: 'text', icon: Type, label: 'Text Input', category: 'input' },
    { type: 'email', icon: Mail, label: 'Email', category: 'input' },
    { type: 'phone', icon: Phone, label: 'Phone/WA', category: 'input' },
    { type: 'dropdown', icon: ChevronDown, label: 'Dropdown', category: 'input' },
    { type: 'checkbox', icon: CheckSquare, label: 'Checkbox', category: 'input' },
    { type: 'heading', icon: Type, label: 'Heading', category: 'content' },
    { type: 'paragraph', icon: AlignLeft, label: 'Paragraph', category: 'content' },
    { type: 'image', icon: ImageIcon, label: 'Image/Cover', category: 'content' },
    { type: 'divider', icon: Minus, label: 'Divider', category: 'content' },
    { type: 'countdown', icon: Timer, label: 'Countdown', category: 'content' },
  ]

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    
    if (!over) {
      setActiveId(null)
      return
    }

    const activeData = active.data.current
    const overData = over.data.current

    // Dragging new component to canvas
    if (activeData?.type === 'new-component') {
      const componentType = activeData.componentType
      const newElement: FormElement = {
        id: Date.now().toString(),
        type: componentType,
        label: componentType === 'text' ? 'Text Input' : componentType === 'email' ? 'Email Address' : componentType === 'phone' ? 'Phone Number' : '',
        placeholder: '',
        required: false,
        icon: componentType === 'email',
        validateEmail: componentType === 'email',
      }
      
      setElements([...elements, newElement])
      setSelectedElement(newElement)
      toast.success('Element added')
    }
    // Reordering elements
    else if (activeData?.type === 'canvas-element' && overData?.type === 'canvas-element') {
      const oldIndex = elements.findIndex(el => el.id === active.id)
      const newIndex = elements.findIndex(el => el.id === over.id)
      
      if (oldIndex !== -1 && newIndex !== -1) {
        setElements(arrayMove(elements, oldIndex, newIndex))
      }
    }

    setActiveId(null)
  }

  const handleCoverImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      setCoverImageUrl(url)
      toast.success('Cover image uploaded')
    }
  }

  const handleDeleteElement = (id: string) => {
    setElements(elements.filter(el => el.id !== id))
    if (selectedElement?.id === id) {
      setSelectedElement(null)
    }
    toast.success('Element deleted')
  }

  const handleMoveElement = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= elements.length) return
    
    setElements(arrayMove(elements, index, newIndex))
  }

  const handleUpdateElement = (updates: Partial<FormElement>) => {
    if (!selectedElement) return
    
    setElements(elements.map(el => 
      el.id === selectedElement.id ? { ...el, ...updates } : el
    ))
    setSelectedElement({ ...selectedElement, ...updates })
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && selectedElement) {
      const url = URL.createObjectURL(file)
      handleUpdateElement({ imageFile: file, imageUrl: url })
      toast.success('Image uploaded')
    }
  }

  const handleSave = async () => {
    try {
      const payload = {
        formName,
        headline: elements.find(e => e.type === 'heading')?.content || '',
        description: elements.find(e => e.type === 'paragraph')?.content || '',
        submitButtonText: 'Download Now For Free',
        successMessage: 'Thank you! Check your email.',
        redirectType: 'message',
        collectName: !!elements.find(e => e.type === 'text'),
        collectEmail: !!elements.find(e => e.type === 'email'),
        collectPhone: !!elements.find(e => e.type === 'phone'),
        showCountdown: !!elements.find(e => e.type === 'countdown'),
        elements: JSON.stringify(elements)
      }

      const res = await fetch('/api/affiliate/optin-forms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        toast.success('Form saved successfully!')
        router.push('/affiliate/optin-forms')
      } else {
        const error = await res.json()
        toast.error(error.error || 'Failed to save form')
      }
    } catch (error) {
      console.error('Save error:', error)
      toast.error('Failed to save form')
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col h-screen bg-slate-50">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-20 shadow-sm">
          <div className="flex items-center gap-6">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div className="h-8 w-px bg-slate-200"></div>
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                <AlignLeft className="w-5 h-5" />
              </div>
              <div>
                <h1 className="font-bold text-lg leading-tight text-slate-900">Opt-in Form Builder</h1>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span>Campaigns</span>
                  <span>›</span>
                  <span>{formName}</span>
                </div>
              </div>
            </div>
            <div className="h-8 w-px bg-slate-200 mx-2"></div>
            <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50 flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
              {leadMagnetName}
            </Badge>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-6 mr-4 border-r border-slate-200 pr-6">
              <div className="flex flex-col items-end">
                <span className="text-xs text-slate-500 font-medium">Est. Conversion</span>
                <div className="flex items-center gap-1 text-green-600 font-bold text-sm">
                  12.5% <span className="text-xs">↗</span>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-xs text-slate-500 font-medium">Total Leads</span>
                <span className="font-bold text-slate-900 text-sm">842</span>
              </div>
            </div>
            <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">Draft</Badge>
            <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-700">
              <Copy className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm">
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </Button>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 shadow-sm" onClick={handleSave}>
              Publish
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Sidebar - Components */}
          <aside className="w-80 bg-white border-r border-slate-200 flex flex-col shrink-0 overflow-y-auto">
            <div className="p-5 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-1">Komponen Form</h2>
              <p className="text-xs text-slate-500">Drag items to the canvas</p>
            </div>
            <div className="p-4 space-y-6">
              {/* Input Fields */}
              <div>
                <h3 className="text-xs font-semibold text-slate-400 mb-3 px-1">Input Fields</h3>
                <SortableContext items={componentTypes.filter(c => c.category === 'input').map(c => `component-${c.type}`)} strategy={verticalListSortingStrategy}>
                  <div className="grid grid-cols-2 gap-3">
                    {componentTypes.filter(c => c.category === 'input').map(comp => (
                      <DraggableComponent key={comp.type} {...comp} />
                    ))}
                  </div>
                </SortableContext>
              </div>

              {/* Content & Layout */}
              <div>
                <h3 className="text-xs font-semibold text-slate-400 mb-3 px-1">Content & Layout</h3>
                <SortableContext items={componentTypes.filter(c => c.category === 'content').map(c => `component-${c.type}`)} strategy={verticalListSortingStrategy}>
                  <div className="grid grid-cols-2 gap-3">
                    {componentTypes.filter(c => c.category === 'content').map(comp => (
                      <DraggableComponent key={comp.type} {...comp} />
                    ))}
                  </div>
                </SortableContext>
              </div>
            </div>

            {/* Pro Tip */}
            <div className="mt-auto p-4 bg-slate-50 border-t border-slate-200">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 text-blue-600 p-2 rounded-full">
                  <Info className="w-4 h-4" />
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Pro tip: Use a catchy headline to increase your conversion rate by up to 20%.
                </p>
              </div>
            </div>
          </aside>

          {/* Center - Mobile Preview Canvas */}
          <main className="flex-1 bg-slate-100 overflow-y-auto flex items-start justify-center p-8 relative">
            {/* Grid Background */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
              backgroundImage: 'radial-gradient(#64748b 1px, transparent 1px)',
              backgroundSize: '24px 24px'
            }}></div>

            {/* Mobile Frame */}
            <div className="relative w-full max-w-[375px] my-4 shadow-2xl shadow-slate-300 rounded-[40px] border-[8px] border-slate-900 bg-slate-900 overflow-hidden flex flex-col h-[750px] z-10">
              {/* Status Bar */}
              <div className="h-6 bg-white w-full flex justify-between items-center px-6 pt-2 shrink-0 select-none z-20">
                <span className="text-[10px] font-bold text-slate-900">9:41</span>
                <div className="flex gap-1.5 text-[10px]">
                  <span>📶</span><span>📶</span><span>🔋</span>
                </div>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 bg-white overflow-y-auto scrollbar-hide">
                {/* Cover Image */}
                <div 
                  className="group relative w-full h-40 bg-slate-200 hover:ring-2 hover:ring-blue-500 cursor-pointer transition-all"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {coverImageUrl && (
                    <img src={coverImageUrl} alt="" className="w-full h-full object-cover" />
                  )}
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <span className="bg-white/90 text-slate-900 text-xs px-2 py-1 rounded shadow-sm font-medium">
                      Edit Cover
                    </span>
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleCoverImageUpload}
                />

                {/* Form Elements - Droppable Area */}
                <SortableContext items={elements.map(e => e.id)} strategy={verticalListSortingStrategy}>
                  <div className="flex flex-col flex-1 p-6 gap-4">
                    {elements.map((element, index) => (
                      <SortableFormElement
                        key={element.id}
                        element={element}
                        index={index}
                        isSelected={selectedElement?.id === element.id}
                        onClick={() => setSelectedElement(element)}
                        onDelete={() => handleDeleteElement(element.id)}
                        onMoveUp={() => handleMoveElement(index, 'up')}
                        onMoveDown={() => handleMoveElement(index, 'down')}
                      />
                    ))}
                  </div>
                </SortableContext>

                {/* Submit Button */}
                <div className="mt-auto p-6 bg-white border-t border-slate-100 sticky bottom-0 z-10">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-500/30">
                    Download Now For Free
                  </Button>
                  <p className="text-[10px] text-center text-slate-400 mt-3 flex items-center justify-center gap-1">
                    <Lock className="w-3 h-3" /> 100% Secure. No Spam.
                  </p>
                </div>
              </div>
            </div>

            {/* Floating Action Buttons */}
            <div className="absolute bottom-8 right-8 flex flex-col gap-2 z-20">
              <button className="size-10 rounded-full bg-white shadow-lg shadow-slate-200 flex items-center justify-center text-slate-600 hover:text-blue-600 transition-colors border border-slate-100">
                <Undo className="w-5 h-5" />
              </button>
              <button className="size-10 rounded-full bg-white shadow-lg shadow-slate-200 flex items-center justify-center text-slate-600 hover:text-blue-600 transition-colors border border-slate-100">
                <Redo className="w-5 h-5" />
              </button>
            </div>
          </main>

          {/* Right Sidebar - Settings */}
          <aside className="w-80 bg-white border-l border-slate-200 flex flex-col shrink-0">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex flex-col h-full">
              <div className="flex border-b border-slate-200">
                <TabsList className="grid grid-cols-2 w-full rounded-none border-0 bg-transparent">
                  <TabsTrigger 
                    value="field" 
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                  >
                    Field Settings
                  </TabsTrigger>
                  <TabsTrigger 
                    value="style"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                  >
                    Style
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="flex-1 overflow-y-auto">
                <TabsContent value="field" className="p-5 space-y-6 mt-0">
                  {selectedElement ? (
                    <>
                      {/* Element Info */}
                      <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                        <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                          {selectedElement.type === 'email' && <Mail className="w-5 h-5" />}
                          {selectedElement.type === 'text' && <Type className="w-5 h-5" />}
                          {selectedElement.type === 'heading' && <Type className="w-5 h-5" />}
                          {selectedElement.type === 'paragraph' && <AlignLeft className="w-5 h-5" />}
                          {selectedElement.type === 'countdown' && <Timer className="w-5 h-5" />}
                          {selectedElement.type === 'image' && <ImageIcon className="w-5 h-5" />}
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-slate-900">
                            {selectedElement.type === 'email' ? 'Email Input' : 
                             selectedElement.type === 'text' ? 'Text Input' :
                             selectedElement.type === 'heading' ? 'Heading' :
                             selectedElement.type === 'paragraph' ? 'Paragraph' :
                             selectedElement.type === 'countdown' ? 'Countdown Timer' :
                             selectedElement.type === 'image' ? 'Image' : selectedElement.type}
                          </h3>
                          <p className="text-xs text-slate-500">ID: {selectedElement.id}</p>
                        </div>
                      </div>

                      {/* Settings based on type */}
                      {(selectedElement.type === 'text' || selectedElement.type === 'email' || selectedElement.type === 'phone') && (
                        <div className="space-y-4">
                          <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-slate-700">Label Text</Label>
                            <Input
                              value={selectedElement.label || ''}
                              onChange={(e) => handleUpdateElement({ label: e.target.value })}
                              className="bg-slate-50 border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-slate-700">Placeholder</Label>
                            <Input
                              value={selectedElement.placeholder || ''}
                              onChange={(e) => handleUpdateElement({ placeholder: e.target.value })}
                              className="bg-slate-50 border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-slate-700">
                              Helper Text <span className="text-slate-400 font-normal">(Optional)</span>
                            </Label>
                            <Input
                              value={selectedElement.helperText || ''}
                              onChange={(e) => handleUpdateElement({ helperText: e.target.value })}
                              placeholder="e.g. We'll never share your email."
                              className="bg-slate-50 border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            />
                          </div>
                          <div className="pt-2 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-slate-700">Required Field</span>
                              <Switch
                                checked={selectedElement.required || false}
                                onCheckedChange={(checked) => handleUpdateElement({ required: checked })}
                              />
                            </div>
                            {selectedElement.type === 'email' && (
                              <div className="flex items-center justify-between">
                                <div className="flex flex-col">
                                  <span className="text-sm text-slate-700">Validate Email</span>
                                  <span className="text-[10px] text-slate-400">Check for valid format</span>
                                </div>
                                <Switch
                                  checked={selectedElement.validateEmail || false}
                                  onCheckedChange={(checked) => handleUpdateElement({ validateEmail: checked })}
                                />
                              </div>
                            )}
                          </div>

                          {selectedElement.type === 'email' && (
                            <div className="pt-4 border-t border-slate-100">
                              <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                                  Icon
                                  <Info className="w-3 h-3 text-slate-400" />
                                </Label>
                                <div className="flex gap-2">
                                  <button 
                                    onClick={() => handleUpdateElement({ icon: true })}
                                    className={`flex-1 py-2 px-3 border rounded-lg text-sm flex items-center justify-center gap-2 transition-colors ${
                                      selectedElement.icon 
                                        ? 'border-blue-500 bg-blue-50 text-blue-600'
                                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                                    }`}
                                  >
                                    <Mail className="w-4 h-4" /> Mail
                                  </button>
                                  <button 
                                    onClick={() => handleUpdateElement({ icon: false })}
                                    className={`flex-1 py-2 px-3 border rounded-lg text-sm flex items-center justify-center transition-colors ${
                                      !selectedElement.icon 
                                        ? 'border-blue-500 bg-blue-50 text-blue-600'
                                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                                    }`}
                                  >
                                    None
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {selectedElement.type === 'heading' && (
                        <div className="space-y-4">
                          <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-slate-700">Heading Text</Label>
                            <Textarea
                              value={selectedElement.content || ''}
                              onChange={(e) => handleUpdateElement({ content: e.target.value })}
                              rows={3}
                              className="bg-slate-50 border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-slate-700">Heading Level</Label>
                            <Select value={String(selectedElement.level || 1)} onValueChange={(v) => handleUpdateElement({ level: Number(v) })}>
                              <SelectTrigger className="bg-slate-50 border-slate-200">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="1">H1</SelectItem>
                                <SelectItem value="2">H2</SelectItem>
                                <SelectItem value="3">H3</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      )}

                      {selectedElement.type === 'paragraph' && (
                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold text-slate-700">Paragraph Text</Label>
                          <Textarea
                            value={selectedElement.content || ''}
                            onChange={(e) => handleUpdateElement({ content: e.target.value })}
                            rows={5}
                            className="bg-slate-50 border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                          />
                        </div>
                      )}

                      {selectedElement.type === 'image' && (
                        <div className="space-y-4">
                          <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-slate-700">Upload Image</Label>
                            <div className="border-2 border-dashed border-slate-200 rounded-lg p-4 text-center hover:border-blue-500 transition-colors">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="hidden"
                                id="element-image-upload"
                              />
                              <label htmlFor="element-image-upload" className="cursor-pointer">
                                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                                <p className="text-xs text-slate-600">Click to upload image</p>
                                <p className="text-[10px] text-slate-400 mt-1">PNG, JPG up to 10MB</p>
                              </label>
                            </div>
                          </div>
                          {selectedElement.imageUrl && (
                            <div className="space-y-1.5">
                              <Label className="text-xs font-semibold text-slate-700">Preview</Label>
                              <img src={selectedElement.imageUrl} alt="" className="w-full h-32 object-cover rounded-lg border border-slate-200" />
                            </div>
                          )}
                        </div>
                      )}

                      {/* Delete Button */}
                      <div className="pt-4 border-t border-slate-200">
                        <Button
                          variant="outline"
                          className="w-full border-red-200 text-red-600 hover:bg-red-50"
                          onClick={() => handleDeleteElement(selectedElement.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Field
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-12">
                      <Settings className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                      <p className="text-sm text-slate-500">Select an element to edit its settings</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="style" className="p-5 space-y-4 mt-0">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">Primary Color</Label>
                    <Input type="color" defaultValue="#258cf4" className="h-10" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">Secondary Color</Label>
                    <Input type="color" defaultValue="#64748b" className="h-10" />
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </aside>
        </div>
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeId ? (
          <div className="opacity-50 bg-white p-3 rounded-lg shadow-lg border border-blue-500">
            Dragging...
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
