import { useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabaseClient'
import Button from '../components/ui/Button'
import type { Item } from '../lib/types'
import { useDeleteItem, useItemImages } from '@/features/items/api'

export default function ItemDetail() {
  const { id } = useParams({ from: '/item/$id' })
  const navigate = useNavigate()
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const deleteItem = useDeleteItem(id)
  const { data: images, isLoading: imagesLoading } = useItemImages(id)

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
          item_visibility_groups (
            item_id, group_id, tier
          )
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      return data as Item & {
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

        {/* Image Gallery */}
        {imagesLoading && (
          <div className="w-full h-96 bg-base-800 rounded-lg mb-6 flex items-center justify-center">
            <span className="text-ink-600">Loading images...</span>
          </div>
        )}
        {!imagesLoading && images && images.length > 0 && (
          <div className="mb-6">
            {/* Main Image */}
            <div className="relative w-full h-96 bg-base-800 rounded-lg overflow-hidden mb-4">
              <img
                src={images[selectedImageIndex]?.signed_url || ''}
                alt={`${item.title} - Image ${selectedImageIndex + 1}`}
                className="w-full h-full object-contain"
              />
              {images.length > 1 && (
                <>
                  <button
                    onClick={() => setSelectedImageIndex(prev => (prev - 1 + images.length) % images.length)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-base-900/80 hover:bg-base-900 text-ink-400 rounded-full w-10 h-10 flex items-center justify-center"
                  >
                    ←
                  </button>
                  <button
                    onClick={() => setSelectedImageIndex(prev => (prev + 1) % images.length)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-base-900/80 hover:bg-base-900 text-ink-400 rounded-full w-10 h-10 flex items-center justify-center"
                  >
                    →
                  </button>
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-base-900/80 px-3 py-1 rounded-full text-ink-400 text-sm">
                    {selectedImageIndex + 1} / {images.length}
                  </div>
                </>
              )}
            </div>
            {/* Thumbnail Strip */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {images.map((img, idx) => (
                  <button
                    key={img.id}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${
                      idx === selectedImageIndex ? 'border-mint-400' : 'border-base-700'
                    }`}
                  >
                    <img
                      src={img.signed_url || ''}
                      alt={`Thumbnail ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

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


