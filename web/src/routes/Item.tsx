import { useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabaseClient'
import Button from '../components/ui/Button'
import type { Item } from '../lib/types'
import { useDeleteItem } from '@/features/items/api'

export default function ItemDetail() {
  const { id } = useParams({ from: '/item/$id' })
  const navigate = useNavigate()
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const deleteItem = useDeleteItem(id)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUserId(user?.id ?? null)
    })
  }, [])

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this item? This action cannot be undone.')) {
      deleteItem.mutate(undefined, {
        onSuccess: () => {
          navigate({ to: '/' })
        },
      })
    }
  }

  const { data: item, isLoading, error } = useQuery({
    queryKey: ['item', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('items')
        .select(`
          *,
          item_images (
            id, path, sort_order
          ),
          item_visibility_groups (
            item_id, group_id, tier
          )
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      return data as Item & {
        item_images: { id: string; path: string; sort_order: number }[]
        item_visibility_groups: { item_id: string; group_id: string; tier: number }[]
      }
    }
  })

  if (isLoading) return <div className="text-ink-500">Loading...</div>
  if (error) return <div className="text-red-500">Error: {error.message}</div>
  if (!item) return <div className="text-ink-600">Item not found</div>

  const isOwner = currentUserId && item.owner_id === currentUserId

  return (
    <div className="max-w-4xl mx-auto">
      <div className="card p-6">
        <div className="flex items-start justify-between mb-4">
          <h1 className="text-3xl font-bold text-ink-400">{item.title}</h1>
          {isOwner && (
            <div className="flex gap-2">
              <Link to={`/item/${id}/edit`}>
                <Button variant="secondary">Edit</Button>
              </Link>
              <Button 
                variant="danger" 
                onClick={handleDelete}
                disabled={deleteItem.isPending}
              >
                {deleteItem.isPending ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          )}
        </div>
        {item.description && <p className="text-ink-500 mb-4">{item.description}</p>}
        {item.condition && <p className="text-ink-600 mb-2">Condition: {item.condition}</p>}
        {item.category && <p className="text-ink-600 mb-2">Category: {item.category}</p>}
        {item.approx_location && <p className="text-ink-600 mb-4">Location: {item.approx_location}</p>}
        <div className="text-sm text-ink-600">
          Created: {new Date(item.created_at).toLocaleDateString()}
        </div>
      </div>
    </div>
  )
}


