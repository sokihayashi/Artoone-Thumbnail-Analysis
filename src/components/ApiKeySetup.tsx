import { useState } from 'react'
import type { Provider } from '../types'

interface Props {
  onSave: (key: string, provider: Provider) => void
}

interface ProviderInfo {
  label: string
  toggleLabel: string
  placeholder: string
  hint: string
  url: string
  urlLabel: string
}

const INFO: Record<Provider, ProviderInfo> = {
  openrouter: {
    label: 'OpenRouter APIキー',
    toggleLabel: 'OpenRouter（無料）',
    placeholder: 'sk-or-...',
    hint: '無料モデル（Gemini 2.5 Flash等）が使えます。',
    url: 'https://openrouter.ai/keys',
    urlLabel: 'openrouter.ai',
  },
  anthropic: {
    label: 'Anthropic APIキー',
    toggleLabel: 'Claude',
    placeholder: 'sk-ant-...',
    hint: 'console.anthropic.com でAPIキーを発行してください。',
    url: 'https://console.anthropic.com/',
    urlLabel: 'console.anthropic.com',
  },
}

const PROVIDER_ORDER: Provider[] = ['openrouter', 'anthropic']

export default function ApiKeySetup({ onSave }: Props) {
  const [provider, setProvider] = useState<Provider>('openrouter')
  const [key, setKey] = useState('')
  const [show, setShow] = useState(false)

  const info = INFO[provider]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = key.trim()
    if (trimmed) onSave(trimmed, provider)
  }

  const handleProviderChange = (p: Provider) => {
    setProvider(p)
    setKey('')
  }

  return (
    <div className="setup-overlay">
      <div className="setup-card">
        <div className="row" style={{ gap: 10, marginBottom: 14 }}>
          <div className="logo-mark" style={{ width: 28, height: 28, fontSize: 13 }}>A</div>
          <div className="col">
            <h1 style={{ margin: 0 }}>Artoone サムネ診断</h1>
          </div>
        </div>
        <p className="setup-subtitle">YouTubeチーム向け · サムネイル診断ツール</p>

        <div className="tab-pill" style={{ marginBottom: 18 }}>
          {PROVIDER_ORDER.map((p) => (
            <button
              key={p}
              type="button"
              className={provider === p ? 'is-on' : ''}
              onClick={() => handleProviderChange(p)}
            >
              {INFO[p].toggleLabel}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="setup-form">
          <div className="field">
            <label className="field-label" htmlFor="apikey">{info.label}</label>
            <div className="row" style={{ gap: 6 }}>
              <input
                className="input"
                id="apikey"
                type={show ? 'text' : 'password'}
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder={info.placeholder}
                autoComplete="off"
                spellCheck={false}
              />
              <button type="button" className="btn btn-sm" onClick={() => setShow((s) => !s)}>
                {show ? '非表示' : '表示'}
              </button>
            </div>
          </div>
          <p className="setup-hint">
            {info.hint}{' '}
            <a href={info.url} target="_blank" rel="noreferrer">{info.urlLabel}</a>
            <br />
            キーはブラウザの localStorage に保存されます。
          </p>
          <button type="submit" className="btn btn-primary btn-lg" disabled={!key.trim()}>
            はじめる
          </button>
        </form>
      </div>
    </div>
  )
}
