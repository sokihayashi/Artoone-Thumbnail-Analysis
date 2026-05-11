import { describe, it, expect, vi } from 'vitest'
import {
  relativeLuminance,
  wcagContrast,
  rgbToHex,
  avgColor,
  extractColors,
} from './thumbnailAnalysis'

// jsdom は Canvas を含まないため ImageData をポリフィル
class ImageDataPolyfill {
  data: Uint8ClampedArray
  width: number
  height: number
  constructor(data: Uint8ClampedArray, width: number, height: number) {
    this.data = data
    this.width = width
    this.height = height
  }
}
vi.stubGlobal('ImageData', ImageDataPolyfill)

describe('relativeLuminance', () => {
  it('黒は0', () => {
    expect(relativeLuminance(0, 0, 0)).toBe(0)
  })

  it('白は約1', () => {
    expect(relativeLuminance(255, 255, 255)).toBeCloseTo(1, 3)
  })

  it('赤のみの輝度', () => {
    const lum = relativeLuminance(255, 0, 0)
    expect(lum).toBeCloseTo(0.2126, 3)
  })
})

describe('wcagContrast', () => {
  it('白黒のコントラストは21:1', () => {
    const white = { r: 255, g: 255, b: 255 }
    const black = { r: 0, g: 0, b: 0 }
    expect(wcagContrast(white, black)).toBeCloseTo(21, 0)
  })

  it('同色はコントラスト1:1', () => {
    const gray = { r: 128, g: 128, b: 128 }
    expect(wcagContrast(gray, gray)).toBeCloseTo(1, 5)
  })

  it('順序が逆でも同じ値', () => {
    const a = { r: 200, g: 100, b: 50 }
    const b = { r: 30, g: 30, b: 30 }
    expect(wcagContrast(a, b)).toBeCloseTo(wcagContrast(b, a), 10)
  })
})

describe('rgbToHex', () => {
  it('赤 => #FF0000', () => {
    expect(rgbToHex({ r: 255, g: 0, b: 0 })).toBe('#FF0000')
  })

  it('緑 => #00FF00', () => {
    expect(rgbToHex({ r: 0, g: 255, b: 0 })).toBe('#00FF00')
  })

  it('青 => #0000FF', () => {
    expect(rgbToHex({ r: 0, g: 0, b: 255 })).toBe('#0000FF')
  })

  it('黒 => #000000', () => {
    expect(rgbToHex({ r: 0, g: 0, b: 0 })).toBe('#000000')
  })

  it('白 => #FFFFFF', () => {
    expect(rgbToHex({ r: 255, g: 255, b: 255 })).toBe('#FFFFFF')
  })

  it('小数は丸める', () => {
    // Math.round(100.6)=101=0x65, Math.round(200.4)=200=0xC8, Math.round(50.5)=51=0x33
    expect(rgbToHex({ r: 100.6, g: 200.4, b: 50.5 })).toBe('#65C833')
  })
})

describe('avgColor', () => {
  it('空配列はグレー (128,128,128)', () => {
    expect(avgColor([])).toEqual({ r: 128, g: 128, b: 128 })
  })

  it('1色の平均はその色自身', () => {
    expect(avgColor([{ r: 100, g: 150, b: 200 }])).toEqual({ r: 100, g: 150, b: 200 })
  })

  it('2色の平均', () => {
    const result = avgColor([
      { r: 0, g: 0, b: 0 },
      { r: 100, g: 200, b: 50 },
    ])
    expect(result).toEqual({ r: 50, g: 100, b: 25 })
  })
})

describe('extractColors', () => {
  function makeImageData(pixels: number[]): ImageData {
    const data = new Uint8ClampedArray(pixels)
    const pixelCount = pixels.length / 4
    const side = Math.sqrt(pixelCount)
    return new ImageData(data, side, side)
  }

  it('単色画像で1色だけ返る', () => {
    // 2x2 の真っ赤な画像 (16ピクセル分のバイト)
    const pixels = Array.from({ length: 4 * 4 }, (_, i) =>
      i % 4 === 0 ? 240 : i % 4 === 1 ? 0 : i % 4 === 2 ? 0 : 255,
    )
    const data = makeImageData(pixels)
    const { colors, brightness } = extractColors(data)
    expect(colors.length).toBeGreaterThanOrEqual(1)
    expect(colors[0].ratio).toBe(100)
    expect(brightness).toBeGreaterThan(0)
  })

  it('全ピクセル黒の場合、brightnessは0', () => {
    const pixels = new Array(4 * 4).fill(0).map((_, i) => (i % 4 === 3 ? 255 : 0))
    const data = makeImageData(pixels)
    const { brightness } = extractColors(data)
    expect(brightness).toBe(0)
  })
})
