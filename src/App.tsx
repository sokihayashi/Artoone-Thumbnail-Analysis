import { useState, useCallback } from 'react'
import type { Mode, ToolVersion, FormData, AppSettings } from './types'
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

const STORAGE_KEY = 'artoone_settings'

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

  const [apiKey, setApiKey] = useState(saved.apiKey ?? '')
  const [version, setVersion] = useState<ToolVersion>(saved.version ?? 'mini')
  const [model, setModel] = useState(saved.model ?? 'claude-sonnet-4-6')
  const [dlcData, setDlcData] = useState<string | null>(saved.dlcData ?? null)

  const [screen, setScreen] = useState<Screen>('mode-select')
  const [selectedMode, setSelectedMode] = useState<Mode | null>(null)

  const [result, setResult] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [error, setError] = useState('')

  const persistSettings = useCallback(
    (patch: Partial<AppSettings>) => {
      const next = { apiKey, version, model, dlcData, ...patch }
      saveSettings(next)
    },
    [apiKey, version, model, dlcData],
  )

  const handleApiKey = (key: string) => {
    setApiKey(key)
    persistSettings({ apiKey: key })
  }

  const handleVersion = (v: ToolVersion) => {
    setVersion(v)
    persistSettings({ version: v })
  }

  const handleModel = (m: string) => {
    setModel(m)
    persistSettings({ model: m })
  }

  const handleDlcUpload = (json: string) => {
    setDlcData(json)
    persistSettings({ dlcData: json })
  }

  const handleDlcClear = () => {
    setDlcData(null)
    persistSettings({ dlcData: null })
  }

  const handleApiKeyReset = () => {
    setApiKey('')
    saveSettings({ version, model, dlcData })
  }

  const handleModeSelect = (mode: Mode) => {
    setSelectedMode(mode)
    setScreen('form')
    setResult('')
    setError('')
  }

  const buildSystemPrompt = () => {
    const base = version === 'big' ? miniHayashiBigPrompt : miniHayashiPrompt
    if (!dlcData) return base
    return `${base}\n\n---\n\n## 追加DLC ミニCooさん データ\n\n以下のJSONが今回提供されています。\n\`\`\`json\n${dlcData}\n\`\`\``
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
      for await (const chunk of streamClaude(apiKey, systemPrompt, userContent, model)) {
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
    return <ApiKeySetup onSave={handleApiKey} />
  }

  return (
    <div className="app">
      <Header
        version={version}
        onVersionChange={handleVersion}
        dlcLoaded={!!dlcData}
        onDlcUpload={handleDlcUpload}
        onDlcClear={handleDlcClear}
        model={model}
        onModelChange={handleModel}
        onReset={handleNewDiagnosis}
        onApiKeyReset={handleApiKeyReset}
      />

      <main className="app-main">
        {screen === 'mode-select' && (
          <ModeSelector version={version} onSelect={handleModeSelect} />
        )}

        {screen === 'form' && selectedMode === 1 && (
          <Mode1Form
            onSubmit={(d) => handleFormSubmit(d as unknown as FormData)}
            onBack={() => setScreen('mode-select')}
            loading={streaming}
          />
        )}
        {screen === 'form' && selectedMode === 2 && (
          <Mode2Form
            onSubmit={(d) => handleFormSubmit(d as unknown as FormData)}
            onBack={() => setScreen('mode-select')}
            loading={streaming}
          />
        )}
        {screen === 'form' && selectedMode === 3 && (
          <Mode3Form
            onSubmit={(d) => handleFormSubmit(d as unknown as FormData)}
            onBack={() => setScreen('mode-select')}
            loading={streaming}
          />
        )}

        {screen === 'result' && (
          <>
            {error && (
              <div className="error-banner">
                <strong>エラー：</strong> {error}
                <button className="btn-text-small" onClick={handleBackToForm}>
                  フォームに戻る
                </button>
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
