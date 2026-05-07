import type { Mode, Mode1FormData, Mode2FormData, Mode3FormData, FormData, UploadedImage } from '../types'
import { buildImageContent } from './imageUtils'

export async function* streamClaude(
  apiKey: string,
  systemPrompt: string,
  userContent: Array<{ type: 'text'; text: string } | ReturnType<typeof buildImageContent>>,
  model: string,
): AsyncGenerator<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-use': 'true',
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      stream: true,
      system: systemPrompt,
      messages: [{ role: 'user', content: userContent }],
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: { message: `HTTP ${res.status}` } }))
    throw new Error((err as { error?: { message?: string } }).error?.message ?? `HTTP ${res.status}`)
  }

  const reader = res.body!.getReader()
  const decoder = new TextDecoder()
  let buf = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buf += decoder.decode(value, { stream: true })
    const lines = buf.split('\n')
    buf = lines.pop() ?? ''
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      const data = line.slice(6)
      if (data === '[DONE]') continue
      try {
        const parsed = JSON.parse(data) as { type: string; delta?: { type: string; text?: string } }
        if (parsed.type === 'content_block_delta' && parsed.delta?.type === 'text_delta') {
          yield parsed.delta.text ?? ''
        }
      } catch {
        // ignore
      }
    }
  }
}

function imageLabel(images: UploadedImage[], label: string): string {
  if (!images.length) return ''
  return images.length === 1
    ? `\n${label}：（画像を添付）`
    : `\n${label}：（画像${images.length}枚を添付）`
}

export function buildUserMessage(mode: Mode, data: FormData) {
  const allImages: { label: string; images: UploadedImage[] }[] = []
  let text = ''

  if (mode === 1) {
    const d = data as Mode1FormData
    text = `モード1：サムネを1から考えたいです

動画タイトル：${d.title}

動画の概要：${d.overview}

出るメンバー：${d.members || '（未記入）'}

使いたい素材：${d.materials || '（なし）'}${imageLabel(d.materialImages, '素材画像')}

軽いサムネ指示：${d.lightInstruction || '（なし）'}

テンション感：${d.tension || '（未記入）'}

サムネで目指したい印象：${d.impression || '（未記入）'}

参考にしたい既存サムネ：${d.referenceImages.length ? '（添付画像を参照）' : '（なし）'}`
    allImages.push({ label: '素材', images: d.materialImages })
    allImages.push({ label: '参考サムネ', images: d.referenceImages })
  } else if (mode === 2) {
    const d = data as Mode2FormData
    text = `モード2：今ある1案をレビューしてください

動画タイトル：${d.title}

サムネに出ているメンバー：${d.members || '（未記入）'}

動画の概要：${d.overview || '（未記入）'}

使っている素材：${d.materials || '（未記入）'}

テンション感：${d.tension || '（未記入）'}

サムネで目指したい印象：${d.impression || '（未記入）'}

参考にしたい既存サムネ：${d.referenceImages.length ? '（添付画像を参照）' : '（なし）'}

ラフか完成版か：${d.completionLevel || '（未記入）'}${imageLabel(d.thumbnailImages, 'レビュー対象サムネ')}`
    allImages.push({ label: 'サムネ', images: d.thumbnailImages })
    allImages.push({ label: '参考', images: d.referenceImages })
  } else {
    const d = data as Mode3FormData
    text = `モード3：複数の案を見比べてください

動画タイトル：${d.title}

動画の概要：${d.overview || '（未記入）'}

比較の目的：${d.purpose}

参考にしたい点：${d.points}

どれをベースにしたいか：${d.base || '（未記入）'}

使いたい素材：${d.materials || '（なし）'}

テンション感：${d.tension || '（未記入）'}

サムネで目指したい印象：${d.impression || '（未記入）'}

参考にしたい既存サムネ：${d.referenceImages.length ? '（添付画像を参照）' : '（なし）'}

ラフか完成版か：${d.completionLevel || '（未記入）'}${imageLabel(d.thumbnailImages, '比較対象サムネ')}`
    allImages.push({ label: 'サムネ', images: d.thumbnailImages })
    allImages.push({ label: '参考', images: d.referenceImages })
  }

  const content: Array<{ type: 'text'; text: string } | ReturnType<typeof buildImageContent>> = [
    { type: 'text', text },
  ]

  for (const { images } of allImages) {
    for (const img of images) {
      content.push(buildImageContent(img))
    }
  }

  return content
}
