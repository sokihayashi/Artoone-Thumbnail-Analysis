interface Props {
  streaming: boolean
  elapsed: number
  retryCountdown: number | null
  onCancel: () => void
}

function formatElapsed(s: number): string {
  const m = Math.floor(s / 60)
  const ss = s % 60
  return `${m.toString().padStart(2, '0')}:${ss.toString().padStart(2, '0')}`
}

export default function StageTracker({ streaming, elapsed, retryCountdown, onCancel }: Props) {
  const isRetrying = retryCountdown !== null
  return (
    <div className="stage-strip">
      <div className="stage-strip-row">
        <span className="stage-dot" />
        <span className="stage-label">[{isRetrying ? 'RETRYING' : 'ANALYZING'}]</span>
        <span className="stage-meta">
          {isRetrying ? `${retryCountdown}秒後に再試行` : 'AIがサムネを解析しています'}
        </span>
        <span className="stage-elapsed">T+ {formatElapsed(elapsed)}</span>
        <button className="btn btn-ghost btn-sm" onClick={onCancel} disabled={!streaming && !isRetrying}>
          中断
        </button>
      </div>
      <div className="progress-blocks" aria-hidden>
        <span className="block" /><span className="block" /><span className="block" />
        <span className="block" /><span className="block" /><span className="block" />
        <span className="block" /><span className="block" /><span className="block" />
        <span className="block" /><span className="block" /><span className="block" />
      </div>
    </div>
  )
}
