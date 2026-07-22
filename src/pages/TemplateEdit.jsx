import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import useTemplateStore from '@/stores/useTemplateStore'
import usePdfStore from '@/stores/usePdfStore'
import FieldBuilder from '@/components/form/FieldBuilder'
import FieldPlacementEditor from '@/components/pdf/FieldPlacementEditor'
import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'
import { ArrowLeft, Sliders, Layout } from 'lucide-react'

export default function TemplateEdit() {
  const { id } = useParams()
  const { currentTemplate, fields, fetchTemplate, saveFields, loading } = useTemplateStore()
  const { clearPdf } = usePdfStore()
  const [tab, setTab] = useState('fields')

  useEffect(() => {
    fetchTemplate(id)
    return () => clearPdf()
  }, [id, fetchTemplate, clearPdf])

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
        <Link to="/templates"><Button className="rounded-xl">Back to Workspace</Button></Link>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto py-10 px-4 sm:px-6 lg:px-8 animate-fade-in">
      <div className="flex items-center gap-3.5 mb-8">
        <Link to={`/templates/${id}`} className="p-2 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50 text-slate-400 hover:text-slate-700 transition-all duration-200">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">Edit Template</h1>
          <p className="text-xs text-slate-400">Configure inputs and layout mapping for {currentTemplate.name}</p>
        </div>
      </div>

      {/* Premium Pill Tabs */}
      <div className="bg-slate-100/60 border border-slate-200/40 p-1 rounded-xl w-fit flex gap-1 mb-8">
        <button
          onClick={() => setTab('fields')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
            tab === 'fields'
              ? 'bg-white text-blue-600 shadow-sm shadow-blue-500/5 ring-1 ring-black/[0.02]'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sliders className="h-4 w-4" />
          Form Fields
        </button>
        <button
          onClick={() => setTab('placement')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
            tab === 'placement'
              ? 'bg-white text-blue-600 shadow-sm shadow-blue-500/5 ring-1 ring-black/[0.02]'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layout className="h-4 w-4" />
          Field Placement
        </button>
      </div>

      {/* Tab Panels */}
      <div className="animate-slide-up">
        {tab === 'fields' && (
          <div className="bg-white rounded-2xl border border-slate-100 p-6 sm:p-8 shadow-sm">
            <FieldBuilder
              fields={fields}
              onSave={saveFields}
              templateId={id}
            />
          </div>
        )}

        {tab === 'placement' && (
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <FieldPlacementEditor />
          </div>
        )}
      </div>
    </div>
  )
}
