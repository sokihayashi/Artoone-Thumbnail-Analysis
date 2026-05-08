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
}

const MODELS: Record<Provider, { id: string; label: string }[]> = {
  openrouter: [
    { id: 'google/gemini-2.5-flash', label: 'Gemini 2.5 Flash（推奨・安価）' },
    { id: 'google/gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash Lite（最安）' },
    { id: 'anthropic/claude-haiku-4-5', label: 'Claude Haiku 4.5（高速・賢め）' },
    { id: 'anthropic/claude-sonnet-4-6', label: 'Claude Sonnet 4.6（最高品質）' },
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
  onReset, onApiKeyReset,
  bakedKey, screen,
}: Props) {
  const handleProviderChange = (p: Provider) => {
    onProviderChange(p)
    onModelChange(MODELS[p][0].id)
  }

  const showBack = screen !== 'mode-select'

  return (
    <header className="app-header">
      <div className="header-inner">
        <div className="header-left">
          {showBack && (
            <button className="btn-back-header" onClick={onReset} title="モード選択に戻る">
              ←
            </button>
          )}
          <button className="header-logo" onClick={onReset}>
            <span className="logo-icon">🎨</span>
            <span className="logo-text">Artooneサムネ診断</span>
          </button>
        </div>

        <div className="header-controls">
          <div className="version-toggle">
            <button className={version === 'mini' ? 'toggle-btn active' : 'toggle-btn'} onClick={() => onVersionChange('mini')}>
              かんたん
            </button>
            <button className={version === 'big' ? 'toggle-btn active' : 'toggle-btn'} onClick={() => onVersionChange('big')}>
              詳細
            </button>
          </div>

          {!bakedKey && (
            <>
              <div className="version-toggle">
                {PROVIDER_ORDER.map((p) => (
                  <button
                    key={p}
                    className={provider === p ? 'toggle-btn active' : 'toggle-btn'}
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

              <button className="btn-text-small" onClick={onApiKeyReset}>APIキー</button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
