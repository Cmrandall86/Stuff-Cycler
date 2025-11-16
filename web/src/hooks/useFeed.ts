import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabaseClient'
import type { Item, ItemImage } from '../lib/types'

export function useFeed() {
  return useQuery({
    queryKey: ['feed'],
    queryFn: async () => {
      console.log('🔍 Fetching feed from Supabase...')
      
      const { data, error } = await supabase
        .from('items')
        .select(`
          id, title, description, status, created_at,
          item_images ( id, path, sort_order )
        `)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) {
        console.error('❌ Supabase error fetching feed:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          fullError: error
        })
        throw error
      }

      console.log('✅ Feed fetched successfully:', data?.length, 'items')
      return data as (Item & {
        item_images?: ItemImage[]
      })[]
    },
  })
}


