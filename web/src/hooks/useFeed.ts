import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabaseClient'
import type { Item, ItemPhoto } from '../lib/types'

export function useFeed() {
  return useQuery({
    queryKey: ['feed'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('items')
        .select('id,title,description,status,created_at,item_photos(storage_path)')
        .order('created_at', { ascending: false })
        .limit(50)
      if (error) throw error
      return data as (Item & { item_photos?: ItemPhoto[] })[]
    }
  })
}

