import { useState } from 'react'
import type { Mode1FormData } from '../types'
import ImageUploader from './ImageUploader'

interface Props {
  onSubmit: (data: Mode1FormData) => void
  onBack: () => void
  loading: boolean
}

export default function Mode1Form({ onSubmit, onBack, loading }: Props) {
  const [d, setD] = useState<Mode1FormData>({
    title: '',
    overview: '',
    members: '',
    materials: '',
    lightInstruction: '',
    tension: '',
    impression: '',
    materialImages: [],
    referenceImages: [],
  })

  const set = (field: keyof Mode1FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setD((prev) => ({ ...prev, [field]: e.target.value }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!d.title.trim() || !d.overview.trim()) return
    onSubmit(d)
  }

  return (
    <form className="diagnosis-form" onSubmit={handleSubmit}>
      <div className="form-header">
        <button type="button" className="btn-back" onClick={onBack}>
          ← 戻る
        </button>
        <h2>サムネを1から考える</h2>
      </div>

      <div className="field-group">
        <label htmlFor="title">動画タイトル <span className="required">*</span></label>
        <input id="title" type="text" value={d.title} onChange={set('title')} required />
      </div>

      <div className="field-group">
        <label htmlFor="overview">動画の概要 <span className="required">*</span></label>
        <textarea id="overview" value={d.overview} onChange={set('overview')} rows={3} required />
      </div>

      <div className="field-group">
        <label htmlFor="members">出るメンバー</label>
        <input id="members" type="text" value={d.members} onChange={set('members')} placeholder="例：真田、林" />
      </div>

      <div className="field-group">
        <label htmlFor="materials">使いたい素材</label>
        <textarea
          id="materials"
          value={d.materials}
          onChange={set('materials')}
          rows={2}
          placeholder="例：この顔写真を使いたい、この作品画像を入れたい"
        />
      </div>

      <ImageUploader
        label="素材画像（あれば）"
        images={d.materialImages}
        onChange={(imgs) => setD((prev) => ({ ...prev, materialImages: imgs }))}
      />

      <div className="field-group">
        <label htmlFor="light">軽いサムネ指示（任意）</label>
        <input
          id="light"
          type="text"
          value={d.lightInstruction}
          onChange={set('lightInstruction')}
          placeholder="例：顔大きめで、文字主役で、3案くらい欲しい"
        />
      </div>

      <div className="field-group">
        <label htmlFor="tension">テンション感（任意）</label>
        <input
          id="tension"
          type="text"
          value={d.tension}
          onChange={set('tension')}
          placeholder="例：にぎやか、落ち着いた"
        />
      </div>

      <div className="field-group">
        <label htmlFor="impression">サムネで目指したい印象（任意）</label>
        <input
          id="impression"
          type="text"
          value={d.impression}
          onChange={set('impression')}
          placeholder="例：見た人が思わずクリックしたくなる感じ"
        />
      </div>

      <ImageUploader
        label="参考にしたい既存サムネ（任意）"
        images={d.referenceImages}
        onChange={(imgs) => setD((prev) => ({ ...prev, referenceImages: imgs }))}
      />

      <div className="form-submit">
        <button type="submit" className="btn-primary" disabled={loading || !d.title.trim() || !d.overview.trim()}>
          {loading ? '診断中…' : '診断する'}
        </button>
      </div>
    </form>
  )
}
