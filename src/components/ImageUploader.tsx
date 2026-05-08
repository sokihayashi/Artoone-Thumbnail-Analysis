import { useRef, useState } from 'react'
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
  const [isDragging, setIsDragging] = useState(false)

  const handleFiles = async (files: FileList | null) => {
    if (!files) return
    const newImages = await Promise.all(Array.from(files).map(fileToUploadedImage))
    onChange(multiple ? [...images, ...newImages] : newImages)
    if (inputRef.current) inputRef.current.value = ''
  }

  const onDragOver = (e: React.DragEvent) => e.preventDefault()
  const onDragEnter = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true) }
  const onDragLeave = (e: React.DragEvent) => {
    if ((e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) return
    setIsDragging(false)
  }
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleFiles(e.dataTransfer.files)
  }

  const remove = (i: number) => onChange(images.filter((_, idx) => idx !== i))
  const openPicker = () => inputRef.current?.click()

  return (
    <div className="field">
      <div className="field-label">
        {label}
        {required && <span className="field-required">*</span>}
        {hint && <span className="field-hint">{hint}</span>}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple={multiple}
        hidden
        onChange={(e) => handleFiles(e.target.files)}
      />

      {/* Single image: show it filling the 16:9 zone */}
      {!multiple && images.length === 1 ? (
        <div
          className={`upload upload--filled${isDragging ? ' upload--drag' : ''}`}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragEnter={onDragEnter}
          onDragLeave={onDragLeave}
          onClick={openPicker}
        >
          <img src={images[0].dataUrl} alt={images[0].name} className="upload-fill-img" />
          <button
            type="button"
            className="upload-fill-remove"
            onClick={(e) => { e.stopPropagation(); remove(0) }}
            title="削除"
          >×</button>
          {isDragging && <div className="upload-drag-overlay" />}
        </div>

      ) : multiple && images.length > 0 ? (
        /* Multiple images: full-width stacked tiles + small add button below */
        <div
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragEnter={onDragEnter}
          onDragLeave={onDragLeave}
        >
          <div className={`upload-grid${isDragging ? ' upload-grid--drag' : ''}`}>
            {images.map((img, i) => (
              <div key={i} className="upload-tile">
                <img src={img.dataUrl} alt={img.name} />
                <button
                  type="button"
                  className="upload-tile-remove"
                  onClick={() => remove(i)}
                  title="削除"
                >×</button>
              </div>
            ))}
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-sm upload-add-btn"
            onClick={openPicker}
          >
            ＋ 追加
          </button>
        </div>

      ) : (
        /* Empty drop zone */
        <div
          className={`upload${isDragging ? ' upload--drag' : ''}`}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragEnter={onDragEnter}
          onDragLeave={onDragLeave}
          onClick={openPicker}
        >
          <span>{isDragging ? 'ここにドロップ' : 'クリックまたはドラッグ&ドロップで画像を追加'}</span>
        </div>
      )}
    </div>
  )
}
