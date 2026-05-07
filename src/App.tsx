import { useState, useCallback } from 'react'
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
const BAKED_GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY as string | undefined
const BAKED_ANTHROPIC_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY as string | undefined
const BAKED_KEY = BAKED_GEMINI_KEY ?? BAKED_ANTHROPIC_KEY
const BAKED_PROVIDER: Provider | undefined = BAKED_GEMINI_KEY ? 'gemini' : BAKED_ANTHROPIC_KEY ? 'anthropic' : undefined

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

type Screen = 'mode-select' | 'form' | 'result'

export default function App() {
  const saved = loadSettings()

  const [apiKey, setApiKey] = useState(saved.apiKey ?? BAKED_KEY ?? '')
  const [provider, setProvider] = useState<Provider>(saved.provider ?? BAKED_PROVIDER ?? 'gemini')
  const [version, setVersion] = useState<ToolVersion>(saved.version ?? 'mini')
  const [model, setModel] = useState(saved.model ?? (BAKED_PROVIDER === 'anthropic' ? 'claude-sonnet-4-6' : 'gemini-2.0-flash'))

  const [screen, setScreen] = useState<Screen>('mode-select')
  const [selectedMode, setSelectedMode] = useState<Mode | null>(null)

  const [result, setResult] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [error, setError] = useState('')

  const persistSettings = useCallback(
    (patch: Partial<AppSettings>) => {
      saveSettings({ apiKey, provider, version, model, ...patch })
    },
    [apiKey, provider, version, model],
  )

  const handleApiKeySave = (key: string, p: Provider) => {
    setApiKey(key)
    setProvider(p)
    const defaultModel = p === 'gemini' ? 'gemini-2.0-flash' : 'claude-sonnet-4-6'
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

  const runDiagnosis = async (mode: Mode, data: FormData) => {
    setResult('')
    setError('')
    setStreaming(true)
    setScreen('result')

    try {
      const systemPrompt = buildSystemPrompt()
      const userContent = buildUserMessage(mode, data)
      let accumulated = ''
      for await (const chunk of streamClaude(apiKey, systemPrompt, userContent, model, provider)) {
        accumulated += chunk
        setResult(accumulated)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setStreaming(false)
    }
  }

  const handleFormSubmit = (data: FormData) => {
    if (!selectedMode) return
    runDiagnosis(selectedMode, data)
  }

  const handleBackToForm = () => {
    setScreen('form')
    setResult('')
    setError('')
    setStreaming(false)
  }

  const handleNewDiagnosis = () => {
    setScreen('mode-select')
    setSelectedMode(null)
    setResult('')
    setError('')
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
            {error && (
              <div className="error-banner">
                <strong>エラー：</strong> {error}
                <button className="btn-text-small" onClick={handleBackToForm}>フォームに戻る</button>
              </div>
            )}
            <ResultDisplay
              result={result}
              streaming={streaming}
              onBack={handleBackToForm}
              onNewDiagnosis={handleNewDiagnosis}
            />
          </>
        )}
      </main>
    </div>
  )
}
