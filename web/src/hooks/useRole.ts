import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/hooks/useAuth'

export function useRole() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['my-role', user?.id],
    enabled: !!user,
    staleTime: 60_000,
    refetchOnMount: 'always',  // <- ensure AdminGate gets data even if cache is cold
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_my_role')
      if (error) throw error
      return (data ?? 'member') as 'admin' | 'member'
    },
  })
}
