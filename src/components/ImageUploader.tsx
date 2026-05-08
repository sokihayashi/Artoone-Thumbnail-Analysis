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
          className="upload upload--filled"
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={openPicker}
        >
          <img src={images[0].dataUrl} alt={images[0].name} className="upload-fill-img" />
          <button
            type="button"
            className="upload-fill-remove"
            onClick={(e) => { e.stopPropagation(); remove(0) }}
            title="削除"
          >×</button>
        </div>

      ) : multiple && images.length > 0 ? (
        /* Multiple images: 16:9 grid + add tile */
        <div className="upload-grid">
          {images.map((img, i) => (
            <div
              key={i}
              className="upload-tile"
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
            >
              <img src={img.dataUrl} alt={img.name} />
              <button
                type="button"
                className="upload-tile-remove"
                onClick={() => remove(i)}
                title="削除"
              >×</button>
            </div>
          ))}
          <div
            className="upload upload--add"
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={openPicker}
          >
            <span>＋ 追加</span>
          </div>
        </div>

      ) : (
        /* Empty drop zone */
        <div
          className="upload"
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={openPicker}
        >
          <span>クリックまたはドラッグ&ドロップで画像を追加</span>
        </div>
      )}
    </div>
  )
}
