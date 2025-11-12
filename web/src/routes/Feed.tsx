import { useFeed } from '../hooks/useFeed'
import ItemCard from '../components/ItemCard'

export default function Feed() {
  const { data: items, isLoading, error } = useFeed()

  if (isLoading) {
    return <div className="text-ink-500">Loading feed...</div>
  }

  if (error) {
    return <div className="text-red-500">Error loading feed: {error.message}</div>
  }

  if (!items || items.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-ink-600">No items yet. Create one to get started!</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((item) => (
        <ItemCard key={item.id} item={item} />
      ))}
    </div>
  )
}

