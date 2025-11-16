import { useFeed } from '../hooks/useFeed'
import ItemCard from '../components/ItemCard'

export default function Feed() {
  const { data: items, isLoading, error } = useFeed()

  if (isLoading) {
    return <div className="text-ink-500">Loading feed...</div>
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto mt-8 p-6 bg-red-50 border border-red-200 rounded-lg">
        <h2 className="text-xl font-bold text-red-700 mb-2">Error loading feed</h2>
        <p className="text-red-600 mb-4">{error.message}</p>
        <details className="text-sm">
          <summary className="cursor-pointer text-red-700 font-medium mb-2">Technical Details</summary>
          <pre className="bg-red-100 p-3 rounded overflow-x-auto text-xs">
            {JSON.stringify(error, null, 2)}
          </pre>
        </details>
        <div className="mt-4 text-sm text-red-700">
          <p className="font-medium">Check your browser console for detailed error logs.</p>
          <p className="mt-2">Next steps:</p>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li>Open browser DevTools (F12) and check Console tab</li>
            <li>Look for error messages starting with ❌</li>
            <li>Check Supabase Dashboard → Logs → PostgREST for server errors</li>
          </ul>
        </div>
      </div>
    )
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

