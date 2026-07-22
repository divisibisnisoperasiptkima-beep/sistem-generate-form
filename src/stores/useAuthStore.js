import { create } from 'zustand'
import { supabase } from '@/lib/supabase'

const useAuthStore = create((set) => ({
  user: null,
  session: null,
  loading: true,

  init: async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) console.error('Auth init error:', error.message)
      set({ session, user: session?.user ?? null, loading: false })

      supabase.auth.onAuthStateChange((event, session) => {
        set({ session, user: session?.user ?? null })
      })
    } catch (err) {
      console.error('Auth init failed:', err)
      set({ loading: false })
    }
  },

  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    return { data, error }
  },

  signUp: async (email, password) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin },
    })
    return { data, error }
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null, session: null })
  },
}))

export default useAuthStore
