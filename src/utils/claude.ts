import type { Mode, Mode1FormData, Mode2FormData, Mode3FormData, FormData, UploadedImage, Provider } from '../types'
import { buildImageContent } from './imageUtils'

// ─── Anthropic streaming ───────────────────────────────────────────────────

type AnthropicContent = { type: 'text'; text: string } | ReturnType<typeof buildImageContent>

async function* streamAnthropic(
  apiKey: string,
  systemPrompt: string,
  content: AnthropicContent[],
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
      messages: [{ role: 'user', content }],
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: { message?: string } }).error?.message ?? `HTTP ${res.status}`)
  }

  yield* readSSE(res, (parsed: unknown) => {
    const p = parsed as { type: string; delta?: { type: string; text?: string } }
    if (p.type === 'content_block_delta' && p.delta?.type === 'text_delta') {
      return p.delta.text ?? ''
    }
    return null
  })
}

// ─── Gemini streaming ──────────────────────────────────────────────────────

type GeminiPart =
  | { text: string }
  | { inlineData: { mimeType: string; data: string } }

async function* streamGemini(
  apiKey: string,
  systemPrompt: string,
  parts: GeminiPart[],
  model: string,
): AsyncGenerator<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${apiKey}&alt=sse`

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: 'user', parts }],
      generationConfig: { maxOutputTokens: 4096 },
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    const msg = (err as { error?: { message?: string } }).error?.message ?? `HTTP ${res.status}`
    throw new Error(msg)
  }

  yield* readSSE(res, (parsed: unknown) => {
    const p = parsed as { candidates?: { content?: { parts?: { text?: string }[] } }[] }
    return p.candidates?.[0]?.content?.parts?.[0]?.text ?? null
  })
}

// ─── OpenRouter streaming (OpenAI-compatible) ─────────────────────────────

type OpenRouterPart =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } }

async function* streamOpenRouter(
  apiKey: string,
  systemPrompt: string,
  parts: OpenRouterPart[],
  model: string,
): AsyncGenerator<string> {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      stream: true,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: parts },
      ],
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    const msg = (err as { error?: { message?: string } }).error?.message ?? `HTTP ${res.status}`
    throw new Error(msg)
  }

  yield* readSSE(res, (parsed: unknown) => {
    const p = parsed as { choices?: { delta?: { content?: string } }[] }
    return p.choices?.[0]?.delta?.content ?? null
  })
}

// ─── Shared SSE reader ─────────────────────────────────────────────────────

async function* readSSE(
  res: Response,
  extract: (parsed: unknown) => string | null,
): AsyncGenerator<string> {
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
        const text = extract(JSON.parse(data))
        if (text) yield text
      } catch {
        // ignore
      }
    }
  }
}

// ─── Public API ────────────────────────────────────────────────────────────

export async function* streamClaude(
  apiKey: string,
  systemPrompt: string,
  userContent: AnthropicContent[],
  model: string,
  provider: Provider = 'anthropic',
): AsyncGenerator<string> {
  if (provider === 'gemini') {
    const parts: GeminiPart[] = userContent.map((c) => {
      if (c.type === 'text') return { text: c.text }
      const img = c as ReturnType<typeof buildImageContent>
      return { inlineData: { mimeType: img.source.media_type, data: img.source.data } }
    })
    yield* streamGemini(apiKey, systemPrompt, parts, model)
  } else if (provider === 'openrouter') {
    const parts: OpenRouterPart[] = userContent.map((c) => {
      if (c.type === 'text') return { type: 'text', text: c.text }
      const img = c as ReturnType<typeof buildImageContent>
      return { type: 'image_url', image_url: { url: `data:${img.source.media_type};base64,${img.source.data}` } }
    })
    yield* streamOpenRouter(apiKey, systemPrompt, parts, model)
  } else {
    yield* streamAnthropic(apiKey, systemPrompt, userContent, model)
  }
}

// ─── Message builder ───────────────────────────────────────────────────────

function imageLabel(images: UploadedImage[], label: string): string {
  if (!images.length) return ''
  return images.length === 1
    ? `\n${label}：（画像を添付）`
    : `\n${label}：（画像${images.length}枚を添付）`
}

export function buildUserMessage(mode: Mode, data: FormData) {
  const allImages: { images: UploadedImage[] }[] = []
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
    allImages.push({ images: d.materialImages })
    allImages.push({ images: d.referenceImages })
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
    allImages.push({ images: d.thumbnailImages })
    allImages.push({ images: d.referenceImages })
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

ラフか完成版か：${d.completionLevel || '（未記入）'}`
    allImages.push({ images: d.thumbnailImages })
    allImages.push({ images: d.referenceImages })
  }

  const content: AnthropicContent[] = [{ type: 'text', text }]
  for (const { images } of allImages) {
    for (const img of images) {
      content.push(buildImageContent(img))
    }
  }
  return content
}
