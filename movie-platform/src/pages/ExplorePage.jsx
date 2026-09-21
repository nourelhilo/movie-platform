import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import MovieCard from '../components/movies/MovieCard.jsx';
import { getPopularMovies, getTopRatedMovies, searchMovies } from '../services/api.js';

const TABS = [
  { key: 'popular', label: 'Trending This Week' },
  { key: 'top_rated', label: 'Critically Acclaimed' },
];

const SkeletonCard = () => (
  <div className="skeleton-card">
    <div className="skeleton-poster shimmer" />
    <div className="skeleton-line shimmer" style={{ width: '80%' }} />
    <div className="skeleton-line shimmer" style={{ width: '40%' }} />
  </div>
);

export const ExplorePage = () => {
  const location = useLocation();
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState('popular');
  const [movies, setMovies] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [isSearchMode, setIsSearchMode] = useState(false);

  const debounceRef = useRef(null);
  const sentinelRef = useRef(null);
  const observerRef = useRef(null);

  const fetchFirstPage = useCallback(async (tab, q) => {
    setLoading(true);
    setError('');
    setMovies([]);
    setPage(1);
    try {
      let res;
      if (q && q.trim().length > 0) {
        res = await searchMovies(q.trim(), 1);
        setIsSearchMode(true);
      } else {
        res = tab === 'popular' ? await getPopularMovies(1) : await getTopRatedMovies(1);
        setIsSearchMode(false);
      }
      setMovies(res.data.results || []);
      setTotalPages(res.data.totalPages || 1);
    } catch (e) {
      setError(e.message || 'Could not load movies. Is the server running and TMDB key set?');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchNextPage = useCallback(async () => {
    if (loadingMore || page >= totalPages) return;
    const nextPage = page + 1;
    setLoadingMore(true);
    try {
      let res;
      if (isSearchMode && query.trim()) {
        res = await searchMovies(query.trim(), nextPage);
      } else {
        res = activeTab === 'popular'
          ? await getPopularMovies(nextPage)
          : await getTopRatedMovies(nextPage);
      }
      setMovies(prev => [...prev, ...(res.data.results || [])]);
      setPage(nextPage);
    } catch (e) {
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, page, totalPages, isSearchMode, query, activeTab]);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) fetchNextPage(); },
      { threshold: 0.1 }
    );
    if (sentinelRef.current) observerRef.current.observe(sentinelRef.current);
    return () => observerRef.current?.disconnect();
  }, [fetchNextPage]);

  useEffect(() => {
    if (!query.trim()) fetchFirstPage(activeTab, '');
  }, [activeTab]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const urlQuery = params.get('q') || '';
    if (urlQuery) {
      setQuery(urlQuery);
      fetchFirstPage(activeTab, urlQuery);
    } else {
      fetchFirstPage('popular', '');
    }
  }, [location.search]);

  return (
    <div className="explore-root content-wrapper">

      <div className="explore-header">
        <div>
          <h1 className="explore-title">Explore Global Cinema</h1>
          <p className="explore-subtitle">Search, filter, and discover films without bias.</p>
        </div>
      </div>

      {!isSearchMode && (
        <div className="tab-strip">
          {TABS.map(t => (
            <button
              key={t.key}
              className={`tab-btn ${activeTab === t.key ? 'active' : ''}`}
              onClick={() => setActiveTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {isSearchMode && query && (
        <p className="search-context font-mono">
          RESULTS FOR "{query.toUpperCase()}"
        </p>
      )}

      {error && (
        <div className="explore-error surface-card">
          <p className="font-mono" style={{ fontSize: 11, letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 6 }}>SERVER NOTICE</p>
          <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{error}</p>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
            Add <code>TMDB_API_KEY</code> to <code>server/.env</code> and restart the server.
          </p>
        </div>
      )}

      {!error && (
        <>
          <div className="movie-grid">
            {loading
              ? Array.from({ length: 20 }).map((_, i) => <SkeletonCard key={i} />)
              : movies.map(m => <MovieCard key={`${m.id}-${m.title}`} movie={m} />)
            }
          </div>

          {!loading && movies.length === 0 && (
            <div className="explore-empty">
              <p className="font-mono" style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.1em' }}>NO RESULTS</p>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                {isSearchMode ? 'Try a different search term.' : 'No movies found.'}
              </p>
            </div>
          )}

          {loadingMore && (
            <div className="loading-more font-mono">LOADING MORE…</div>
          )}

          <div ref={sentinelRef} style={{ height: 20 }} />
        </>
      )}

      <style>{`
        .explore-root { padding: 20px 24px 60px; }
        .explore-header {
          margin-bottom: 16px;
        }
        .explore-title { font-size: 34px; margin: 4px 0 4px; }
        .explore-subtitle { color: var(--text-secondary); font-size: 14px; }
        .tab-strip {
          display: flex;
          gap: 6px;
          border-bottom: 1px solid var(--border-subtle);
          padding-bottom: 16px;
          margin-bottom: 28px;
        }
        .tab-btn {
          padding: 7px 16px;
          font-size: 13px;
          font-weight: 500;
          color: var(--text-secondary);
          border-radius: var(--radius-md);
          background: transparent;
          transition: all var(--transition-fast);
        }
        .tab-btn:hover { color: var(--text-primary); background: rgba(255,255,255,0.04); }
        .tab-btn.active {
          color: var(--text-primary);
          background: var(--bg-tertiary);
          border: 1px solid var(--border-medium);
        }
        .search-context {
          font-size: 10.5px;
          letter-spacing: 0.1em;
          color: var(--text-muted);
          margin-bottom: 22px;
        }
        .movie-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          gap: 24px 16px;
        }
        .skeleton-card { display: flex; flex-direction: column; gap: 8px; }
        .skeleton-poster {
          aspect-ratio: 2/3;
          border-radius: var(--radius-md);
          background: var(--bg-tertiary);
        }
        .skeleton-line {
          height: 12px;
          border-radius: 4px;
          background: var(--bg-tertiary);
        }
        .shimmer {
          background: linear-gradient(90deg, var(--bg-tertiary) 25%, var(--bg-secondary) 50%, var(--bg-tertiary) 75%);
          background-size: 200% 100%;
          animation: shimmer 1.4s infinite;
        }
        @keyframes shimmer { 0% { background-position: 200% 0 } 100% { background-position: -200% 0 } }
        .explore-error {
          padding: 20px 24px;
          border-left: 3px solid var(--border-medium);
          margin-bottom: 24px;
        }
        .explore-error code {
          background: var(--bg-tertiary);
          padding: 2px 6px;
          border-radius: var(--radius-sm);
          font-family: var(--font-mono);
          font-size: 11px;
          color: var(--text-secondary);
        }
        .explore-empty {
          text-align: center;
          padding: 80px 24px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          align-items: center;
        }
        .loading-more {
          text-align: center;
          font-size: 10.5px;
          letter-spacing: 0.1em;
          color: var(--text-muted);
          padding: 24px 0;
        }
      `}</style>
    </div>
  );
};

export default ExplorePage;
