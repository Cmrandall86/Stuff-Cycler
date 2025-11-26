import { useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card from '@/components/ui/Card'
import { useMyGroups } from '@/features/groups/api'
import { useCreateItem, useUpdateItem, useItemGroups } from './api'
import { supabase } from '@/lib/supabaseClient'
import type { Item } from '@/lib/types'

export default function ItemForm({ itemId, item }: { itemId?: string; item?: Item }) {
  const navigate = useNavigate()
  const { data: groups } = useMyGroups()
  const { data: existingVisibilityGroups } = useItemGroups(itemId ?? '')
  const createItem = useCreateItem()
  const updateItem = useUpdateItem(itemId ?? '')
  
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [condition, setCondition] = useState('')
  const [category, setCategory] = useState('')
  const [approxLocation, setApproxLocation] = useState('')
  const [visibility, setVisibility] = useState<'public' | 'groups'>('public')
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([])
  const [error, setError] = useState('')

  // Load existing item data for edit mode
  useEffect(() => {
    if (item) {
      setTitle(item.title || '')
      setDescription(item.description || '')
      setCondition(item.condition || '')
      setCategory(item.category || '')
      setApproxLocation(item.approx_location || '')
      setVisibility(item.visibility as 'public' | 'groups' || 'public')
    }
  }, [item])

  // Load existing visibility groups for edit mode
  useEffect(() => {
    if (existingVisibilityGroups && existingVisibilityGroups.length > 0) {
      setSelectedGroupIds(existingVisibilityGroups.map(vg => vg.group_id))
    }
  }, [existingVisibilityGroups])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validation
    if (!title.trim()) {
      setError('Title is required')
      return
    }

    if (visibility === 'groups' && selectedGroupIds.length === 0) {
      setError('Please select at least one group for visibility')
      return
    }

    const formData = {
      title,
      description,
      condition,
      category,
      approx_location: approxLocation,
      visibility,
      group_ids: visibility === 'groups' ? selectedGroupIds : [],
    }

    try {
      let newItem
      if (itemId) {
        newItem = await updateItem.mutateAsync(formData)
      } else {
        newItem = await createItem.mutateAsync(formData)
      }
      
      // Navigate to the item detail page
      navigate({ to: `/item/${newItem.id}` })
    } catch (err: any) {
      setError(err.message || 'Failed to save item')
    }
  }

  const handleGroupToggle = (groupId: string) => {
    setSelectedGroupIds(prev => 
      prev.includes(groupId) 
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    )
  }

  const isPending = createItem.isPending || updateItem.isPending

  return (
    <Card className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl text-ink-400 mb-6">
        {itemId ? 'Edit Item' : 'Create New Item'}
      </h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Item title"
          required
        />

        <div>
          <label className="block text-sm font-medium text-ink-400 mb-2">
            Description
          </label>
          <textarea
            className="w-full bg-base-900 border border-base-700 rounded-lg px-3 py-2 text-ink-400 min-h-[100px]"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your item..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Condition"
            value={condition}
            onChange={(e) => setCondition(e.target.value)}
            placeholder="e.g., New, Like New, Good"
          />

          <Input
            label="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="e.g., Books, Electronics"
          />
        </div>

        <Input
          label="Approximate Location"
          value={approxLocation}
          onChange={(e) => setApproxLocation(e.target.value)}
          placeholder="e.g., Downtown, North Side"
        />

        {/* Who can see this section */}
        <div className="border-t border-base-700 pt-6">
          <h3 className="text-lg text-ink-400 mb-4">Who can see this?</h3>
          
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="visibility"
                value="public"
                checked={visibility === 'public'}
                onChange={(e) => setVisibility(e.target.value as 'public' | 'groups')}
                className="w-4 h-4"
              />
              <div>
                <div className="text-ink-400">Public</div>
                <div className="text-ink-600 text-sm">Anyone can see this item</div>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="visibility"
                value="groups"
                checked={visibility === 'groups'}
                onChange={(e) => setVisibility(e.target.value as 'public' | 'groups')}
                className="w-4 h-4"
              />
              <div>
                <div className="text-ink-400">Specific Groups</div>
                <div className="text-ink-600 text-sm">Only members of selected groups can see this</div>
              </div>
            </label>
          </div>

          {/* Group selection */}
          {visibility === 'groups' && (
            <div className="mt-4 border border-base-700 rounded-lg p-4">
              <div className="text-sm text-ink-400 mb-3">Select groups:</div>
              {groups && groups.length > 0 ? (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {groups.map(group => (
                    <label key={group.id} className="flex items-center gap-2 cursor-pointer p-2 hover:bg-base-800 rounded">
                      <input
                        type="checkbox"
                        checked={selectedGroupIds.includes(group.id)}
                        onChange={() => handleGroupToggle(group.id)}
                        className="w-4 h-4"
                      />
                      <span className="text-ink-400">{group.name}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="text-ink-600 text-sm">
                  You don't belong to any groups yet. Create or join a group first.
                </div>
              )}
            </div>
          )}
        </div>

        {error && (
          <div className="text-red-500 text-sm">{error}</div>
        )}

        <div className="flex gap-3 pt-4">
          <Button
            type="submit"
            className="btn-accent"
            disabled={isPending}
          >
            {isPending ? 'Saving...' : (itemId ? 'Update Item' : 'Create Item')}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate({ to: '/' })}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  )
}

