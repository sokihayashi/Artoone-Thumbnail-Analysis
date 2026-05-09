import type { Mode, Mode1FormData, Mode2FormData, Mode3FormData, FormData, UploadedImage, Provider, ThumbnailMetrics } from '../types'
import { buildImageContent } from './imageUtils'
import { analyzeThumb } from './thumbnailAnalysis'
import dlcData from '../data/dlc.json'

interface DlcVideo {
  '動画のタイトル': string
  '公開日': string
  '企画型': string
  'タイトル型': string
  '相性の良いサムネ型': string
  '勝ち筋ラベル': string
  'タイトルとサムネの関係': string
  '成立ライン': string
  '視聴回数': number
  'インプレッションのクリック率 (%)': number
}

type ImagePart = ReturnType<typeof buildImageContent>
type AnthropicContent = { type: 'text'; text: string } | ImagePart

type OpenRouterPart =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } }

// ─── Anthropic ─────────────────────────────────────────────────

async function* streamAnthropic(
  apiKey: string,
  systemPrompt: string,
  content: AnthropicContent[],
  model: string,
  signal?: AbortSignal,
): AsyncGenerator<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    signal,
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
      system: [{ type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } }],
      messages: [{ role: 'user', content }],
    }),
  })

  if (!res.ok) throw await responseError(res)

  yield* readSSE(res, signal, (parsed) => {
    const p = parsed as { type: string; delta?: { type: string; text?: string } }
    if (p.type === 'content_block_delta' && p.delta?.type === 'text_delta') return p.delta.text ?? ''
    return null
  })
}

// ─── OpenRouter (OpenAI-compatible) ───────────────────────────────────────

async function* streamOpenRouter(
  apiKey: string,
  systemPrompt: string,
  content: AnthropicContent[],
  model: string,
  signal?: AbortSignal,
): AsyncGenerator<string> {
  const parts: OpenRouterPart[] = content.map((c) =>
    c.type === 'text'
      ? { type: 'text', text: c.text }
      : { type: 'image_url', image_url: { url: `data:${c.source.media_type};base64,${c.source.data}` } },
  )

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    signal,
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      stream: true,
      messages: [
        { role: 'system', content: [{ type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } }] },
        { role: 'user', content: parts },
      ],
    }),
  })

  if (!res.ok) throw await responseError(res)

  yield* readSSE(res, signal, (parsed) => {
    const p = parsed as { choices?: { delta?: { content?: string } }[] }
    return p.choices?.[0]?.delta?.content ?? null
  })
}

// ─── Helpers ────────────────────────────────────────────────────────

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
  signal: AbortSignal | undefined,
  extract: (parsed: unknown) => string | null,
): AsyncGenerator<string> {
  if (!res.body) throw new Error('Response body is null')
  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buf = ''

  try {
    while (true) {
      if (signal?.aborted) break
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
    // Flush any remaining bytes held by the streaming TextDecoder
    buf += decoder.decode()
  } finally {
    reader.cancel().catch(() => {})
  }
}

// ─── Public dispatcher ──────────────────────────────────────────────

export async function* streamChat(
  apiKey: string,
  systemPrompt: string,
  userContent: AnthropicContent[],
  model: string,
  provider: Provider,
  signal?: AbortSignal,
): AsyncGenerator<string> {
  if (provider === 'openrouter') yield* streamOpenRouter(apiKey, systemPrompt, userContent, model, signal)
  else yield* streamAnthropic(apiKey, systemPrompt, userContent, model, signal)
}

// ─── User message builder ──────────────────────────────────────────────

function imageLabel(images: UploadedImage[], label: string): string {
  if (!images.length) return ''
  return images.length === 1
    ? `\n${label}：（画像を添付）`
    : `\n${label}：（画像${images.length}枚を添付）`
}

export async function buildUserMessage(mode: Mode, data: FormData): Promise<AnthropicContent[]> {
  const text = renderModeText(mode, data)
  const images = collectImages(mode, data)
  const targets = collectAnalysisTargets(mode, data)
  const facts = await buildAnalysisFactsBlock(targets)
  const cases = buildRelevantCasesBlock(mode, data)

  const parts = [text, cases, facts].filter((s) => s.length > 0)
  const content: AnthropicContent[] = [{ type: 'text', text: parts.join('\n\n') }]
  for (const img of images) content.push(buildImageContent(img))
  return content
}

function buildRelevantCasesBlock(mode: Mode, data: FormData): string {
  const queryText = buildQueryText(mode, data)
  const top = pickRelevantCases(queryText, 3)
  if (!top.length) return ''
  const lines = top.map((c, i) => {
    return `${i + 1}. 「${c['動画のタイトル']}」(${c['公開日']})\n   企画型: ${c['企画型']} / タイトル型: ${c['タイトル型']} / サムネ型: ${c['相性の良いサムネ型']}\n   勝ち筋: ${c['勝ち筋ラベル']} / 視聴回数: ${formatViews(c['視聴回数'])} / CTR: ${c['インプレッションのクリック率 (%)']}%`
  })
  return [
    '## 関連する過去事例（DLCから自動抽出）',
    'タイトル類似度の高い過去動画を3件抽出。診断時の参考にしてよい（同じ型を必ず推奨する必要はない）。',
    '',
    lines.join('\n\n'),
  ].join('\n')
}

function buildQueryText(mode: Mode, data: FormData): string {
  const d = data as Mode1FormData & Mode2FormData & Mode3FormData
  const parts = [d.title, d.overview, d.tension, d.impression]
  if (mode === 1 && d.lightInstruction) parts.push(d.lightInstruction)
  if (mode === 3 && d.purpose) parts.push(d.purpose)
  return parts.filter(Boolean).join(' ')
}

function pickRelevantCases(query: string, n: number): DlcVideo[] {
  const all = (dlcData.top_videos ?? []) as DlcVideo[]
  if (!query) return all.slice(0, n)
  const tokens = tokenize(query)
  const scored = all.map((video) => ({
    video,
    score: scoreMatch(tokens, video),
  }))
  scored.sort((a, b) => b.score - a.score)
  return scored.slice(0, n).map((s) => s.video)
}

function scoreMatch(queryTokens: string[], video: DlcVideo): number {
  const targetText = `${video['動画のタイトル']} ${video['企画型']} ${video['タイトル型']} ${video['勝ち筋ラベル']}`
  const targetTokens = tokenize(targetText)
  let overlap = 0
  for (const q of queryTokens) {
    if (q.length < 2) continue
    if (targetTokens.some((t) => t.includes(q) || q.includes(t))) overlap += 1
  }
  const ctrBoost = Math.min(video['インプレッションのクリック率 (%)'] / 10, 0.5)
  const viewBoost = Math.min(Math.log10(Math.max(video['視聴回数'], 1)) / 20, 0.3)
  return overlap + ctrBoost + viewBoost
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[【】「」『』、。·・！？!?,.(\)[\]<>\/\\]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 0)
}

function formatViews(n: number): string {
  if (n >= 10000) return `${(n / 10000).toFixed(1)}万`
  return `${n}`
}

function collectAnalysisTargets(mode: Mode, data: FormData): UploadedImage[] {
  if (mode === 2) return (data as Mode2FormData).thumbnailImages
  if (mode === 3) return (data as Mode3FormData).thumbnailImages
  return []
}

async function buildAnalysisFactsBlock(images: UploadedImage[]): Promise<string> {
  if (!images.length) return ''
  const metrics = await Promise.all(images.map((img) => safeAnalyze(img)))
  const blocks = metrics
    .map((m, i) => (m ? formatMetrics(m, i + 1) : null))
    .filter((s): s is string => s !== null)
  if (!blocks.length) return ''
  return [
    '## 機械測定データ（参考値）',
    '以下は画像処理ライブラリ(Tesseract OCR + WCAGコントラスト計算)による客観値。',
    '装飾的小文字（©、URL、配信時刻など）は人間判断で無視してよい。',
    'OCRが文字を未検出でも装飾フォント起因が多い。未検出を「文字が細い」と判断しないこと。',
    '',
    blocks.join('\n\n'),
  ].join('\n')
}

async function safeAnalyze(image: UploadedImage): Promise<ThumbnailMetrics | null> {
  try {
    return await analyzeThumb(image)
  } catch (e) {
    console.warn('analyzeThumb failed', e)
    return null
  }
}

function formatMetrics(m: ThumbnailMetrics, idx: number): string {
  const lines: string[] = [`### サムネ画像${idx}（${m.width}×${m.height}）`]

  if (m.textRegions.length) {
    lines.push('[テキスト領域]')
    for (const r of m.textRegions) {
      const sizeWarn = r.fontSize < 36 ? ' ⚠危険' : r.fontSize < 60 ? ' ⚠注意' : ''
      const ctrWarn = r.contrastRatio < 3 ? ' ⚠危険' : r.contrastRatio < 4.5 ? ' ⚠注意' : ''
      lines.push(`- "${r.text}" font_size≈${r.fontSize}px contrast=${r.contrastRatio}${sizeWarn}${ctrWarn}`)
    }
  } else {
    lines.push('[テキスト領域] OCR検出なし（装飾・カラーフォントはOCRが苦手。大きな文字でも未検出になる場合あり）')
  }

  lines.push('')
  if (m.faces.length) {
    lines.push('[顔検出]')
    const sortedFaces = [...m.faces].sort((a, b) => b.areaRatio - a.areaRatio)
    for (let i = 0; i < sortedFaces.length; i++) {
      const f = sortedFaces[i]
      const sizeWarn = f.areaRatio < 5 ? ' ⚠危険(表情読めない)' : f.areaRatio < 8 ? ' ⚠注意' : ''
      lines.push(`- 顔${i + 1}: area_ratio=${f.areaRatio}% center_offset=(${f.centerOffset.dx}%, ${f.centerOffset.dy}%)${sizeWarn}`)
    }
    if (sortedFaces.length > 5) lines.push('⚠危険: 顔5人超 → 視線分散・誰が主役か不明')
    else if (sortedFaces.length > 3) lines.push('⚠注意: 顔3人超 → 視線が分散しやすい')
  } else {
    lines.push('[顔検出] 顔検出なし')
  }

  lines.push('')
  lines.push('[主要色（10%以上の占有のみ）]')
  const major = m.dominantColors.filter((c) => c.ratio >= 10)
  if (major.length) {
    lines.push(major.map((c) => `${c.hex} (${c.ratio}%)`).join(' / '))
    if (major.length >= 5) lines.push('⚠注意: 主要色5色以上 → ごちゃつき・視線分散')
  } else {
    lines.push('（占有10%以上の主要色なし → グラデーション or ノイズ多い）')
  }

  lines.push(`平均輝度: ${m.averageBrightness}`)

  return lines.join('\n')
}

function renderModeText(mode: Mode, data: FormData): string {
  if (mode === 1) {
    const d = data as Mode1FormData
    return `モード1：サムネを1から考えたいです

動画タイトル：${d.title}

動画の概要：${d.overview}

サムネで主役にしたいもの：${d.intendedSubject || '（未記入）'}

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

サムネで主役にしているもの：${d.intendedSubject || '（未記入）'}

テンション感：${d.tension || '（未記入）'}

サムネで目指したい印象：${d.impression || '（未記入）'}

参考にしたい既存サムネ：${d.referenceImages.length ? '（添付画像を参照）' : '（なし）'}

ラフか完成版か：${d.completionLevel || '（未記入）'}${imageLabel(d.thumbnailImages, 'レビュー対象サムネ')}`
  }
  const d = data as Mode3FormData
  return `モード3：複数の案を見比べてください

動画タイトル：${d.title}

動画の概要：${d.overview || '（未記入）'}

各案で目指している主役：${d.intendedSubject || '（未記入）'}

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
