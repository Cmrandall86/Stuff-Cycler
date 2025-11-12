import { useParams } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabaseClient'
import type { Item } from '../lib/types'

export default function ItemDetail() {
  const { id } = useParams({ from: '/item/$id' })
  
  const { data: item, isLoading, error } = useQuery({
    queryKey: ['item', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('items')
        .select('*, item_photos(*), item_visibility(*)')
        .eq('id', id)
        .single()
      if (error) throw error
      return data as Item & { item_photos: any[], item_visibility: any[] }
    }
  })

  if (isLoading) return <div className="text-ink-500">Loading...</div>
  if (error) return <div className="text-red-500">Error: {error.message}</div>
  if (!item) return <div className="text-ink-600">Item not found</div>

  return (
    <div className="max-w-4xl mx-auto">
      <div className="card p-6">
        <h1 className="text-3xl font-bold mb-4 text-ink-400">{item.title}</h1>
        {item.description && (
          <p className="text-ink-500 mb-4">{item.description}</p>
        )}
        {item.condition && (
          <p className="text-ink-600 mb-2">Condition: {item.condition}</p>
        )}
        {item.category && (
          <p className="text-ink-600 mb-2">Category: {item.category}</p>
        )}
        {item.approx_location && (
          <p className="text-ink-600 mb-4">Location: {item.approx_location}</p>
        )}
        <div className="text-sm text-ink-600">
          Created: {new Date(item.created_at).toLocaleDateString()}
        </div>
      </div>
    </div>
  )
}

