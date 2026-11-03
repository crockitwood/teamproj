import { useState } from 'react'
import { RATING_MAX, RATING_MIN } from '../api.js'

const STARS = Array.from({ length: RATING_MAX - RATING_MIN + 1 }, (_, index) => RATING_MIN + index)

/**
 * 星级评分组件
 * - 可交互：<RatingStars value={rating} onChange={setRating} />
 * - 只读展示：<RatingStars value={5} readOnly />
 */
export default function RatingStars({ value = 0, onChange, readOnly = false, size = 'md' }) {
  const [hover, setHover] = useState(0)

  if (readOnly) {
    return (
      <span className={`stars stars-${size}`} title={`评分 ${value} 分`}>
        {STARS.map((star) => (
          <span key={star} className={star <= value ? 'star is-on' : 'star'} aria-hidden="true">
            ★
          </span>
        ))}
        <span className="stars-text">{value ? `${value} 分` : '暂无评分'}</span>
      </span>
    )
  }

  const active = hover || value

  return (
    <div className={`stars stars-${size}`} role="radiogroup" aria-label="评分">
      {STARS.map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={value === star}
          aria-label={`${star} 分`}
          title={`${star} 分`}
          className={star <= active ? 'star-btn is-on' : 'star-btn'}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          onFocus={() => setHover(star)}
          onBlur={() => setHover(0)}
          onClick={() => onChange?.(star)}
        >
          ★
        </button>
      ))}
      <span className="stars-text">{active ? `${active} 分` : '点击星星打分'}</span>
    </div>
  )
}
