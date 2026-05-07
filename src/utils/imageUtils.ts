import type { UploadedImage } from '../types'

export async function fileToUploadedImage(file: File): Promise<UploadedImage> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string
      const base64 = dataUrl.split(',')[1]
      const mediaType = file.type || 'image/jpeg'
      resolve({ name: file.name, dataUrl, base64, mediaType })
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function buildImageContent(image: UploadedImage) {
  return {
    type: 'image' as const,
    source: {
      type: 'base64' as const,
      media_type: image.mediaType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
      data: image.base64,
    },
  }
}
