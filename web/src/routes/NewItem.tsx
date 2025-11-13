import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/hooks/useAuth'
import ImageUploader from '@/components/ImageUploader'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

export default function NewItem() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [condition, setCondition] = useState('')
  const [category, setCategory] = useState('')
  const [location, setLocation] = useState('')
  const [photos, setPhotos] = useState<File[]>([])
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    try {
      // Create item
      const { data: item, error: itemError } = await supabase
        .from('items')
        .insert({
          owner_id: user.id,
          title,
          description,
          condition,
          category,
          approx_location: location,
          status: 'active'
        })
        .select()
        .single()

      if (itemError) throw itemError

      // Upload photos (simplified - would need signed URLs in real implementation)
      // TODO: Implement photo upload with signed URLs

      navigate({ to: '/item/$id', params: { id: item.id } })
    } catch (error) {
      console.error('Error creating item:', error)
      alert('Failed to create item')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="card p-6">
        <h1 className="text-2xl font-bold mb-6 text-ink-400">Create New Item</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <div>
            <label className="block text-ink-500 mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 bg-base-700 border border-base-600 rounded-2xl text-ink-400"
              rows={4}
            />
          </div>
          <Input
            label="Condition"
            value={condition}
            onChange={(e) => setCondition(e.target.value)}
          />
          <Input
            label="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
          <Input
            label="Approximate Location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
          <div>
            <label className="block text-ink-500 mb-2">Photos</label>
            <ImageUploader
              files={photos}
              onChange={setPhotos}
              maxFiles={5}
            />
          </div>
          <Button type="submit" disabled={loading} className="btn-accent">
            {loading ? 'Creating...' : 'Create Item'}
          </Button>
        </form>
      </div>
    </div>
  )
}


