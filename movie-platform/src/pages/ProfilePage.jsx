import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import {
  Film,
  Clock,
  Star,
  Bookmark,
  Edit3,
  Check,
  ArrowUpRight,
  BookOpen,
} from 'lucide-react';
import api, { getDiary, getWatchlist } from '../services/api.js';

export const ProfilePage = () => {
  const { mongoUser, refreshUser } = useAuth();
  const [diaryEntries, setDiaryEntries] = useState([]);
  const [watchlistCount, setWatchlistCount] = useState(0);
  const [loadingExtras, setLoadingExtras] = useState(true);

  const [showEditModal, setShowEditModal] = useState(false);
  const [displayName, setDisplayName] = useState(mongoUser?.displayName || '');
  const [bio, setBio] = useState(mongoUser?.bio || '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      getDiary(1, 50).catch(() => ({ data: { entries: [] } })),
      getWatchlist().catch(() => ({ data: { items: [] } })),
      refreshUser ? refreshUser().catch(() => null) : Promise.resolve(null),
    ]).then(([diaryRes, wlRes]) => {
      if (!isMounted) return;
      setDiaryEntries(diaryRes.data?.entries || []);
      setWatchlistCount((wlRes.data?.items || []).length);
      setLoadingExtras(false);
    });

    return () => { isMounted = false; };
  }, []);

  if (!mongoUser) {
    return (
      <div className="content-wrapper profile-loading surface-card" style={{ margin: '60px auto', padding: 40, textAlign: 'center' }}>
        <p className="font-mono text-muted">Please sign in to view your profile.</p>
        <Link to="/login" className="btn btn-primary" style={{ marginTop: 16 }}>
          Go to Sign In
        </Link>
      </div>
    );
  }

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await api.patch('/auth/me', { displayName, bio });
      mongoUser.displayName = displayName;
      mongoUser.bio = bio;
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setShowEditModal(false);
      }, 1000);
    } catch (err) {
      console.warn('Profile update fallback:', err);
      mongoUser.displayName = displayName;
      mongoUser.bio = bio;
      setShowEditModal(false);
    } finally {
      setSavingProfile(false);
    }
  };

  // Compute stats from mongoUser, with automatic fallback to loaded entries
  const totalEntriesCount = mongoUser.statsSummary?.totalWatched || diaryEntries.length || 0;

  const ratedEntries = diaryEntries.filter(e => typeof e.rating === 'number' && e.rating > 0);
  const calculatedAvg = ratedEntries.length > 0
    ? (ratedEntries.reduce((sum, e) => sum + e.rating, 0) / ratedEntries.length)
    : 0;
  const avgRatingVal = mongoUser.statsSummary?.averageRating || calculatedAvg || 0;
  const avgRatingDisplay = avgRatingVal > 0 ? Number(avgRatingVal).toFixed(1) : '—';

  const diaryTotalMinutes = diaryEntries.reduce((sum, e) => sum + (e.runtime && Number(e.runtime) > 0 ? Number(e.runtime) : 105), 0);
  const totalMinutes = (mongoUser.statsSummary?.totalMinutes && Number(mongoUser.statsSummary.totalMinutes) > 0)
    ? Number(mongoUser.statsSummary.totalMinutes)
    : (diaryEntries.length > 0 ? diaryTotalMinutes : 0);
  const hoursWatched = Math.floor(totalMinutes / 60);
  const minsRemaining = totalMinutes % 60;
  const watchTimeLabel = totalMinutes > 0
    ? (minsRemaining > 0 ? `${hoursWatched}h ${minsRemaining}m` : `${hoursWatched}h`)
    : '—';

  return (
    <div className="profile-root content-wrapper">

      <div className="surface-card profile-hero-card">
        <div className="profile-hero-content">
          {mongoUser.avatarUrl ? (
            <img src={mongoUser.avatarUrl} alt={mongoUser.username} className="profile-avatar-lg" />
          ) : (
            <div className="profile-avatar-placeholder-lg font-mono">
              {mongoUser.displayName?.[0]?.toUpperCase() || mongoUser.username?.[0]?.toUpperCase() || 'U'}
            </div>
          )}

          <div className="profile-info-block">
            <div className="profile-name-row">
              <h2 className="profile-display-name font-serif">{mongoUser.displayName || mongoUser.username}</h2>
              <span className="badge-user font-mono">@{mongoUser.username}</span>
            </div>
            <p className="profile-bio">{mongoUser.bio || 'No bio yet.'}</p>

            <button
              className="btn btn-secondary btn-edit-profile font-mono"
              onClick={() => {
                setDisplayName(mongoUser.displayName || mongoUser.username);
                setBio(mongoUser.bio || '');
                setShowEditModal(true);
              }}
            >
              <Edit3 size={12} />
              <span>Edit Profile</span>
            </button>
          </div>
        </div>

        <div className="profile-stats-grid">
          <Link to="/diary" className="profile-stat-box">
            <Film size={17} className="stat-icon" />
            <span className="stat-num font-mono">{totalEntriesCount}</span>
            <span className="stat-desc">Films Watched</span>
          </Link>
          <div className="profile-stat-box">
            <Clock size={17} className="stat-icon" />
            <span className="stat-num font-mono">{watchTimeLabel}</span>
            <span className="stat-desc">Watch Time</span>
          </div>
          <Link to="/watchlist" className="profile-stat-box">
            <Bookmark size={17} className="stat-icon" />
            <span className="stat-num font-mono">{watchlistCount}</span>
            <span className="stat-desc">In Watchlist</span>
          </Link>
          <div className="profile-stat-box">
            <Star size={17} className="stat-icon" />
            <span className="stat-num font-mono">
              {avgRatingDisplay}
            </span>
            <span className="stat-desc">Avg Rating</span>
          </div>
        </div>
      </div>


      <div className="profile-recent-section">
        <div className="section-title-row">
          <div>
            <h3 className="section-title font-serif">Recent Diary Logs</h3>
            <span className="font-mono text-muted" style={{ fontSize: 10.5, letterSpacing: '0.08em' }}>
              LAST LOGGED SCREENINGS
            </span>
          </div>
          <Link to="/diary" className="btn btn-secondary font-mono" style={{ fontSize: 11 }}>
            <span>Full Diary</span>
            <ArrowUpRight size={13} />
          </Link>
        </div>

        {diaryEntries.length === 0 ? (
          <div className="surface-card no-entries-box">
            <BookOpen size={24} className="text-muted" />
            <p>No films logged yet. View the archive to record your viewings.</p>
            <Link to="/explore" className="btn btn-secondary font-mono" style={{ fontSize: 11 }}>
              Explore Archive
            </Link>
          </div>
        ) : (
          <div className="recent-diary-grid">
            {diaryEntries.slice(0, 4).map((entry) => (
              <Link key={entry._id} to={`/movie/${entry.tmdbId}`} className="surface-card recent-entry-card">
                <div className="recent-thumb-wrapper">
                  {entry.posterPath ? (
                    <img
                      src={`https://image.tmdb.org/t/p/w185${entry.posterPath}`}
                      alt={entry.title}
                      className="recent-thumb"
                    />
                  ) : (
                    <div className="recent-no-thumb font-mono">FILM</div>
                  )}
                </div>
                <div className="recent-info">
                  <p className="recent-title">{entry.title}</p>
                  <div className="recent-meta font-mono">
                    <span>★ {entry.rating?.toFixed(1)}</span>
                    {entry.year && <span>• {entry.year}</span>}
                  </div>
                  {entry.review && (
                    <p className="recent-review-snippet">"{entry.review}"</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {showEditModal && (
        <div className="modal-backdrop" onClick={() => setShowEditModal(false)}>
          <div className="surface-card edit-profile-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="font-serif" style={{ fontSize: 24 }}>Edit Profile</h3>
              <button className="btn-close" onClick={() => setShowEditModal(false)}>✕</button>
            </div>

            <form onSubmit={handleSaveProfile} className="edit-form">
              <div className="form-field">
                <label className="font-mono field-label">DISPLAY NAME</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="modal-input"
                  required
                />
              </div>

              <div className="form-field">
                <label className="font-mono field-label">BIO</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="modal-textarea"
                  rows={3}
                  placeholder="Share your favorite genres, movements, or viewing philosophies..."
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={savingProfile}>
                  {saveSuccess ? <Check size={14} /> : null}
                  <span>{savingProfile ? 'Saving...' : saveSuccess ? 'Saved' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
