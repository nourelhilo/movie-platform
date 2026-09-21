import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Dices,
  Film,
  Bookmark,
  ArrowUpRight,
  RotateCw,
  Check,
  CheckCircle2
} from 'lucide-react';
import { getPopularMovies, getTopRatedMovies, addToWatchlist, checkWatchlistItem } from '../services/api.js';
import QuickLogModal from '../components/movies/QuickLogModal.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const TMDB_IMG_POSTER = 'https://image.tmdb.org/t/p/w500';
const TMDB_IMG_BACKDROP = 'https://image.tmdb.org/t/p/w1280';

const DECADES = [
  { label: 'Any Era', val: 'all' },
  { label: 'Classic (Pre-1970)', val: 'pre70' },
  { label: '1970s', val: '70s' },
  { label: '1980s', val: '80s' },
  { label: '1990s', val: '90s' },
  { label: '2000s', val: '00s' },
  { label: '2010s+', val: '10s' },
];

const GENRES = [
  { label: 'Any Genre', id: 'all' },
  { label: 'Drama', id: 18 },
  { label: 'Sci-Fi', id: 878 },
  { label: 'Thriller / Mystery', id: 53 },
  { label: 'Crime', id: 80 },
  { label: 'Romance', id: 10749 },
  { label: 'Action', id: 28 },
];

const RUNTIMES = [
  { label: 'Any Runtime', val: 'all' },
  { label: 'Under 100m', val: 100 },
  { label: 'Under 120m', val: 120 },
  { label: 'Under 150m', val: 150 },
];

export const RoulettePage = () => {
  const { currentUser } = useAuth();
  const [candidates, setCandidates] = useState([]);
  const [loadingPool, setLoadingPool] = useState(true);

  // filters
  const [selectedDecade, setSelectedDecade] = useState('all');
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [selectedRuntime, setSelectedRuntime] = useState('all');

  // spinning state
  const [isSpinning, setIsSpinning] = useState(false);
  const [currentReelIndex, setCurrentReelIndex] = useState(0);
  const [selectedFilm, setSelectedFilm] = useState(null);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);

  // fetch initial candidate pool
  useEffect(() => {
    const fetchPool = async () => {
      setLoadingPool(true);
      try {
        const [popRes, topRes] = await Promise.all([
          getPopularMovies(1),
          getTopRatedMovies(1)
        ]);
        const combined = [...(popRes.data.results || []), ...(topRes.data.results || [])];
        // deduplicate
        const unique = Array.from(new Map(combined.map(m => [m.id, m])).values());
        setCandidates(unique);
      } catch (err) {
        console.error('Failed to load candidate pool:', err);
      } finally {
        setLoadingPool(false);
      }
    };
    fetchPool();
  }, []);

  // filter pool based on constraints
  const pool = candidates.filter(m => {
    const year = m.release_date ? parseInt(m.release_date.split('-')[0]) : null;
    if (selectedDecade !== 'all' && year) {
      if (selectedDecade === 'pre70' && year >= 1970) return false;
      if (selectedDecade === '70s' && (year < 1970 || year > 1979)) return false;
      if (selectedDecade === '80s' && (year < 1980 || year > 1989)) return false;
      if (selectedDecade === '90s' && (year < 1990 || year > 1999)) return false;
      if (selectedDecade === '00s' && (year < 2000 || year > 2009)) return false;
      if (selectedDecade === '10s' && year < 2010) return false;
    }

    if (selectedGenre !== 'all') {
      const gId = Number(selectedGenre);
      const hasGenre = m.genre_ids?.includes(gId) || m.genres?.some(g => (g.id || g) === gId);
      if (!hasGenre) return false;
    }

    return true;
  });

  const effectivePool = pool.length > 0 ? pool : candidates;

  const handleSpin = () => {
    if (isSpinning || effectivePool.length === 0) return;

    setIsSpinning(true);
    setSelectedFilm(null);
    setInWatchlist(false);

    let speed = 50;
    let iterations = 0;
    const maxIterations = 28;

    const spinInterval = () => {
      iterations++;
      setCurrentReelIndex(Math.floor(Math.random() * effectivePool.length));

      if (iterations < maxIterations) {
        // accelerate then decelerate
        speed += 12;
        setTimeout(spinInterval, speed);
      } else {
        // final pick
        const finalPick = effectivePool[Math.floor(Math.random() * effectivePool.length)];
        setSelectedFilm(finalPick);
        setIsSpinning(false);

        // check watchlist
        if (currentUser) {
          checkWatchlistItem(finalPick.id)
            .then(res => setInWatchlist(res.data.inWatchlist))
            .catch(() => { });
        }
      }
    };

    setTimeout(spinInterval, speed);
  };

  const handleAddToWatchlist = async () => {
    if (!selectedFilm || inWatchlist) return;
    try {
      await addToWatchlist({
        tmdbId: selectedFilm.id,
        title: selectedFilm.title,
        posterPath: selectedFilm.poster_path || '',
        year: selectedFilm.release_date ? parseInt(selectedFilm.release_date.split('-')[0]) : null,
        runtime: selectedFilm.runtime || 110,
        genres: selectedFilm.genres || []
      });
      setInWatchlist(true);
    } catch (err) {
      console.error(err);
    }
  };

  const currentReelMovie = effectivePool[currentReelIndex] || candidates[0];

  return (
    <div className="content-wrapper roulette-page-root">
      {/* header */}
      <div className="roulette-header">

        <h1 className="roulette-title font-serif">Movie Roulette</h1>
      </div>

      {/* constraints matrix */}
      <div className="surface-card roulette-control-box">

        <div className="control-grid">
          {/* era filter */}
          <div className="control-field">
            <label className="field-label font-mono">ERA / DECADE</label>
            <select
              value={selectedDecade}
              onChange={(e) => setSelectedDecade(e.target.value)}
              className="control-select font-mono"
              disabled={isSpinning}
            >
              {DECADES.map(d => (
                <option key={d.val} value={d.val}>{d.label}</option>
              ))}
            </select>
          </div>

          {/* genre filter */}
          <div className="control-field">
            <label className="field-label font-mono">PRIMARY GENRE</label>
            <select
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value)}
              className="control-select font-mono"
              disabled={isSpinning}
            >
              {GENRES.map(g => (
                <option key={g.id} value={g.id}>{g.label}</option>
              ))}
            </select>
          </div>

          {/* runtime filter */}
          <div className="control-field">
            <label className="field-label font-mono">MAX RUNTIME</label>
            <select
              value={selectedRuntime}
              onChange={(e) => setSelectedRuntime(e.target.value)}
              className="control-select font-mono"
              disabled={isSpinning}
            >
              {RUNTIMES.map(r => (
                <option key={r.val} value={r.val}>{r.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="spin-action-row">
          <button
            className="btn btn-primary spin-main-btn"
            onClick={handleSpin}
            disabled={isSpinning || loadingPool}
          >
            <Dices size={18} className={isSpinning ? 'dice-animate' : ''} />
            <span>{isSpinning ? 'Spinning…' : 'Spin'}</span>
          </button>
        </div>
      </div>

      {/* roulette stage / reel arena */}
      <div className="surface-card reel-stage">
        {/* slot reel view when spinning */}
        {isSpinning && currentReelMovie && (
          <div className="spinning-display">
            <div className="reel-motion-box">
              <span className="font-mono text-muted reel-status">SHUFFLING CANDIDATE POOL...</span>
              <h2 className="reel-title font-serif">{currentReelMovie.title}</h2>
              <span className="font-mono reel-year">
                {currentReelMovie.release_date?.split('-')[0] || '—'}
              </span>
            </div>
          </div>
        )}

        {/* final selection result card */}
        {!isSpinning && selectedFilm && (
          <div className="reveal-card">
            <div className="reveal-backdrop-container">
              {selectedFilm.backdrop_path && (
                <img
                  src={`${TMDB_IMG_BACKDROP}${selectedFilm.backdrop_path}`}
                  alt=""
                  className="reveal-backdrop"
                />
              )}
              <div className="reveal-backdrop-fade" />
            </div>

            <div className="reveal-content">
              <div className="reveal-poster-wrapper">
                {selectedFilm.poster_path ? (
                  <img
                    src={`${TMDB_IMG_POSTER}${selectedFilm.poster_path}`}
                    alt={selectedFilm.title}
                    className="reveal-poster"
                  />
                ) : (
                  <div className="reveal-no-poster">
                    <Film size={36} />
                  </div>
                )}
              </div>

              <div className="reveal-details">

                <h2 className="reveal-title font-serif">{selectedFilm.title}</h2>
                <div className="reveal-meta font-mono">
                  <span>{selectedFilm.release_date?.split('-')[0] || '—'}</span>
                  <span>•</span>
                  <span>★ {selectedFilm.vote_average?.toFixed(1) || '—'}</span>
                </div>

                <p className="reveal-overview">{selectedFilm.overview}</p>

                <div className="reveal-actions">
                  <Link to={`/movie/${selectedFilm.id}`} className="btn btn-primary">
                    <span>View Film Details</span>
                    <ArrowUpRight size={14} />
                  </Link>

                  <button
                    className={`btn ${inWatchlist ? 'btn-ghost' : 'btn-secondary'}`}
                    onClick={handleAddToWatchlist}
                    disabled={inWatchlist}
                  >
                    {inWatchlist ? (
                      <>
                        <Check size={14} />
                        <span>In Watchlist</span>
                      </>
                    ) : (
                      <>
                        <Bookmark size={14} />
                        <span>Add to Watchlist</span>
                      </>
                    )}
                  </button>

                  <button
                    className="btn btn-secondary font-mono"
                    onClick={() => setShowLogModal(true)}
                  >
                    <CheckCircle2 size={14} />
                    <span>Log to Diary</span>
                  </button>

                  <button
                    className="btn btn-ghost font-mono"
                    onClick={handleSpin}
                  >
                    <RotateCw size={13} />
                    <span>Respin</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* initial empty / idle prompt */}
        {!isSpinning && !selectedFilm && (
          <div className="idle-reel">
            <Dices size={44} className="idle-icon" />
            <h3 className="idle-title font-serif">Roll the Roulette</h3>
            <p className="idle-desc">
              Select your filters above and click Spin to find a movie.
            </p>
          </div>
        )}
      </div>

      {/* quick log modal if triggered */}
      {showLogModal && selectedFilm && (
        <QuickLogModal
          movie={{
            tmdbId: selectedFilm.id,
            title: selectedFilm.title,
            posterPath: selectedFilm.poster_path,
            year: selectedFilm.release_date?.split('-')[0]
          }}
          onClose={() => setShowLogModal(false)}
        />
      )}

      <style>{`
        .roulette-page-root {
          padding: 48px 24px 100px;
          display: flex;
          flex-direction: column;
          gap: 32px;
        }
        .roulette-header {
          border-bottom: 1px solid var(--border-subtle);
          padding-bottom: 24px;
        }
        .roulette-title {
          font-size: 42px;
          line-height: 1.1;
          margin: 6px 0;
        }

        /* Control Box */
        .roulette-control-box {
          padding: 24px 28px;
          background: var(--bg-secondary);
          border: 1px solid var(--border-medium);
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .control-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 20px;
        }
        .control-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .field-label {
          font-size: 10.5px;
          color: var(--text-muted);
          letter-spacing: 0.08em;
        }
        .control-select {
          background: var(--bg-tertiary);
          border: 1px solid var(--border-subtle);
          color: var(--text-primary);
          padding: 8px 12px;
          border-radius: var(--radius-sm);
          font-size: 12.5px;
          outline: none;
          cursor: pointer;
        }
        .control-select:focus {
          border-color: var(--border-focus);
        }
        .spin-action-row {
          display: flex;
          justify-content: center;
          padding-top: 8px;
        }
        .spin-main-btn {
          padding: 12px 36px;
          font-size: 14px;
          letter-spacing: 0.06em;
          border-radius: var(--radius-sm);
        }
        .dice-animate {
          animation: spinDice 0.6s linear infinite;
        }
        @keyframes spinDice {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* Reel Stage */
        .reel-stage {
          min-height: 400px;
          background: var(--bg-secondary);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          overflow: hidden;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* Spinning View */
        .spinning-display {
          padding: 60px 24px;
          text-align: center;
          width: 100%;
        }
        .reel-motion-box {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }
        .reel-status {
          font-size: 11px;
          letter-spacing: 0.14em;
        }
        .reel-title {
          font-size: 38px;
          color: var(--text-primary);
          text-shadow: 0 0 20px rgba(255,255,255,0.2);
        }
        .reel-year {
          font-size: 14px;
          color: var(--text-muted);
        }

        /* Reveal View */
        .reveal-card {
          width: 100%;
          position: relative;
          padding: 40px;
        }
        .reveal-backdrop-container {
          position: absolute;
          inset: 0;
          overflow: hidden;
          opacity: 0.2;
          z-index: 0;
        }
        .reveal-backdrop {
          width: 100%;
          height: 100%;
          object-fit: cover;
          filter: blur(8px);
        }
        .reveal-backdrop-fade {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at center, transparent, var(--bg-secondary));
        }

        .reveal-content {
          position: relative;
          z-index: 1;
          display: flex;
          gap: 36px;
          align-items: center;
        }
        .reveal-poster-wrapper {
          flex-shrink: 0;
          width: 200px;
          aspect-ratio: 2/3;
          border-radius: var(--radius-sm);
          overflow: hidden;
          border: 1px solid var(--border-medium);
          box-shadow: 0 20px 40px rgba(0,0,0,0.6);
        }
        .reveal-poster {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .reveal-no-poster {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-tertiary);
          color: var(--text-muted);
        }
        .reveal-details {
          display: flex;
          flex-direction: column;
          gap: 12px;
          max-width: 600px;
        }
        .reveal-title {
          font-size: 38px;
          line-height: 1.15;
        }
        .reveal-meta {
          display: flex;
          gap: 10px;
          font-size: 13px;
          color: var(--text-muted);
        }
        .reveal-overview {
          font-size: 14.5px;
          color: var(--text-secondary);
          line-height: 1.6;
        }
        .reveal-actions {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          margin-top: 8px;
        }

        /* Idle */
        .idle-reel {
          padding: 60px 24px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }
        .idle-icon {
          color: var(--text-muted);
          opacity: 0.5;
        }
        .idle-title {
          font-size: 28px;
        }
        .idle-desc {
          font-size: 14px;
          color: var(--text-secondary);
          max-width: 480px;
        }

        @media (max-width: 768px) {
          .reveal-content {
            flex-direction: column;
            text-align: center;
          }
          .reveal-details {
            align-items: center;
          }
          .reveal-meta, .reveal-actions {
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
};

export default RoulettePage;
