import { useState, useCallback, useRef, useEffect } from 'react'
import type { Mode, ToolVersion, FormData, AppSettings, Provider } from './types'
import { streamClaude, buildUserMessage } from './utils/claude'
import ApiKeySetup from './components/ApiKeySetup'
import Header from './components/Header'
import ModeSelector from './components/ModeSelector'
import Mode1Form from './components/Mode1Form'
import Mode2Form from './components/Mode2Form'
import Mode3Form from './components/Mode3Form'
import ResultDisplay from './components/ResultDisplay'

import miniHayashiPrompt from './prompts/mini-hayashi.md?raw'
import miniHayashiBigPrompt from './prompts/mini-hayashi-big.md?raw'
import dlcData from './data/dlc.json'

const STORAGE_KEY = 'artoone_settings'
const BAKED_OPENROUTER_KEY = import.meta.env.VITE_OPENROUTER_API_KEY as string | undefined
const BAKED_GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY as string | undefined
const BAKED_ANTHROPIC_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY as string | undefined
const BAKED_KEY = BAKED_OPENROUTER_KEY ?? BAKED_GEMINI_KEY ?? BAKED_ANTHROPIC_KEY
const BAKED_PROVIDER: Provider | undefined = BAKED_OPENROUTER_KEY ? 'openrouter' : BAKED_GEMINI_KEY ? 'gemini' : BAKED_ANTHROPIC_KEY ? 'anthropic' : undefined

function loadSettings(): Partial<AppSettings> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
  } catch {
    return {}
  }
}

function saveSettings(s: Partial<AppSettings>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
}

function parseRetryAfter(msg: string): number | null {
  const m = msg.match(/Please retry in ([\d.]+)s/)
  return m ? Math.ceil(parseFloat(m[1])) : null
}

type Screen = 'mode-select' | 'form' | 'result'

export default function App() {
  const saved = loadSettings()

  const [apiKey, setApiKey] = useState(saved.apiKey ?? BAKED_KEY ?? '')
  const [provider, setProvider] = useState<Provider>(saved.provider ?? BAKED_PROVIDER ?? 'gemini')
  const [version, setVersion] = useState<ToolVersion>(saved.version ?? 'mini')
  const defaultModel = BAKED_PROVIDER === 'anthropic' ? 'claude-sonnet-4-6'
    : BAKED_PROVIDER === 'openrouter' ? 'google/gemini-2.0-flash-exp:free'
    : 'gemini-1.5-flash'
  const [model, setModel] = useState(saved.model ?? defaultModel)

  const [screen, setScreen] = useState<Screen>('mode-select')
  const [selectedMode, setSelectedMode] = useState<Mode | null>(null)

  const [result, setResult] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [error, setError] = useState('')
  const [retryCountdown, setRetryCountdown] = useState<number | null>(null)

  const retryTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    return () => { if (retryTimerRef.current) clearInterval(retryTimerRef.current) }
  }, [])

  const persistSettings = useCallback(
    (patch: Partial<AppSettings>) => {
      saveSettings({ apiKey, provider, version, model, ...patch })
    },
    [apiKey, provider, version, model],
  )

  const handleApiKeySave = (key: string, p: Provider) => {
    setApiKey(key)
    setProvider(p)
    const defaultModel = p === 'openrouter' ? 'google/gemini-2.0-flash-exp:free'
      : p === 'gemini' ? 'gemini-1.5-flash' : 'claude-sonnet-4-6'
    setModel(defaultModel)
    persistSettings({ apiKey: key, provider: p, model: defaultModel })
  }

  const handleVersion = (v: ToolVersion) => { setVersion(v); persistSettings({ version: v }) }
  const handleProvider = (p: Provider) => { setProvider(p); persistSettings({ provider: p }) }
  const handleModel = (m: string) => { setModel(m); persistSettings({ model: m }) }
  const handleApiKeyReset = () => { setApiKey(''); saveSettings({ provider, version, model }) }

  const handleModeSelect = (mode: Mode) => {
    setSelectedMode(mode)
    setScreen('form')
    setResult('')
    setError('')
  }

  const buildSystemPrompt = () => {
    const base = version === 'big' ? miniHayashiBigPrompt : miniHayashiPrompt
    const dlcJson = JSON.stringify(dlcData)
    return `${base}\n\n---\n\n## 追加DLC ミニCooさん データ\n\n以下のJSONが今回提供されています。\n\`\`\`json\n${dlcJson}\n\`\`\``
  }

  const runDiagnosis = useCallback(async (mode: Mode, data: FormData, retryCount = 0) => {
    setResult('')
    setError('')
    setRetryCountdown(null)
    setStreaming(true)
    if (retryCount === 0) setScreen('result')

    try {
      const systemPrompt = buildSystemPrompt()
      const userContent = buildUserMessage(mode, data)
      let accumulated = ''
      for await (const chunk of streamClaude(apiKey, systemPrompt, userContent, model, provider)) {
        accumulated += chunk
        setResult(accumulated)
      }
      setStreaming(false)
    } catch (e) {
      setStreaming(false)
      const msg = e instanceof Error ? e.message : String(e)
      const waitSecs = retryCount < 3 ? parseRetryAfter(msg) : null
      if (waitSecs !== null) {
        let remaining = waitSecs
        setRetryCountdown(remaining)
        retryTimerRef.current = setInterval(() => {
          remaining -= 1
          setRetryCountdown(remaining)
          if (remaining <= 0) {
            clearInterval(retryTimerRef.current!)
            retryTimerRef.current = null
            setRetryCountdown(null)
            runDiagnosis(mode, data, retryCount + 1)
          }
        }, 1000)
      } else {
        setError(msg)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey, model, provider, version])

  const handleFormSubmit = (data: FormData) => {
    if (!selectedMode) return
    runDiagnosis(selectedMode, data)
  }

  const handleBackToForm = () => {
    if (retryTimerRef.current) { clearInterval(retryTimerRef.current); retryTimerRef.current = null }
    setScreen('form')
    setResult('')
    setError('')
    setStreaming(false)
    setRetryCountdown(null)
  }

  const handleNewDiagnosis = () => {
    if (retryTimerRef.current) { clearInterval(retryTimerRef.current); retryTimerRef.current = null }
    setScreen('mode-select')
    setSelectedMode(null)
    setResult('')
    setError('')
    setRetryCountdown(null)
  }

  if (!apiKey) {
    return <ApiKeySetup onSave={handleApiKeySave} />
  }

  return (
    <div className="app">
      <Header
        version={version}
        onVersionChange={handleVersion}
        provider={provider}
        onProviderChange={handleProvider}
        model={model}
        onModelChange={handleModel}
        onReset={handleNewDiagnosis}
        onApiKeyReset={handleApiKeyReset}
        bakedKey={!!BAKED_KEY}
        screen={screen}
      />

      <main className="app-main">
        {screen === 'mode-select' && (
          <ModeSelector version={version} onSelect={handleModeSelect} />
        )}

        {screen === 'form' && selectedMode === 1 && (
          <Mode1Form onSubmit={(d) => handleFormSubmit(d as unknown as FormData)} onBack={() => setScreen('mode-select')} loading={streaming} />
        )}
        {screen === 'form' && selectedMode === 2 && (
          <Mode2Form onSubmit={(d) => handleFormSubmit(d as unknown as FormData)} onBack={() => setScreen('mode-select')} loading={streaming} />
        )}
        {screen === 'form' && selectedMode === 3 && (
          <Mode3Form onSubmit={(d) => handleFormSubmit(d as unknown as FormData)} onBack={() => setScreen('mode-select')} loading={streaming} />
        )}

        {screen === 'result' && (
          <>
            {retryCountdown !== null && (
              <div className="retry-banner">
                レート制限中... <strong>{retryCountdown}秒後に自動リトライします</strong>
              </div>
            )}
            {error && (
              <div className="error-banner">
                <strong>エラー：</strong> {error}
                <button className="btn-text-small" onClick={handleBackToForm}>フォームに戻る</button>
              </div>
            )}
            <ResultDisplay
              result={result}
              streaming={streaming || retryCountdown !== null}
              onBack={handleBackToForm}
              onNewDiagnosis={handleNewDiagnosis}
            />
          </>
        )}
      </main>
    </div>
  )
}
