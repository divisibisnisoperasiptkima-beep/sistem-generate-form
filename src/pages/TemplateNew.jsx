import { useState, useEffect } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import useTemplateStore from '@/stores/useTemplateStore'
import usePdfStore from '@/stores/usePdfStore'
import useToastStore from '@/stores/useToastStore'
import FieldBuilder from '@/components/form/FieldBuilder'
import FieldPlacementEditor from '@/components/pdf/FieldPlacementEditor'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Spinner from '@/components/ui/Spinner'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'

export default function TemplateNew() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { createTemplate, updateTemplate, fetchTemplate, saveFields, error, currentTemplate } = useTemplateStore()
  const { clearPdf } = usePdfStore()
  const addToast = useToastStore(s => s.addToast)

  const stepParam = parseInt(searchParams.get('step'))
  const step = stepParam >= 1 && stepParam <= 3 ? stepParam : 1
  const templateId = searchParams.get('templateId')

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [restoring, setRestoring] = useState(false)

  useEffect(() => {
    if (templateId) {
      setRestoring(true)
      fetchTemplate(templateId).finally(() => setRestoring(false))
    }
  }, [templateId, fetchTemplate])

  useEffect(() => {
    if (currentTemplate && templateId && !name) {
      setName(currentTemplate.name || '')
      setDescription(currentTemplate.description || '')
    }
  }, [currentTemplate, templateId, name])

  useEffect(() => {
    if (step > 1 && !templateId && !restoring) {
      navigate('/templates/new', { replace: true })
    }
  }, [step, templateId, restoring, navigate])

  const goToStep = (s) => {
    const params = new URLSearchParams()
    params.set('step', s)
    if (templateId) params.set('templateId', templateId)
    navigate(`/templates/new?${params.toString()}`)
  }

  const handleSaveDetails = async () => {
    if (!name.trim()) return
    setSaving(true)
    if (templateId) {
      const ok = await updateTemplate(templateId, { name: name.trim(), description: description.trim() })
      setSaving(false)
      if (ok) {
        addToast('Template details saved', 'success')
        goToStep(2)
      }
    } else {
      const data = await createTemplate(name.trim(), description.trim())
      setSaving(false)
      if (data) {
        addToast('Template created successfully', 'success')
        navigate(`/templates/new?templateId=${data.id}&step=2`)
      }
    }
  }

  const handleFieldsSaved = () => {
    goToStep(3)
  }

  const handlePlacementDone = () => {
    clearPdf()
    addToast('Template is ready. You can now share and generate PDFs.', 'success')
    navigate(`/templates/${templateId}`)
  }

  const stepNames = ['Template Details', 'Form Config', 'PDF Placement']

  return (
    <div className="max-w-6xl mx-auto py-10 px-4 sm:px-6 lg:px-8 animate-fade-in">
      <div className="flex items-center gap-3.5 mb-8">
        <Link to="/templates" className="p-2 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50 text-slate-400 hover:text-slate-700 transition-all duration-200">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">Create Template</h1>
          <p className="text-xs text-slate-400">Set up a template step by step</p>
        </div>
      </div>

      {/* Modern Stepper Timeline */}
      <div className="bg-white border border-slate-100 rounded-2xl px-6 py-5 shadow-sm mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {[1, 2, 3].map((s) => {
          const isActive = s === step
          const isCompleted = s < step
          return (
            <div key={s} className="flex-1 flex items-center gap-3 group">
              <div className="flex items-center gap-3">
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                    isActive
                      ? 'bg-blue-600 text-white ring-4 ring-blue-100 shadow-md shadow-blue-500/10'
                      : isCompleted
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {isCompleted ? <Check className="h-4.5 w-4.5" /> : s}
                </div>
                <div className="flex flex-col">
                  <span className={`text-xs font-bold tracking-tight leading-none ${
                    isActive ? 'text-blue-600' : isCompleted ? 'text-slate-800' : 'text-slate-400'
                  }`}>
                    {stepNames[s - 1]}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium mt-0.5">
                    {s === 1 ? 'Metadata' : s === 2 ? 'Inputs' : 'Layout Design'}
                  </span>
                </div>
              </div>
              {s < 3 && (
                <div className="hidden md:block flex-1 h-0.5 mx-4 bg-slate-100 rounded">
                  <div
                    className="h-full bg-blue-600 rounded transition-all duration-500"
                    style={{ width: isCompleted ? '100%' : '0%' }}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Step Contents */}
      <div className="animate-slide-up">
        {restoring ? (
          <div className="flex justify-center py-24">
            <Spinner size="lg" />
          </div>
        ) : (
          <>
            {step === 1 && (
              <div className="max-w-xl">
                <div className="bg-white rounded-2xl border border-slate-100 p-6 sm:p-8 space-y-6 shadow-sm">
                  <div>
                    <h2 className="text-base font-bold text-slate-800">Template Information</h2>
                    <p className="text-xs text-slate-400 mt-0.5">Enter details to classify your PDF form document template.</p>
                  </div>

                  <div className="space-y-4">
                    <Input
                      label="Template Name"
                      placeholder="e.g. NDAs, Employment Agreement"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Description (optional)</label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={4}
                        placeholder="Provide context about what this template generates..."
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 shadow-sm"
                      />
                    </div>
                  </div>

                  {error && (
                    <p className="text-sm text-red-500 font-medium bg-red-50/50 px-3 py-2 rounded-lg border border-red-100">{error}</p>
                  )}
                  
                  <Button onClick={handleSaveDetails} loading={saving} disabled={!name.trim()} className="w-full py-2.5 rounded-xl text-sm">
                    {templateId ? 'Save & Continue' : 'Create & Continue'}
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}

            {step === 2 && templateId && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                  <FieldBuilder
                    fields={useTemplateStore.getState().fields}
                    onSave={saveFields}
                    templateId={templateId}
                  />
                </div>
                <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <Button variant="ghost" onClick={() => goToStep(1)} className="text-slate-500 hover:text-slate-800">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Details
                  </Button>
                  <Button onClick={handleFieldsSaved} className="rounded-xl px-5">
                    Continue to PDF Placement
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {step === 3 && templateId && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                  <FieldPlacementEditor />
                </div>
                <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <Button variant="ghost" onClick={() => goToStep(2)} className="text-slate-500 hover:text-slate-800">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Config
                  </Button>
                  <Button onClick={handlePlacementDone} className="rounded-xl px-6 bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500 shadow-md shadow-emerald-500/10">
                    Finish Template
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
