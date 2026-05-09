import { useState } from 'react'
import type { Mode2FormData } from '../types'
import ImageUploader from './ImageUploader'

interface Props {
  onSubmit: (data: Mode2FormData) => void
  onBack: () => void
  loading: boolean
  initialData?: Mode2FormData
}

export default function Mode2Form({ onSubmit, onBack, loading, initialData }: Props) {
  const [d, setD] = useState<Mode2FormData>(initialData ?? {
    title: '',
    members: '',
    overview: '',
    materials: '',
    intendedSubject: '',
    tension: '',
    impression: '',
    completionLevel: '',
    thumbnailImages: [],
    referenceImages: [],
  })

  const set = (field: keyof Mode2FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setD((prev) => ({ ...prev, [field]: e.target.value }))

  const canSubmit = !!(d.title.trim() && d.thumbnailImages.length > 0)
  const touched = !!(d.title || d.thumbnailImages.length || d.members || d.overview)
  const submitHint = touched && !canSubmit
    ? !d.thumbnailImages.length ? '画像を追加してください'
    : 'タイトルを入力してください'
    : null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    onSubmit(d)
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <div className="pane-scroll">
        <div className="form-step">
          <div className="form-step-tag">STEP 2 / 3 · INPUT</div>
          <h2 className="form-step-h2">サムネと文脈を教えてください</h2>
        </div>

        <div className="form-fields">
          <ImageUploader
            label="レビューするサムネ画像"
            images={d.thumbnailImages}
            onChange={(imgs) => setD((prev) => ({ ...prev, thumbnailImages: imgs }))}
            required
          />

          <div className="field">
            <div className="field-label">動画タイトル <span className="field-required">*</span></div>
            <input className="input" type="text" value={d.title} onChange={set('title')} placeholder="例：【検証】ChatGPTで1週間生活したら..." required />
          </div>

          <div className="field">
            <div className="field-label">サムネに出ているメンバー <span className="field-hint">任意</span></div>
            <input className="input" type="text" value={d.members} onChange={set('members')} placeholder="例：真田、林" />
          </div>

          <div className="field">
            <div className="field-label">動画の概要 <span className="field-hint">120字程度</span></div>
            <textarea className="textarea" value={d.overview} onChange={set('overview')} rows={3} />
          </div>

          <div className="field">
            <div className="field-label">使っている素材 <span className="field-hint">任意</span></div>
            <input className="input" type="text" value={d.materials} onChange={set('materials')} />
          </div>

          <div className="field">
            <div className="field-label">サムネで主役にしているもの <span className="field-hint">任意</span></div>
            <select
              className="select"
              value={d.intendedSubject}
              onChange={(e) => setD((prev) => ({ ...prev, intendedSubject: e.target.value }))}
            >
              <option value="">選択しない</option>
              <option value="顔・リアクション">顔・リアクション（人物の表情や反応を見せたい）</option>
              <option value="作品・完成物・モノ">作品・完成物・モノ（制作物や素材が主役）</option>
              <option value="文字・企画のインパクト">文字・企画のインパクト（キャッチコピーや意外性）</option>
              <option value="人物と作品の組み合わせ">人物と作品の組み合わせ（両方見せたい）</option>
              <option value="まだ決めていない">わからない / 迷っている</option>
            </select>
          </div>

          <div className="field">
            <div className="field-label">テンション感 <span className="field-hint">任意</span></div>
            <input className="input" type="text" value={d.tension} onChange={set('tension')} placeholder="例：にぎやか、シリアス" />
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
