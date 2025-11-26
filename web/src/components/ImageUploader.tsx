import { useState, useRef } from 'react'
import { compress } from '../lib/image'
import Button from './ui/Button'
import type { ImageFile } from '@/features/items/types'

interface ImageUploaderProps {
  images: ImageFile[]
  onChange: (images: ImageFile[]) => void
  onRemove: (id: string) => void
  maxFiles?: number
}

export default function ImageUploader({ images, onChange, onRemove, maxFiles = 5 }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    if (images.length + selectedFiles.length > maxFiles) {
      alert(`Maximum ${maxFiles} files allowed`)
      return
    }

    setUploading(true)
    try {
      const compressedFiles = await Promise.all(selectedFiles.map(compress))
      const newImages: ImageFile[] = compressedFiles.map((file, index) => ({
        id: `new-${Date.now()}-${index}`,
        file,
        isExisting: false,
        sortOrder: images.length + index,
      }))
      onChange([...images, ...newImages])
    } catch (error) {
      console.error('Error compressing images:', error)
      alert('Failed to process images')
    } finally {
      setUploading(false)
    }
    // Reset input
    e.target.value = ''
  }

  const handleButtonClick = () => {
    fileInputRef.current?.click()
  }

  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return

    const newImages = [...images]
    const draggedImage = newImages[draggedIndex]
    newImages.splice(draggedIndex, 1)
    newImages.splice(index, 0, draggedImage)

    // Update sort orders
    const updatedImages = newImages.map((img, idx) => ({
      ...img,
      sortOrder: idx,
    }))

    onChange(updatedImages)
    setDraggedIndex(index)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
  }

  const getImageUrl = (image: ImageFile): string => {
    if (image.url) return image.url
    if (image.file) return URL.createObjectURL(image.file)
    return ''
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          capture="environment"
          onChange={handleFileSelect}
          disabled={uploading || images.length >= maxFiles}
          className="hidden"
        />
        <Button
          type="button"
          variant="secondary"
          onClick={handleButtonClick}
          disabled={uploading || images.length >= maxFiles}
        >
          {uploading ? 'Processing...' : `Add Images (${images.length}/${maxFiles})`}
        </Button>
        {images.length > 0 && (
          <span className="text-sm text-ink-600">
            Drag to reorder
          </span>
        )}
      </div>
      
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mt-4">
          {images.map((image, index) => (
            <div
              key={image.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`relative cursor-move ${draggedIndex === index ? 'opacity-50' : ''}`}
            >
              <img
                src={getImageUrl(image)}
                alt={`Preview ${index + 1}`}
                className="w-full h-24 object-cover rounded-lg border-2 border-base-700"
              />
              {index === 0 && (
                <div className="absolute bottom-1 left-1 bg-mint-500 text-base-900 text-xs px-2 py-0.5 rounded">
                  Cover
                </div>
              )}
              <button
                type="button"
                onClick={() => onRemove(image.id)}
                className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold shadow-lg"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

