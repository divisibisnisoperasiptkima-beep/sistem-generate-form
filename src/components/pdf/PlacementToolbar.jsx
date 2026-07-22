import { useState } from 'react'
import usePdfStore from '@/stores/usePdfStore'
import useTemplateStore from '@/stores/useTemplateStore'
import useToastStore from '@/stores/useToastStore'
import { detectPdfPlaceholders } from '@/lib/pdfAutoDetect'
import {
  Wand2,
  Grid,
  ZoomIn,
  ZoomOut,
  Eye,
  Edit3,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
  Copy,
  ClipboardCheck,
} from 'lucide-react'

export default function PlacementToolbar() {
  const {
    pdfDocument,
    scale,
    setScale,
    snapToGrid,
    setSnapToGrid,
    gridSize,
    setGridSize,
    selectedPlacementId,
    previewMode,
    setPreviewMode,
    currentPage,
  } = usePdfStore()

  const { currentTemplate, fields, placements, savePlacement } = useTemplateStore()
  const addToast = useToastStore((s) => s.addToast)

  const [detecting, setDetecting] = useState(false)
  const [copiedStyle, setCopiedStyle] = useState(null)

  const activePlacement = placements.find((p) => p.id === selectedPlacementId)

  const handleAutoDetect = async () => {
    if (!pdfDocument || !currentTemplate || fields.length === 0) {
      addToast('Please upload a PDF and define fields first', 'warning')
      return
    }
    setDetecting(true)
    try {
      const detected = await detectPdfPlaceholders(pdfDocument, fields)
      if (detected.length === 0) {
        addToast('No matching {{field_name}} placeholders found in PDF text layer', 'info')
      } else {
        let addedCount = 0
        for (const p of detected) {
          await savePlacement(currentTemplate.id, p)
          addedCount++
        }
        addToast(`Successfully auto-detected & placed ${addedCount} fields!`, 'success')
      }
    } catch (err) {
      console.error('Auto-detection error:', err)
      addToast('Failed to auto-detect fields from PDF text', 'error')
    } finally {
      setDetecting(false)
    }
  }

  const handleAlign = (type) => {
    if (!activePlacement || !currentTemplate) return
    let updates = {}
    if (type === 'left') updates = { x: 20 }
    else if (type === 'center') updates = { x: 200 }
    else if (type === 'right') updates = { x: 400 }
    else if (type === 'top') updates = { y: 20 }
    else if (type === 'middle') updates = { y: 300 }
    else if (type === 'bottom') updates = { y: 600 }

    savePlacement(currentTemplate.id, {
      ...activePlacement,
      ...updates,
    })
  }

  const handleCopyStyle = () => {
    if (!activePlacement) return
    setCopiedStyle({
      font_family: activePlacement.font_family,
      font_size: activePlacement.font_size,
      font_color: activePlacement.font_color,
      font_style: activePlacement.font_style,
      text_align: activePlacement.text_align,
      vertical_align: activePlacement.vertical_align,
      word_wrap: activePlacement.word_wrap,
      auto_fit_font: activePlacement.auto_fit_font,
      bg_color: activePlacement.bg_color,
      border_color: activePlacement.border_color,
      border_width: activePlacement.border_width,
      padding: activePlacement.padding,
    })
    addToast('Placement style copied to clipboard', 'info')
  }

  const handlePasteStyle = () => {
    if (!activePlacement || !copiedStyle || !currentTemplate) return
    savePlacement(currentTemplate.id, {
      ...activePlacement,
      ...copiedStyle,
    })
    addToast('Style applied to selected placement', 'success')
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-2 shadow-sm flex flex-wrap items-center justify-between gap-2 text-xs">
      {/* Mode Switcher */}
      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
        <button
          onClick={() => setPreviewMode(false)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
            !previewMode ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>Editor</span>
        </button>
        <button
          onClick={() => setPreviewMode(true)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
            previewMode ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Live Preview</span>
        </button>
      </div>

      {/* Auto-Detect Wizard */}
      <button
        onClick={handleAutoDetect}
        disabled={detecting || !pdfDocument}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-lg shadow-sm hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 transition-all cursor-pointer"
        title="Automatically detect {{field_name}} placeholders in PDF"
      >
        <Wand2 className={`w-3.5 h-3.5 ${detecting ? 'animate-spin' : ''}`} />
        <span>{detecting ? 'Detecting...' : 'Auto-Detect Fields'}</span>
      </button>

      {/* Alignment & Style Copy/Paste */}
      {activePlacement && (
        <div className="flex items-center gap-1 border-x border-slate-200 px-2">
          <button
            onClick={() => handleAlign('left')}
            className="p-1.5 rounded hover:bg-slate-100 text-slate-600 transition-colors"
            title="Align Left Margin"
          >
            <AlignLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleAlign('center')}
            className="p-1.5 rounded hover:bg-slate-100 text-slate-600 transition-colors"
            title="Center Horizontally"
          >
            <AlignCenter className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleAlign('right')}
            className="p-1.5 rounded hover:bg-slate-100 text-slate-600 transition-colors"
            title="Align Right Margin"
          >
            <AlignRight className="w-3.5 h-3.5" />
          </button>
          <div className="w-px h-4 bg-slate-200 mx-1" />
          <button
            onClick={handleCopyStyle}
            className="p-1.5 rounded hover:bg-slate-100 text-slate-600 transition-colors"
            title="Copy Style"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handlePasteStyle}
            disabled={!copiedStyle}
            className="p-1.5 rounded hover:bg-slate-100 text-slate-600 disabled:opacity-30 transition-colors"
            title="Paste Style"
          >
            <ClipboardCheck className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Grid & Zoom Controls */}
      <div className="flex items-center gap-2">
        <label className="flex items-center gap-1 text-slate-600 cursor-pointer font-medium">
          <Grid className="w-3.5 h-3.5 text-slate-400" />
          <input
            type="checkbox"
            checked={snapToGrid}
            onChange={(e) => setSnapToGrid(e.target.checked)}
            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
          />
          <span>Snap</span>
        </label>

        {snapToGrid && (
          <select
            value={gridSize}
            onChange={(e) => setGridSize(Number(e.target.value))}
            className="px-1.5 py-0.5 border border-slate-200 rounded text-slate-700 text-[11px] bg-white"
          >
            <option value={5}>5px</option>
            <option value={10}>10px</option>
            <option value={15}>15px</option>
            <option value={20}>20px</option>
          </select>
        )}

        <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg p-0.5">
          <button
            onClick={() => setScale(Math.max(0.5, scale - 0.25))}
            className="p-1 rounded hover:bg-slate-200 text-slate-600 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-[11px] font-semibold text-slate-600 w-10 text-center">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={() => setScale(Math.min(3, scale + 0.25))}
            className="p-1 rounded hover:bg-slate-200 text-slate-600 transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
