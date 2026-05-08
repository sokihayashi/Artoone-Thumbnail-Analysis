import type { ToolVersion, Provider } from '../types'

interface Props {
  version: ToolVersion
  onVersionChange: (v: ToolVersion) => void
  provider: Provider
  onProviderChange: (p: Provider) => void
  model: string
  onModelChange: (m: string) => void
  onReset: () => void
  onApiKeyReset: () => void
  bakedKey: boolean
  screen: 'mode-select' | 'form' | 'result'
  subtitle?: string
}

const MODELS: Record<Provider, { id: string; label: string }[]> = {
  openrouter: [
    { id: 'anthropic/claude-haiku-4-5', label: 'Claude Haiku 4.5（推奨）' },
    { id: 'anthropic/claude-sonnet-4-6', label: 'Claude Sonnet 4.6（最高品質）' },
    { id: 'google/gemini-2.5-flash', label: 'Gemini 2.5 Flash（安価）' },
    { id: 'nvidia/nemotron-nano-12b-v2-vl:free', label: 'Nemotron Nano 12B VL（無料）' },
  ],
  anthropic: [
    { id: 'claude-sonnet-4-6', label: 'Sonnet 4.6' },
    { id: 'claude-opus-4-7', label: 'Opus 4.7' },
  ],
}

const PROVIDER_LABEL: Record<Provider, string> = {
  openrouter: 'OpenRouter',
  anthropic: 'Claude',
}

const PROVIDER_ORDER: Provider[] = ['openrouter', 'anthropic']

export default function Header({
  version, onVersionChange,
  provider, onProviderChange,
  model, onModelChange,
  onApiKeyReset,
  bakedKey, subtitle,
  onReset,
}: Props) {
  const handleProviderChange = (p: Provider) => {
    onProviderChange(p)
    onModelChange(MODELS[p][0].id)
  }

  return (
    <header className="app-header">
      <div className="header-left">
        <span className="window-controls" aria-hidden>
          <i /><i /><i />
        </span>
        <button className="header-logo" onClick={onReset} title="モード選択へ">
          <div className="logo-mark">A</div>
          <span className="logo-text">Artoone</span>
          <span className="logo-subtitle">/ サムネ診断</span>
        </button>
        {subtitle && <span className="header-tag">[{subtitle}]</span>}
      </div>

      <div className="header-right">
        <div className="tab-pill">
          <button className={version === 'mini' ? 'is-on' : ''} onClick={() => onVersionChange('mini')}>
            かんたん
          </button>
          <button className={version === 'big' ? 'is-on' : ''} onClick={() => onVersionChange('big')}>
            詳細
          </button>
        </div>

        {!bakedKey && (
          <div className="header-advanced row" style={{ gap: 6 }}>
            <div className="tab-pill">
              {PROVIDER_ORDER.map((p) => (
                <button
                  key={p}
                  className={provider === p ? 'is-on' : ''}
                  onClick={() => handleProviderChange(p)}
                >
                  {PROVIDER_LABEL[p]}
                </button>
              ))}
            </div>

            <select className="model-select" value={model} onChange={(e) => onModelChange(e.target.value)}>
              {MODELS[provider].map((m) => (
                <option key={m.id} value={m.id}>{m.label}</option>
              ))}
            </select>

            <button className="btn btn-ghost btn-sm" onClick={onApiKeyReset}>APIキー</button>
          </div>
        )}
      </div>
    </header>
  )
}
