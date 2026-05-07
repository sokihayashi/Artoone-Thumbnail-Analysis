import { useState } from 'react'
import type { Provider } from '../types'

interface Props {
  onSave: (key: string, provider: Provider) => void
}

const INFO: Record<Provider, { label: string; placeholder: string; hint: string; url: string; urlLabel: string }> = {
  openrouter: {
    label: 'OpenRouter APIキー',
    placeholder: 'sk-or-...',
    hint: '無料モデル（Gemini 2.0 Flash等）が使えます。',
    url: 'https://openrouter.ai/keys',
    urlLabel: 'openrouter.ai',
  },
  gemini: {
    label: 'Google AI Studio APIキー',
    placeholder: 'AIza...',
    hint: 'Google AI Studio で無料発行できます。',
    url: 'https://aistudio.google.com/app/apikey',
    urlLabel: 'aistudio.google.com',
  },
  anthropic: {
    label: 'Anthropic APIキー',
    placeholder: 'sk-ant-...',
    hint: 'console.anthropic.com でAPIキーを発行してください。',
    url: 'https://console.anthropic.com/',
    urlLabel: 'console.anthropic.com',
  },
}

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
        <div className="setup-icon">🎨</div>
        <h1>Artooneサムネ診断</h1>
        <p className="setup-subtitle">アートゥーン！ サムネイル診断システム</p>

        <div className="provider-toggle">
          <button
            type="button"
            className={provider === 'openrouter' ? 'toggle-btn active' : 'toggle-btn'}
            onClick={() => handleProviderChange('openrouter')}
          >
            OpenRouter（無料）
          </button>
          <button
            type="button"
            className={provider === 'gemini' ? 'toggle-btn active' : 'toggle-btn'}
            onClick={() => handleProviderChange('gemini')}
          >
            Gemini
          </button>
          <button
            type="button"
            className={provider === 'anthropic' ? 'toggle-btn active' : 'toggle-btn'}
            onClick={() => handleProviderChange('anthropic')}
          >
            Claude
          </button>
        </div>

        <form onSubmit={handleSubmit} className="setup-form">
          <label htmlFor="apikey">{info.label}</label>
          <div className="input-row">
            <input
              id="apikey"
              type={show ? 'text' : 'password'}
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder={info.placeholder}
              autoComplete="off"
              spellCheck={false}
            />
            <button type="button" className="btn-icon" onClick={() => setShow((s) => !s)}>
              {show ? '非表示' : '表示'}
            </button>
          </div>
          <p className="setup-hint">
            {info.hint}{' '}
            <a href={info.url} target="_blank" rel="noreferrer">{info.urlLabel}</a>
            <br />
            キーはブラウザの localStorage に保存されます。
          </p>
          <button type="submit" className="btn-primary" disabled={!key.trim()}>
            はじめる
          </button>
        </form>
      </div>
    </div>
  )
}
