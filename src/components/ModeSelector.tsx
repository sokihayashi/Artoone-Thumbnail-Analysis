import type { Mode, ToolVersion } from '../types'

interface Props {
  version: ToolVersion
  onSelect: (mode: Mode) => void
}

const MODES: { id: Mode; title: string; subtitle: string; desc: string }[] = [
  {
    id: 1,
    title: '1. サムネを1から考える',
    subtitle: 'まだ案がないとき',
    desc: '企画内容や使いたい素材から、どういうサムネにするかを考えるモードです。',
  },
  {
    id: 2,
    title: '2. 今ある1案をレビューする',
    subtitle: '制作中のサムネを改善する',
    desc: '複数枚アップロードしてもOKです。その場合は、それぞれを個別にレビューします。',
  },
  {
    id: 3,
    title: '3. 複数の案を見比べる',
    subtitle: '完成案・提出案を比較する',
    desc: '完成案や提出案を見比べて、どれを採用するか決めるモードです。',
  },
]

export default function ModeSelector({ version, onSelect }: Props) {
  return (
    <div className="mode-selector">
      <div className="mode-header">
        <h2>
          {version === 'big' ? 'サムネ診断 ミニはやしビッグ' : 'サムネ診断 ミニはやし'}{' '}
          <span className="version-badge">Ver.1.0</span>
        </h2>
        <p>やりたいことを選んでください。</p>
      </div>
      <div className="mode-cards">
        {MODES.map((m) => (
          <button key={m.id} className="mode-card" onClick={() => onSelect(m.id)}>
            <div className="mode-card-num">{m.id}</div>
            <div className="mode-card-body">
              <div className="mode-card-title">{m.title}</div>
              <div className="mode-card-sub">{m.subtitle}</div>
              <div className="mode-card-desc">{m.desc}</div>
            </div>
            <div className="mode-card-arrow">→</div>
          </button>
        ))}
      </div>
    </div>
  )
}
