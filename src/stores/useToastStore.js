import { create } from 'zustand'

const useToastStore = create((set, get) => ({
  toasts: [],

  addToast: (message, type = 'info', duration = 4000) => {
    const id = crypto.randomUUID()
    set({ toasts: [...get().toasts, { id, message, type }] })
    setTimeout(() => {
      set({ toasts: get().toasts.filter(t => t.id !== id) })
    }, duration)
  },

  removeToast: (id) => {
    set({ toasts: get().toasts.filter(t => t.id !== id) })
  },
}))

export default useToastStore
