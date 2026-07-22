/**
 * Helper utility to scan a PDF document text layer for field placeholders
 * such as {{field_name}}, {field_name}, or direct field label matches.
 */

export async function detectPdfPlaceholders(pdfDocument, fields) {
  if (!pdfDocument || !fields || fields.length === 0) return []

  const detectedPlacements = []
  const numPages = pdfDocument.numPages

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdfDocument.getPage(pageNum)
    const viewport = page.getViewport({ scale: 1.0 })
    const textContent = await page.getTextContent()

    // Group adjacent items on the same line if needed
    const items = textContent.items || []

    for (const item of items) {
      if (!item.str || typeof item.str !== 'string') continue
      const str = item.str.trim()
      if (!str) continue

      // Search for matching field
      for (const field of fields) {
        const fieldName = field.name.toLowerCase()
        const fieldLabel = field.label ? field.label.toLowerCase() : fieldName

        // Check for placeholder patterns: {{fieldName}}, {fieldName}, or exact field label/name match
        const matchesPlaceholder =
          str.includes(`{{${fieldName}}}`) ||
          str.includes(`{${fieldName}}`) ||
          str.includes(`{{${fieldLabel}}}`) ||
          str.includes(`{${fieldLabel}}`) ||
          str.toLowerCase() === fieldName ||
          str.toLowerCase() === fieldLabel

        if (matchesPlaceholder) {
          // item.transform = [scaleX, skewX, skewY, scaleY, translateX, translateY]
          const transform = item.transform
          const x = transform[4]
          const fontHeight = Math.abs(transform[3]) || item.height || 12
          const y = viewport.height - transform[5] - fontHeight

          const width = Math.max(80, item.width || 120)
          const height = Math.max(16, fontHeight + 4)

          detectedPlacements.push({
            field_id: field.id,
            page: pageNum,
            x: Math.max(0, Math.round(x)),
            y: Math.max(0, Math.round(y)),
            width: Math.round(width),
            height: Math.round(height),
            font_size: Math.round(fontHeight),
            font_family: 'Helvetica',
            font_color: '#000000',
            text_align: 'left',
            vertical_align: 'middle',
            font_style: 'normal',
            word_wrap: true,
            auto_fit_font: false,
          })
        }
      }
    }
  }

  return detectedPlacements
}
