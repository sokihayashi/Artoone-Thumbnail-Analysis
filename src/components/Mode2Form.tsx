import { useState } from 'react'
import type { Mode2FormData } from '../types'
import ImageUploader from './ImageUploader'

interface Props {
  onSubmit: (data: Mode2FormData) => void
  onBack: () => void
  loading: boolean
}

export default function Mode2Form({ onSubmit, onBack, loading }: Props) {
  const [d, setD] = useState<Mode2FormData>({
    title: '',
    members: '',
    overview: '',
    materials: '',
    tension: '',
    impression: '',
    completionLevel: '',
    thumbnailImages: [],
    referenceImages: [],
  })

  const set = (field: keyof Mode2FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setD((prev) => ({ ...prev, [field]: e.target.value }))

  const canSubmit = d.title.trim() && d.thumbnailImages.length > 0

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    onSubmit(d)
  }

  return (
    <form className="diagnosis-form" onSubmit={handleSubmit}>
      <div className="form-header">
        <button type="button" className="btn-back" onClick={onBack}>
          ← 戻る
        </button>
        <h2>今ある1案をレビューする</h2>
      </div>

      <ImageUploader
        label="レビューするサムネ画像"
        images={d.thumbnailImages}
        onChange={(imgs) => setD((prev) => ({ ...prev, thumbnailImages: imgs }))}
        required
      />

      <div className="field-group">
        <label htmlFor="title">動画タイトル <span className="required">*</span></label>
        <input id="title" type="text" value={d.title} onChange={set('title')} required />
      </div>

      <div className="field-group">
        <label htmlFor="members">サムネに出ているメンバー</label>
        <input id="members" type="text" value={d.members} onChange={set('members')} placeholder="例：真田、林" />
      </div>

      <div className="field-group">
        <label htmlFor="overview">動画の概要</label>
        <textarea id="overview" value={d.overview} onChange={set('overview')} rows={3} />
      </div>

      <div className="field-group">
        <label htmlFor="materials">使っている素材（任意）</label>
        <input id="materials" type="text" value={d.materials} onChange={set('materials')} />
      </div>

      <div className="field-group">
        <label htmlFor="tension">テンション感（任意）</label>
        <input id="tension" type="text" value={d.tension} onChange={set('tension')} placeholder="例：にぎやか、シリアス" />
      </div>

      <div className="field-group">
        <label htmlFor="impression">サムネで目指したい印象（任意）</label>
        <input id="impression" type="text" value={d.impression} onChange={set('impression')} />
      </div>

      <div className="field-group">
        <label htmlFor="completion">ラフか完成版か（任意）</label>
        <select
          id="completion"
          value={d.completionLevel}
          onChange={(e) => setD((prev) => ({ ...prev, completionLevel: e.target.value }))}
          className="select-input"
        >
          <option value="">選択しない</option>
          <option value="ラフ">ラフ</option>
          <option value="ほぼ完成">ほぼ完成</option>
          <option value="完成版">完成版</option>
        </select>
      </div>

      <ImageUploader
        label="参考にしたい既存サムネ（任意）"
        images={d.referenceImages}
        onChange={(imgs) => setD((prev) => ({ ...prev, referenceImages: imgs }))}
      />

      <div className="form-submit">
        <button type="submit" className="btn-primary" disabled={loading || !canSubmit}>
          {loading ? '診断中…' : '診断する'}
        </button>
        {!d.thumbnailImages.length && (
          <p className="form-hint">サムネ画像を1枚以上アップロードしてください</p>
        )}
      </div>
    </form>
  )
}
