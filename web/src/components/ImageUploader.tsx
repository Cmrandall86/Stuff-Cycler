import { useState } from 'react'
import { compress } from '../lib/image'
import Button from './ui/Button'

interface ImageUploaderProps {
  files: File[]
  onChange: (files: File[]) => void
  maxFiles?: number
}

export default function ImageUploader({ files, onChange, maxFiles = 5 }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    if (files.length + selectedFiles.length > maxFiles) {
      alert(`Maximum ${maxFiles} files allowed`)
      return
    }

    setUploading(true)
    try {
      const compressedFiles = await Promise.all(selectedFiles.map(compress))
      onChange([...files, ...compressedFiles])
    } catch (error) {
      console.error('Error compressing images:', error)
      alert('Failed to process images')
    } finally {
      setUploading(false)
    }
  }

  const removeFile = (index: number) => {
    onChange(files.filter((_, i) => i !== index))
  }

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        disabled={uploading || files.length >= maxFiles}
        className="hidden"
        id="image-upload"
      />
      <label htmlFor="image-upload">
        <Button
          type="button"
          variant="secondary"
          disabled={uploading || files.length >= maxFiles}
          className="cursor-pointer"
        >
          {uploading ? 'Processing...' : `Upload Images (${files.length}/${maxFiles})`}
        </Button>
      </label>
      {files.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mt-4">
          {files.map((file, index) => (
            <div key={index} className="relative">
              <img
                src={URL.createObjectURL(file)}
                alt={`Preview ${index + 1}`}
                className="w-full h-24 object-cover rounded-lg"
              />
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm"
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

