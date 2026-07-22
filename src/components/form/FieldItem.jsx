import { FIELD_TYPES } from '@/lib/constants'

export default function FieldItem({
  field,
  onUpdate,
  onRemove,
  isEditing,
  onToggleEdit,
}) {
  const handleChange = (key, value) => {
    onUpdate(field.id, { [key]: value })
  }

  const handleOptionsChange = (value) => {
    const options = value.split('\n').map((line) => {
      const trimmed = line.trim()
      if (!trimmed) return null
      return { label: trimmed, value: trimmed.toLowerCase().replace(/\s+/g, '_') }
    }).filter(Boolean)
    onUpdate(field.id, { options })
  }

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-white mb-3">
      {isEditing ? (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Field Name</label>
              <input
                type="text"
                value={field.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="e.g. full_name"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Label</label>
              <input
                type="text"
                value={field.label}
                onChange={(e) => handleChange('label', e.target.value)}
                className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="e.g. Full Name"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
              <select
                value={field.field_type}
                onChange={(e) => handleChange('field_type', e.target.value)}
                className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {FIELD_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Placeholder</label>
              <input
                type="text"
                value={field.placeholder || ''}
                onChange={(e) => handleChange('placeholder', e.target.value)}
                className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Default Value</label>
              <input
                type="text"
                value={field.default_value || ''}
                onChange={(e) => handleChange('default_value', e.target.value)}
                className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={field.required}
                  onChange={(e) => handleChange('required', e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span className="text-xs text-gray-600">Required</span>
              </label>
            </div>
          </div>

          {field.field_type === 'select' && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Options (one per line)
              </label>
              <textarea
                value={(field.options || []).map((o) => o.label).join('\n')}
                onChange={(e) => handleOptionsChange(e.target.value)}
                rows={3}
                className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Option 1&#10;Option 2&#10;Option 3"
              />
            </div>
          )}

          <div className="flex justify-end gap-2">
            <button
              onClick={onRemove}
              className="text-xs text-red-600 hover:text-red-700 cursor-pointer"
            >
              Remove
            </button>
            <button
              onClick={onToggleEdit}
              className="text-xs text-blue-600 hover:text-blue-700 cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">{field.label || field.name}</span>
              {field.required && (
                <span className="text-red-500 text-xs">Required</span>
              )}
            </div>
            <div className="text-xs text-gray-400 mt-0.5">
              Type: {FIELD_TYPES.find((t) => t.value === field.field_type)?.label || field.field_type}
              {field.name && field.name !== field.label && (
                <span className="ml-2">ID: {field.name}</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onToggleEdit}
              className="text-xs text-gray-500 hover:text-gray-700 cursor-pointer"
            >
              Edit
            </button>
            <button
              onClick={onRemove}
              className="text-xs text-red-500 hover:text-red-700 cursor-pointer"
            >
              Remove
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
