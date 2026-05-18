import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string

const lockMap = new Map<string, Promise<unknown>>()

export const supabase = createClient(url, key, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    lock: async (name, _acquireTimeout, fn) => {
      const prev = lockMap.get(name) ?? Promise.resolve()
      let release!: () => void
      const next = new Promise<void>(r => { release = r })
      lockMap.set(name, prev.then(() => next))
      await prev
      try {
        return await fn()
      } finally {
        release()
      }
    },
  },
})
