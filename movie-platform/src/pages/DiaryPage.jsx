import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Star,
  Repeat,
  Trash2,
  Calendar,
  Plus,
  Film,
  BookOpen,
} from 'lucide-react';
import { getDiary, deleteDiaryEntry, searchMovies, getMovieDetail } from '../services/api.js';
import QuickLogModal from '../components/movies/QuickLogModal.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const TMDB_IMG = 'https://image.tmdb.org/t/p/w185';

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch (e) {
    return dateStr;
  }
};

const renderStars = (rating) => {
  const stars = [];
  const fullStars = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.5;

  for (let i = 1; i <= 5; i++) {
    if (i <= fullStars) {
      stars.push(<Star key={i} size={13} fill="#eab308" color="#eab308" />);
    } else if (i === fullStars + 1 && hasHalf) {
      stars.push(
        <span key={i} className="half-star-wrapper" title={`${rating} stars`}>
          <Star size={13} fill="#eab308" color="#eab308" style={{ clipPath: 'polygon(0 0, 50% 0, 50% 100%, 0 100%)' }} />
          <Star size={13} color="#4b5563" style={{ position: 'absolute', top: 0, left: 0, zIndex: -1 }} />
        </span>
      );
    } else {
      stars.push(<Star key={i} size={13} color="#4b5563" />);
    }
  }
  return stars;
};

export const DiaryPage = () => {
  const { refreshUser } = useAuth();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [error, setError] = useState('');

  const [showSearchModal, setShowSearchModal] = useState(false);
  const [filmSearchQuery, setFilmSearchQuery] = useState('');
  const [filmSearchResults, setFilmSearchResults] = useState([]);
  const [searchingFilms, setSearchingFilms] = useState(false);
  const [selectedFilmToLog, setSelectedFilmToLog] = useState(null);

  const fetchEntries = async (pg = 1) => {
    setLoading(true);
    setError('');
    try {
      const res = await getDiary(pg, 20);
      setEntries(res.data.entries || []);
      setPage(res.data.page || 1);
      setTotalPages(res.data.totalPages || 1);
      setTotalCount(res.data.total || 0);
    } catch (err) {
      setError(err.message || 'Failed to load diary entries.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries(1);
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this diary log?')) return;
    try {
      await deleteDiaryEntry(id);
      setEntries(prev => prev.filter(e => e._id !== id));
      setTotalCount(prev => Math.max(0, prev - 1));
      refreshUser?.();
    } catch (err) {
      console.error('Failed to delete diary entry:', err);
    }
  };

  const handleFilmSearch = async (e) => {
    e.preventDefault();
    if (!filmSearchQuery.trim()) return;
    setSearchingFilms(true);
    try {
      const res = await searchMovies(filmSearchQuery.trim(), 1);
      setFilmSearchResults(res.data.results || []);
    } catch (err) {
      console.error('Film search error:', err);
    } finally {
      setSearchingFilms(false);
    }
  };

  const ratedEntries = entries.filter(e => typeof e.rating === 'number' && e.rating > 0);
  const averageRating = ratedEntries.length > 0
    ? (ratedEntries.reduce((acc, curr) => acc + curr.rating, 0) / ratedEntries.length).toFixed(1)
    : '—';
  const reviewsCount = entries.filter(e => e.review && e.review.trim().length > 0).length;
  const rewatchCount = entries.filter(e => e.isRewatch).length;

  return (
    <div className="content-wrapper diary-page-root">

      <div className="diary-header">
        <div>
          <h1 className="diary-title font-serif">Diary</h1>
        </div>

        <div className="diary-header-actions">
          <button 
            className="btn btn-primary"
            onClick={() => {
              setShowSearchModal(true);
              setFilmSearchQuery('');
              setFilmSearchResults([]);
            }}
          >
            <Plus size={15} />
            <span>Log a Film</span>
          </button>
        </div>
      </div>

      <div className="diary-stats-ribbon surface-card font-mono">
        <div className="stat-node">
          <span className="node-label">TOTAL LOGGED</span>
          <span className="node-val">{totalCount} Films</span>
        </div>
        <div className="node-sep" />
        <div className="stat-node">
          <span className="node-label">AVERAGE RATING</span>
          <span className="node-val">{averageRating} / 5.0</span>
        </div>
        <div className="node-sep" />
        <div className="stat-node">
          <span className="node-label">REVIEWS WRITTEN</span>
          <span className="node-val">{reviewsCount} Entries</span>
        </div>
        <div className="node-sep" />
        <div className="stat-node">
          <span className="node-label">REWATCHES</span>
          <span className="node-val">{rewatchCount} Recorded</span>
        </div>
      </div>

      {loading ? (
        <div className="diary-loading surface-card">
          <p className="font-mono text-muted">RETRIEVING LOGBOOK ENTRIES...</p>
        </div>
      ) : error ? (
        <div className="surface-card error-box">
          <p className="font-mono text-muted">ERROR</p>
          <p>{error}</p>
          <button className="btn btn-secondary" onClick={() => fetchEntries(page)}>Retry</button>
        </div>
      ) : entries.length === 0 ? (
        <div className="surface-card empty-diary">
          <BookOpen size={38} className="text-muted" />
          <h2 className="empty-title font-serif">The Logbook is Blank</h2>
          <p className="empty-desc">
            You haven't recorded any films in your diary yet. Search the archive or add your recent watches.
          </p>
          <button 
            className="btn btn-primary"
            onClick={() => setShowSearchModal(true)}
          >
            <Plus size={15} />
            <span>Log Your First Film</span>
          </button>
        </div>
      ) : (
        <div className="diary-feed">
          {entries.map((entry) => (
            <div key={entry._id} className="surface-card diary-entry-card">

              <Link to={`/movie/${entry.tmdbId}`} className="diary-poster-link">
                {entry.posterPath ? (
                  <img 
                    src={`${TMDB_IMG}${entry.posterPath}`} 
                    alt={entry.title} 
                    className="diary-poster"
                    loading="lazy" 
                  />
                ) : (
                  <div className="diary-no-poster">
                    <Film size={20} />
                  </div>
                )}
              </Link>

              <div className="diary-entry-content">
                <div className="entry-header-row">
                  <div>
                    <Link to={`/movie/${entry.tmdbId}`} className="entry-title-link">
                      <h3 className="entry-title font-serif">{entry.title}</h3>
                    </Link>
                    <div className="entry-meta font-mono">
                      {entry.year && <span>{entry.year}</span>}
                      <span>•</span>
                      <span className="entry-date">
                        <Calendar size={11} />
                        Watched {formatDate(entry.watchedOn)}
                      </span>
                    </div>
                  </div>

                  <div className="entry-rating-block">
                    <div className="stars-row" title={`${entry.rating} / 5.0`}>
                      {renderStars(entry.rating)}
                    </div>
                    {entry.isRewatch && (
                      <span className="rewatch-chip font-mono" title="Rewatched film">
                        <Repeat size={10} />
                        REWATCH
                      </span>
                    )}
                  </div>
                </div>

                {entry.review && (
                  <div className="entry-review-box">
                    <p className="review-text">“{entry.review}”</p>
                  </div>
                )}

                {entry.tags && entry.tags.length > 0 && (
                  <div className="entry-tags-row font-mono">
                    {entry.tags.map((t, idx) => (
                      <span key={idx} className="entry-tag">#{t}</span>
                    ))}
                  </div>
                )}
              </div>

              <button 
                className="btn-delete-entry"
                onClick={() => handleDelete(entry._id)}
                title="Delete this entry"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="diary-pagination font-mono">
          <button 
            className="btn btn-secondary" 
            disabled={page <= 1}
            onClick={() => fetchEntries(page - 1)}
          >
            Previous
          </button>
          <span className="page-indicator">Page {page} of {totalPages}</span>
          <button 
            className="btn btn-secondary" 
            disabled={page >= totalPages}
            onClick={() => fetchEntries(page + 1)}
          >
            Next
          </button>
        </div>
      )}

      {showSearchModal && (
        <div className="modal-backdrop" onClick={() => setShowSearchModal(false)}>
          <div className="surface-card search-film-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span className="font-mono text-muted" style={{ fontSize: 10, letterSpacing: '0.1em' }}>SELECT FILM TO LOG</span>
                <h3 className="font-serif" style={{ fontSize: 24, marginTop: 4 }}>Search The Archive</h3>
              </div>
              <button className="btn-close" onClick={() => setShowSearchModal(false)}>✕</button>
            </div>

            <form onSubmit={handleFilmSearch} className="modal-search-bar">
              <input 
                type="text" 
                placeholder="Type movie title (e.g. Stalker, Persona, Blade Runner)..." 
                value={filmSearchQuery}
                onChange={(e) => setFilmSearchQuery(e.target.value)}
                autoFocus
                className="search-input"
              />
              <button type="submit" className="btn btn-primary" disabled={searchingFilms}>
                {searchingFilms ? 'Searching...' : 'Search'}
              </button>
            </form>

            <div className="modal-results-list">
              {filmSearchResults.map((m) => (
                <div 
                  key={m.id} 
                  className="result-row"
                  onClick={async () => {
                    const baseMovie = {
                      tmdbId: m.id,
                      title: m.title,
                      posterPath: m.poster_path,
                      year: m.release_date ? m.release_date.split('-')[0] : null,
                      runtime: 0,
                    };
                    setSelectedFilmToLog(baseMovie);
                    setShowSearchModal(false);
                    try {
                      const detailRes = await getMovieDetail(m.id);
                      if (detailRes.data?.runtime) {
                        setSelectedFilmToLog(prev => prev && prev.tmdbId === m.id ? { ...prev, runtime: detailRes.data.runtime } : prev);
                      }
                    } catch (e) {}
                  }}
                >
                  {m.poster_path ? (
                    <img src={`${TMDB_IMG}${m.poster_path}`} alt={m.title} className="result-thumb" />
                  ) : (
                    <div className="result-thumb-placeholder">
                      <Film size={16} />
                    </div>
                  )}
                  <div className="result-meta">
                    <p className="result-title">{m.title}</p>
                    <span className="font-mono text-muted" style={{ fontSize: 11 }}>
                      {m.release_date ? m.release_date.split('-')[0] : '—'}
                    </span>
                  </div>
                  <button className="btn btn-secondary font-mono" style={{ fontSize: 11, marginLeft: 'auto' }}>
                    Select
                  </button>
                </div>
              ))}

              {filmSearchResults.length === 0 && filmSearchQuery && !searchingFilms && (
                <p className="text-muted font-mono" style={{ textAlign: 'center', padding: '24px 0', fontSize: 12 }}>
                  No titles found. Try another keyword.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {selectedFilmToLog && (
        <QuickLogModal 
          movie={selectedFilmToLog}
          onClose={() => setSelectedFilmToLog(null)}
          onLogged={(newEntry) => {
            setEntries(prev => [newEntry, ...prev]);
            setTotalCount(prev => prev + 1);
            setSelectedFilmToLog(null);
          }}
        />
      )}

    </div>
  );
};

export default DiaryPage;
