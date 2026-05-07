import type { ToolVersion } from '../types'

interface Props {
  version: ToolVersion
  onVersionChange: (v: ToolVersion) => void
  dlcLoaded: boolean
  onDlcUpload: (json: string) => void
  onDlcClear: () => void
  model: string
  onModelChange: (m: string) => void
  onReset: () => void
  onApiKeyReset: () => void
}

const MODELS = [
  { id: 'claude-opus-4-7', label: 'Opus 4.7 (高精度)' },
  { id: 'claude-sonnet-4-6', label: 'Sonnet 4.6 (標準)' },
]

export default function Header({
  version,
  onVersionChange,
  dlcLoaded,
  onDlcUpload,
  onDlcClear,
  model,
  onModelChange,
  onReset,
  onApiKeyReset,
}: Props) {
  const handleDlcFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      try {
        JSON.parse(text)
        onDlcUpload(text)
      } catch {
        alert('JSONファイルの読み込みに失敗しました。')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <header className="app-header">
      <div className="header-inner">
        <button className="header-logo" onClick={onReset}>
          <span className="logo-icon">🎨</span>
          <span className="logo-text">サムネ診断</span>
        </button>

        <div className="header-controls">
          <div className="version-toggle">
            <button
              className={version === 'mini' ? 'toggle-btn active' : 'toggle-btn'}
              onClick={() => onVersionChange('mini')}
            >
              ミニはやし
            </button>
            <button
              className={version === 'big' ? 'toggle-btn active' : 'toggle-btn'}
              onClick={() => onVersionChange('big')}
            >
              ビッグ
            </button>
          </div>

          <select
            className="model-select"
            value={model}
            onChange={(e) => onModelChange(e.target.value)}
            title="使用するモデル"
          >
            {MODELS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>

          <div className="dlc-control">
            {dlcLoaded ? (
              <button className="btn-dlc-loaded" onClick={onDlcClear} title="DLCを解除">
                DLC ✓
              </button>
            ) : (
              <label className="btn-dlc" title="ミニCooさん DLCをアップロード">
                DLC
                <input type="file" accept=".json" onChange={handleDlcFile} hidden />
              </label>
            )}
          </div>

          <button className="btn-text-small" onClick={onApiKeyReset} title="APIキーを変更">
            APIキー
          </button>
        </div>
      </div>
    </header>
  )
}
