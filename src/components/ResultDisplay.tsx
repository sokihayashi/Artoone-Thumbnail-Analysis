import ReactMarkdown from 'react-markdown'

interface Props {
  result: string
  streaming: boolean
  onBack: () => void
  onNewDiagnosis: () => void
}

export default function ResultDisplay({ result, streaming, onBack, onNewDiagnosis }: Props) {
  const handleCopy = () => {
    navigator.clipboard.writeText(result).catch(() => {})
  }

  return (
    <div className="result-container">
      <div className="result-toolbar">
        <button className="btn-back" onClick={onBack}>
          ← 修正して再診断
        </button>
        <div className="result-toolbar-right">
          {!streaming && result && (
            <button className="btn-secondary" onClick={handleCopy}>
              コピー
            </button>
          )}
          <button className="btn-primary" onClick={onNewDiagnosis}>
            新しい診断
          </button>
        </div>
      </div>

      <div className="result-body">
        {streaming && !result && (
          <div className="streaming-indicator">
            <span className="dot" />
            <span className="dot" />
            <span className="dot" />
          </div>
        )}
        {result && (
          <div className="markdown-content">
            <ReactMarkdown>{result}</ReactMarkdown>
            {streaming && <span className="cursor-blink">▌</span>}
          </div>
        )}
      </div>
    </div>
  )
}
