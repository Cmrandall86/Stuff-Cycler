import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabaseClient'
import type { Item, ItemImage } from '../lib/types'

type ItemWithImages = Item & {
  item_images?: (ItemImage & { signed_url?: string })[]
}

export function useFeed() {
  return useQuery({
    queryKey: ['feed'],
    queryFn: async (): Promise<ItemWithImages[]> => {
      console.log('🔍 Fetching feed from Supabase...')
      
      const { data, error } = await supabase
        .from('items')
        .select(`
          id, title, description, status, created_at, category,
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
      
      // Generate signed URLs for first image of each item
      const itemsWithSignedUrls = await Promise.all(
        (data || []).map(async (item) => {
          if (item.item_images && item.item_images.length > 0) {
            // Sort by sort_order and get first image
            const sortedImages = [...item.item_images].sort((a, b) => a.sort_order - b.sort_order)
            const firstImage = sortedImages[0]
            
            try {
              const { data: signedUrlData } = await supabase.storage
                .from('images')
                .createSignedUrl(firstImage.path, 3600) // 1 hour expiry
              
              return {
                ...item,
                item_images: [{
                  ...firstImage,
                  signed_url: signedUrlData?.signedUrl
                }]
              }
            } catch (err) {
              console.error('Error generating signed URL for image:', err)
              return {
                ...item,
                item_images: [firstImage]
              }
            }
          }
          return item
        })
      )

      return itemsWithSignedUrls as ItemWithImages[]
    },
  })
}


