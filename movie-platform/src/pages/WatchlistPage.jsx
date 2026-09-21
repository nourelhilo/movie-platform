import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Bookmark,
  Clock,
  Trash2,
  CheckCircle2,
  Search,
  Film,
  ArrowUpRight,
} from 'lucide-react';
import { getWatchlist, removeFromWatchlist, updateWatchlistItem } from '../services/api.js';
import QuickLogModal from '../components/movies/QuickLogModal.jsx';

const TMDB_IMG = 'https://image.tmdb.org/t/p/w342';

const formatRuntime = (min) => {
  if (!min || min <= 0) return '—';
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

export const WatchlistPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [runtimeFilter, setRuntimeFilter] = useState('all'); // 'all', 'under90', '90to120', 'over120'
  const [priorityFilter, setPriorityFilter] = useState('all'); // 'all', 'high', 'medium', 'low'
  const [sortBy, setSortBy] = useState('newest'); // 'newest', 'runtimeAsc', 'runtimeDesc', 'title'
  const [selectedMovieForLog, setSelectedMovieForLog] = useState(null);

  const fetchItems = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getWatchlist();
      setItems(res.data.items || []);
    } catch (err) {
      setError(err.message || 'Failed to load watchlist.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleRemove = async (id, e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await removeFromWatchlist(id);
      setItems(prev => prev.filter(i => i._id !== id));
    } catch (err) {
      console.error('Failed to remove item:', err);
    }
  };

  const handlePriorityChange = async (id, newPriority, e) => {
    e.stopPropagation();
    try {
      await updateWatchlistItem(id, { priority: newPriority });
      setItems(prev => prev.map(item => item._id === id ? { ...item, priority: newPriority } : item));
    } catch (err) {
      console.error('Failed to update priority:', err);
    }
  };

  const filteredItems = items.filter(item => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = item.title?.toLowerCase().includes(q);
      const matchGenre = item.genres?.some(g => (g.name || g).toLowerCase().includes(q));
      if (!matchTitle && !matchGenre) return false;
    }

    const r = item.runtime || 0;
    if (runtimeFilter === 'under90' && r >= 90) return false;
    if (runtimeFilter === '90to120' && (r < 90 || r > 120)) return false;
    if (runtimeFilter === 'over120' && r <= 120) return false;

    if (priorityFilter !== 'all' && item.priority !== priorityFilter) return false;

    return true;
  }).sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    if (sortBy === 'runtimeAsc') return (a.runtime || 0) - (b.runtime || 0);
    if (sortBy === 'runtimeDesc') return (b.runtime || 0) - (a.runtime || 0);
    if (sortBy === 'title') return (a.title || '').localeCompare(b.title || '');
    return 0;
  });

  const totalRuntimeMin = items.reduce((acc, curr) => acc + (curr.runtime || 0), 0);
  const totalHours = Math.floor(totalRuntimeMin / 60);

  return (
    <div className="content-wrapper watchlist-page-root">

      <div className="watchlist-header">
        <div>
          <h1 className="watchlist-title font-serif">Watchlist</h1>
        </div>

        <div className="watchlist-stats font-mono">
          <div className="stat-pill">
            <span className="stat-label">TOTAL QUEUED</span>
            <span className="stat-value">{items.length} Works</span>
          </div>
          <div className="stat-divider" />
          <div className="stat-pill">
            <span className="stat-label">TOTAL DURATION</span>
            <span className="stat-value">{totalHours}h {totalRuntimeMin % 60}m</span>
          </div>
        </div>
      </div>

      <div className="watchlist-toolbar surface-card">
        <div className="toolbar-search">
          <Search size={15} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search your queue by title or genre..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="toolbar-filters">

          <div className="filter-group">
            <span className="filter-label font-mono">RUNTIME:</span>
            <button 
              className={`filter-btn ${runtimeFilter === 'all' ? 'active' : ''}`}
              onClick={() => setRuntimeFilter('all')}
            >
              Any
            </button>
            <button 
              className={`filter-btn ${runtimeFilter === 'under90' ? 'active' : ''}`}
              onClick={() => setRuntimeFilter('under90')}
              title="Less than 90 minutes"
            >
              &lt; 90m
            </button>
            <button 
              className={`filter-btn ${runtimeFilter === '90to120' ? 'active' : ''}`}
              onClick={() => setRuntimeFilter('90to120')}
              title="Between 90 and 120 minutes"
            >
              90–120m
            </button>
            <button 
              className={`filter-btn ${runtimeFilter === 'over120' ? 'active' : ''}`}
              onClick={() => setRuntimeFilter('over120')}
              title="More than 120 minutes"
            >
              120m+
            </button>
          </div>

          <div className="filter-group">
            <span className="filter-label font-mono">PRIORITY:</span>
            <select 
              value={priorityFilter} 
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="filter-select font-mono"
            >
              <option value="all">All Priorities</option>
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </select>
          </div>

          <div className="filter-group">
            <span className="filter-label font-mono">SORT:</span>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="filter-select font-mono"
            >
              <option value="newest">Recently Added</option>
              <option value="runtimeAsc">Shortest First</option>
              <option value="runtimeDesc">Longest First</option>
              <option value="title">Title (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="watchlist-grid">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="skeleton-card surface-card shimmer" style={{ height: 320 }} />
          ))}
        </div>
      ) : error ? (
        <div className="surface-card error-box">
          <p className="font-mono text-muted">NOTICE</p>
          <p>{error}</p>
          <button className="btn btn-secondary" onClick={fetchItems}>Retry</button>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="surface-card empty-watchlist">
          <Bookmark size={36} className="empty-icon" />
          <h2 className="empty-title font-serif">
            {items.length === 0 ? 'Your Watchlist is Empty' : 'No Films Match Your Current Filter'}
          </h2>
          <p className="empty-desc">
            {items.length === 0 
              ? 'Browse the Solander archive and bookmark works you wish to experience.' 
              : 'Try broadening your runtime or priority filters above.'}
          </p>
          {items.length === 0 ? (
            <Link to="/explore" className="btn btn-primary">
              <span>Explore The Catalog</span>
              <ArrowUpRight size={14} />
            </Link>
          ) : (
            <button 
              className="btn btn-secondary" 
              onClick={() => { setRuntimeFilter('all'); setPriorityFilter('all'); setSearchQuery(''); }}
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div className="watchlist-grid">
          {filteredItems.map((item) => (
            <div key={item._id} className="surface-card watchlist-card">
              <Link to={`/movie/${item.tmdbId}`} className="card-poster-wrapper">
                {item.posterPath ? (
                  <img 
                    src={`${TMDB_IMG}${item.posterPath}`} 
                    alt={item.title} 
                    className="card-poster"
                    loading="lazy" 
                  />
                ) : (
                  <div className="no-poster-box">
                    <Film size={28} />
                    <span className="font-mono">NO POSTER</span>
                  </div>
                )}

                <span className={`priority-chip font-mono priority-${item.priority || 'medium'}`}>
                  {(item.priority || 'medium').toUpperCase()}
                </span>
              </Link>

              <div className="card-body">
                <div className="card-top-info">
                  <Link to={`/movie/${item.tmdbId}`} className="card-title-link">
                    <h3 className="card-title">{item.title}</h3>
                  </Link>
                  <div className="card-meta font-mono">
                    {item.year && <span>{item.year}</span>}
                    {item.year && item.runtime > 0 && <span>•</span>}
                    {item.runtime > 0 && (
                      <span className="runtime-badge">
                        <Clock size={11} />
                        {formatRuntime(item.runtime)}
                      </span>
                    )}
                  </div>
                </div>

                {item.genres && item.genres.length > 0 && (
                  <div className="genres-strip">
                    {item.genres.slice(0, 2).map((g, idx) => (
                      <span key={idx} className="genre-tag font-mono">
                        {g.name || g}
                      </span>
                    ))}
                  </div>
                )}

                <div className="card-actions">
                  <button 
                    className="btn btn-log font-mono"
                    title="Log to Diary"
                    onClick={() => setSelectedMovieForLog({
                      tmdbId: item.tmdbId,
                      title: item.title,
                      posterPath: item.posterPath,
                      year: item.year
                    })}
                  >
                    <CheckCircle2 size={13} />
                    <span>LOG</span>
                  </button>

                  <select 
                    value={item.priority || 'medium'}
                    onChange={(e) => handlePriorityChange(item._id, e.target.value, e)}
                    className="priority-selector font-mono"
                    title="Change Priority"
                  >
                    <option value="high">High</option>
                    <option value="medium">Med</option>
                    <option value="low">Low</option>
                  </select>

                  <button 
                    className="btn-icon-danger"
                    title="Remove from Watchlist"
                    onClick={(e) => handleRemove(item._id, e)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedMovieForLog && (
        <QuickLogModal 
          movie={selectedMovieForLog}
          onClose={() => setSelectedMovieForLog(null)}
          onLogged={() => {
          }}
        />
      )}

    </div>
  );
};

export default WatchlistPage;

