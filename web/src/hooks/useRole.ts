import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from './useAuth'

export function useRole() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['role', user?.id],
    queryFn: async () => {
      if (!user) return null

      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (error) throw error
      return (data?.role as 'admin' | 'member') || null
    },
    enabled: !!user,
  })
}

