import React, { useState } from 'react';
import { Star } from 'lucide-react';

/**
 * starrating — interactive half-star picker (0.5–5.0)
 * props:
 *   value       — current rating (number)
 *   onchange    — called with new rating on click (omit for read-only)
 *   size        — icon size in px (default 20)
 *   readonly    — disable interaction
 */
export const StarRating = ({ value = 0, onChange, size = 20, readOnly = false }) => {
  const [hovered, setHovered] = useState(null);
  const display = readOnly ? value : (hovered ?? value);

  const handleMove = (e, starIndex) => {
    if (readOnly) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const half = (e.clientX - rect.left) < rect.width / 2;
    setHovered(half ? starIndex - 0.5 : starIndex);
  };

  const handleClick = (e, starIndex) => {
    if (readOnly || !onChange) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const half = (e.clientX - rect.left) < rect.width / 2;
    onChange(half ? starIndex - 0.5 : starIndex);
  };

  return (
    <div className={`star-rating ${readOnly ? 'read-only' : 'interactive'}`}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = display >= star ? 'full' : display >= star - 0.5 ? 'half' : 'empty';
        return (
          <span
            key={star}
            className={`star-wrapper star-${filled}`}
            onMouseMove={!readOnly ? (e) => handleMove(e, star) : undefined}
            onMouseLeave={!readOnly ? () => setHovered(null) : undefined}
            onClick={!readOnly ? (e) => handleClick(e, star) : undefined}
          >
            <Star size={size} />
            {filled === 'half' && (
              <span className="star-half-fill">
                <Star size={size} />
              </span>
            )}
          </span>
        );
      })}
      {!readOnly && display > 0 && (
        <span className="star-value font-mono">{display.toFixed(1)}</span>
      )}

      <style>{`
        .star-rating {
          display: flex;
          align-items: center;
          gap: 3px;
        }
        .star-wrapper {
          position: relative;
          display: inline-flex;
          color: var(--border-medium);
          transition: color 0.1s;
        }
        .star-rating.interactive .star-wrapper {
          cursor: pointer;
        }
        .star-wrapper.star-full {
          color: var(--text-primary);
        }
        .star-wrapper.star-half {
          color: var(--border-medium);
        }
        .star-half-fill {
          position: absolute;
          inset: 0;
          overflow: hidden;
          width: 50%;
          color: var(--text-primary);
        }
        .star-value {
          font-size: 11px;
          color: var(--text-muted);
          letter-spacing: 0.05em;
          margin-left: 6px;
        }
      `}</style>
    </div>
  );
};

export default StarRating;
