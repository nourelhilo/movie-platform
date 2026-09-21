import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import StarRating from './StarRating.jsx';
import api from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';

const TMDB_IMG = 'https://image.tmdb.org/t/p/w92';

export const QuickLogModal = ({ movie, onClose, onLogged }) => {
  const { refreshUser } = useAuth();
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleSave = async () => {
    if (!rating) { setError('Please select a rating'); return; }
    setSaving(true);
    setError('');
    try {
      let resolvedRuntime = Number(movie.runtime) || 0;
      if (resolvedRuntime <= 0 && movie.tmdbId) {
        try {
          const detailRes = await api.get(`/movies/${movie.tmdbId}`);
          if (detailRes.data?.runtime) {
            resolvedRuntime = Number(detailRes.data.runtime);
          }
        } catch (e) {
          resolvedRuntime = 105;
        }
      }

      const res = await api.post('/diary', {
        tmdbId: movie.tmdbId,
        title: movie.title,
        posterPath: movie.posterPath || '',
        year: movie.year,
        runtime: resolvedRuntime || 105,
        rating,
        review,
        watchedOn: new Date().toISOString(),
      });
      refreshUser?.();
      onLogged?.(res.data.entry);
      onClose();
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to save — is the server running?');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="quick-log-modal surface-card" onClick={(e) => e.stopPropagation()}>

        <div className="qlm-header">
          <div className="qlm-movie-info">
            {movie.posterPath && (
              <img
                src={`${TMDB_IMG}${movie.posterPath}`}
                alt={movie.title}
                className="qlm-thumb"
              />
            )}
            <div>
              <p className="qlm-title">{movie.title}</p>
              {movie.year && <span className="qlm-year font-mono">{movie.year}</span>}
            </div>
          </div>
          <button className="qlm-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="qlm-section">
          <label className="qlm-label font-mono">YOUR RATING</label>
          <StarRating value={rating} onChange={setRating} size={24} />
        </div>

        <div className="qlm-section">
          <label className="qlm-label font-mono">QUICK NOTE <span className="qlm-optional">(optional)</span></label>
          <textarea
            className="qlm-textarea"
            placeholder="What did you think?"
            value={review}
            onChange={(e) => setReview(e.target.value)}
            rows={3}
            maxLength={5000}
          />
        </div>

        {error && <p className="qlm-error">{error}</p>}

        <div className="qlm-actions">
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? (
              <span>Saving…</span>
            ) : (
              <><Check size={14} /><span>Log to Diary</span></>
            )}
          </button>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
        </div>
      </div>

      <style>{`
        .modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.7);
          z-index: 1000;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          padding: 0 16px 24px;
          animation: fadeIn 0.15s ease;
        }
        @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
        .quick-log-modal {
          width: 100%;
          max-width: 480px;
          border-radius: var(--radius-lg);
          border: 1px solid var(--border-medium);
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          animation: slideUp 0.2s ease;
        }
        @keyframes slideUp { from { transform: translateY(20px); opacity:0 } to { transform: translateY(0); opacity:1 } }
        .qlm-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
        }
        .qlm-movie-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .qlm-thumb {
          width: 40px;
          height: 60px;
          object-fit: cover;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border-subtle);
        }
        .qlm-title {
          font-size: 15px;
          font-weight: 600;
          color: var(--text-primary);
        }
        .qlm-year {
          font-size: 11px;
          color: var(--text-muted);
          letter-spacing: 0.06em;
        }
        .qlm-close {
          color: var(--text-muted);
          padding: 4px;
          border-radius: var(--radius-sm);
          transition: color var(--transition-fast);
          background: transparent;
        }
        .qlm-close:hover { color: var(--text-primary); }
        .qlm-section {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .qlm-label {
          font-size: 10px;
          letter-spacing: 0.12em;
          color: var(--text-muted);
        }
        .qlm-optional {
          font-size: 9px;
          color: var(--text-muted);
          opacity: 0.6;
          text-transform: none;
          letter-spacing: 0;
        }
        .qlm-textarea {
          background: var(--bg-tertiary);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          padding: 10px 14px;
          color: var(--text-primary);
          font-family: inherit;
          font-size: 13.5px;
          resize: none;
          outline: none;
          transition: border-color var(--transition-fast);
          line-height: 1.5;
        }
        .qlm-textarea:focus { border-color: var(--border-medium); }
        .qlm-error {
          font-size: 12.5px;
          color: #e87070;
          background: rgba(232,112,112,0.08);
          border: 1px solid rgba(232,112,112,0.2);
          border-radius: var(--radius-sm);
          padding: 8px 12px;
        }
        .qlm-actions {
          display: flex;
          gap: 10px;
        }
      `}</style>
    </div>
  );
};

export default QuickLogModal;
