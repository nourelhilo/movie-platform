import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';

export const LoginPage = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialMode = searchParams.get('mode') === 'signup' || location.pathname === '/register';
  const [isRegister, setIsRegister] = useState(initialMode);

  useEffect(() => {
    const isSignup = searchParams.get('mode') === 'signup' || location.pathname === '/register';
    setIsRegister(isSignup);
  }, [location.search, location.pathname]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const { loginWithEmail, registerWithEmail } = useAuth();
  const navigate = useNavigate();

  // Redirect destination after successful login
  const targetDestination = location.state?.from?.pathname || '/explore';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      if (isRegister) {
        await registerWithEmail(email, password, displayName, username);
      } else {
        await loginWithEmail(email, password);
      }
      navigate(targetDestination, { replace: true });
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page-root">
      <div className="auth-card">
        {/* Header */}
        <div className="auth-header">
          <h1 className="auth-title font-serif">
            {isRegister ? 'Join the Archive' : 'Welcome Back'}
          </h1>
          <p className="auth-subtitle">
            {isRegister
              ? 'Catalog your films, write diary entries, and discover cinema.'
              : 'Sign in to access your diary, watchlist, and cinema profile.'}
          </p>
        </div>

        {/* Tab switcher */}
        <div className="auth-tabs" role="tablist">
          <button
            type="button"
            className={`auth-tab ${!isRegister ? 'active' : ''}`}
            onClick={() => {
              setIsRegister(false);
              setError(null);
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`auth-tab ${isRegister ? 'active' : ''}`}
            onClick={() => {
              setIsRegister(true);
              setError(null);
            }}
          >
            Create Account
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="error-alert" role="alert">
            <AlertCircle size={16} className="error-icon" />
            <div className="error-text">
              <span>{error}</span>
            </div>
            <button
              type="button"
              className="error-dismiss"
              onClick={() => setError(null)}
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="auth-form">
          {isRegister && (
            <>
              <div className="form-group">
                <label className="form-label" htmlFor="auth-display-name">
                  Display Name
                </label>
                <input
                  id="auth-display-name"
                  type="text"
                  required
                  className="form-input"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  autoComplete="name"
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="auth-username">
                  Username
                </label>
                <div className="username-wrapper">
                  <span className="username-at">@</span>
                  <input
                    id="auth-username"
                    type="text"
                    required
                    className="form-input username-input"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    autoComplete="username"
                    maxLength={30}
                  />
                </div>
              </div>
            </>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="auth-email">
              Email Address
            </label>
            <input
              id="auth-email"
              type="email"
              required
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="auth-password">
              Password
            </label>
            <div className="password-wrapper">
              <input
                id="auth-password"
                type={showPassword ? 'text' : 'password'}
                required
                className="form-input password-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={isRegister ? 'new-password' : 'current-password'}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(v => !v)}
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary auth-submit-btn"
            disabled={submitting}
          >
            {submitting ? (
              <span className="btn-loading-content">
                <span className="btn-spinner" />
                <span>Authenticating...</span>
              </span>
            ) : isRegister ? (
              'Create Account'
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Footer info */}
        <div className="auth-card-footer">
          <p>
            {isRegister ? 'Already registered on Solander?' : "Don't have an account yet?"}{' '}
            <button
              type="button"
              className="toggle-auth-btn"
              onClick={() => {
                setIsRegister(!isRegister);
                setError(null);
              }}
            >
              {isRegister ? 'Sign In' : 'Create One'}
            </button>
          </p>
        </div>
      </div>

      <style>{`
        .auth-page-root {
          min-height: calc(100vh - 140px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          background: radial-gradient(circle at 50% 20%, rgba(255, 255, 255, 0.03) 0%, transparent 70%);
        }
        .auth-card {
          width: 100%;
          max-width: 420px;
          padding: 36px 32px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          background: var(--bg-secondary);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          box-shadow: 0 20px 48px rgba(0, 0, 0, 0.6), 0 1px 0 rgba(255, 255, 255, 0.06) inset;
        }

        .auth-header {
          display: flex;
          flex-direction: column;
          gap: 8px;
          text-align: center;
          align-items: center;
        }
        .auth-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 10px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: var(--text-muted);
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid var(--border-subtle);
          padding: 3px 10px;
          border-radius: var(--radius-pill);
        }
        .auth-title {
          font-size: 30px;
          font-weight: 400;
          color: var(--text-primary);
          letter-spacing: -0.01em;
          margin: 0;
        }
        .auth-subtitle {
          font-size: 13px;
          color: var(--text-secondary);
          margin: 0;
          line-height: 1.45;
        }

        .auth-tabs {
          display: grid;
          grid-template-columns: 1fr 1fr;
          background: var(--bg-tertiary);
          padding: 4px;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border-subtle);
          gap: 4px;
        }
        .auth-tab {
          padding: 8px 12px;
          background: transparent;
          border: none;
          border-radius: calc(var(--radius-sm) - 2px);
          color: var(--text-secondary);
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        .auth-tab:hover {
          color: var(--text-primary);
        }
        .auth-tab.active {
          background: var(--bg-secondary);
          color: var(--text-primary);
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.35);
        }

        .error-alert {
          background: rgba(239, 68, 68, 0.08);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #fca5a5;
          padding: 10px 12px;
          border-radius: var(--radius-sm);
          display: flex;
          align-items: flex-start;
          gap: 10px;
          font-size: 12.5px;
          line-height: 1.4;
        }
        .error-icon {
          flex-shrink: 0;
          color: #ef4444;
          margin-top: 1px;
        }
        .error-text {
          flex: 1;
        }
        .error-dismiss {
          background: none;
          border: none;
          color: #fca5a5;
          font-size: 16px;
          cursor: pointer;
          line-height: 1;
          padding: 0 2px;
          opacity: 0.7;
          transition: opacity 0.15s;
        }
        .error-dismiss:hover {
          opacity: 1;
        }

        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .form-label {
          font-size: 12px;
          font-weight: 500;
          color: var(--text-secondary);
        }
        .form-input {
          width: 100%;
          box-sizing: border-box;
          background: var(--bg-tertiary);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-sm);
          padding: 11px 14px;
          color: var(--text-primary);
          font-family: inherit;
          font-size: 14px;
          outline: none;
          transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
        }
        .form-input:focus {
          border-color: var(--border-focus);
          box-shadow: 0 0 0 1px var(--border-focus);
        }
        .form-input::placeholder {
          color: var(--text-muted);
        }

        .password-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }
        .password-input {
          padding-right: 42px;
        }
        .username-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }
        .username-at {
          position: absolute;
          left: 13px;
          color: var(--text-muted);
          font-size: 14px;
          pointer-events: none;
          z-index: 1;
        }
        .username-input {
          padding-left: 26px;
        }
        .password-toggle {
          position: absolute;
          right: 12px;
          background: none;
          border: none;
          cursor: pointer;
          color: var(--text-muted);
          padding: 0;
          display: flex;
          align-items: center;
          transition: color 0.15s;
        }
        .password-toggle:hover {
          color: var(--text-primary);
        }

        .auth-submit-btn {
          width: 100%;
          margin-top: 4px;
          height: 42px;
          font-size: 14px;
          font-weight: 500;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .btn-loading-content {
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        .btn-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(0,0,0,0.2);
          border-top-color: #000;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }

        .auth-card-footer {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          text-align: center;
          font-size: 13px;
          color: var(--text-secondary);
          padding-top: 16px;
          border-top: 1px solid var(--border-subtle);
        }
        .toggle-auth-btn {
          color: var(--text-primary);
          background: none;
          border: none;
          cursor: pointer;
          font-weight: 500;
          text-decoration: underline;
          padding: 0;
          font-size: inherit;
        }
        .toggle-auth-btn:hover {
          color: #fff;
        }
      `}</style>
    </div>
  );
};

export default LoginPage;

