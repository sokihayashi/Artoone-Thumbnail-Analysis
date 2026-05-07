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
  anthropic: [
    { id: 'claude-sonnet-4-6', label: 'Sonnet 4.6' },
    { id: 'claude-opus-4-7', label: 'Opus 4.7' },
  ],
  gemini: [
    { id: 'gemini-2.0-flash', label: 'Flash 2.0 (無料)' },
    { id: 'gemini-1.5-pro', label: '1.5 Pro' },
    { id: 'gemini-1.5-flash', label: '1.5 Flash' },
  ],
}

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
            <div className="version-toggle">
              <button className={provider === 'gemini' ? 'toggle-btn active' : 'toggle-btn'} onClick={() => handleProviderChange('gemini')}>
                Gemini
              </button>
              <button className={provider === 'anthropic' ? 'toggle-btn active' : 'toggle-btn'} onClick={() => handleProviderChange('anthropic')}>
                Claude
              </button>
            </div>
          )}

          {!bakedKey && (
            <select className="model-select" value={model} onChange={(e) => onModelChange(e.target.value)}>
              {MODELS[provider].map((m) => (
                <option key={m.id} value={m.id}>{m.label}</option>
              ))}
            </select>
          )}

          {!bakedKey && (
            <button className="btn-text-small" onClick={onApiKeyReset}>APIキー</button>
          )}
        </div>
      </div>
    </header>
  )
}
