import { useRef } from 'react'
import type { UploadedImage } from '../types'
import { fileToUploadedImage } from '../utils/imageUtils'

interface Props {
  images: UploadedImage[]
  onChange: (images: UploadedImage[]) => void
  label: string
  hint?: string
  multiple?: boolean
  required?: boolean
}

export default function ImageUploader({ images, onChange, label, hint, multiple = true, required = false }: Props) {
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
    <div className="field">
      <div className="field-label">
        {label}
        {required && <span className="field-required">*</span>}
        {hint && <span className="field-hint">{hint}</span>}
      </div>
      <div
        className="upload"
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
        <span>クリックまたはドラッグ&ドロップで画像を追加</span>
      </div>
      {images.length > 0 && (
        <div className="image-grid">
          {images.map((img, i) => (
            <div key={i} className="image-thumb">
              <img src={img.dataUrl} alt={img.name} />
              <button
                type="button"
                className="image-thumb-remove"
                onClick={(e) => { e.stopPropagation(); remove(i) }}
                title="削除"
              >
                ×
              </button>
              <span className="image-thumb-name">{img.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
