import { useState } from 'react'

interface Props {
  onSave: (key: string) => void
}

export default function ApiKeySetup({ onSave }: Props) {
  const [key, setKey] = useState('')
  const [show, setShow] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = key.trim()
    if (trimmed) onSave(trimmed)
  }

  return (
    <div className="setup-overlay">
      <div className="setup-card">
        <div className="setup-icon">🎨</div>
        <h1>サムネ診断ツール</h1>
        <p className="setup-subtitle">アートゥーン！ サムネイル診断システム</p>
        <form onSubmit={handleSubmit} className="setup-form">
          <label htmlFor="apikey">Anthropic API キー</label>
          <div className="input-row">
            <input
              id="apikey"
              type={show ? 'text' : 'password'}
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="sk-ant-..."
              autoComplete="off"
              spellCheck={false}
            />
            <button type="button" className="btn-icon" onClick={() => setShow((s) => !s)}>
              {show ? '非表示' : '表示'}
            </button>
          </div>
          <p className="setup-hint">
            APIキーはブラウザの localStorage に保存されます。共有PCでは使用後にリセットしてください。
          </p>
          <button type="submit" className="btn-primary" disabled={!key.trim()}>
            はじめる
          </button>
        </form>
      </div>
    </div>
  )
}
