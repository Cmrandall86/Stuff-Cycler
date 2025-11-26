import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'
import { compress } from '@/lib/image'
import type { ItemFormData, ItemVisibilityGroup, ItemImageWithUrl } from './types'
import type { ItemImage } from '@/lib/types'

export const itemKeys = {
  all: ['items'] as const,
  one: (id: string) => [...itemKeys.all, id] as const,
  visibilityGroups: (id: string) => [...itemKeys.all, id, 'visibility-groups'] as const,
  images: (id: string) => [...itemKeys.all, id, 'images'] as const,
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

      // Delete all images from storage first
      const { data: images } = await supabase
        .from('item_images')
        .select('path')
        .eq('item_id', itemId)
      
      if (images && images.length > 0) {
        const paths = images.map(img => img.path)
        await supabase.storage.from('images').remove(paths)
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

// Fetch item images with signed URLs
export function useItemImages(itemId: string) {
  return useQuery({
    queryKey: itemKeys.images(itemId),
    enabled: !!itemId,
    queryFn: async (): Promise<ItemImageWithUrl[]> => {
      const { data: images, error } = await supabase
        .from('item_images')
        .select('*')
        .eq('item_id', itemId)
        .order('sort_order', { ascending: true })
      
      if (error) {
        console.error('Error fetching item images:', error)
        throw error
      }
      
      if (!images || images.length === 0) {
        return []
      }

      // Generate signed URLs for each image
      const imagesWithUrls = await Promise.all(
        images.map(async (img) => {
          const { data } = await supabase.storage
            .from('images')
            .createSignedUrl(img.path, 3600) // 1 hour expiry
          
          return {
            ...img,
            signed_url: data?.signedUrl,
          }
        })
      )
      
      return imagesWithUrls as ItemImageWithUrl[]
    },
  })
}

// Upload images for an item
export async function uploadItemImages(itemId: string, files: File[]): Promise<ItemImage[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Compress images
  const compressedFiles = await Promise.all(files.map(compress))
  
  // Get current max sort order
  const { data: existingImages } = await supabase
    .from('item_images')
    .select('sort_order')
    .eq('item_id', itemId)
    .order('sort_order', { ascending: false })
    .limit(1)
  
  const startSortOrder = (existingImages?.[0]?.sort_order ?? -1) + 1

  const uploadedImages: ItemImage[] = []

  for (let i = 0; i < compressedFiles.length; i++) {
    const file = compressedFiles[i]
    const timestamp = Date.now()
    const fileName = `${timestamp}_${i}.jpg`
    const path = `items/${itemId}/${fileName}`

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from('images')
      .upload(path, file, {
        contentType: 'image/jpeg',
        upsert: false,
      })

    if (uploadError) {
      console.error('Error uploading image:', uploadError)
      throw uploadError
    }

    // Insert record into database
    const { data: imageRecord, error: dbError } = await supabase
      .from('item_images')
      .insert({
        item_id: itemId,
        path: path,
        sort_order: startSortOrder + i,
      })
      .select()
      .single()

    if (dbError) {
      console.error('Error saving image record:', dbError)
      // Try to clean up the uploaded file
      await supabase.storage.from('images').remove([path])
      throw dbError
    }

    uploadedImages.push(imageRecord)
  }

  return uploadedImages
}

// Delete a single image
export function useDeleteImage() {
  const qc = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ imageId, itemId }: { imageId: string; itemId: string }) => {
      // Get the image path
      const { data: image, error: fetchError } = await supabase
        .from('item_images')
        .select('path, item_id')
        .eq('id', imageId)
        .single()
      
      if (fetchError) throw fetchError
      if (!image) throw new Error('Image not found')

      // Verify user owns the item
      const { data: item } = await supabase
        .from('items')
        .select('owner_id')
        .eq('id', image.item_id)
        .single()
      
      const { data: { user } } = await supabase.auth.getUser()
      if (item?.owner_id !== user?.id) {
        throw new Error('Not authorized to delete this image')
      }

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('images')
        .remove([image.path])
      
      if (storageError) {
        console.error('Error deleting from storage:', storageError)
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('item_images')
        .delete()
        .eq('id', imageId)
      
      if (dbError) throw dbError
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: itemKeys.images(variables.itemId) })
    },
  })
}

// Update image sort order
export async function updateImageOrder(itemId: string, imageIds: string[]): Promise<void> {
  const updates = imageIds.map((id, index) => 
    supabase
      .from('item_images')
      .update({ sort_order: index })
      .eq('id', id)
      .eq('item_id', itemId)
  )

  await Promise.all(updates)
}

