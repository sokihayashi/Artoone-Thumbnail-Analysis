export default function EmptyResult() {
  return (
    <div className="empty-result">
      <div className="empty-result-inner">
        <div className="empty-result-icon">
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <path d="M11 2.5v3M11 16.5v3M2.5 11h3M16.5 11h3M4.7 4.7l2.1 2.1M15.2 15.2l2.1 2.1M4.7 17.3l2.1-2.1M15.2 6.8l2.1-2.1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
        <div className="empty-result-title">診断結果はここに表示されます</div>
        <div className="empty-result-desc">
          左の入力を確定すると、AIがサムネを解析します。途中経過もリアルタイムで表示されます。
        </div>
      </div>
    </div>
  )
}
