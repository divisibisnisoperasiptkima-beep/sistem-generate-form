import { useEffect, useState, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import useTemplateStore from '@/stores/useTemplateStore'
import usePdfStore from '@/stores/usePdfStore'
import useToastStore from '@/stores/useToastStore'
import PdfViewer from '@/components/pdf/PdfViewer'
import PlacementOverlay from '@/components/pdf/PlacementOverlay'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Spinner from '@/components/ui/Spinner'
import {
  ArrowLeft,
  Download,
  RefreshCw,
  FileText,
  CheckCircle2,
  Sparkles,
  Eye,
  FileCheck,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

export default function TemplatePreview() {
  const { id } = useParams()
  const { currentTemplate, fields, placements, fetchTemplate, generatePdf, loading } = useTemplateStore()
  const {
    currentPage,
    setCurrentPage,
    numPages,
    scale,
    pdfDocument,
    setPreviewMode,
    setPreviewData,
    previewData: storePreviewData,
  } = usePdfStore()

  const [formData, setFormData] = useState({})
  const [viewMode, setViewMode] = useState('live') // 'live' | 'pdf'
  const [generating, setGenerating] = useState(false)
  const [previewPdfUrl, setPreviewPdfUrl] = useState(null)
  const [generateError, setGenerateError] = useState(null)
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 })
  const [displayRatio, setDisplayRatio] = useState(1)

  const addToast = useToastStore((s) => s.addToast)

  useEffect(() => {
    fetchTemplate(id)
    setPreviewMode(true)
    return () => {
      usePdfStore.getState().clearPdf()
    }
  }, [id, fetchTemplate, setPreviewMode])

  // Initialize sample data
  useEffect(() => {
    if (fields.length > 0) {
      const defaults = {}
      fields.forEach((f) => {
        defaults[f.name] = f.default_value || ''
      })
      setFormData(defaults)
      setPreviewData(defaults)
    }
  }, [fields, setPreviewData])

  const handleFieldChange = (name, value) => {
    const updated = { ...formData, [name]: value }
    setFormData(updated)
    setPreviewData(updated)
  }

  const handleFillSampleData = () => {
    const samples = {}
    fields.forEach((f) => {
      if (f.field_type === 'date') samples[f.name] = new Date().toISOString().split('T')[0]
      else if (f.field_type === 'number') samples[f.name] = '1,250.00'
      else if (f.field_type === 'checkbox') samples[f.name] = true
      else if (f.name.toLowerCase().includes('name')) samples[f.name] = 'Johnathan Doe'
      else if (f.name.toLowerCase().includes('email')) samples[f.name] = 'john.doe@example.com'
      else if (f.name.toLowerCase().includes('address')) samples[f.name] = '123 Innovation Drive, Suite 400'
      else samples[f.name] = `Sample ${f.label || f.name}`
    })
    setFormData(samples)
    setPreviewData(samples)
    addToast('Sample test data populated', 'info')
  }

  const handleGeneratePdfServer = async () => {
    setGenerating(true)
    setGenerateError(null)
    const result = await generatePdf(id, formData)
    setGenerating(false)

    if (result?.download_url) {
      setPreviewPdfUrl(result.download_url)
      setViewMode('pdf')
      addToast('Server PDF compiled successfully', 'success')
    } else {
      setGenerateError('Failed to generate PDF. Please check server logs.')
      addToast('Failed to compile PDF output', 'error')
    }
  }

  const handlePageRender = useCallback(({ width, height, displayRatio: ratio }) => {
    setCanvasSize({ width, height })
    if (ratio) setDisplayRatio(ratio)
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!currentTemplate) {
    return (
      <div className="max-w-lg mx-auto mt-20 text-center bg-white border border-slate-100 p-8 rounded-2xl shadow-sm animate-fade-in">
        <h1 className="text-xl font-bold text-slate-800 mb-2">Template Not Found</h1>
        <Link to="/templates">
          <Button className="rounded-xl">Back to Workspace</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 animate-fade-in space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <Link
            to={`/templates/${id}`}
            className="p-2 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-500 transition-all"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">
              Test Document Rendering &amp; Display
            </h1>
            <p className="text-xs text-slate-500">
              Type test data and verify exact visual output on {currentTemplate.name}
            </p>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
          <button
            onClick={() => setViewMode('live')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              viewMode === 'live' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Instant Live Canvas</span>
          </button>
          <button
            onClick={() => {
              if (previewPdfUrl) setViewMode('pdf')
              else handleGeneratePdfServer()
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              viewMode === 'pdf' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileCheck className="w-3.5 h-3.5" />
            <span>Server PDF Output</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6 items-start">
        {/* Left Input Sidebar */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Test Data Input
              </h2>
              <p className="text-[11px] text-slate-400">Updates live on document canvas</p>
            </div>
            <button
              onClick={handleFillSampleData}
              className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 px-2 py-1 rounded-lg transition-colors cursor-pointer"
            >
              <Sparkles className="w-3 h-3" />
              <span>Fill Sample</span>
            </button>
          </div>

          {fields.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-4">No form fields defined for this template.</p>
          ) : (
            <div className="space-y-3.5 max-h-[520px] overflow-y-auto pr-1">
              {fields.map((field) => {
                const placement = placements.find((p) => p.field_id === field.id)
                const val = formData[field.name] ?? ''

                return (
                  <div key={field.id} className="space-y-1">
                    <div className="flex justify-between items-center text-xs font-medium text-slate-700">
                      <span>{field.label || field.name}</span>
                      {placement && (
                        <span className="text-[10px] text-slate-400">
                          {placement.font_family}, {placement.font_size}pt
                        </span>
                      )}
                    </div>
                    {field.field_type === 'checkbox' ? (
                      <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg bg-slate-50 border border-slate-200">
                        <input
                          type="checkbox"
                          checked={!!formData[field.name]}
                          onChange={(e) => handleFieldChange(field.name, e.target.checked)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                        />
                        <span className="text-xs text-slate-700 font-medium">Checked</span>
                      </label>
                    ) : (
                      <Input
                        type={field.field_type === 'number' ? 'number' : field.field_type === 'date' ? 'date' : 'text'}
                        placeholder={field.placeholder || `Enter ${field.label || field.name}`}
                        value={val}
                        onChange={(e) => handleFieldChange(field.name, e.target.value)}
                      />
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {generateError && (
            <div className="flex items-center gap-1.5 p-2.5 bg-red-50 text-red-700 rounded-xl border border-red-200 text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{generateError}</span>
            </div>
          )}

          <Button
            className="w-full py-2.5 rounded-xl text-xs font-bold"
            onClick={handleGeneratePdfServer}
            loading={generating}
            disabled={fields.length === 0}
          >
            <RefreshCw className="h-4 w-4" />
            Compile Server PDF
          </Button>
        </div>

        {/* Right Preview Viewport */}
        <div className="space-y-4">
          {viewMode === 'live' ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 text-xs">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-blue-600" />
                  Instant Live Document Canvas (As-You-Type)
                </span>
                <span className="text-slate-400 text-[11px]">
                  Real-time client overlay verification
                </span>
              </div>

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

              {/* Page Controls */}
              {currentTemplate?.original_pdf_url && pdfDocument && (
                <div className="flex items-center justify-between pt-2 text-xs">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage <= 1}
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    Previous
                  </Button>
                  <span className="font-semibold text-slate-600">
                    Page {currentPage} of {numPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.min(numPages, currentPage + 1))}
                    disabled={currentPage >= numPages}
                  >
                    Next
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              {previewPdfUrl ? (
                <>
                  <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      <span className="text-sm font-bold text-slate-800">
                        Server PDF Output Ready
                      </span>
                    </div>
                    <a href={previewPdfUrl} download={`${currentTemplate.name}_preview.pdf`}>
                      <Button variant="outline" size="sm" className="rounded-lg text-xs gap-1.5">
                        <Download className="h-4 w-4" />
                        Download PDF
                      </Button>
                    </a>
                  </div>
                  <div className="h-[650px] bg-slate-100">
                    <iframe src={previewPdfUrl} className="w-full h-full border-none" title="Preview output" />
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center min-h-[400px] bg-slate-50 p-6 text-center">
                  <div>
                    <Spinner size="lg" className="mx-auto mb-3" />
                    <p className="text-slate-500 text-sm font-medium">Compiling server PDF...</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
