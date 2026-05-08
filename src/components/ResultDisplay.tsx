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

const CHIP_ICON: Record<Accent, string> = {
  positive:    '✓',
  negative:    '!',
  priority:    '★',
  instruction: '→',
  bonus:       '◇',
  neutral:     '',
}

function SectionCard({ heading, body, accent, showCursor, streaming }: {
  heading: string
  body: string
  accent: Accent
  showCursor: boolean
  streaming: boolean
}) {
  const icon = CHIP_ICON[accent]
  const isBonus = accent === 'bonus'
  const bodyEl = (
    <div className="section-card__body markdown-content">
      <ReactMarkdown>{body}</ReactMarkdown>
      {showCursor && <span className="cursor-blink">▌</span>}
    </div>
  )
  const chipEl = heading && (
    accent === 'neutral'
      ? <h3 className="section-card__heading">{heading}</h3>
      : (
        <div className="section-chip">
          {icon && <span className="section-chip__icon">{icon}</span>}
          {heading}
        </div>
      )
  )

  if (isBonus) {
    return (
      <details className={`section-card section-card--${accent}`} open={streaming}>
        <summary>
          {chipEl}
          <span className="bonus-toggle" />
        </summary>
        {bodyEl}
      </details>
    )
  }

  return (
    <div className={`section-card section-card--${accent}`}>
      {chipEl}
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
