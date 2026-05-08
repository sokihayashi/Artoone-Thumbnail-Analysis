import type { UploadedImage } from '../types'

const TARGET_W = 1920
const TARGET_H = 1080
const JPEG_QUALITY = 0.92

export async function fileToUploadedImage(file: File): Promise<UploadedImage> {
  const bitmap = await loadBitmap(file)
  const { canvas } = drawNormalized(bitmap, TARGET_W, TARGET_H)
  const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY)
  const base64 = dataUrl.split(',')[1]
  return {
    name: file.name,
    dataUrl,
    base64,
    mediaType: 'image/jpeg',
    width: TARGET_W,
    height: TARGET_H,
  }
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

async function loadBitmap(file: File): Promise<HTMLImageElement> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target?.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = dataUrl
  })
}

function drawNormalized(img: HTMLImageElement, w: number, h: number) {
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  const srcRatio = img.naturalWidth / img.naturalHeight
  const dstRatio = w / h
  let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight
  if (srcRatio > dstRatio) {
    sw = img.naturalHeight * dstRatio
    sx = (img.naturalWidth - sw) / 2
  } else if (srcRatio < dstRatio) {
    sh = img.naturalWidth / dstRatio
    sy = (img.naturalHeight - sh) / 2
  }
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, w, h)
  return { canvas, ctx }
}

export function getImageData(image: UploadedImage): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = image.width ?? img.naturalWidth
      canvas.height = image.height ?? img.naturalHeight
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      resolve(ctx.getImageData(0, 0, canvas.width, canvas.height))
    }
    img.onerror = reject
    img.src = image.dataUrl
  })
}
