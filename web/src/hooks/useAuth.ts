// src/hooks/useAuth.ts
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabaseClient'
import { ensureUserBootstrap } from '@/lib/bootstrapUser'

// Optional: console helper in the browser
if (typeof window !== 'undefined') (window as any).supabase = supabase

type AuthContextValue = {
  user: User | null
  loading: boolean
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    // 1) Prime from current session
    ;(async () => {
      const { data } = await supabase.auth.getSession()
      const u = data.session?.user ?? null
      if (!mounted) return
      setUser(u)
      setLoading(false)
      if (u?.id) {
        // Bootstrap user in background, don't block UI
        ensureUserBootstrap(u.id).catch(err => console.error('Bootstrap error:', err))
      }
    })()

    // 2) Subscribe to auth changes
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      const u = session?.user ?? null
      if (!mounted) return
      setUser(u)
      setLoading(false)
      if (u?.id) {
        ensureUserBootstrap(u.id).catch(err => console.error('Bootstrap error:', err))
      }
    })

    return () => {
      mounted = false
      sub?.subscription?.unsubscribe()
    }
  }, [])

  const value = useMemo(() => ({ user, loading }), [user, loading])

  return React.createElement(AuthContext.Provider, { value }, children)
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
