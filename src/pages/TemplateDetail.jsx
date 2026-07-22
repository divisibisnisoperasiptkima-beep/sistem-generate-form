import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import useTemplateStore from '@/stores/useTemplateStore'
import usePdfStore from '@/stores/usePdfStore'
import PdfViewer from '@/components/pdf/PdfViewer'
import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'
import { ArrowLeft, Edit3, Eye, Share2, Clipboard, Layers, CheckSquare, AlertTriangle, FileText, Check } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default function TemplateDetail() {
  const { id } = useParams()
  const { currentTemplate, fields, placements, fetchTemplate, publishTemplate, unpublishTemplate, loading } = useTemplateStore()
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetchTemplate(id)
    return () => usePdfStore.getState().clearPdf()
  }, [id, fetchTemplate])

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!currentTemplate) {
    return (
      <div className="max-w-lg mx-auto mt-20 text-center bg-white border border-slate-100 p-8 rounded-2xl shadow-sm">
        <h1 className="text-xl font-bold text-slate-800 mb-2">Template Not Found</h1>
        <p className="text-sm text-slate-500 mb-6">This template may have been deleted.</p>
        <Link to="/templates"><Button className="rounded-xl">Back to Workspace</Button></Link>
      </div>
    )
  }

  const shareUrl = currentTemplate.share_token
    ? `${window.location.origin}/f/${currentTemplate.share_token}`
    : null

  const unplacedCount = fields.filter(
    (f) => !placements.some((p) => p.field_id === f.id)
  ).length

  const handleCopyLink = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-100">
        <div className="flex items-start gap-3.5">
          <Link to="/templates" className="p-2 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50 text-slate-400 hover:text-slate-700 transition-all duration-200 mt-1">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">{currentTemplate.name}</h1>
              {currentTemplate.is_published ? (
                <span className="text-[10px] bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  Live
                </span>
              ) : (
                <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  Draft
                </span>
              )}
            </div>
            {currentTemplate.description && (
              <p className="text-sm text-slate-400 mt-1.5 max-w-2xl">{currentTemplate.description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-center">
          <button
            onClick={async () => {
              if (currentTemplate.is_published) {
                await unpublishTemplate(currentTemplate.id)
              } else {
                await publishTemplate(currentTemplate.id)
              }
              fetchTemplate(id)
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer border ${
              currentTemplate.is_published
                ? 'bg-emerald-50 border-emerald-100 text-emerald-700 hover:bg-emerald-100'
                : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {currentTemplate.is_published ? 'Unpublish' : 'Publish'}
          </button>
          {shareUrl && currentTemplate.is_published && (
            <button
              onClick={handleCopyLink}
              className="p-2 rounded-xl hover:bg-slate-50 border border-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              title="Copy share link"
            >
              {copied ? (
                <Check className="h-4.5 w-4.5 text-emerald-500" />
              ) : (
                <Share2 className="h-4.5 w-4.5" />
              )}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-slate-900/[0.02] border border-slate-100 rounded-2xl overflow-hidden shadow-inner p-4 flex justify-center">
            <div className="w-full max-w-2xl bg-white rounded-xl shadow-md border border-slate-100">
              {currentTemplate.original_pdf_url ? (
                <PdfViewer pdfUrl={currentTemplate.original_pdf_url} hideControls />
              ) : (
                <div className="flex items-center justify-center min-h-[400px] bg-slate-50 rounded-xl">
                  <div className="text-center p-6">
                    <div className="h-12 w-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <FileText className="h-6 w-6 text-slate-400" />
                    </div>
                    <p className="text-slate-400 text-sm mb-4">No PDF uploaded to this template</p>
                    <Link to={`/templates/${id}/edit`}>
                      <Button variant="outline" size="sm" className="rounded-lg">
                        Upload PDF Template
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <h3 className="font-extrabold text-slate-800 text-sm tracking-tight mb-4 pb-2 border-b border-slate-50">
              Template Summary
            </h3>
            
            <div className="space-y-3.5 text-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-500">
                  <Clipboard className="h-4 w-4 text-slate-400" />
                  <span>Total Fields</span>
                </div>
                <span className="font-bold text-slate-700 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100/50">
                  {fields.length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-500">
                  <Layers className="h-4 w-4 text-slate-400" />
                  <span>Layout Placements</span>
                </div>
                <span className="font-bold text-slate-700 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100/50">
                  {placements.length}
                </span>
              </div>
              
              {unplacedCount > 0 ? (
                <div className="flex items-center justify-between bg-amber-50/50 border border-amber-100/80 px-3 py-2 rounded-xl">
                  <div className="flex items-center gap-2 text-amber-600">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="font-medium text-xs">Unplaced Fields</span>
                  </div>
                  <span className="font-extrabold text-amber-700 text-xs bg-amber-100/60 px-2.5 py-0.5 rounded-lg">
                    {unplacedCount}
                  </span>
                </div>
              ) : fields.length > 0 ? (
                <div className="flex items-center justify-between bg-emerald-50/50 border border-emerald-100/80 px-3 py-2 rounded-xl">
                  <div className="flex items-center gap-2 text-emerald-600">
                    <CheckSquare className="h-4 w-4" />
                    <span className="font-medium text-xs">Layout Mapping</span>
                  </div>
                  <span className="font-extrabold text-emerald-700 text-xs bg-emerald-100/60 px-2.5 py-0.5 rounded-lg">
                    100% complete
                  </span>
                </div>
              ) : null}

              <div className="h-px bg-slate-50 my-2" />
              
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Created Date</span>
                <span>{formatDate(currentTemplate.created_at)}</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Link to={`/templates/${id}/edit`} className="block">
              <Button variant="outline" className="w-full justify-start py-2.5 rounded-xl border-slate-200 text-slate-700">
                <Edit3 className="h-4 w-4 mr-1 text-slate-400" />
                Edit Form Inputs & Placements
              </Button>
            </Link>
            <Link to={`/templates/${id}/preview`} className="block">
              <Button variant="outline" className="w-full justify-start py-2.5 rounded-xl border-slate-200 text-slate-700">
                <Eye className="h-4 w-4 mr-1 text-slate-400" />
                Fill Form & Preview PDF
              </Button>
            </Link>
            {shareUrl && currentTemplate.is_published && (
              <a href={shareUrl} target="_blank" rel="noopener noreferrer" className="block">
                <Button variant="outline" className="w-full justify-start py-2.5 rounded-xl border-slate-200 text-slate-700">
                  <ExternalLinkIcon />
                  Open Live Form Link
                </Button>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function ExternalLinkIcon() {
  return (
    <svg className="h-4 w-4 mr-2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
  )
}
