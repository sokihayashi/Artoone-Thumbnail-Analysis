import { useState } from 'react'
import type { Mode3FormData } from '../types'
import ImageUploader from './ImageUploader'

interface Props {
  onSubmit: (data: Mode3FormData) => void
  onBack: () => void
  loading: boolean
  initialData?: Mode3FormData
}

export default function Mode3Form({ onSubmit, onBack, loading, initialData }: Props) {
  const [d, setD] = useState<Mode3FormData>(initialData ?? {
    title: '',
    overview: '',
    purpose: '',
    points: '',
    base: '',
    materials: '',
    tension: '',
    impression: '',
    completionLevel: '',
    thumbnailImages: [],
    referenceImages: [],
  })

  const set = (field: keyof Mode3FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setD((prev) => ({ ...prev, [field]: e.target.value }))

  const canSubmit = !!(d.title.trim() && d.purpose.trim() && d.thumbnailImages.length >= 2)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    onSubmit(d)
  }

  const touched = !!(d.title || d.purpose || d.thumbnailImages.length)
  const submitHint = touched && !canSubmit
    ? d.thumbnailImages.length === 0 ? '比較する画像を2枚以上追加してください'
    : d.thumbnailImages.length < 2 ? `あと${2 - d.thumbnailImages.length}枚追加してください`
    : !d.title.trim() ? 'タイトルを入力してください'
    : '比較の目的を入力してください'
    : null

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <div className="pane-scroll">
        <div className="form-step">
          <div className="form-step-tag">STEP 2 / 3 · INPUT</div>
          <h2 className="form-step-h2">複数の案を見比べる</h2>
        </div>

        <div className="form-fields">
          <ImageUploader
            label="比較するサムネ画像"
            hint="2枚以上"
            images={d.thumbnailImages}
            onChange={(imgs) => setD((prev) => ({ ...prev, thumbnailImages: imgs }))}
            required
          />

          <div className="field">
            <div className="field-label">動画タイトル <span className="field-required">*</span></div>
            <input className="input" type="text" value={d.title} onChange={set('title')} placeholder="例：【検証】ChatGPTで1週間生活したら..." required />
          </div>

          <div className="field">
            <div className="field-label">動画の概要 <span className="field-hint">任意</span></div>
            <textarea className="textarea" value={d.overview} onChange={set('overview')} rows={3} />
          </div>

          <div className="field">
            <div className="field-label">比較の目的 <span className="field-required">*</span></div>
            <input className="input" type="text" value={d.purpose} onChange={set('purpose')} placeholder="例：最終的にどちらを採用するか決めたい" required />
          </div>

          <div className="field">
            <div className="field-label">参考にしたい点 <span className="field-hint">任意</span></div>
            <input className="input" type="text" value={d.points} onChange={set('points')} placeholder="例：クリック率、視認性、チャンネルとの統一感" />
          </div>

          <div className="field">
            <div className="field-label">どれをベースにしたいか <span className="field-hint">任意</span></div>
            <input className="input" type="text" value={d.base} onChange={set('base')} placeholder="例：A案の構成をベースにしたい" />
          </div>

          <div className="field">
            <div className="field-label">使いたい素材 <span className="field-hint">任意</span></div>
            <input className="input" type="text" value={d.materials} onChange={set('materials')} />
          </div>

          <div className="field">
            <div className="field-label">テンション感 <span className="field-hint">任意</span></div>
            <input className="input" type="text" value={d.tension} onChange={set('tension')} />
          </div>

          <div className="field">
            <div className="field-label">サムネで目指したい印象 <span className="field-hint">任意</span></div>
            <input className="input" type="text" value={d.impression} onChange={set('impression')} />
          </div>

          <div className="field">
            <div className="field-label">ラフか完成版か <span className="field-hint">任意</span></div>
            <select
              className="select"
              value={d.completionLevel}
              onChange={(e) => setD((prev) => ({ ...prev, completionLevel: e.target.value }))}
            >
              <option value="">選択しない</option>
              <option value="ラフ">ラフ</option>
              <option value="ほぼ完成">ほぼ完成</option>
              <option value="完成版">完成版</option>
            </select>
          </div>

          <ImageUploader
            label="参考にしたい既存サムネ"
            hint="任意"
            images={d.referenceImages}
            onChange={(imgs) => setD((prev) => ({ ...prev, referenceImages: imgs }))}
          />
        </div>
      </div>

      <div className="pane-foot">
        <button type="button" className="btn btn-ghost btn-sm" onClick={onBack}>← モード選択</button>
        <div className="col" style={{ alignItems: 'flex-end', gap: 4 }}>
          {submitHint && <span className="submit-hint">{submitHint}</span>}
          <button type="submit" className="btn btn-accent" disabled={loading || !canSubmit}>
            <span style={{ fontSize: 14 }}>✦</span>
            {loading ? '診断中…' : '診断を開始'}
          </button>
        </div>
      </div>
    </form>
  )
}
