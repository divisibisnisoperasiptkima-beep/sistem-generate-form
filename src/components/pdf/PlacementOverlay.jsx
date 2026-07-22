import { useState, useRef, useCallback, useEffect } from 'react'
import usePdfStore from '@/stores/usePdfStore'
import useTemplateStore from '@/stores/useTemplateStore'
import { cn } from '@/lib/utils'

const RESIZE_HANDLES = [
  { dir: 'nw', cursor: 'nwse-resize', classNames: '-top-1.5 -left-1.5' },
  { dir: 'n',  cursor: 'ns-resize',   classNames: '-top-1.5 left-1/2 -translate-x-1/2' },
  { dir: 'ne', cursor: 'nesw-resize', classNames: '-top-1.5 -right-1.5' },
  { dir: 'e',  cursor: 'ew-resize',   classNames: 'top-1/2 -translate-y-1/2 -right-1.5' },
  { dir: 'se', cursor: 'nwse-resize', classNames: '-bottom-1.5 -right-1.5' },
  { dir: 's',  cursor: 'ns-resize',   classNames: '-bottom-1.5 left-1/2 -translate-x-1/2' },
  { dir: 'sw', cursor: 'nesw-resize', classNames: '-bottom-1.5 -left-1.5' },
  { dir: 'w',  cursor: 'ew-resize',   classNames: 'top-1/2 -translate-y-1/2 -left-1.5' },
]

export default function PlacementOverlay({ pageIndex, canvasWidth, canvasHeight, scale, displayRatio = 1 }) {
  const {
    selectedFieldId,
    setSelectedFieldId,
    selectedPlacementId,
    setSelectedPlacementId,
    snapToGrid,
    gridSize,
    previewMode,
    previewData,
  } = usePdfStore()

  const { fields, placements, savePlacement, currentTemplate } = useTemplateStore()
  const overlayRef = useRef(null)
  const [dragging, setDragging] = useState(null)
  const [newPlacement, setNewPlacement] = useState(null)

  const pagePlacements = placements.filter((p) => p.page === pageIndex)
  const unplacedFields = fields.filter(
    (f) => !placements.some((p) => p.field_id === f.id && p.page === pageIndex)
  )

  const effectiveScale = displayRatio > 0 ? scale / displayRatio : scale

  const snapValue = useCallback(
    (val) => {
      if (!snapToGrid) return val
      return Math.round(val / gridSize) * gridSize
    },
    [snapToGrid, gridSize]
  )

  const getEventCoords = useCallback(
    (e) => {
      const rect = overlayRef.current.getBoundingClientRect()
      const clientX = e.touches ? e.touches[0].clientX : e.clientX
      const clientY = e.touches ? e.touches[0].clientY : e.clientY
      return {
        x: (clientX - rect.left) / effectiveScale,
        y: (clientY - rect.top) / effectiveScale,
      }
    },
    [effectiveScale]
  )

  const handleMouseDown = useCallback(
    (e) => {
      if (e.target !== overlayRef.current) return
      if (!selectedFieldId) return

      const coords = getEventCoords(e)
      const x = snapValue(coords.x)
      const y = snapValue(coords.y)

      setNewPlacement({
        field_id: selectedFieldId,
        page: pageIndex,
        x,
        y,
        width: 150,
        height: 24,
        font_size: 12,
        font_family: 'Helvetica',
        font_color: '#000000',
        text_align: 'left',
        vertical_align: 'middle',
        font_style: 'normal',
        word_wrap: true,
        auto_fit_font: false,
      })

      setDragging({
        type: 'new',
        startX: coords.x,
        startY: coords.y,
      })
    },
    [selectedFieldId, pageIndex, getEventCoords, snapValue]
  )

  const handleMouseMove = useCallback(
    (e) => {
      if (!dragging) return
      const coords = getEventCoords(e)

      if (dragging.type === 'new' && newPlacement) {
        const x1 = Math.min(dragging.startX, coords.x)
        const y1 = Math.min(dragging.startY, coords.y)
        const w = Math.abs(coords.x - dragging.startX)
        const h = Math.abs(coords.y - dragging.startY)

        setNewPlacement({
          ...newPlacement,
          x: snapValue(x1),
          y: snapValue(y1),
          width: snapValue(w),
          height: snapValue(h),
        })
      } else if (dragging.type === 'move') {
        const dx = coords.x - dragging.startX
        const dy = coords.y - dragging.startY
        setDragging({ ...dragging, dx, dy })
      } else if (dragging.type === 'resize' && dragging.placementId) {
        const p = pagePlacements.find((pl) => pl.id === dragging.placementId)
        if (p) {
          const handleDir = dragging.handleDir || 'se'
          let { x, y, width, height } = p
          const dx = coords.x - dragging.startX
          const dy = coords.y - dragging.startY

          if (handleDir.includes('e')) width = Math.max(15, p.width + dx)
          if (handleDir.includes('s')) height = Math.max(12, p.height + dy)
          if (handleDir.includes('w')) {
            const newW = Math.max(15, p.width - dx)
            x = p.x + (p.width - newW)
            width = newW
          }
          if (handleDir.includes('n')) {
            const newH = Math.max(12, p.height - dy)
            y = p.y + (p.height - newH)
            height = newH
          }

          setDragging({
            ...dragging,
            currentX: snapValue(x),
            currentY: snapValue(y),
            currentW: snapValue(width),
            currentH: snapValue(height),
          })
        }
      }
    },
    [dragging, newPlacement, getEventCoords, pagePlacements, snapValue]
  )

  const handleMouseUp = useCallback(async () => {
    if (dragging?.type === 'new' && newPlacement) {
      if (newPlacement.width > 10 && newPlacement.height > 10) {
        const created = await savePlacement(currentTemplate.id, {
          ...newPlacement,
          width: Math.round(newPlacement.width),
          height: Math.round(newPlacement.height),
          x: Math.round(newPlacement.x),
          y: Math.round(newPlacement.y),
        })
        setSelectedFieldId(null)
        if (created?.id) setSelectedPlacementId(created.id)
      }
      setNewPlacement(null)
    } else if (dragging?.type === 'move' && dragging.placementId) {
      const p = pagePlacements.find((pl) => pl.id === dragging.placementId)
      if (p) {
        const finalX = snapValue(p.x + (dragging.dx || 0))
        const finalY = snapValue(p.y + (dragging.dy || 0))
        await savePlacement(currentTemplate.id, {
          ...p,
          x: Math.round(finalX),
          y: Math.round(finalY),
        })
      }
    } else if (dragging?.type === 'resize' && dragging.placementId) {
      const p = pagePlacements.find((pl) => pl.id === dragging.placementId)
      if (p && dragging.currentW && dragging.currentH) {
        await savePlacement(currentTemplate.id, {
          ...p,
          x: Math.round(dragging.currentX ?? p.x),
          y: Math.round(dragging.currentY ?? p.y),
          width: Math.round(dragging.currentW),
          height: Math.round(dragging.currentH),
        })
      }
    }
    setDragging(null)
  }, [dragging, newPlacement, currentTemplate, savePlacement, setSelectedFieldId, setSelectedPlacementId, pagePlacements, snapValue])

  const handleRemovePlacement = useCallback(async (placementId) => {
    const { removePlacement } = useTemplateStore.getState()
    await removePlacement(placementId)
    setSelectedPlacementId(null)
  }, [setSelectedPlacementId])

  const dragHandlersRef = useRef(null)
  dragHandlersRef.current = { handleMouseMove, handleMouseUp }

  useEffect(() => {
    if (!dragging) return
    const onMove = (e) => dragHandlersRef.current?.handleMouseMove(e)
    const onUp = (e) => dragHandlersRef.current?.handleMouseUp(e)
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
    return () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
  }, [dragging])

  // Keyboard Nudge Navigation
  useEffect(() => {
    const activePlacement = pagePlacements.find(
      (p) => p.id === selectedPlacementId || p.field_id === selectedFieldId
    )
    if (!activePlacement || !currentTemplate) return

    const handleKeyDown = (e) => {
      if (['input', 'textarea', 'select'].includes(document.activeElement?.tagName?.toLowerCase())) {
        return
      }

      const step = e.shiftKey ? 10 : 1
      let dx = 0
      let dy = 0

      if (e.key === 'ArrowLeft') dx = -step
      else if (e.key === 'ArrowRight') dx = step
      else if (e.key === 'ArrowUp') dy = -step
      else if (e.key === 'ArrowDown') dy = step
      else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (activePlacement.id) handleRemovePlacement(activePlacement.id)
        return
      } else return

      e.preventDefault()
      savePlacement(currentTemplate.id, {
        ...activePlacement,
        x: Math.max(0, Math.round(activePlacement.x + dx)),
        y: Math.max(0, Math.round(activePlacement.y + dy)),
      })
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedPlacementId, selectedFieldId, pagePlacements, currentTemplate, savePlacement, handleRemovePlacement])

  const getCalculatedFontSize = (p, text) => {
    let fontSize = p.font_size || 12
    if (p.auto_fit_font && text) {
      const minSize = p.min_font_size || 6
      const contentWidth = Math.max(10, p.width - (p.padding || 2) * 2)
      while (fontSize > minSize) {
        const estWidth = text.length * fontSize * 0.52
        if (estWidth <= contentWidth) break
        fontSize -= 0.5
      }
    }
    return fontSize
  }

  const getPlacementStyle = (p, isDragging = false) => {
    let x = p.x
    let y = p.y
    let width = p.width
    let height = p.height

    if (isDragging && dragging?.dx !== undefined) {
      x = p.x + dragging.dx
      y = p.y + dragging.dy
    }

    if (isDragging && dragging?.type === 'resize') {
      if (dragging.currentX !== undefined) x = dragging.currentX
      if (dragging.currentY !== undefined) y = dragging.currentY
      if (dragging.currentW !== undefined) width = dragging.currentW
      if (dragging.currentH !== undefined) height = dragging.currentH
    }

    const fontWeight = p.font_style === 'bold' || p.font_style === 'bolditalic' ? 'bold' : 'normal'
    const fontStyle = p.font_style === 'italic' || p.font_style === 'bolditalic' ? 'italic' : 'normal'

    let justifyContent = 'flex-start'
    if (p.text_align === 'center') justifyContent = 'center'
    else if (p.text_align === 'right') justifyContent = 'flex-end'

    let alignItems = 'center'
    if (p.vertical_align === 'top') alignItems = 'flex-start'
    else if (p.vertical_align === 'bottom') alignItems = 'flex-end'

    const textVal = getDisplayText(p.field_id)
    const fontSize = getCalculatedFontSize(p, textVal)

    return {
      left: x * effectiveScale,
      top: y * effectiveScale,
      width: width * effectiveScale,
      height: height * effectiveScale,
      fontSize: fontSize * effectiveScale,
      fontFamily: p.font_family || 'Helvetica',
      color: p.font_color || '#000000',
      textAlign: p.text_align || 'left',
      fontWeight,
      fontStyle,
      lineHeight: 1.15,
      backgroundColor: p.bg_color || 'transparent',
      borderColor: p.border_color || undefined,
      borderWidth: p.border_width ? `${p.border_width * effectiveScale}px` : undefined,
      borderStyle: p.border_width ? 'solid' : undefined,
      padding: `${(p.padding || 2) * effectiveScale}px`,
      opacity: p.opacity ?? 1,
      display: 'flex',
      justifyContent,
      alignItems,
      whiteSpace: p.word_wrap ? 'normal' : 'nowrap',
      overflow: 'hidden',
    }
  }

  const fieldLabel = (fieldId) => {
    const f = fields.find((f) => f.id === fieldId)
    return f?.label || f?.name || '?'
  }

  const getDisplayText = (fieldId) => {
    const f = fields.find((f) => f.id === fieldId)
    if (!f) return '?'
    if (!previewMode) return f.label || f.name
    if (previewData && previewData[f.name] !== undefined && previewData[f.name] !== null && previewData[f.name] !== '') {
      return String(previewData[f.name])
    }
    if (f.default_value) return f.default_value
    if (f.field_type === 'date') return '2026-07-22'
    if (f.field_type === 'number') return '1,250.00'
    if (f.field_type === 'checkbox') return '✓'
    return `[${f.label || f.name}]`
  }

  return (
    <div
      ref={overlayRef}
      className={`absolute inset-0 select-none ${previewMode ? 'cursor-default' : 'cursor-crosshair'}`}
      style={{
        width: displayRatio > 0 && canvasWidth > 0 ? canvasWidth / displayRatio : '100%',
        height: displayRatio > 0 && canvasHeight > 0 ? canvasHeight / displayRatio : '100%',
      }}
      onMouseDown={previewMode ? undefined : handleMouseDown}
      onMouseMove={previewMode ? undefined : handleMouseMove}
      onMouseUp={previewMode ? undefined : handleMouseUp}
      onMouseLeave={previewMode ? undefined : handleMouseUp}
    >
      {/* Visual Grid Lines */}
      {snapToGrid && !previewMode && (
        <div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage: `radial-gradient(circle, #3b82f6 1px, transparent 1px)`,
            backgroundSize: `${gridSize * effectiveScale}px ${gridSize * effectiveScale}px`,
          }}
        />
      )}

      {pagePlacements.map((p) => {
        const isSelected = !previewMode && (p.id === selectedPlacementId || p.field_id === selectedFieldId)
        const isThisDragging = dragging?.placementId === p.id

        return (
          <div
            key={p.id}
            className={cn(
              'absolute rounded pointer-events-auto transition-shadow',
              previewMode
                ? 'border-transparent bg-transparent'
                : isSelected
                ? 'border-2 border-blue-600 bg-blue-500/10 ring-2 ring-blue-500/40 shadow-lg'
                : 'border border-slate-400/80 bg-slate-400/5 hover:border-slate-600 hover:bg-slate-400/10'
            )}
            style={getPlacementStyle(p, isThisDragging)}
            onClick={(e) => {
              if (previewMode) return
              e.stopPropagation()
              setSelectedFieldId(p.field_id)
              setSelectedPlacementId(p.id)
            }}
            onMouseDown={(e) => {
              if (previewMode) return
              if (e.target.classList.contains('resize-handle')) return
              e.stopPropagation()
              setSelectedFieldId(p.field_id)
              setSelectedPlacementId(p.id)
              setDragging({
                type: 'move',
                placementId: p.id,
                startX: getEventCoords(e).x,
                startY: getEventCoords(e).y,
              })
            }}
          >
            <span
              className={cn('w-full px-0.5', p.word_wrap ? 'break-words whitespace-normal' : 'truncate')}
              style={{ color: p.font_color || '#000000', lineHeight: 1.15 }}
            >
              {getDisplayText(p.field_id)}
            </span>

            {/* Remove button */}
            {isSelected && (
              <button
                className="absolute -top-2.5 -right-2.5 h-5 w-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs font-bold cursor-pointer shadow-md z-10"
                onClick={(e) => {
                  e.stopPropagation()
                  handleRemovePlacement(p.id)
                }}
                title="Remove Placement"
              >
                &times;
              </button>
            )}

            {/* 8-Point Resize Handles */}
            {isSelected &&
              RESIZE_HANDLES.map(({ dir, cursor, classNames }) => (
                <div
                  key={dir}
                  className={cn(
                    'resize-handle absolute w-2.5 h-2.5 bg-blue-600 border border-white rounded-full z-10',
                    classNames
                  )}
                  style={{ cursor }}
                  onMouseDown={(e) => {
                    e.stopPropagation()
                    setDragging({
                      type: 'resize',
                      placementId: p.id,
                      handleDir: dir,
                      startX: getEventCoords(e).x,
                      startY: getEventCoords(e).y,
                    })
                  }}
                />
              ))}
          </div>
        )
      })}

      {newPlacement && (
        <div
          className="absolute border-2 border-dashed border-green-500 bg-green-500/10 rounded"
          style={getPlacementStyle(newPlacement)}
        >
          <span className="block px-1 text-xs text-green-700 truncate">
            {fieldLabel(newPlacement.field_id)}
          </span>
        </div>
      )}

      {selectedFieldId && unplacedFields.length > 0 && (
        <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm border border-slate-200 rounded-xl shadow-lg p-3 text-xs pointer-events-auto z-20 max-w-xs animate-fade-in">
          <p className="font-semibold text-slate-800 mb-1">Click &amp; Drag to place:</p>
          <p className="text-blue-600 font-bold text-sm">
            {fieldLabel(selectedFieldId)}
          </p>
          <p className="text-slate-400 text-[11px] mt-1">
            Draw a rectangle on the PDF to map field boundaries.
          </p>
        </div>
      )}
    </div>
  )
}
