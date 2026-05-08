import type { Mode, Mode1FormData, Mode2FormData, Mode3FormData, FormData, UploadedImage, Provider } from '../types'
import { buildImageContent } from './imageUtils'

type ImagePart = ReturnType<typeof buildImageContent>
type AnthropicContent = { type: 'text'; text: string } | ImagePart

type OpenRouterPart =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } }

// ─── Anthropic ─────────────────────────────────────────────────────────────

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

  if (!res.ok) throw await responseError(res)

  yield* readSSE(res, (parsed) => {
    const p = parsed as { type: string; delta?: { type: string; text?: string } }
    if (p.type === 'content_block_delta' && p.delta?.type === 'text_delta') return p.delta.text ?? ''
    return null
  })
}

// ─── OpenRouter (OpenAI-compatible) ────────────────────────────────────────

async function* streamOpenRouter(
  apiKey: string,
  systemPrompt: string,
  content: AnthropicContent[],
  model: string,
): AsyncGenerator<string> {
  const parts: OpenRouterPart[] = content.map((c) =>
    c.type === 'text'
      ? { type: 'text', text: c.text }
      : { type: 'image_url', image_url: { url: `data:${c.source.media_type};base64,${c.source.data}` } },
  )

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

  if (!res.ok) throw await responseError(res)

  yield* readSSE(res, (parsed) => {
    const p = parsed as { choices?: { delta?: { content?: string } }[] }
    return p.choices?.[0]?.delta?.content ?? null
  })
}

// ─── Helpers ───────────────────────────────────────────────────────────────

async function responseError(res: Response): Promise<Error> {
  const err = await res.json().catch(() => ({}))
  return new Error(extractStreamError(err) ?? `HTTP ${res.status}`)
}

function extractStreamError(parsed: unknown): string | null {
  const e = (parsed as { error?: { message?: string; metadata?: { raw?: string; provider_name?: string } } }).error
  if (!e) return null
  const provider = e.metadata?.provider_name ? ` [${e.metadata.provider_name}]` : ''
  const raw = e.metadata?.raw ? `: ${e.metadata.raw}` : ''
  return `${e.message ?? 'Unknown error'}${provider}${raw}`
}

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
      let parsed: unknown
      try { parsed = JSON.parse(data) } catch { continue }
      const errMsg = extractStreamError(parsed)
      if (errMsg) throw new Error(errMsg)
      const text = extract(parsed)
      if (text) yield text
    }
  }
}

// ─── Public dispatcher ─────────────────────────────────────────────────────

export async function* streamChat(
  apiKey: string,
  systemPrompt: string,
  userContent: AnthropicContent[],
  model: string,
  provider: Provider,
): AsyncGenerator<string> {
  if (provider === 'openrouter') yield* streamOpenRouter(apiKey, systemPrompt, userContent, model)
  else yield* streamAnthropic(apiKey, systemPrompt, userContent, model)
}

// ─── User message builder ──────────────────────────────────────────────────

function imageLabel(images: UploadedImage[], label: string): string {
  if (!images.length) return ''
  return images.length === 1
    ? `\n${label}：（画像を添付）`
    : `\n${label}：（画像${images.length}枚を添付）`
}

export function buildUserMessage(mode: Mode, data: FormData): AnthropicContent[] {
  const text = renderModeText(mode, data)
  const images = collectImages(mode, data)

  const content: AnthropicContent[] = [{ type: 'text', text }]
  for (const img of images) content.push(buildImageContent(img))
  return content
}

function renderModeText(mode: Mode, data: FormData): string {
  if (mode === 1) {
    const d = data as Mode1FormData
    return `モード1：サムネを1から考えたいです

動画タイトル：${d.title}

動画の概要：${d.overview}

出るメンバー：${d.members || '（未記入）'}

使いたい素材：${d.materials || '（なし）'}${imageLabel(d.materialImages, '素材画像')}

軽いサムネ指示：${d.lightInstruction || '（なし）'}

テンション感：${d.tension || '（未記入）'}

サムネで目指したい印象：${d.impression || '（未記入）'}

参考にしたい既存サムネ：${d.referenceImages.length ? '（添付画像を参照）' : '（なし）'}`
  }
  if (mode === 2) {
    const d = data as Mode2FormData
    return `モード2：今ある1案をレビューしてください

動画タイトル：${d.title}

サムネに出ているメンバー：${d.members || '（未記入）'}

動画の概要：${d.overview || '（未記入）'}

使っている素材：${d.materials || '（未記入）'}

テンション感：${d.tension || '（未記入）'}

サムネで目指したい印象：${d.impression || '（未記入）'}

参考にしたい既存サムネ：${d.referenceImages.length ? '（添付画像を参照）' : '（なし）'}

ラフか完成版か：${d.completionLevel || '（未記入）'}${imageLabel(d.thumbnailImages, 'レビュー対象サムネ')}`
  }
  const d = data as Mode3FormData
  return `モード3：複数の案を見比べてください

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
}

function collectImages(mode: Mode, data: FormData): UploadedImage[] {
  if (mode === 1) {
    const d = data as Mode1FormData
    return [...d.materialImages, ...d.referenceImages]
  }
  if (mode === 2) {
    const d = data as Mode2FormData
    return [...d.thumbnailImages, ...d.referenceImages]
  }
  const d = data as Mode3FormData
  return [...d.thumbnailImages, ...d.referenceImages]
}
