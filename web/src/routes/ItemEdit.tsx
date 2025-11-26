import { useParams } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'
import ItemForm from '@/features/items/ItemForm'
import type { Item } from '@/lib/types'

export default function ItemEdit() {
  const { id } = useParams({ from: '/item/$id/edit' })

  const { data: item, isLoading, error } = useQuery({
    queryKey: ['item', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      return data as Item
    }
  })

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto py-6">
        <div className="text-ink-500">Loading...</div>
      </div>
    )
  }

  if (error || !item) {
    return (
      <div className="max-w-5xl mx-auto py-6">
        <div className="text-red-500">Error loading item: {error?.message || 'Item not found'}</div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto py-6">
      <ItemForm itemId={id} item={item} />
    </div>
  )
}

