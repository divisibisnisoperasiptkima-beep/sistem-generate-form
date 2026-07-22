import { useRef, useEffect, useCallback } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import pdfjsWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import usePdfStore from '@/stores/usePdfStore'
import Spinner from '@/components/ui/Spinner'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl

export default function PdfViewer({ pdfUrl, onPdfLoaded, onPageRender, children, hideControls }) {
  const canvasRef = useRef(null)
  const containerRef = useRef(null)
  const renderTaskRef = useRef(null)
  const loadedUrlRef = useRef(null)
  const { pdfDocument, setPdfDocument, currentPage, setCurrentPage, numPages, scale } = usePdfStore()

  const loadPdf = useCallback(async (url) => {
    if (!url || typeof url !== 'string') return
    try {
      const loadingTask = pdfjsLib.getDocument({ url })
      const doc = await loadingTask.promise
      setPdfDocument(doc)
      onPdfLoaded?.(doc)
    } catch (err) {
      console.error('Failed to load PDF:', err)
    }
  }, [setPdfDocument, onPdfLoaded])

  useEffect(() => {
    if (!pdfUrl) {
      if (pdfDocument) setPdfDocument(null)
      loadedUrlRef.current = null
      return
    }
    if (loadedUrlRef.current === pdfUrl) return
    if (pdfDocument) {
      setPdfDocument(null)
      return
    }
    loadedUrlRef.current = pdfUrl
    loadPdf(pdfUrl)
    return () => {
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel()
      }
    }
  }, [pdfUrl, pdfDocument, loadPdf, setPdfDocument])

  const renderPage = useCallback(async (pageNum) => {
    if (!pdfDocument) return
    const canvas = canvasRef.current
    if (!canvas) return

    const page = await pdfDocument.getPage(pageNum)
    const viewport = page.getViewport({ scale })
    const context = canvas.getContext('2d')

    canvas.height = viewport.height
    canvas.width = viewport.width
    canvas.style.width = '100%'
    canvas.style.height = 'auto'

    const rect = canvas.getBoundingClientRect()
    onPageRender?.({
      width: viewport.width,
      height: viewport.height,
      displayRatio: rect.width > 0 ? viewport.width / rect.width : 1,
    })

    if (renderTaskRef.current) {
      renderTaskRef.current.cancel()
    }

    const renderContext = { canvasContext: context, viewport }
    renderTaskRef.current = page.render(renderContext)

    try {
      await renderTaskRef.current.promise
    } catch {
      // render cancelled
    }
  }, [pdfDocument, scale, onPageRender])

  useEffect(() => {
    renderPage(currentPage)
  }, [currentPage, scale, pdfDocument, renderPage])

  if (!pdfUrl) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
        <p className="text-gray-400">Upload a PDF to begin</p>
      </div>
    )
  }

  if (!pdfDocument) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
        <Spinner />
      </div>
    )
  }

  return (
    <div ref={containerRef} className="relative">
      {!hideControls && (
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage <= 1}
              className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 cursor-pointer disabled:cursor-default"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-sm text-gray-600">
              Page {currentPage} of {numPages}
            </span>
            <button
              onClick={() => setCurrentPage(Math.min(numPages, currentPage + 1))}
              disabled={currentPage >= numPages}
              className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 cursor-pointer disabled:cursor-default"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <div className="flex items-center gap-1">
            <button onClick={() => setScale(Math.max(0.5, scale - 0.25))} className="p-1 rounded hover:bg-gray-100 cursor-pointer">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
              </svg>
            </button>
            <span className="text-xs text-gray-500 w-10 text-center">{Math.round(scale * 100)}%</span>
            <button onClick={() => setScale(Math.min(3, scale + 0.25))} className="p-1 rounded hover:bg-gray-100 cursor-pointer">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <div className="relative border rounded-lg overflow-hidden bg-white shadow-sm">
        <canvas ref={canvasRef} className="block" />
        {children}
      </div>
    </div>
  )
}
