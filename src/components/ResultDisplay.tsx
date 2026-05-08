import { useState } from 'react'
import ReactMarkdown from 'react-markdown'

interface Props {
  result: string
  streaming: boolean
  onBack: () => void
  onNewDiagnosis: () => void
}

type Section = { heading: string; body: string }
type Accent = 'positive' | 'negative' | 'priority' | 'instruction' | 'bonus' | 'neutral'

type KindConfig = { label: string; glyph: string; sev: number; color: string }

const KIND_CONFIG: Record<Accent, KindConfig> = {
  priority:    { label: 'PRIORITY',     glyph: '●', sev: 3, color: 'var(--sev-crit)' },
  negative:    { label: 'ISSUE',        glyph: '▲', sev: 2, color: 'var(--sev-warn)' },
  positive:    { label: 'STRENGTH',     glyph: '◆', sev: 2, color: 'var(--sev-good)' },
  instruction: { label: 'ACTION',       glyph: '▶', sev: 1, color: 'var(--sev-info)' },
  bonus:       { label: 'NICE TO HAVE', glyph: '○', sev: 0, color: 'var(--sev-mute)' },
  neutral:     { label: '',             glyph: '',  sev: 0, color: 'var(--muted)' },
}

function parseSections(md: string): Section[] {
  if (!md) return []
  const lines = md.split('\n')
  const sections: Section[] = []
  let current: Section | null = null
  const headingRe = /^### (.+?)\s*$/

  for (const line of lines) {
    const m = line.match(headingRe)
    if (m) {
      if (current) sections.push(current)
      current = { heading: m[1].trim(), body: '' }
    } else {
      if (current) {
        current.body += (current.body ? '\n' : '') + line
      } else {
        if (sections.length === 0) sections.push({ heading: '', body: line })
        else sections[0].body += '\n' + line
      }
    }
  }
  if (current) sections.push(current)

  if (sections.length === 1 && sections[0].heading === '') return []
  if (sections.length > 0 && sections[0].heading === '' && !sections[0].body.trim()) {
    sections.shift()
  }
  return sections
}

function accentFor(heading: string): Accent {
  if (heading === '良い点') return 'positive'
  if (heading === '問題点' || heading === '各案の問題点' || heading === '避けたい方向') return 'negative'
  if (heading === '最優先で直したいこと' || heading === '今すぐ直したいこと') return 'priority'
  if (heading === '修正指示' || heading === '制作メモ' || heading === '制作担当への一言メモ') return 'instruction'
  if (heading === '余裕があれば' || heading === '近い参考例') return 'bonus'
  return 'neutral'
}

function SectionCard({ heading, body, accent, showCursor, streaming }: {
  heading: string
  body: string
  accent: Accent
  showCursor: boolean
  streaming: boolean
}) {
  const cfg = KIND_CONFIG[accent]
  const isBonus = accent === 'bonus'
  const isNeutral = accent === 'neutral'

  const bodyEl = (
    <div className="section-card__body markdown-content">
      <ReactMarkdown>{body}</ReactMarkdown>
      {showCursor && <span className="cursor-blink">▌</span>}
    </div>
  )

  const headerEl = heading && (
    isNeutral
      ? <h3 className="section-card__heading">{heading}</h3>
      : (
        <>
          <div className="section-card-head">
            <span className="section-kind" style={{ color: cfg.color }}>
              {cfg.glyph && <span className="section-kind-glyph">{cfg.glyph}</span>}
              {cfg.label}
            </span>
            <span className="section-spacer" />
            {cfg.sev > 0 && (
              <span className="sev" style={{ color: cfg.color }}>
                {[0, 1, 2].map(i => (
                  <span key={i} className={`sev-dot${i < cfg.sev ? ' on' : ''}`} />
                ))}
              </span>
            )}
          </div>
          <div className="section-title">{heading}</div>
        </>
      )
  )

  if (isBonus) {
    return (
      <details className={`section-card section-card--${accent}`} open={streaming}>
        <summary>
          <div className="section-card-head">
            <span className="section-kind" style={{ color: cfg.color }}>
              {cfg.glyph && <span className="section-kind-glyph">{cfg.glyph}</span>}
              {cfg.label}
            </span>
            <span className="section-spacer" />
            <span className="bonus-toggle" />
          </div>
          <div className="section-title">{heading}</div>
        </summary>
        {bodyEl}
      </details>
    )
  }

  return (
    <div className={`section-card section-card--${accent}`}>
      {headerEl}
      {bodyEl}
    </div>
  )
}

export default function ResultDisplay({ result, streaming, onBack, onNewDiagnosis }: Props) {
  const [copyLabel, setCopyLabel] = useState('コピー')

  const handleCopy = () => {
    navigator.clipboard.writeText(result).then(
      () => {
        setCopyLabel('コピー済み！')
        setTimeout(() => setCopyLabel('コピー'), 1500)
      },
      () => {
        setCopyLabel('コピー失敗')
        setTimeout(() => setCopyLabel('コピー'), 1500)
      },
    )
  }

  const sections = parseSections(result)

  return (
    <div className="result-container">
      <div className="result-toolbar">
        <button className="btn-ghost" onClick={onBack}>
          ← 修正して再診断
        </button>
        <div className="result-toolbar-right">
          {!streaming && result && (
            <button className="btn-secondary" onClick={handleCopy}>
              {copyLabel}
            </button>
          )}
          <button className="btn-primary" onClick={onNewDiagnosis}>
            新しい診断
          </button>
        </div>
      </div>

      <div className="result-body">
        {streaming && !result && (
          <div className="streaming-indicator">
            <span className="dot" />
            <span className="dot" />
            <span className="dot" />
          </div>
        )}
        {result && sections.length > 0 && (
          <div className="section-cards">
            {sections.map((s, i) => (
              <SectionCard
                key={i}
                heading={s.heading}
                body={s.body}
                accent={accentFor(s.heading)}
                showCursor={streaming && i === sections.length - 1}
                streaming={streaming}
              />
            ))}
          </div>
        )}
        {result && sections.length === 0 && (
          <div className="markdown-content">
            <ReactMarkdown>{result}</ReactMarkdown>
            {streaming && <span className="cursor-blink">▌</span>}
          </div>
        )}
      </div>
    </div>
  )
}
