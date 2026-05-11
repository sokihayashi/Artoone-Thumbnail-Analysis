export type Mode = 1 | 2 | 3

export type ToolVersion = 'mini' | 'big'

export interface UploadedImage {
  name: string
  dataUrl: string
  base64: string
  mediaType: string
  width?: number
  height?: number
}

export interface FaceRegion {
  bbox: { x: number; y: number; w: number; h: number }
  areaRatio: number
  centerOffset: { dx: number; dy: number }
}

export interface ColorBucket {
  hex: string
  ratio: number
}

export interface ThumbnailMetrics {
  width: number
  height: number
  faces: FaceRegion[]
  dominantColors: ColorBucket[]
  averageBrightness: number
}

export interface Mode1FormData {
  title: string
  overview: string
  members: string
  materials: string
  lightInstruction: string
  intendedSubject: string
  tension: string
  impression: string
  materialImages: UploadedImage[]
  referenceImages: UploadedImage[]
}

export interface Mode2FormData {
  title: string
  members: string
  overview: string
  materials: string
  intendedSubject: string
  tension: string
  impression: string
  completionLevel: string
  thumbnailImages: UploadedImage[]
  referenceImages: UploadedImage[]
}

export interface Mode3FormData {
  title: string
  overview: string
  purpose: string
  points: string
  base: string
  materials: string
  intendedSubject: string
  tension: string
  impression: string
  completionLevel: string
  thumbnailImages: UploadedImage[]
  referenceImages: UploadedImage[]
}

export type FormData = Mode1FormData | Mode2FormData | Mode3FormData

export type Provider = 'anthropic' | 'openrouter'

export interface AppSettings {
  apiKey: string
  model: string
  provider: Provider
  version: ToolVersion
}
