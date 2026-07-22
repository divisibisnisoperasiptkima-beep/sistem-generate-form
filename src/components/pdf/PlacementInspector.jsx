import { useState, useEffect } from 'react'
import usePdfStore from '@/stores/usePdfStore'
import useTemplateStore from '@/stores/useTemplateStore'
import Button from '@/components/ui/Button'
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Bold,
  Italic,
  Trash2,
  Copy,
  Layers,
  Sparkles,
  Maximize2,
  WrapText,
  Type,
  Palette,
  LayoutGrid
} from 'lucide-react'

const FONT_FAMILIES = [
  { label: 'Helvetica (Sans-Serif)', value: 'Helvetica' },
  { label: 'Times New Roman (Serif)', value: 'Times-Roman' },
  { label: 'Courier (Monospace)', value: 'Courier' },
]

const QUICK_COLORS = ['#000000', '#1e293b', '#2563eb', '#dc2626', '#16a34a', '#d97706', '#4f46e5', '#ffffff']

export default function PlacementInspector() {
  const { selectedFieldId, selectedPlacementId, setSelectedPlacementId, currentPage, snapToGrid, setSnapToGrid, gridSize, setGridSize } = usePdfStore()
  const { fields, placements, savePlacement, removePlacement, currentTemplate } = useTemplateStore()

  // Find targeted placement
  const currentPlacement = placements.find(
    (p) => (selectedPlacementId && p.id === selectedPlacementId) || (selectedFieldId && p.field_id === selectedFieldId && p.page === currentPage)
  )

  const field = fields.find((f) => f.id === (currentPlacement?.field_id || selectedFieldId))

  const [formData, setFormData] = useState({
    x: 0,
    y: 0,
    width: 150,
    height: 20,
    font_size: 12,
    font_family: 'Helvetica',
    font_color: '#000000',
    text_align: 'left',
    vertical_align: 'middle',
    font_style: 'normal',
    word_wrap: true,
    auto_fit_font: false,
    min_font_size: 8,
    max_font_size: 24,
    bg_color: '',
    border_color: '',
    border_width: 0,
    padding: 2,
    opacity: 1,
  })

  useEffect(() => {
    if (currentPlacement) {
      setFormData({
        x: currentPlacement.x || 0,
        y: currentPlacement.y || 0,
        width: currentPlacement.width || 150,
        height: currentPlacement.height || 20,
        font_size: currentPlacement.font_size || 12,
        font_family: currentPlacement.font_family || 'Helvetica',
        font_color: currentPlacement.font_color || '#000000',
        text_align: currentPlacement.text_align || 'left',
        vertical_align: currentPlacement.vertical_align || 'middle',
        font_style: currentPlacement.font_style || 'normal',
        word_wrap: currentPlacement.word_wrap ?? true,
        auto_fit_font: currentPlacement.auto_fit_font ?? false,
        min_font_size: currentPlacement.min_font_size || 8,
        max_font_size: currentPlacement.max_font_size || 24,
        bg_color: currentPlacement.bg_color || '',
        border_color: currentPlacement.border_color || '',
        border_width: currentPlacement.border_width || 0,
        padding: currentPlacement.padding || 2,
        opacity: currentPlacement.opacity ?? 1,
      })
    }
  }, [currentPlacement])

  if (!field) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-slate-700 font-semibold text-sm">
          <LayoutGrid className="w-4 h-4 text-blue-600" />
          <span>Canvas Grid & Controls</span>
        </div>

        <div className="space-y-3 text-xs">
          <label className="flex items-center justify-between cursor-pointer p-2 rounded-lg bg-slate-50 border border-slate-100 hover:bg-slate-100/80 transition-colors">
            <span className="text-slate-700 font-medium">Snap to Grid</span>
            <input
              type="checkbox"
              checked={snapToGrid}
              onChange={(e) => setSnapToGrid(e.target.checked)}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
            />
          </label>

          {snapToGrid && (
            <div>
              <div className="flex justify-between text-slate-500 mb-1">
                <span>Grid Size</span>
                <span className="font-semibold text-slate-700">{gridSize}px</span>
              </div>
              <input
                type="range"
                min="5"
                max="25"
                step="5"
                value={gridSize}
                onChange={(e) => setGridSize(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>
          )}
        </div>

        <div className="border-t border-slate-100 pt-4 text-center">
          <p className="text-xs text-slate-400">
            Click on a field in the PDF canvas or select a field from the left panel to edit its detailed placement settings.
          </p>
        </div>
      </div>
    )
  }

  const handleChange = (key, value) => {
    const updated = { ...formData, [key]: value }
    setFormData(updated)

    if (currentPlacement && currentTemplate) {
      savePlacement(currentTemplate.id, {
        ...currentPlacement,
        [key]: value,
      })
    }
  }

  const toggleFontStyle = (style) => {
    let current = formData.font_style || 'normal'
    let next = 'normal'
    if (style === 'bold') {
      if (current === 'normal') next = 'bold'
      else if (current === 'italic') next = 'bolditalic'
      else if (current === 'bold') next = 'normal'
      else if (current === 'bolditalic') next = 'italic'
    } else if (style === 'italic') {
      if (current === 'normal') next = 'italic'
      else if (current === 'bold') next = 'bolditalic'
      else if (current === 'italic') next = 'normal'
      else if (current === 'bolditalic') next = 'bold'
    }
    handleChange('font_style', next)
  }

  const isBold = formData.font_style === 'bold' || formData.font_style === 'bolditalic'
  const isItalic = formData.font_style === 'italic' || formData.font_style === 'bolditalic'

  const handleRemove = async () => {
    if (currentPlacement) {
      await removePlacement(currentPlacement.id)
      setSelectedPlacementId(null)
    }
  }

  const handleDuplicate = async () => {
    if (!currentPlacement || !currentTemplate) return
    await savePlacement(currentTemplate.id, {
      ...currentPlacement,
      id: undefined,
      x: currentPlacement.x + 15,
      y: currentPlacement.y + 15,
    })
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-4 max-h-[85vh] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
            {field.field_type}
          </span>
          <h3 className="font-bold text-slate-800 text-sm mt-1 truncate max-w-[180px]">
            {field.label || field.name}
          </h3>
        </div>
        {currentPlacement && (
          <div className="flex items-center gap-1">
            <button
              onClick={handleDuplicate}
              title="Duplicate Placement"
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
            >
              <Copy className="w-4 h-4" />
            </button>
            <button
              onClick={handleRemove}
              title="Delete Placement"
              className="p-1.5 hover:bg-red-50 rounded-lg text-red-500 transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {!currentPlacement && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
          Field is not placed on Page {currentPage} yet. Draw a box on the PDF canvas to place it.
        </div>
      )}

      {currentPlacement && (
        <>
          {/* Position & Size Inspector */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Maximize2 className="w-3.5 h-3.5 text-slate-400" />
              Position &amp; Geometry (pt)
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-[10px] text-slate-400">X Position</span>
                <input
                  type="number"
                  value={Math.round(formData.x)}
                  onChange={(e) => handleChange('x', Number(e.target.value))}
                  className="w-full px-2 py-1 border border-slate-200 rounded-lg text-slate-800 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-400">Y Position</span>
                <input
                  type="number"
                  value={Math.round(formData.y)}
                  onChange={(e) => handleChange('y', Number(e.target.value))}
                  className="w-full px-2 py-1 border border-slate-200 rounded-lg text-slate-800 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-400">Width</span>
                <input
                  type="number"
                  min="10"
                  value={Math.round(formData.width)}
                  onChange={(e) => handleChange('width', Math.max(10, Number(e.target.value)))}
                  className="w-full px-2 py-1 border border-slate-200 rounded-lg text-slate-800 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-400">Height</span>
                <input
                  type="number"
                  min="10"
                  value={Math.round(formData.height)}
                  onChange={(e) => handleChange('height', Math.max(10, Number(e.target.value)))}
                  className="w-full px-2 py-1 border border-slate-200 rounded-lg text-slate-800 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-3 space-y-3">
            {/* Typography Inspector */}
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Type className="w-3.5 h-3.5 text-slate-400" />
              Typography
            </label>

            <div className="space-y-2 text-xs">
              <div>
                <span className="text-[10px] text-slate-400">Font Family</span>
                <select
                  value={formData.font_family}
                  onChange={(e) => handleChange('font_family', e.target.value)}
                  className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-slate-800 focus:ring-1 focus:ring-blue-500 bg-white"
                >
                  {FONT_FAMILIES.map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2 items-center">
                <div>
                  <span className="text-[10px] text-slate-400">Font Size (pt)</span>
                  <input
                    type="number"
                    min="6"
                    max="72"
                    value={formData.font_size}
                    onChange={(e) => handleChange('font_size', Number(e.target.value))}
                    className="w-full px-2 py-1 border border-slate-200 rounded-lg text-slate-800 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="pt-4 flex gap-1">
                  <button
                    type="button"
                    onClick={() => toggleFontStyle('bold')}
                    className={`flex-1 py-1 rounded-lg border flex justify-center items-center cursor-pointer transition-colors ${
                      isBold ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                    title="Bold"
                  >
                    <Bold className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleFontStyle('italic')}
                    className={`flex-1 py-1 rounded-lg border flex justify-center items-center cursor-pointer transition-colors ${
                      isItalic ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                    title="Italic"
                  >
                    <Italic className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Color Picker & Presets */}
              <div>
                <span className="text-[10px] text-slate-400">Font Color</span>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="color"
                    value={formData.font_color || '#000000'}
                    onChange={(e) => handleChange('font_color', e.target.value)}
                    className="w-7 h-7 rounded border border-slate-200 cursor-pointer p-0.5"
                  />
                  <input
                    type="text"
                    value={formData.font_color}
                    onChange={(e) => handleChange('font_color', e.target.value)}
                    className="flex-1 px-2 py-1 border border-slate-200 rounded-lg text-slate-800 font-mono text-xs"
                  />
                </div>
                <div className="flex gap-1 mt-1.5">
                  {QUICK_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => handleChange('font_color', c)}
                      className="w-5 h-5 rounded-full border border-slate-300 transition-transform hover:scale-110 cursor-pointer"
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Alignment & Layout */}
          <div className="border-t border-slate-100 pt-3 space-y-3 text-xs">
            <label className="font-semibold text-slate-700 flex items-center gap-1.5">
              <WrapText className="w-3.5 h-3.5 text-slate-400" />
              Alignment &amp; Overflow
            </label>

            <div>
              <span className="text-[10px] text-slate-400 mb-1 block">Horizontal Align</span>
              <div className="flex gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                {[
                  { id: 'left', icon: AlignLeft },
                  { id: 'center', icon: AlignCenter },
                  { id: 'right', icon: AlignRight },
                  { id: 'justify', icon: AlignJustify },
                ].map(({ id, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => handleChange('text_align', id)}
                    className={`flex-1 py-1 rounded-md flex justify-center items-center transition-colors cursor-pointer ${
                      formData.text_align === id ? 'bg-white text-blue-600 shadow-sm font-bold' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 mb-1 block">Vertical Align</span>
              <div className="flex gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[11px]">
                {['top', 'middle', 'bottom'].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => handleChange('vertical_align', v)}
                    className={`flex-1 py-1 capitalize rounded-md transition-colors cursor-pointer ${
                      formData.vertical_align === v ? 'bg-white text-blue-600 shadow-sm font-semibold' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-slate-700">Word Wrap (Multiline)</span>
                <input
                  type="checkbox"
                  checked={formData.word_wrap}
                  onChange={(e) => handleChange('word_wrap', e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-slate-700">Auto-Fit Font Size</span>
                <input
                  type="checkbox"
                  checked={formData.auto_fit_font}
                  onChange={(e) => handleChange('auto_fit_font', e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                />
              </label>
            </div>
          </div>

          {/* Background & Border */}
          <div className="border-t border-slate-100 pt-3 space-y-3 text-xs">
            <label className="font-semibold text-slate-700 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-slate-400" />
              Box Fill &amp; Border
            </label>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[10px] text-slate-400">Background Fill</span>
                <div className="flex items-center gap-1 mt-1">
                  <input
                    type="color"
                    value={formData.bg_color || '#ffffff'}
                    onChange={(e) => handleChange('bg_color', e.target.value)}
                    className="w-6 h-6 rounded border border-slate-200 cursor-pointer p-0.5"
                  />
                  <button
                    type="button"
                    onClick={() => handleChange('bg_color', '')}
                    className="text-[10px] text-slate-500 underline hover:text-slate-800"
                  >
                    Clear
                  </button>
                </div>
              </div>
              <div>
                <span className="text-[10px] text-slate-400">Border Color</span>
                <div className="flex items-center gap-1 mt-1">
                  <input
                    type="color"
                    value={formData.border_color || '#000000'}
                    onChange={(e) => handleChange('border_color', e.target.value)}
                    className="w-6 h-6 rounded border border-slate-200 cursor-pointer p-0.5"
                  />
                  <button
                    type="button"
                    onClick={() => handleChange('border_color', '')}
                    className="text-[10px] text-slate-500 underline hover:text-slate-800"
                  >
                    None
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[10px] text-slate-400">Border Width (px)</span>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={formData.border_width}
                  onChange={(e) => handleChange('border_width', Number(e.target.value))}
                  className="w-full px-2 py-1 border border-slate-200 rounded-lg text-slate-800 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-400">Padding (pt)</span>
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={formData.padding}
                  onChange={(e) => handleChange('padding', Number(e.target.value))}
                  className="w-full px-2 py-1 border border-slate-200 rounded-lg text-slate-800 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
