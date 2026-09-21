import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Bookmark, Clock, Globe, Star, Check, BookOpen, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { getMovieDetail, addToWatchlist, checkWatchlistItem, checkDiaryEntry } from '../services/api.js';
import MovieCard from '../components/movies/MovieCard.jsx';
import QuickLogModal from '../components/movies/QuickLogModal.jsx';

const TMDB_IMG_BACKDROP = 'https://image.tmdb.org/t/p/w1280';
const TMDB_IMG_POSTER = 'https://image.tmdb.org/t/p/w342';
const TMDB_IMG_FACE = 'https://image.tmdb.org/t/p/w185';

const runtime = (min) => {
  if (!min) return null;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

export const MovieDetailPage = () => {
  const { tmdbId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showLogModal, setShowLogModal] = useState(false);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [isLogged, setIsLogged] = useState(false);
  const [watchlistLoading, setWatchlistLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError('');
    setMovie(null);
    window.scrollTo(0, 0);

    getMovieDetail(tmdbId)
      .then(res => {
        setMovie(res.data.movie);
        setLoading(false);
      })
      .catch(e => {
        setError(e.message || 'Failed to load movie.');
        setLoading(false);
      });
  }, [tmdbId]);

  useEffect(() => {
    if (!currentUser || !tmdbId) return;
    checkWatchlistItem(tmdbId).then(r => setInWatchlist(r.data.inWatchlist)).catch(() => {});
    checkDiaryEntry(tmdbId).then(r => setIsLogged(r.data.logged)).catch(() => {});
  }, [currentUser, tmdbId]);

  const handleAddWatchlist = async () => {
    if (!currentUser) { navigate('/login'); return; }
    if (inWatchlist || !movie) return;
    setWatchlistLoading(true);
    try {
      await addToWatchlist({
        tmdbId: movie.tmdbId,
        title: movie.title,
        posterPath: movie.posterPath || '',
        year: movie.year,
        runtime: movie.runtime || 0,
        genres: movie.genres || [],
      });
      setInWatchlist(true);
    } catch (e) {
    } finally {
      setWatchlistLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="mdp-loading">
        <div className="mdp-backdrop-skeleton shimmer" />
        <div className="content-wrapper mdp-body-skeleton">
          <div className="shimmer" style={{ width: 160, height: 240, borderRadius: 8 }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="shimmer" style={{ height: 40, width: '60%', borderRadius: 6 }} />
            <div className="shimmer" style={{ height: 16, width: '30%', borderRadius: 4 }} />
            <div className="shimmer" style={{ height: 80, width: '90%', borderRadius: 6, marginTop: 16 }} />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="content-wrapper mdp-error">
        <p className="font-mono" style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.1em' }}>ERROR</p>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{error}</p>
        <button className="btn btn-secondary" onClick={() => navigate(-1)}>
          <ArrowLeft size={14} /> Go Back
        </button>
      </div>
    );
  }

  if (!movie) return null;

  return (
    <div className="mdp-root">

      <div className="mdp-backdrop">
        {movie.backdropPath && (
          <img src={`${TMDB_IMG_BACKDROP}${movie.backdropPath}`} alt="" aria-hidden="true" />
        )}
        <div className="mdp-backdrop-vignette" />
      </div>

      <div className="content-wrapper mdp-main">

        <button className="mdp-back btn btn-secondary" onClick={() => navigate(-1)}>
          <ArrowLeft size={14} /> Back
        </button>

        <div className="mdp-hero">

          <div className="mdp-poster-wrap">
            {movie.posterPath ? (
              <img
                src={`${TMDB_IMG_POSTER}${movie.posterPath}`}
                alt={movie.title}
                className="mdp-poster"
              />
            ) : (
              <div className="mdp-poster mdp-poster-placeholder">
                <span className="font-mono">NO POSTER</span>
              </div>
            )}
          </div>

          <div className="mdp-info">
            {movie.genres?.length > 0 && (
              <div className="mdp-genres">
                {movie.genres.slice(0, 4).map(g => (
                  <span key={g.id} className="badge badge-neutral font-mono">{g.name.toUpperCase()}</span>
                ))}
              </div>
            )}

            <h1 className="mdp-title">{movie.title}</h1>

            {movie.tagline && (
              <p className="mdp-tagline">&ldquo;{movie.tagline}&rdquo;</p>
            )}

            <div className="mdp-meta-strip font-mono">
              {movie.year && <span>{movie.year}</span>}
              {movie.runtime > 0 && (
                <span className="mdp-meta-sep"><Clock size={11} /> {runtime(movie.runtime)}</span>
              )}
              {movie.originalLanguage && movie.originalLanguage !== 'en' && (
                <span className="mdp-meta-sep"><Globe size={11} /> {movie.originalLanguage.toUpperCase()}</span>
              )}
            </div>

            {movie.directors?.length > 0 && (
              <p className="mdp-director">
                <span className="font-mono" style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.1em' }}>DIRECTED BY</span>{' '}
                <span style={{ color: 'var(--text-primary)' }}>{movie.directors.map(d => d.name).join(', ')}</span>
              </p>
            )}

            {movie.overview && (
              <p className="mdp-overview">{movie.overview}</p>
            )}

            <div className="mdp-actions">
              <button
                className={`btn ${isLogged ? 'btn-secondary' : 'btn-primary'}`}
                onClick={() => {
                  if (!currentUser) { navigate('/login'); return; }
                  if (!isLogged) setShowLogModal(true);
                }}
              >
                {isLogged ? <><Check size={14} /> Logged</> : <><BookOpen size={14} /> Log Film</>}
              </button>
              <button
                className="btn btn-secondary"
                onClick={handleAddWatchlist}
                disabled={watchlistLoading}
              >
                {inWatchlist
                  ? <><Check size={14} /> In Watchlist</>
                  : <><Bookmark size={14} /> Add to Watchlist</>
                }
              </button>
            </div>

            {!currentUser && (
              <p className="mdp-auth-hint font-mono">
                <Link to="/login" style={{ color: 'var(--text-secondary)' }}>Sign in</Link> to log or save films
              </p>
            )}
          </div>
        </div>

        {movie.cast?.length > 0 && (
          <section className="mdp-section">
            <h2 className="mdp-section-title font-mono">CAST</h2>
            <div className="mdp-cast-strip">
              {movie.cast.slice(0, 8).map(p => (
                <div key={p.id} className="mdp-cast-card">
                  {p.profile_path ? (
                    <img src={`${TMDB_IMG_FACE}${p.profile_path}`} alt={p.name} className="mdp-cast-face" />
                  ) : (
                    <div className="mdp-cast-face mdp-cast-face-placeholder">
                      <Users size={20} />
                    </div>
                  )}
                  <p className="mdp-cast-name">{p.name}</p>
                  <p className="mdp-cast-char">{p.character}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {movie.similar?.length > 0 && (
          <section className="mdp-section">
            <h2 className="mdp-section-title font-mono">YOU MIGHT ALSO LIKE</h2>
            <div className="mdp-similar-grid">
              {movie.similar.slice(0, 6).map(m => (
                <MovieCard key={m.id} movie={m} />
              ))}
            </div>
          </section>
        )}
      </div>

      {showLogModal && (
        <QuickLogModal
          movie={{
            tmdbId: movie.tmdbId,
            title: movie.title,
            posterPath: movie.posterPath,
            year: movie.year,
          }}
          onClose={() => setShowLogModal(false)}
          onLogged={() => setIsLogged(true)}
        />
      )}

      <style>{`
        .mdp-root { position: relative; min-height: 100vh; }
        .mdp-backdrop {
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 480px;
          overflow: hidden;
          z-index: 0;
        }
        .mdp-backdrop img {
          width: 100%; height: 100%;
          object-fit: cover;
          object-position: center top;
          filter: brightness(0.35);
        }
        .mdp-backdrop-vignette {
          position: absolute;
          inset: 0;
          background: linear-gradient(to bottom, transparent 30%, var(--bg-primary) 100%);
        }
        .mdp-main {
          position: relative;
          z-index: 1;
          padding: 32px 24px 80px;
        }
        .mdp-back {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 48px;
          font-size: 13px;
        }
        .mdp-hero {
          display: flex;
          gap: 40px;
          align-items: flex-start;
          margin-bottom: 60px;
          flex-wrap: wrap;
        }
        .mdp-poster-wrap {
          flex-shrink: 0;
        }
        .mdp-poster {
          width: 200px;
          border-radius: var(--radius-md);
          border: 1px solid var(--border-subtle);
          display: block;
        }
        .mdp-poster-placeholder {
          width: 200px;
          height: 300px;
          background: var(--bg-tertiary);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-muted);
          font-size: 9px;
          letter-spacing: 0.1em;
          border-radius: var(--radius-md);
        }
        .mdp-info {
          flex: 1;
          min-width: 280px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          padding-top: 60px;
        }
        .mdp-genres { display: flex; gap: 6px; flex-wrap: wrap; }
        .mdp-title {
          font-size: clamp(28px, 4vw, 46px);
          line-height: 1.1;
          color: var(--text-primary);
        }
        .mdp-tagline {
          font-size: 14px;
          color: var(--text-muted);
          font-style: italic;
        }
        .mdp-meta-strip {
          display: flex;
          gap: 14px;
          font-size: 11px;
          color: var(--text-muted);
          letter-spacing: 0.08em;
          align-items: center;
          flex-wrap: wrap;
        }
        .mdp-meta-sep {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .mdp-director {
          font-size: 13.5px;
          display: flex;
          gap: 8px;
          align-items: baseline;
          flex-wrap: wrap;
        }
        .mdp-overview {
          font-size: 14.5px;
          line-height: 1.7;
          color: var(--text-secondary);
          max-width: 600px;
        }
        .mdp-actions { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 4px; }
        .mdp-auth-hint {
          font-size: 11px;
          color: var(--text-muted);
          letter-spacing: 0.06em;
        }
        .mdp-section { margin-bottom: 48px; }
        .mdp-section-title {
          font-size: 10.5px;
          letter-spacing: 0.14em;
          color: var(--text-muted);
          margin-bottom: 18px;
          border-bottom: 1px solid var(--border-subtle);
          padding-bottom: 10px;
        }
        .mdp-cast-strip {
          display: flex;
          gap: 16px;
          overflow-x: auto;
          padding-bottom: 8px;
        }
        .mdp-cast-card {
          flex-shrink: 0;
          width: 90px;
          text-align: center;
        }
        .mdp-cast-face {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          object-fit: cover;
          border: 1px solid var(--border-subtle);
          margin: 0 auto 8px;
          display: block;
        }
        .mdp-cast-face-placeholder {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          background: var(--bg-tertiary);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-muted);
          margin: 0 auto 8px;
        }
        .mdp-cast-name {
          font-size: 12px;
          color: var(--text-primary);
          font-weight: 500;
          line-height: 1.3;
        }
        .mdp-cast-char {
          font-size: 11px;
          color: var(--text-muted);
          line-height: 1.3;
          margin-top: 2px;
        }
        .mdp-similar-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
          gap: 20px 14px;
        }
        .mdp-loading { position: relative; }
        .mdp-backdrop-skeleton {
          height: 380px;
          background: var(--bg-tertiary);
        }
        .mdp-body-skeleton {
          display: flex;
          gap: 32px;
          padding: 32px 24px;
          margin-top: -80px;
          position: relative;
          z-index: 1;
        }
        .mdp-error {
          padding: 80px 24px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .shimmer {
          background: linear-gradient(90deg, var(--bg-tertiary) 25%, var(--bg-secondary) 50%, var(--bg-tertiary) 75%);
          background-size: 200% 100%;
          animation: shimmer 1.4s infinite;
        }
        @keyframes shimmer { 0% { background-position: 200% 0 } 100% { background-position: -200% 0 } }
      `}</style>
    </div>
  );
};

export default MovieDetailPage;
