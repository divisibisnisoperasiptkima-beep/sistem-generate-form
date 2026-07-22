import { useState } from 'react'
import FieldItem from './FieldItem'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import { Plus } from 'lucide-react'

function generateFieldName(label) {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9\s_]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 50) || 'field'
}

const NEW_FIELD = () => ({
  id: `temp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
  name: '',
  label: '',
  field_type: 'text',
  required: false,
  placeholder: '',
  default_value: '',
  options: [],
})

export default function FieldBuilder({ fields, onSave, templateId }) {
  const [localFields, setLocalFields] = useState(() => fields.map((f) => ({ ...f })))
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)

  const handleAddField = () => {
    const field = NEW_FIELD()
    setLocalFields([...localFields, field])
    setEditingId(field.id)
  }

  const handleUpdateField = (id, updates) => {
    setLocalFields((prev) =>
      prev.map((f) => {
        if (f.id !== id) return f
        const updated = { ...f, ...updates }
        if (updates.label && (!f.name || f.name === generateFieldName(f.label))) {
          updated.name = generateFieldName(updates.label)
        }
        return updated
      })
    )
  }

  const handleRemoveField = (id) => {
    setLocalFields((prev) => prev.filter((f) => f.id !== id))
    if (editingId === id) setEditingId(null)
  }

  const handleSaveFields = async () => {
    setSaving(true)
    const cleaned = localFields.map(({ id: _id, ...rest }) => ({
      ...rest,
      name: rest.name || generateFieldName(rest.label || 'field'),
      label: rest.label || rest.name || 'Field',
    }))
    await onSave(templateId, cleaned)
    setSaving(false)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold">Form Fields</h2>
          <p className="text-sm text-gray-500">Define the fields that will appear on your form</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleAddField}>
            <Plus className="h-4 w-4" />
            Add Field
          </Button>
          <Button size="sm" onClick={handleSaveFields} loading={saving}>
            Save Fields
          </Button>
        </div>
      </div>

      {localFields.length === 0 ? (
        <EmptyState
          title="No fields yet"
          description="Add form fields that users will fill in. These fields will be mapped to positions on your PDF template."
          action={
            <Button variant="outline" onClick={handleAddField}>
              <Plus className="h-4 w-4" />
              Add Your First Field
            </Button>
          }
        />
      ) : (
        <div className="space-y-1">
          {localFields.map((field, idx) => (
            <div key={field.id} className="flex items-start gap-2">
              <span className="text-gray-400 text-sm mt-4 min-w-[24px]">{idx + 1}.</span>
              <div className="flex-1">
                <FieldItem
                  field={field}
                  onUpdate={handleUpdateField}
                  onRemove={() => handleRemoveField(field.id)}
                  isEditing={editingId === field.id}
                  onToggleEdit={() =>
                    setEditingId(editingId === field.id ? null : field.id)
                  }
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
