import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'
import type { ItemFormData, ItemVisibilityGroup } from './types'

export const itemKeys = {
  all: ['items'] as const,
  one: (id: string) => [...itemKeys.all, id] as const,
  visibilityGroups: (id: string) => [...itemKeys.all, id, 'visibility-groups'] as const,
}

// Fetch current visibility groups for an item
export function useItemGroups(itemId: string) {
  return useQuery({
    queryKey: itemKeys.visibilityGroups(itemId),
    enabled: !!itemId,
    queryFn: async (): Promise<ItemVisibilityGroup[]> => {
      const { data, error } = await supabase
        .from('item_visibility_groups')
        .select('*')
        .eq('item_id', itemId)
      
      if (error) {
        console.error('Error fetching item visibility groups:', error)
        throw error
      }
      
      return (data ?? []) as ItemVisibilityGroup[]
    },
  })
}

// Create a new item
export function useCreateItem() {
  const qc = useQueryClient()
  
  return useMutation({
    mutationFn: async (input: ItemFormData) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Create the item
      const { data: item, error: itemError } = await supabase
        .from('items')
        .insert({
          owner_id: user.id,
          title: input.title,
          description: input.description,
          condition: input.condition,
          category: input.category,
          approx_location: input.approx_location,
          visibility: input.visibility,
        })
        .select()
        .single()
      
      if (itemError) {
        console.error('Error creating item:', itemError)
        throw itemError
      }

      // If visibility is 'groups', add visibility groups
      if (input.visibility === 'groups' && input.group_ids.length > 0) {
        const visibilityGroups = input.group_ids.map(groupId => ({
          item_id: item.id,
          group_id: groupId,
          tier: 1, // Default tier
        }))

        const { error: visError } = await supabase
          .from('item_visibility_groups')
          .insert(visibilityGroups)
        
        if (visError) {
          console.error('Error setting item visibility:', visError)
          // Don't throw - item is created, just log the error
        }
      }

      return item
    },
    onSuccess: () => {
      // Invalidate feed queries
      qc.invalidateQueries({ queryKey: ['feed'] })
      qc.invalidateQueries({ queryKey: itemKeys.all })
    },
  })
}

// Update an existing item
export function useUpdateItem(itemId: string) {
  const qc = useQueryClient()
  
  return useMutation({
    mutationFn: async (input: ItemFormData) => {
      // Update the item
      const { data: item, error: itemError } = await supabase
        .from('items')
        .update({
          title: input.title,
          description: input.description,
          condition: input.condition,
          category: input.category,
          approx_location: input.approx_location,
          visibility: input.visibility,
        })
        .eq('id', itemId)
        .select()
        .single()
      
      if (itemError) {
        console.error('Error updating item:', itemError)
        throw itemError
      }

      // Delete existing visibility groups
      await supabase
        .from('item_visibility_groups')
        .delete()
        .eq('item_id', itemId)

      // If visibility is 'groups', add new visibility groups
      if (input.visibility === 'groups' && input.group_ids.length > 0) {
        const visibilityGroups = input.group_ids.map(groupId => ({
          item_id: itemId,
          group_id: groupId,
          tier: 1,
        }))

        const { error: visError } = await supabase
          .from('item_visibility_groups')
          .insert(visibilityGroups)
        
        if (visError) {
          console.error('Error updating item visibility:', visError)
        }
      }

      return item
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['feed'] })
      qc.invalidateQueries({ queryKey: itemKeys.one(itemId) })
      qc.invalidateQueries({ queryKey: itemKeys.visibilityGroups(itemId) })
    },
  })
}

// Delete an item
export function useDeleteItem(itemId: string) {
  const qc = useQueryClient()
  
  return useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Only owner can delete
      const { data: item } = await supabase
        .from('items')
        .select('owner_id')
        .eq('id', itemId)
        .single()
      
      if (item?.owner_id !== user.id) {
        throw new Error('Only the item owner can delete this item')
      }

      const { error } = await supabase
        .from('items')
        .delete()
        .eq('id', itemId)
      
      if (error) {
        console.error('Error deleting item:', error)
        throw error
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['feed'] })
      qc.invalidateQueries({ queryKey: itemKeys.all })
    },
  })
}

