import { useState, useCallback } from 'react'
import PdfViewer from './PdfViewer'
import PlacementOverlay from './PlacementOverlay'
import PlacementInspector from './PlacementInspector'
import PlacementToolbar from './PlacementToolbar'
import useTemplateStore from '@/stores/useTemplateStore'
import usePdfStore from '@/stores/usePdfStore'
import useToastStore from '@/stores/useToastStore'
import Button from '@/components/ui/Button'
import { FileUp, CheckCircle, AlertCircle, Move, MousePointerClick } from 'lucide-react'

export default function FieldPlacementEditor() {
  const { currentTemplate, fields, placements, uploadPdf, error, clearError } = useTemplateStore()
  const { currentPage, setSelectedFieldId, selectedFieldId, setSelectedPlacementId, setCurrentPage, pdfDocument, scale, numPages } = usePdfStore()
  const addToast = useToastStore((s) => s.addToast)
  const [uploading, setUploading] = useState(false)
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 })
  const [displayRatio, setDisplayRatio] = useState(1)

  const handlePdfUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !currentTemplate) return
    setUploading(true)
    clearError()
    const result = await uploadPdf(currentTemplate.id, file)
    setUploading(false)
    if (result) {
      addToast('PDF uploaded successfully', 'success')
    } else {
      addToast('Failed to upload PDF. Please try again.', 'error')
    }
  }

  const handlePageRender = useCallback(({ width, height, displayRatio: ratio }) => {
    setCanvasSize({ width, height })
    if (ratio) setDisplayRatio(ratio)
  }, [])

  const unplacedFields = fields.filter(
    (f) => !placements.some((p) => p.field_id === f.id && p.page === currentPage)
  )

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr_300px] gap-6 items-start">
      {/* Left Column: PDF Upload & Field List */}
      <div className="space-y-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <h3 className="font-bold text-sm text-slate-800 mb-3 flex items-center gap-2">
            <FileUp className="w-4 h-4 text-blue-600" />
            Template Source PDF
          </h3>
          <label className="block">
            <input
              type="file"
              accept=".pdf"
              onChange={handlePdfUpload}
              className="hidden"
            />
            <Button
              variant="outline"
              size="sm"
              loading={uploading}
              onClick={(e) => e.currentTarget.closest('label').querySelector('input').click()}
              className="w-full justify-center border-dashed"
            >
              {currentTemplate?.original_pdf_url ? 'Replace PDF' : 'Upload PDF'}
            </Button>
          </label>
          {currentTemplate?.original_pdf_url && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 mt-2 font-medium">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>PDF loaded</span>
            </div>
          )}
          {error && (
            <div className="flex items-center gap-1.5 text-xs text-red-500 mt-2">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-sm text-slate-800">
              Form Fields ({fields.length})
            </h3>
          </div>

          {fields.length === 0 ? (
            <p className="text-xs text-slate-400">No fields defined yet. Go to Form Fields tab first.</p>
          ) : (
            <div className="space-y-1.5 max-h-[380px] overflow-y-auto pr-1">
              {fields.map((field) => {
                const placement = placements.find(
                  (p) => p.field_id === field.id && p.page === currentPage
                )
                const isSelected = selectedFieldId === field.id

                return (
                  <button
                    key={field.id}
                    onClick={() => {
                      if (isSelected) {
                        setSelectedFieldId(null)
                        setSelectedPlacementId(null)
                      } else {
                        setSelectedFieldId(field.id)
                        if (placement) setSelectedPlacementId(placement.id)
                      }
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-blue-50 border-blue-500 text-blue-800 shadow-sm font-medium'
                        : placement
                        ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        : 'bg-white border-dashed border-slate-300 text-slate-600 hover:border-blue-400 hover:text-blue-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium truncate max-w-[140px]">{field.label || field.name}</span>
                      <span
                        className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${
                          placement
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {placement ? 'Placed' : 'Unplaced'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-1 text-[10px] text-slate-400">
                      <span>{field.field_type}</span>
                      {placement && (
                        <span>
                          ({Math.round(placement.x)}, {Math.round(placement.y)})
                        </span>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {selectedFieldId && unplacedFields.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 shadow-sm animate-slide-up">
            <h4 className="text-xs font-bold text-blue-900 mb-1 flex items-center gap-1.5">
              <MousePointerClick className="w-4 h-4 text-blue-600" />
              Placement Active
            </h4>
            <p className="text-xs text-blue-700 leading-relaxed">
              Click and drag anywhere on Page {currentPage} to position a bounding box for this field.
            </p>
          </div>
        )}
      </div>

      {/* Center Column: PDF Canvas Viewer */}
      <div className="space-y-3">
        {currentTemplate?.original_pdf_url && <PlacementToolbar />}

        <PdfViewer pdfUrl={currentTemplate?.original_pdf_url} hideControls onPageRender={handlePageRender}>
          {currentTemplate?.original_pdf_url && pdfDocument && canvasSize.width > 0 && (
            <PlacementOverlay
              pageIndex={currentPage}
              canvasWidth={canvasSize.width}
              canvasHeight={canvasSize.height}
              scale={scale}
              displayRatio={displayRatio}
            />
          )}
        </PdfViewer>

        {currentTemplate?.original_pdf_url && pdfDocument && (
          <div className="flex items-center justify-between bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage <= 1}
            >
              Previous Page
            </Button>
            <span className="text-xs font-semibold text-slate-600">
              Page {currentPage} of {numPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.min(numPages, currentPage + 1))}
              disabled={currentPage >= numPages}
            >
              Next Page
            </Button>
          </div>
        )}
      </div>

      {/* Right Column: Placement Inspector Panel */}
      <div>
        <PlacementInspector />
      </div>
    </div>
  )
}
