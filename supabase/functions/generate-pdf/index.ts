import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { PDFDocument, StandardFonts, rgb } from 'https://esm.sh/pdf-lib@1.17.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { template_id, data } = await req.json()

    if (!template_id || !data) {
      return new Response(
        JSON.stringify({ error: 'Missing template_id or data' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(
      Deno.env.get('PROJECT_URL') ?? '',
      Deno.env.get('SERVICE_ROLE_KEY') ?? ''
    )

    // Fetch template info
    const { data: template, error: templateError } = await supabase
      .from('templates')
      .select('*')
      .eq('id', template_id)
      .single()

    if (templateError || !template) {
      return new Response(
        JSON.stringify({ error: 'Template not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fetch placements
    const { data: placements } = await supabase
      .from('field_placements')
      .select('*')
      .eq('template_id', template_id)

    // Fetch fields
    const { data: fields } = await supabase
      .from('template_fields')
      .select('*')
      .eq('template_id', template_id)
      .order('sort_order', { ascending: true })

    if (!template.original_pdf_url) {
      return new Response(
        JSON.stringify({ error: 'Template has no PDF uploaded' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Download the original PDF from storage
    const pdfResponse = await fetch(template.original_pdf_url)
    if (!pdfResponse.ok) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch original PDF' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const pdfBytes = await pdfResponse.arrayBuffer()
    const pdfDoc = await PDFDocument.load(pdfBytes)
    const pages = pdfDoc.getPages()

    // Cache font families
    const fonts = {
      Helvetica: await pdfDoc.embedFont(StandardFonts.Helvetica),
      HelveticaBold: await pdfDoc.embedFont(StandardFonts.HelveticaBold),
      HelveticaOblique: await pdfDoc.embedFont(StandardFonts.HelveticaOblique),
      HelveticaBoldOblique: await pdfDoc.embedFont(StandardFonts.HelveticaBoldOblique),

      Times: await pdfDoc.embedFont(StandardFonts.TimesRoman),
      TimesBold: await pdfDoc.embedFont(StandardFonts.TimesRomanBold),
      TimesItalic: await pdfDoc.embedFont(StandardFonts.TimesRomanItalic),
      TimesBoldItalic: await pdfDoc.embedFont(StandardFonts.TimesRomanBoldItalic),

      Courier: await pdfDoc.embedFont(StandardFonts.Courier),
      CourierBold: await pdfDoc.embedFont(StandardFonts.CourierBold),
      CourierOblique: await pdfDoc.embedFont(StandardFonts.CourierOblique),
      CourierBoldOblique: await pdfDoc.embedFont(StandardFonts.CourierBoldOblique),
    }

    // Overlay text for each placement
    for (const placement of placements || []) {
      const field = (fields || []).find((f) => f.id === placement.field_id)
      if (!field) continue

      const rawValue = data[field.name]
      const value = rawValue !== undefined && rawValue !== null ? String(rawValue) : ''
      if (!value && value !== '0') continue

      const pageIndex = (placement.page || 1) - 1
      if (pageIndex >= pages.length) continue

      const page = pages[pageIndex]

      const displayValue = field.field_type === 'checkbox'
        ? (rawValue ? '\u2713' : '')
        : value

      if (!displayValue) continue

      const font = selectFont(fonts, placement.font_family, placement.font_style)
      const pageHeight = page.getHeight()

      let fontSize = placement.font_size || 12
      const boxX = placement.x || 0
      const boxWidth = placement.width || 150
      const boxHeight = placement.height || 20
      const padding = placement.padding || 0
      const contentWidth = Math.max(10, boxWidth - padding * 2)
      const contentHeight = Math.max(10, boxHeight - padding * 2)

      // Auto-fit font scaling
      if (placement.auto_fit_font) {
        const minSize = placement.min_font_size || 6
        while (fontSize > minSize) {
          const testLines = placement.word_wrap
            ? wrapText(displayValue, contentWidth, fontSize, font)
            : [displayValue]
          const testTotalHeight = testLines.length * fontSize * 1.15
          if (testTotalHeight <= contentHeight) break
          fontSize -= 0.5
        }
      }

      // Wrap lines
      const lines = placement.word_wrap
        ? wrapText(displayValue, contentWidth, fontSize, font)
        : [displayValue]

      const lineHeight = fontSize * 1.15
      const totalTextHeight = lines.length * lineHeight

      // Optional Background & Border
      if (placement.bg_color || (placement.border_width && placement.border_color)) {
        const rectY = pageHeight - (placement.y || 0) - boxHeight
        const drawOptions: any = {
          x: boxX,
          y: rectY,
          width: boxWidth,
          height: boxHeight,
          opacity: placement.opacity ?? 1,
        }
        if (placement.bg_color) {
          const bgRgb = hexToRgb(placement.bg_color)
          drawOptions.color = rgb(bgRgb.r, bgRgb.g, bgRgb.b)
        }
        if (placement.border_width && placement.border_color) {
          const bRgb = hexToRgb(placement.border_color)
          drawOptions.borderColor = rgb(bRgb.r, bRgb.g, bRgb.b)
          drawOptions.borderWidth = placement.border_width
        }
        page.drawRectangle(drawOptions)
      }

      // Vertical alignment calculation (matching HTML flexbox alignment)
      const fontAscent = fontSize * 0.72
      const topY = pageHeight - (placement.y || 0) - padding
      let startY = topY - fontAscent
      const vertAlign = placement.vertical_align || 'middle'

      if (vertAlign === 'middle') {
        const boxCenterY = pageHeight - (placement.y || 0) - boxHeight / 2
        // Position first line so entire text block is centered vertically in box
        startY = boxCenterY + (totalTextHeight / 2) - fontAscent
      } else if (vertAlign === 'bottom') {
        const bottomY = pageHeight - (placement.y || 0) - boxHeight + padding
        startY = bottomY + totalTextHeight - fontAscent
      }

      const color = hexToRgb(placement.font_color || '#000000')

      // Draw each line of text
      lines.forEach((lineText, index) => {
        const currentLineY = startY - index * lineHeight
        const textX = getAlignedX(
          boxX + padding,
          contentWidth,
          lineText,
          placement.text_align || 'left',
          fontSize,
          font
        )

        page.drawText(lineText, {
          x: textX,
          y: currentLineY,
          size: fontSize,
          font,
          color: rgb(color.r, color.g, color.b),
          opacity: placement.opacity ?? 1,
        })
      })
    }

    const modifiedPdfBytes = await pdfDoc.save()

    // Upload generated PDF to storage
    const fileName = `generated/${template_id}/${crypto.randomUUID()}.pdf`
    const { error: uploadError } = await supabase.storage
      .from('pdf-outputs')
      .upload(fileName, modifiedPdfBytes, {
        contentType: 'application/pdf',
        upsert: false,
      })

    if (uploadError) {
      return new Response(
        JSON.stringify({ error: 'Failed to upload generated PDF' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: urlData } = supabase.storage
      .from('pdf-outputs')
      .getPublicUrl(fileName)

    // Save submission record
    const { error: submissionError } = await supabase
      .from('submissions')
      .insert({
        template_id,
        data,
        status: 'completed',
        generated_pdf_url: urlData.publicUrl,
      })

    if (submissionError) {
      console.error('Submission save error:', submissionError)
    }

    return new Response(
      JSON.stringify({
        success: true,
        download_url: urlData.publicUrl,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

function selectFont(fonts: any, family?: string, style?: string) {
  const isBold = style === 'bold' || style === 'bolditalic'
  const isItalic = style === 'italic' || style === 'bolditalic'

  if (family === 'Times-Roman' || family === 'Times') {
    if (isBold && isItalic) return fonts.TimesBoldItalic
    if (isBold) return fonts.TimesBold
    if (isItalic) return fonts.TimesItalic
    return fonts.Times
  }

  if (family === 'Courier') {
    if (isBold && isItalic) return fonts.CourierBoldOblique
    if (isBold) return fonts.CourierBold
    if (isItalic) return fonts.CourierOblique
    return fonts.Courier
  }

  // Default to Helvetica
  if (isBold && isItalic) return fonts.HelveticaBoldOblique
  if (isBold) return fonts.HelveticaBold
  if (isItalic) return fonts.HelveticaOblique
  return fonts.Helvetica
}

function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? { r: parseInt(result[1], 16) / 255, g: parseInt(result[2], 16) / 255, b: parseInt(result[3], 16) / 255 }
    : { r: 0, g: 0, b: 0 }
}

function wrapText(text: string, maxWidth: number, fontSize: number, font: any): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let currentLine = ''

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word
    const testWidth = font.widthOfTextAtSize(testLine, fontSize)
    if (testWidth <= maxWidth) {
      currentLine = testLine
    } else {
      if (currentLine) lines.push(currentLine)
      currentLine = word
    }
  }
  if (currentLine) lines.push(currentLine)
  return lines.length > 0 ? lines : [text]
}

function getAlignedX(x: number, width: number, text: string, align: string, fontSize: number, font: any): number {
  if (align === 'center') {
    const textWidth = font.widthOfTextAtSize(text, fontSize)
    return x + Math.max(0, (width - textWidth) / 2)
  }
  if (align === 'right') {
    const textWidth = font.widthOfTextAtSize(text, fontSize)
    return x + Math.max(0, width - textWidth)
  }
  return x
}
