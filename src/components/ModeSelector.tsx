import type { Mode, ToolVersion } from '../types'

interface Props {
  version: ToolVersion
  onSelect: (mode: Mode) => void
}

interface ModeDef {
  id: Mode
  num: string
  title: string
  desc: string
  meta: string
  time: string
  icon: React.ReactNode
}

const ICON = {
  spark: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8 1.5v3M8 11.5v3M1.5 8h3M11.5 8h3M3.4 3.4l2.1 2.1M10.5 10.5l2.1 2.1M3.4 12.6l2.1-2.1M10.5 5.5l2.1-2.1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  eye: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M1.5 8s2.5-4.5 6.5-4.5S14.5 8 14.5 8s-2.5 4.5-6.5 4.5S1.5 8 1.5 8z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
      <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.4"/>
    </svg>
  ),
  compare: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="1.5" y="2.5" width="5.5" height="11" rx="1" stroke="currentColor" strokeWidth="1.4"/>
      <rect x="9" y="2.5" width="5.5" height="11" rx="1" stroke="currentColor" strokeWidth="1.4"/>
    </svg>
  ),
}

const MODES: ModeDef[] = [
  {
    id: 1,
    num: '01',
    title: 'サムネを1から考える',
    desc: '企画内容や使いたい素材から、構図と要素をゼロから提案します。',
    meta: '入力: タイトル / 概要 / ターゲット',
    time: '~ 40秒',
    icon: ICON.spark,
  },
  {
    id: 2,
    num: '02',
    title: '今ある1案をレビューする',
    desc: '良い点・問題点・最優先で直すべき箇所を洗い出します。',
    meta: '入力: 画像 + タイトル',
    time: '~ 25秒',
    icon: ICON.eye,
  },
  {
    id: 3,
    num: '03',
    title: '複数の案を見比べる',
    desc: '2〜4枚のサムネを並べて A/B/C 比較。CTRが伸びそうな案と理由を提示します。',
    meta: '入力: 画像 ×2〜4',
    time: '~ 50秒',
    icon: ICON.compare,
  },
]

export default function ModeSelector({ version, onSelect }: Props) {
  return (
    <div className="mode-screen">
      <div className="mode-screen-inner">
        <div className="mode-step">STEP 1 / 3</div>
        <h1 className="mode-h1">どう診断しますか？</h1>
        <p className="mode-sub">
          企画段階か、検討中の案があるか、複数案で迷っているか。状況に合わせて選んでください。
          <span className="chip" style={{ marginLeft: 8 }}>{version === 'big' ? '詳細' : 'かんたん'}</span>
        </p>

        <div className="mode-cards">
          {MODES.map((m) => (
            <button key={m.id} type="button" className="mode-card" onClick={() => onSelect(m.id)}>
              <div className="mode-card-top">
                <span className="mode-card-icon">{m.icon}</span>
                <span className="mode-card-num">{m.num}</span>
              </div>
              <div className="mode-card-title">{m.title}</div>
              <div className="mode-card-desc">{m.desc}</div>
              <div className="mode-card-foot">
                <span>{m.meta}</span>
                <span>{m.time}</span>
              </div>
            </button>
          ))}
        </div>

        <div className="mode-bottom">
          <div className="mode-hints">
            <span className="row" style={{ gap: 4 }}>
              <span className="kbd">↑</span><span className="kbd">↓</span> 選択
            </span>
            <span className="row" style={{ gap: 4 }}>
              <span className="kbd">↵</span> 決定
            </span>
          </div>
          <span className="dim mono" style={{ fontSize: 11 }}>
            カードを選ぶとフォームに進みます
          </span>
        </div>
      </div>
    </div>
  )
}
