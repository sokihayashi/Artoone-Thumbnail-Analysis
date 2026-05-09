import { describe, it, expect } from 'vitest'
import { buildImageContent } from './imageUtils'
import type { UploadedImage } from '../types'

const sampleImage: UploadedImage = {
  name: 'test.jpg',
  dataUrl: 'data:image/jpeg;base64,AAAA',
  base64: 'AAAA',
  mediaType: 'image/jpeg',
  width: 1920,
  height: 1080,
}

describe('buildImageContent', () => {
  it('type は "image"', () => {
    expect(buildImageContent(sampleImage).type).toBe('image')
  })

  it('source.type は "base64"', () => {
    expect(buildImageContent(sampleImage).source.type).toBe('base64')
  })

  it('base64 データが正しく渡る', () => {
    expect(buildImageContent(sampleImage).source.data).toBe('AAAA')
  })

  it('media_type が正しく渡る', () => {
    expect(buildImageContent(sampleImage).source.media_type).toBe('image/jpeg')
  })

  it('PNG の場合も正しく渡る', () => {
    const png: UploadedImage = { ...sampleImage, mediaType: 'image/png', base64: 'BBBB' }
    const content = buildImageContent(png)
    expect(content.source.media_type).toBe('image/png')
    expect(content.source.data).toBe('BBBB')
  })
})
