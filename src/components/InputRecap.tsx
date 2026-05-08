import type { Mode, FormData, Provider, UploadedImage, Mode1FormData, Mode2FormData, Mode3FormData } from '../types'

interface Props {
  mode: Mode | null
  data: FormData | null
  model: string
  provider: Provider
}

const MODE_LABEL: Record<Mode, string> = {
  1: 'プラン',
  2: 'レビュー',
  3: '比較',
}

function pickThumbnails(mode: Mode | null, data: FormData | null): UploadedImage[] {
  if (!mode || !data) return []
  if (mode === 1) {
    const d = data as Mode1FormData
    return d.materialImages.length > 0 ? d.materialImages : d.referenceImages
  }
  const d = data as Mode2FormData | Mode3FormData
  return d.thumbnailImages
}

export default function InputRecap({ mode, data, model, provider }: Props) {
  const thumbnails = pickThumbnails(mode, data)
  const title = data?.title || ''
  const overview = (data as Mode1FormData | Mode2FormData | Mode3FormData | null)?.overview || ''

  return (
    <>
      <div className="recap-tag">
        <span>INPUT</span>
      </div>

      {thumbnails.length === 0 ? (
        <div className="recap-thumb recap-thumb-placeholder">
          画像なし
        </div>
      ) : thumbnails.length === 1 ? (
        <img className="recap-thumb" src={thumbnails[0].dataUrl} alt={thumbnails[0].name} />
      ) : (
        <div className="recap-thumb-grid">
          {thumbnails.slice(0, 4).map((img, i) => (
            <img key={i} src={img.dataUrl} alt={img.name} />
          ))}
        </div>
      )}

      {title && (
        <div className="recap-field">
          <div className="recap-field-label">TITLE</div>
          <div className="recap-field-value">{title}</div>
        </div>
      )}

      {overview && (
        <div className="recap-field">
          <div className="recap-field-label">SUMMARY</div>
          <div className="recap-field-value-sm">{overview}</div>
        </div>
      )}

      {mode === 3 && data && 'purpose' in data && data.purpose && (
        <div className="recap-field">
          <div className="recap-field-label">PURPOSE</div>
          <div className="recap-field-value-sm">{data.purpose}</div>
        </div>
      )}

      <div className="recap-meta">
        <div><span className="recap-meta-key">model</span>　{shortModel(model, provider)}</div>
        <div><span className="recap-meta-key">mode</span>　{mode ? MODE_LABEL[mode] : '—'}</div>
      </div>
    </>
  )
}

function shortModel(model: string, _provider: Provider): string {
  return model.split('/').pop() || model
}
