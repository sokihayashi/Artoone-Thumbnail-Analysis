import type { Mode, ToolVersion } from '../types'

interface Props {
  version: ToolVersion
  onSelect: (mode: Mode) => void
}

const MODES: { id: Mode; num: string; title: string; desc: string; meta: string; time: string }[] = [
  {
    id: 1,
    num: '01',
    title: 'サムネを1から考える',
    desc: '企画内容や使いたい素材から、どういうサムネにするかを考えるモードです。',
    meta: '入力: タイトル / 概要 / ターゲット',
    time: '~40秒',
  },
  {
    id: 2,
    num: '02',
    title: '今ある1案をレビューする',
    desc: '複数枚アップロードしてもOKです。それぞれを個別にレビューします。',
    meta: '入力: 画像 + タイトル',
    time: '~25秒',
  },
  {
    id: 3,
    num: '03',
    title: '複数の案を見比べる',
    desc: '完成案や提出案を見比べて、どれを採用するか決めるモードです。',
    meta: '入力: 画像 ×2〜4',
    time: '~50秒',
  },
]

export default function ModeSelector({ version, onSelect }: Props) {
  return (
    <div className="mode-selector">
      <div className="mode-header">
        <h2>どう診断しますか？</h2>
        <p>
          企画段階か、検討中の案があるか、複数案で迷っているか。状況に合わせて選んでください。
          <span className="version-badge" style={{ marginLeft: 8 }}>{version === 'big' ? '詳細' : 'かんたん'}</span>
        </p>
      </div>
      <div className="mode-cards">
        {MODES.map((m) => (
          <button key={m.id} className="mode-card" onClick={() => onSelect(m.id)}>
            <div className="mode-card-top">
              <div className="mode-card-num">{m.num}</div>
            </div>
            <div className="mode-card-body">
              <div className="mode-card-title">{m.title}</div>
              <div className="mode-card-desc">{m.desc}</div>
            </div>
            <div className="mode-card-foot">
              <span>{m.meta}</span>
              <span>{m.time}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
