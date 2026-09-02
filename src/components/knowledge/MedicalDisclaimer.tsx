const FULL_TEXT = [
  '本頁資訊卡的文字為實體卡片原文完整轉錄，未經編修、未經查證，內容包含大量未經證實的療效敘述，不代表本站立場，亦非醫療建議。',
  '精油屬芳香產品，非藥品，不具治療、矯正或預防疾病之效能。任何身體不適請諮詢合格醫師或藥師，切勿以精油取代正規醫療；孕婦、嬰幼兒、慢性病與服藥中者使用前請先徵詢專業意見。',
]

const SHORT_TEXT =
  '以下功效為卡片原文轉錄，未經查證，非醫療建議。精油非藥品，不具療效。'

interface MedicalDisclaimerProps {
  /** banner：頁面固定橫幅；inline：Modal 與燈箱內的精簡版 */
  variant?: 'banner' | 'inline'
  className?: string
}

/**
 * 免責聲明。刻意用 amber 而非專案主色 green/blue——
 * 警語長得像一般內容就失去警示作用了。
 */
export default function MedicalDisclaimer({
  variant = 'banner',
  className = '',
}: MedicalDisclaimerProps) {
  if (variant === 'inline') {
    return (
      <p
        role="note"
        className={`bg-amber-50 border-l-4 border-amber-400 text-amber-900 px-3 py-2 text-xs leading-relaxed ${className}`}
      >
        {SHORT_TEXT}
      </p>
    )
  }

  return (
    <section
      role="note"
      aria-label="內容性質說明"
      className={`bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-4 sm:p-5 ${className}`}
    >
      <h2 className="font-bold text-sm sm:text-base mb-2 flex items-center gap-2">
        <svg
          className="w-5 h-5 shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        內容性質說明
      </h2>
      {FULL_TEXT.map(paragraph => (
        <p
          key={paragraph}
          className="text-xs sm:text-sm leading-relaxed mb-1.5 last:mb-0"
        >
          {paragraph}
        </p>
      ))}
    </section>
  )
}
