import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { Search, User, LogOut } from 'lucide-react';

export const Navbar = () => {
  const { currentUser, mongoUser, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const isActive = (path) => location.pathname === path;

  const handleLogout = async () => {
    await logout();
    setDropdownOpen(false);
    navigate('/');
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/explore?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="navbar-root">
      <div className="content-wrapper navbar-inner">

        <Link to="/" className="brand-logo">
          <div className="brand-text-block">
            <span className="brand-title">SOLANDER</span>
            <span className="brand-subtitle font-mono">CINEMA ARCHIVE</span>
          </div>
        </Link>

        <nav className="nav-links">
          <Link to="/explore" className={`nav-item ${isActive('/explore') ? 'active' : ''}`}>
            <span>Discover</span>
          </Link>
          <Link to="/roulette" className={`nav-item ${isActive('/roulette') ? 'active' : ''}`}>
            <span>Roulette</span>
          </Link>

          {currentUser && (
            <>
              <Link to="/diary" className={`nav-item ${isActive('/diary') ? 'active' : ''}`}>
                <span>Diary</span>
              </Link>
              <Link to="/watchlist" className={`nav-item ${isActive('/watchlist') ? 'active' : ''}`}>
                <span>Watchlist</span>
              </Link>
            </>
          )}
        </nav>

        <form onSubmit={handleSearchSubmit} className="nav-search-form">
          <Search size={15} className="nav-search-icon" />
          <input
            type="text"
            className="nav-search-input font-sans"
            placeholder="Search films..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>

        <div className="nav-actions">
          {currentUser ? (
            <div className="user-menu-container">
              <button
                className="user-avatar-btn"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                aria-label="User menu"
              >
                {mongoUser?.avatarUrl ? (
                  <img src={mongoUser.avatarUrl} alt={mongoUser.username} className="user-avatar-img" />
                ) : (
                  <div className="user-avatar-placeholder">
                    {mongoUser?.username?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}
                <span className="user-display-name">
                  @{mongoUser?.username || 'user'}
                </span>
              </button>

              <button
                onClick={handleLogout}
                className="nav-logout-btn font-mono"
                title="Log out"
              >
                Log Out
              </button>

              {dropdownOpen && (
                <div className="dropdown-menu">
                  <div className="dropdown-header">
                    <p className="dropdown-user-title">{mongoUser?.displayName || mongoUser?.username}</p>
                    <p className="dropdown-user-subtitle font-mono">@{mongoUser?.username}</p>
                  </div>
                  <hr className="dropdown-divider" />
                  <Link
                    to={`/u/${mongoUser?.username || 'me'}`}
                    className="dropdown-item"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <User size={14} />
                    <span>My Profile</span>
                  </Link>
                  <hr className="dropdown-divider" />
                  <button className="dropdown-item logout-item" onClick={handleLogout}>
                    <LogOut size={14} />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="auth-nav-group">
              <Link to="/login" className="btn btn-primary btn-sm auth-btn">
                Log In
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm auth-btn">
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .navbar-root {
          position: sticky;
          top: 0;
          z-index: 100;
          background: rgba(5, 5, 7, 0.96);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-bottom: 1px solid var(--border-subtle);
        }
        .navbar-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 80px;
          gap: 24px;
          padding-left: 8px;
          padding-right: 8px;
        }
        .brand-logo {
          display: flex;
          align-items: center;
          text-decoration: none;
          flex-shrink: 0;
        }
        .brand-text-block {
          display: flex;
          flex-direction: column;
          line-height: 1;
        }
        .brand-title {
          font-family: var(--font-serif);
          font-size: 28px;
          letter-spacing: 0.18em;
          color: var(--text-primary);
          font-weight: 500;
          text-transform: uppercase;
        }
        .brand-subtitle {
          font-size: 9px;
          letter-spacing: 0.24em;
          color: var(--text-muted);
          margin-top: 3px;
          text-transform: uppercase;
        }
        .nav-links {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }
        .nav-item {
          display: inline-flex;
          align-items: center;
          padding: 10px 18px;
          font-size: 15px;
          font-weight: 400;
          color: var(--text-secondary);
          border-radius: var(--radius-sm);
          text-decoration: none;
          transition: color var(--transition-fast);
          letter-spacing: 0.01em;
          white-space: nowrap;
        }
        .nav-item:hover {
          color: var(--text-primary);
        }
        .nav-item.active {
          color: var(--text-primary);
          background: rgba(255, 255, 255, 0.06);
        }

        .nav-search-form {
          display: flex;
          align-items: center;
          gap: 10px;
          background: var(--bg-secondary);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-sm);
          padding: 10px 16px;
          flex: 1;
          min-width: 200px;
          max-width: 400px;
          transition: border-color var(--transition-fast);
        }
        .nav-search-form:focus-within {
          border-color: var(--border-medium);
        }
        .nav-search-icon {
          color: var(--text-muted);
          flex-shrink: 0;
        }
        .nav-search-input {
          background: transparent;
          border: none;
          outline: none;
          color: var(--text-primary);
          font-size: 14px;
          width: 100%;
          min-width: 80px;
        }
        .nav-search-input::placeholder {
          color: var(--text-muted);
        }

        .nav-actions {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-shrink: 0;
        }
        .auth-nav-group {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-shrink: 0;
        }
        .auth-btn {
          white-space: nowrap;
          flex-shrink: 0;
          padding: 9px 20px;
          font-size: 14px;
          font-weight: 500;
          background-color: var(--accent-white) !important;
          color: var(--text-inverse) !important;
          border: 1px solid var(--accent-white) !important;
          border-radius: var(--radius-sm);
          text-decoration: none;
          transition: all var(--transition-fast);
        }
        .auth-btn:hover {
          background-color: var(--accent-silver) !important;
          border-color: var(--accent-silver) !important;
          transform: translateY(-1px);
        }
        .user-menu-container {
          display: flex;
          align-items: center;
          gap: 10px;
          position: relative;
        }
        .user-avatar-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 4px 12px 4px 4px;
          background: var(--bg-tertiary);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-pill);
          color: var(--text-primary);
          cursor: pointer;
          transition: border-color var(--transition-fast);
        }
        .user-avatar-btn:hover {
          border-color: var(--border-medium);
        }
        .user-avatar-img {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          object-fit: cover;
        }
        .user-avatar-placeholder {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: var(--bg-elevated);
          color: var(--text-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 12px;
        }
        .user-display-name {
          font-size: 13px;
          font-family: var(--font-mono);
          color: var(--text-secondary);
        }
        .nav-logout-btn {
          background: transparent;
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-sm);
          color: var(--text-muted);
          font-size: 11px;
          padding: 4px 9px;
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        .nav-logout-btn:hover {
          color: var(--text-primary);
          border-color: var(--border-medium);
        }
        .dropdown-menu {
          position: absolute;
          right: 0;
          top: calc(100% + 8px);
          width: 220px;
          background: var(--bg-secondary);
          border: 1px solid var(--border-medium);
          border-radius: var(--radius-md);
          padding: 6px;
          box-shadow: 0 16px 36px rgba(0, 0, 0, 0.6);
          display: flex;
          flex-direction: column;
          gap: 1px;
          z-index: 101;
        }
        .dropdown-header {
          padding: 8px 10px;
        }
        .dropdown-user-title {
          font-weight: 500;
          font-size: 13.5px;
          color: var(--text-primary);
        }
        .dropdown-user-subtitle {
          font-size: 10px;
          color: var(--text-muted);
          text-transform: uppercase;
          margin-top: 2px;
        }
        .dropdown-divider {
          border: none;
          height: 1px;
          background: var(--border-subtle);
          margin: 4px 0;
        }
        .dropdown-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 10px;
          font-size: 13px;
          color: var(--text-secondary);
          border-radius: var(--radius-sm);
          transition: all var(--transition-fast);
          width: 100%;
          text-align: left;
          text-decoration: none;
          background: transparent;
          border: none;
          cursor: pointer;
        }
        .dropdown-item:hover {
          color: var(--text-primary);
          background: rgba(255, 255, 255, 0.04);
        }
        .logout-item {
          color: #999;
        }
        .logout-item:hover {
          color: #fff;
          background: rgba(255, 255, 255, 0.06);
        }

        @media (max-width: 960px) {
          .navbar-inner {
            height: 60px;
            gap: 10px;
          }
          .brand-title {
            font-size: 18px;
          }
          .nav-links {
            gap: 2px;
          }
          .nav-item {
            padding: 5px 7px;
            font-size: 12px;
          }
          .nav-search-form {
            padding: 5px 8px;
            min-width: 80px;
          }
          .nav-search-input {
            font-size: 12px;
          }
          .auth-nav-group {
            gap: 6px;
          }
          .auth-btn {
            padding: 4px 9px;
            font-size: 11.5px;
          }
        }
        @media (max-width: 600px) {
          .nav-search-form {
            min-width: 60px;
          }
          .nav-search-input::placeholder {
            font-size: 11px;
          }
          .user-display-name {
            display: none;
          }
        }
      `}</style>
    </header>
  );
};

export default Navbar;
