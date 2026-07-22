import { create } from 'zustand'

const usePdfStore = create((set) => ({
  pdfDocument: null,
  numPages: 0,
  currentPage: 1,
  scale: 1.5,
  selectedFieldId: null,
  selectedPlacementId: null,
  snapToGrid: false,
  gridSize: 10,
  previewMode: false,
  previewData: {},

  setPdfDocument: (doc) => set({ pdfDocument: doc, numPages: doc ? doc.numPages : 0 }),
  setCurrentPage: (page) => set({ currentPage: page }),
  setScale: (scale) => set({ scale }),
  setSelectedFieldId: (id) => set({ selectedFieldId: id, selectedPlacementId: null }),
  setSelectedPlacementId: (id) => set({ selectedPlacementId: id }),
  setSnapToGrid: (snapToGrid) => set({ snapToGrid }),
  setGridSize: (gridSize) => set({ gridSize }),
  setPreviewMode: (mode) => set({ previewMode: mode }),
  setPreviewData: (data) => set({ previewData: data }),
  clearPdf: () => set({
    pdfDocument: null,
    numPages: 0,
    currentPage: 1,
    selectedFieldId: null,
    selectedPlacementId: null,
    snapToGrid: false,
    gridSize: 10,
    previewMode: false,
    previewData: {},
  }),
}))

export default usePdfStore

