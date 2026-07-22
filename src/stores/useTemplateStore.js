import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import { generateShareToken } from '@/lib/utils'

const useTemplateStore = create((set, get) => ({
  templates: [],
  currentTemplate: null,
  fields: [],
  placements: [],
  pdfUrl: null,
  loading: false,
  error: null,

  fetchTemplates: async () => {
    set({ loading: true, error: null })
    const { data, error } = await supabase
      .from('templates')
      .select('*')
      .order('updated_at', { ascending: false })

    if (error) { set({ error: error.message, loading: false }); return }
    set({ templates: data, loading: false })
  },

  fetchTemplate: async (id) => {
    set({ loading: true, error: null })
    const { data: template, error } = await supabase
      .from('templates')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (error) { set({ error: error.message, loading: false }); return }

    const { data: fields } = await supabase
      .from('template_fields')
      .select('*')
      .eq('template_id', id)
      .order('sort_order', { ascending: true })

    const { data: placements } = await supabase
      .from('field_placements')
      .select('*')
      .eq('template_id', id)

    set({
      currentTemplate: template,
      fields: fields || [],
      placements: placements || [],
      loading: false,
    })
  },

  createTemplate: async (name, description) => {
    set({ loading: true, error: null })
    const shareToken = generateShareToken()
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('templates')
      .insert({ name, description, share_token: shareToken, user_id: user.id })
      .select()
      .single()

    if (error) { set({ error: error.message, loading: false }); return null }
    set({ currentTemplate: data, fields: [], placements: [], loading: false })
    return data
  },

  updateTemplate: async (id, updates) => {
    const { error } = await supabase
      .from('templates')
      .update(updates)
      .eq('id', id)

    if (error) { set({ error: error.message }); return false }
    const { currentTemplate } = get()
    set({ currentTemplate: { ...currentTemplate, ...updates } })
    return true
  },

  uploadPdf: async (templateId, file) => {
    const filePath = `templates/${templateId}/${file.name}`
    const { error } = await supabase.storage
      .from('pdf-templates')
      .upload(filePath, file, { upsert: true })

    if (error) { set({ error: error.message }); return null }

    const { data: urlData } = supabase.storage
      .from('pdf-templates')
      .getPublicUrl(filePath)

    const publicUrl = urlData.publicUrl

    await supabase
      .from('templates')
      .update({ original_pdf_url: publicUrl })
      .eq('id', templateId)

    set({
      pdfUrl: publicUrl,
      currentTemplate: { ...get().currentTemplate, original_pdf_url: publicUrl },
    })
    return publicUrl
  },

  setPdfUrl: (url) => set({ pdfUrl: url }),

  saveFields: async (templateId, fields) => {
    await supabase.from('template_fields').delete().eq('template_id', templateId)

    if (fields.length === 0) { set({ fields: [] }); return true }

    const fieldsWithOrder = fields.map((f, i) => ({
      ...f,
      template_id: templateId,
      sort_order: i,
    }))

    const { error } = await supabase.from('template_fields').insert(fieldsWithOrder)
    if (error) { set({ error: error.message }); return false }

    const { data } = await supabase
      .from('template_fields')
      .select('*')
      .eq('template_id', templateId)
      .order('sort_order', { ascending: true })

    set({ fields: data || [] })
    return true
  },

  addField: async (templateId, field) => {
    const { fields } = get()
    const fieldData = {
      ...field,
      template_id: templateId,
      sort_order: fields.length,
    }

    const { data, error } = await supabase
      .from('template_fields')
      .insert(fieldData)
      .select()
      .single()

    if (error) { set({ error: error.message }); return null }
    set({ fields: [...fields, data] })
    return data
  },

  removeField: async (fieldId) => {
    const { fields } = get()
    await supabase.from('field_placements').delete().eq('field_id', fieldId)
    await supabase.from('template_fields').delete().eq('id', fieldId)
    set({ fields: fields.filter((f) => f.id !== fieldId) })
  },

  updateField: async (fieldId, updates) => {
    const { fields } = get()
    await supabase.from('template_fields').update(updates).eq('id', fieldId)
    set({ fields: fields.map((f) => (f.id === fieldId ? { ...f, ...updates } : f)) })
  },

  savePlacement: async (templateId, placement) => {
    const { placements } = get()
    let existingIdx = -1
    if (placement.id) {
      existingIdx = placements.findIndex((p) => p.id === placement.id)
    } else {
      existingIdx = placements.findIndex(
        (p) => p.field_id === placement.field_id && p.page === placement.page
      )
    }

    if (existingIdx >= 0) {
      const targetId = placement.id || placements[existingIdx].id
      const { data, error } = await supabase
        .from('field_placements')
        .update(placement)
        .eq('id', targetId)
        .select()
        .maybeSingle()

      if (error) { set({ error: error.message }); return null }

      const updated = [...placements]
      updated[existingIdx] = data
      set({ placements: updated })
      return data
    }

    const { data, error } = await supabase
      .from('field_placements')
      .insert({ ...placement, template_id: templateId })
      .select()
      .single()

    if (error) { set({ error: error.message }); return null }
    set({ placements: [...placements, data] })
    return data
  },

  removePlacement: async (placementId) => {
    const { placements } = get()
    await supabase.from('field_placements').delete().eq('id', placementId)
    set({ placements: placements.filter((p) => p.id !== placementId) })
  },

  deleteTemplate: async (id) => {
    const { error } = await supabase.from('templates').delete().eq('id', id)
    if (error) { set({ error: error.message }); return false }
    const { templates } = get()
    set({ templates: templates.filter((t) => t.id !== id) })
    return true
  },

  publishTemplate: async (id) => {
    return get().updateTemplate(id, { is_published: true })
  },

  unpublishTemplate: async (id) => {
    return get().updateTemplate(id, { is_published: false })
  },

  generatePdf: async (templateId, formData) => {
    set({ error: null })
    const { data, error } = await supabase.functions.invoke('generate-pdf', {
      body: { template_id: templateId, data: formData },
    })

    if (error) { set({ error: error.message }); return null }
    return data
  },

  submitForm: async (shareToken, formData) => {
    const { data, error } = await supabase.functions.invoke('get-public-template', {
      body: { share_token: shareToken, data: formData, action: 'submit' },
    })

    if (error) { set({ error: error.message }); return null }
    return data
  },

  fetchPublicTemplate: async (shareToken) => {
    set({ loading: true, error: null })
    const { data, error } = await supabase.functions.invoke('get-public-template', {
      body: { share_token: shareToken, action: 'get' },
    })

    if (error) { set({ error: error.message, loading: false }); return null }
    set({ currentTemplate: data.template, fields: data.fields, loading: false })
    return data
  },

  clearError: () => set({ error: null }),
}))

export default useTemplateStore
