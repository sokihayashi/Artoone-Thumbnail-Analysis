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
    <svg width="22" height="22" viewBox="0 0 16 16" shapeRendering="crispEdges" fill="currentColor">
      <rect x="7" y="1" width="2" height="2" />
      <rect x="7" y="3" width="2" height="2" />
      <rect x="7" y="11" width="2" height="2" />
      <rect x="7" y="13" width="2" height="2" />
      <rect x="1" y="7" width="2" height="2" />
      <rect x="3" y="7" width="2" height="2" />
      <rect x="11" y="7" width="2" height="2" />
      <rect x="13" y="7" width="2" height="2" />
      <rect x="7" y="7" width="2" height="2" />
      <rect x="3" y="3" width="2" height="2" />
      <rect x="11" y="3" width="2" height="2" />
      <rect x="3" y="11" width="2" height="2" />
      <rect x="11" y="11" width="2" height="2" />
    </svg>
  ),
  eye: (
    <svg width="22" height="22" viewBox="0 0 16 16" shapeRendering="crispEdges" fill="currentColor">
      <rect x="3" y="5" width="2" height="2" />
      <rect x="5" y="3" width="2" height="2" />
      <rect x="7" y="3" width="2" height="2" />
      <rect x="9" y="3" width="2" height="2" />
      <rect x="11" y="5" width="2" height="2" />
      <rect x="13" y="7" width="2" height="2" />
      <rect x="11" y="9" width="2" height="2" />
      <rect x="9" y="11" width="2" height="2" />
      <rect x="7" y="11" width="2" height="2" />
      <rect x="5" y="11" width="2" height="2" />
      <rect x="3" y="9" width="2" height="2" />
      <rect x="1" y="7" width="2" height="2" />
      <rect x="6" y="6" width="4" height="4" />
    </svg>
  ),
  compare: (
    <svg width="22" height="22" viewBox="0 0 16 16" shapeRendering="crispEdges" fill="currentColor">
      <rect x="1" y="2" width="6" height="2" />
      <rect x="1" y="12" width="6" height="2" />
      <rect x="1" y="2" width="2" height="12" />
      <rect x="5" y="2" width="2" height="12" />
      <rect x="9" y="2" width="6" height="2" />
      <rect x="9" y="12" width="6" height="2" />
      <rect x="9" y="2" width="2" height="12" />
      <rect x="13" y="2" width="2" height="12" />
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
    time: '40秒',
    icon: ICON.spark,
  },
  {
    id: 2,
    num: '02',
    title: '今ある1案をレビューする',
    desc: '良い点・問題点・最優先で直すべき箇所を洗い出します。',
    meta: '入力: 画像 + タイトル',
    time: '25秒',
    icon: ICON.eye,
  },
  {
    id: 3,
    num: '03',
    title: '複数の案を見比べる',
    desc: '2〜4枚のサムネを並べて A/B/C 比較。CTRが伸びそうな案と理由を提示します。',
    meta: '入力: 画像 ×2〜4',
    time: '50秒',
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
                <span className="mode-card-num">[{m.num}]</span>
              </div>
              <div className="mode-card-title">{m.title}</div>
              <div className="mode-card-desc">{m.desc}</div>
              <div className="mode-card-foot">
                <span>{m.meta}</span>
                <span>≈ {m.time}</span>
              </div>
            </button>
          ))}
        </div>

      </div>
    </div>
  )
}
