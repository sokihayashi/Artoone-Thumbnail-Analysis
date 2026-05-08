import { useRef } from 'react'
import type { UploadedImage } from '../types'
import { fileToUploadedImage } from '../utils/imageUtils'

interface Props {
  images: UploadedImage[]
  onChange: (images: UploadedImage[]) => void
  label: string
  multiple?: boolean
  required?: boolean
}

export default function ImageUploader({ images, onChange, label, multiple = true, required = false }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFiles = async (files: FileList | null) => {
    if (!files) return
    const newImages = await Promise.all(Array.from(files).map(fileToUploadedImage))
    onChange(multiple ? [...images, ...newImages] : newImages)
    if (inputRef.current) inputRef.current.value = ''
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    handleFiles(e.dataTransfer.files)
  }

  const remove = (i: number) => {
    onChange(images.filter((_, idx) => idx !== i))
  }

  return (
    <div className="field-group">
      <label>
        {label}
        {required && <span className="required">*</span>}
      </label>
      <div
        className="drop-zone"
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple={multiple}
          hidden
          onChange={(e) => handleFiles(e.target.files)}
        />
        <span className="drop-zone-text">
          クリックまたはドラッグ&ドロップで画像を追加
        </span>
      </div>
      {images.length > 0 && (
        <div className="image-previews">
          {images.map((img, i) => (
            <div key={i} className="image-preview-item">
              <img src={img.dataUrl} alt={img.name} />
              <button
                type="button"
                className="remove-image"
                onClick={(e) => { e.stopPropagation(); remove(i) }}
              >
                ×
              </button>
              <span className="image-name">{img.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
