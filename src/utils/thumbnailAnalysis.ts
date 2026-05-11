import type { UploadedImage, ThumbnailMetrics, FaceRegion, ColorBucket } from '../types'
import { getImageData } from './imageUtils'

const COLOR_BUCKET_BITS = 4
const FACE_MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.15/model'

let faceLoadPromise: Promise<typeof import('@vladmandic/face-api')> | null = null

async function loadFaceApi() {
  if (!faceLoadPromise) {
    faceLoadPromise = (async () => {
      const faceapi = await import('@vladmandic/face-api')
      await faceapi.nets.tinyFaceDetector.loadFromUri(FACE_MODEL_URL)
      return faceapi
    })()
  }
  return faceLoadPromise
}

export async function analyzeThumb(image: UploadedImage): Promise<ThumbnailMetrics> {
  const data = await getImageData(image)
  const colorInfo = extractColors(data)
  const faces = await runFaceDetection(image, data)
  return {
    width: data.width,
    height: data.height,
    faces,
    dominantColors: colorInfo.colors,
    averageBrightness: colorInfo.brightness,
  }
}

async function runFaceDetection(image: UploadedImage, data: ImageData): Promise<FaceRegion[]> {
  try {
    const faceapi = await loadFaceApi()
    const img = await loadHTMLImage(image.dataUrl)
    const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.5 })
    const detections = await faceapi.detectAllFaces(img, options)
    const cx = data.width / 2
    const cy = data.height / 2
    const total = data.width * data.height
    return detections.map((d) => {
      const b = d.box
      const faceCx = b.x + b.width / 2
      const faceCy = b.y + b.height / 2
      return {
        bbox: { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height) },
        areaRatio: Math.round((b.width * b.height / total) * 1000) / 10,
        centerOffset: {
          dx: Math.round(((faceCx - cx) / data.width) * 100),
          dy: Math.round(((faceCy - cy) / data.height) * 100),
        },
      }
    })
  } catch (e) {
    console.warn('face detection failed', e)
    return []
  }
}

function loadHTMLImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = dataUrl
  })
}

export function avgColor(arr: { r: number; g: number; b: number }[]): { r: number; g: number; b: number } {
  if (!arr.length) return { r: 128, g: 128, b: 128 }
  const sum = arr.reduce((acc, c) => ({ r: acc.r + c.r, g: acc.g + c.g, b: acc.b + c.b }), { r: 0, g: 0, b: 0 })
  return { r: sum.r / arr.length, g: sum.g / arr.length, b: sum.b / arr.length }
}

export function wcagContrast(a: { r: number; g: number; b: number }, b: { r: number; g: number; b: number }): number {
  const la = relativeLuminance(a.r, a.g, a.b)
  const lb = relativeLuminance(b.r, b.g, b.b)
  const [hi, lo] = la > lb ? [la, lb] : [lb, la]
  return (hi + 0.05) / (lo + 0.05)
}

export function relativeLuminance(r: number, g: number, b: number): number {
  const conv = (c: number) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * conv(r) + 0.7152 * conv(g) + 0.0722 * conv(b)
}

export function rgbToHex(c: { r: number; g: number; b: number }): string {
  const h = (n: number) => Math.round(n).toString(16).padStart(2, '0').toUpperCase()
  return `#${h(c.r)}${h(c.g)}${h(c.b)}`
}

export function extractColors(data: ImageData): { colors: ColorBucket[]; brightness: number } {
  const buckets = new Map<number, number>()
  let total = 0
  let lumSum = 0
  const shift = 8 - COLOR_BUCKET_BITS
  for (let i = 0; i < data.data.length; i += 16) {
    const r = data.data[i], g = data.data[i + 1], b = data.data[i + 2]
    const key = ((r >> shift) << (COLOR_BUCKET_BITS * 2)) | ((g >> shift) << COLOR_BUCKET_BITS) | (b >> shift)
    buckets.set(key, (buckets.get(key) ?? 0) + 1)
    total += 1
    lumSum += relativeLuminance(r, g, b)
  }
  const sorted = [...buckets.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)
  const colors: ColorBucket[] = sorted.map(([key, count]) => {
    const r = ((key >> (COLOR_BUCKET_BITS * 2)) & ((1 << COLOR_BUCKET_BITS) - 1)) << shift
    const g = ((key >> COLOR_BUCKET_BITS) & ((1 << COLOR_BUCKET_BITS) - 1)) << shift
    const b = (key & ((1 << COLOR_BUCKET_BITS) - 1)) << shift
    return {
      hex: rgbToHex({ r: r + (1 << (shift - 1)), g: g + (1 << (shift - 1)), b: b + (1 << (shift - 1)) }),
      ratio: Math.round((count / total) * 1000) / 10,
    }
  })
  return { colors, brightness: Math.round((lumSum / total) * 1000) / 1000 }
}
