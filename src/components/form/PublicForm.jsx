import { useState, useEffect } from 'react'
import useTemplateStore from '@/stores/useTemplateStore'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Spinner from '@/components/ui/Spinner'
import { FileText, CheckCircle2, ChevronRight, AlertCircle, Download, ExternalLink, RotateCcw } from 'lucide-react'

const FIELD_TYPE_INPUT_MAP = {
  text: 'text',
  textarea: 'textarea',
  number: 'number',
  date: 'date',
  select: 'select',
  checkbox: 'checkbox',
}

export default function PublicForm({ shareToken }) {
  const { currentTemplate, fields, fetchPublicTemplate, submitForm, loading, error } = useTemplateStore()
  const [formValues, setFormValues] = useState({})
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)

  useEffect(() => {
    fetchPublicTemplate(shareToken)
  }, [shareToken, fetchPublicTemplate])

  useEffect(() => {
    if (fields.length > 0) {
      const defaults = {}
      fields.forEach((f) => {
        defaults[f.name] = f.default_value || ''
      })
      setFormValues(defaults)
    }
  }, [fields])

  const handleChange = (name, value) => {
    setFormValues((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }))
    }
  }

  const validate = () => {
    const newErrors = {}
    fields.forEach((f) => {
      if (f.required) {
        const val = formValues[f.name]
        if (!val || (typeof val === 'string' && !val.trim())) {
          newErrors[f.name] = `${f.label || f.name} is required`
        }
      }
    })
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setSubmitting(true)
    const data = await submitForm(shareToken, formValues)
    setSubmitting(false)

    if (data) {
      setResult(data)
    }
  }

  const renderField = (field) => {
    const type = FIELD_TYPE_INPUT_MAP[field.field_type] || 'text'

    if (type === 'textarea') {
      return (
        <div key={field.id} className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
            {field.label || field.name}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <textarea
            value={formValues[field.name] || ''}
            onChange={(e) => handleChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            rows={4}
            className={`w-full rounded-lg border px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 shadow-sm ${
              errors[field.name] ? 'border-red-400 focus:ring-red-500/20 focus:border-red-500' : 'border-slate-200'
            }`}
          />
          {errors[field.name] && (
            <p className="mt-1 text-xs text-red-500 font-medium">{errors[field.name]}</p>
          )}
        </div>
      )
    }

    if (type === 'select') {
      return (
        <div key={field.id} className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
            {field.label || field.name}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <select
            value={formValues[field.name] || ''}
            onChange={(e) => handleChange(field.name, e.target.value)}
            className={`w-full rounded-lg border px-3 py-2 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 shadow-sm ${
              errors[field.name] ? 'border-red-400 focus:ring-red-500/20' : 'border-slate-200'
            }`}
          >
            <option value="">-- Select option --</option>
            {(field.options || []).map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          {errors[field.name] && (
            <p className="mt-1 text-xs text-red-500 font-medium">{errors[field.name]}</p>
          )}
        </div>
      )
    }

    if (type === 'checkbox') {
      return (
        <div key={field.id} className="py-1">
          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={!!formValues[field.name]}
              onChange={(e) => handleChange(field.name, e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500/20 focus:ring-offset-0 transition-colors"
            />
            <span className="text-sm font-semibold text-slate-700 group-hover:text-slate-900 transition-colors">
              {field.label || field.name}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </span>
          </label>
          {errors[field.name] && (
            <p className="mt-1.5 text-xs text-red-500 font-medium">{errors[field.name]}</p>
          )}
        </div>
      )
    }

    return (
      <Input
        key={field.id}
        type={type}
        label={`${field.label || field.name}${field.required ? ' *' : ''}`}
        placeholder={field.placeholder}
        value={formValues[field.name] || ''}
        onChange={(e) => handleChange(field.name, e.target.value)}
        error={errors[field.name]}
      />
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[75vh]">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error || (!loading && !currentTemplate)) {
    return (
      <div className="max-w-lg mx-auto mt-24 text-center bg-white border border-slate-100 p-8 rounded-2xl shadow-sm animate-fade-in">
        <div className="h-12 w-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-100">
          <AlertCircle className="h-6 w-6 text-red-500" />
        </div>
        <h1 className="text-xl font-bold text-slate-800 mb-2">Form Not Found</h1>
        <p className="text-sm text-slate-400 leading-relaxed">This form may have been disabled, removed, or the share URL is incorrect.</p>
      </div>
    )
  }

  if (result) {
    return (
      <div className="max-w-4xl mx-auto py-10 px-4 animate-scale-in">
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-emerald-50 rounded-2xl flex items-center justify-center border border-emerald-100 shrink-0">
                <CheckCircle2 className="h-6 w-6 text-emerald-500" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-slate-800">Document Successfully Generated</h1>
                <p className="text-xs text-slate-500">Your compiled PDF document is ready for viewing and download.</p>
              </div>
            </div>

            {result.download_url && (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <a
                  href={result.download_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 sm:flex-initial"
                >
                  <Button variant="outline" size="sm" className="w-full rounded-xl text-xs gap-1.5 border-slate-200">
                    <ExternalLink className="h-4 w-4" />
                    Open PDF
                  </Button>
                </a>
                <a
                  href={result.download_url}
                  download={`${currentTemplate?.name || 'generated_document'}.pdf`}
                  className="flex-1 sm:flex-initial"
                >
                  <Button size="sm" className="w-full rounded-xl text-xs font-bold gap-1.5">
                    <Download className="h-4 w-4" />
                    Download PDF
                  </Button>
                </a>
              </div>
            )}
          </div>

          {/* Embedded Viewer */}
          {result.download_url ? (
            <div className="rounded-2xl border border-slate-200 overflow-hidden h-[620px] bg-slate-100 shadow-inner">
              <iframe
                src={result.download_url}
                className="w-full h-full border-none"
                title="Generated Document Results"
              />
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500 text-sm">
              Document compilation completed.
            </div>
          )}

          {/* Action Footer */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <button
              onClick={() => setResult(null)}
              className="flex items-center gap-1.5 text-blue-600 font-semibold hover:text-blue-700 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Submit Another Response</span>
            </button>
            <span className="text-slate-400">Template-to-Document Generator</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 animate-fade-in">
      <div className="bg-white rounded-2xl border border-slate-100 p-6 sm:p-8 mb-6 shadow-sm">
        <div className="flex items-center gap-2 bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full w-fit mb-3">
          <FileText className="h-3.5 w-3.5" />
          <span>Interactive Document Form</span>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight leading-tight">{currentTemplate.name}</h1>
        {currentTemplate.description && (
          <p className="text-sm text-slate-400 mt-2.5 leading-relaxed">{currentTemplate.description}</p>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-2xl border border-slate-100 p-6 sm:p-8 space-y-6 shadow-sm">
          {fields.map(renderField)}
        </div>

        <div className="mt-8">
          <Button type="submit" size="lg" loading={submitting} className="w-full py-3 rounded-2xl font-bold">
            Submit &amp; Generate PDF
            <ChevronRight className="h-4.5 w-4.5" />
          </Button>
        </div>
      </form>
    </div>
  )
}
