import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'
import type { Group } from '@/lib/types'

export function useGroups() {
  return useQuery({
    queryKey: ['groups'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) {
        // If 403, user might not have groups yet - return empty array
        if (error.code === 'PGRST301' || error.message?.includes('403')) {
          return [] as Group[]
        }
        throw error
      }
      return (data || []) as Group[]
    },
    retry: false, // Don't retry on auth errors
  })
}

