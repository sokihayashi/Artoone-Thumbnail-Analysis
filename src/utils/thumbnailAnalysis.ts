import type {
  UploadedImage,
  ThumbnailMetrics,
  TextRegion,
  FaceRegion,
  ColorBucket,
} from '../types'
import { getImageData } from './imageUtils'

const MIN_OCR_CONFIDENCE = 60
const COLOR_BUCKET_BITS = 4
const FACE_MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.15/model'

let ocrWorker: import('tesseract.js').Worker | null = null
let ocrInitPromise: Promise<import('tesseract.js').Worker> | null = null
let faceLoadPromise: Promise<typeof import('@vladmandic/face-api')> | null = null

type OcrBbox = { x0: number; y0: number; x1: number; y1: number }
type OcrLine = { text?: string; confidence?: number; bbox: OcrBbox }
type OcrParagraph = { lines?: OcrLine[] }
type OcrBlock = { paragraphs?: OcrParagraph[] }

async function getOcrWorker() {
  if (ocrWorker) return ocrWorker
  if (!ocrInitPromise) {
    ocrInitPromise = (async () => {
      const { createWorker } = await import('tesseract.js')
      const worker = await createWorker(['jpn', 'eng'])
      ocrWorker = worker
      return worker
    })()
  }
  return ocrInitPromise
}

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
  const [textRegions, faces] = await Promise.all([runOcr(image, data), runFaceDetection(image, data)])
  return {
    width: data.width,
    height: data.height,
    textRegions,
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

async function runOcr(image: UploadedImage, data: ImageData): Promise<TextRegion[]> {
  const worker = await getOcrWorker()
  const result = await worker.recognize(image.dataUrl, {}, { blocks: true })
  const blocks = (result.data.blocks as OcrBlock[] | undefined) ?? []
  const rawLines = blocks.flatMap((b) =>
    (b.paragraphs ?? []).flatMap((p) => (p.lines ?? []).filter((l) => l.bbox && l.text)),
  )
  return rawLines
    .map((l) => ({ text: l.text!.trim(), bbox: l.bbox, confidence: l.confidence ?? 0 }))
    .filter((l) => l.text.length > 0 && l.confidence >= MIN_OCR_CONFIDENCE)
    .map((l) => buildRegion(l.text, l.bbox, l.confidence, data))
}

function buildRegion(
  text: string,
  bbox: OcrBbox,
  confidence: number,
  data: ImageData,
): TextRegion {
  const x = Math.max(0, Math.floor(bbox.x0))
  const y = Math.max(0, Math.floor(bbox.y0))
  const w = Math.max(1, Math.floor(bbox.x1 - bbox.x0))
  const h = Math.max(1, Math.floor(bbox.y1 - bbox.y0))
  const fontSize = Math.round(h * 0.78)
  const { fg, bg } = sampleFgBg(data, x, y, w, h)
  const contrastRatio = wcagContrast(fg, bg)
  return {
    text,
    bbox: { x, y, w, h },
    fontSize,
    fgColor: rgbToHex(fg),
    bgColor: rgbToHex(bg),
    contrastRatio: Math.round(contrastRatio * 100) / 100,
    confidence: Math.round(confidence),
  }
}

function sampleFgBg(data: ImageData, x: number, y: number, w: number, h: number) {
  const step = Math.max(1, Math.floor(Math.min(w, h) / 12))
  const samples: { r: number; g: number; b: number; lum: number }[] = []
  for (let yy = y; yy < y + h && yy < data.height; yy += step) {
    for (let xx = x; xx < x + w && xx < data.width; xx += step) {
      const i = (yy * data.width + xx) * 4
      const r = data.data[i], g = data.data[i + 1], b = data.data[i + 2]
      samples.push({ r, g, b, lum: relativeLuminance(r, g, b) })
    }
  }
  const lums = samples.map((s) => s.lum)
  const minL = Math.min(...lums)
  const maxL = Math.max(...lums)
  const range = maxL - minL
  const dark = samples.filter((s) => s.lum <= minL + range * 0.3)
  const light = samples.filter((s) => s.lum >= maxL - range * 0.3)
  return { fg: avgColor(dark), bg: avgColor(light) }
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

export async function terminateOcr() {
  if (ocrWorker) {
    await ocrWorker.terminate()
    ocrWorker = null
    ocrInitPromise = null
  }
}
