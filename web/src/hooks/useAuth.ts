import { useEffect, useState } from 'react'

import { supabase } from '@/lib/supabaseClient'

import type { User } from '@supabase/supabase-js'

import { ensureUserBootstrap } from '@/lib/bootstrapUser'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    ;(async () => {
      const { data } = await supabase.auth.getUser()
      const u = data.user ?? null
      if (mounted) {
        setUser(u)
        setLoading(false)
      }
      if (u) {
        // Bootstrap user in background, don't block auth state
        ensureUserBootstrap(u.id).catch(err => {
          console.error('Bootstrap error:', err)
        })
      }
    })()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_evt, session) => {
      const u = session?.user ?? null
      if (mounted) {
        setUser(u)
        setLoading(false)
      }
      if (u) {
        // Bootstrap user in background, don't block auth state
        ensureUserBootstrap(u.id).catch(err => {
          console.error('Bootstrap error:', err)
        })
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  return { user, loading }
}

