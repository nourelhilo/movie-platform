import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export const HomePage = () => {
  const { currentUser } = useAuth();

  return (
    <div className="home-root">


      <section className="features-section content-wrapper">
        <div className="feature-row">
          <div className="feature-index font-mono">01</div>
          <div className="feature-body">
            <h2 className="feature-title font-serif">Explore</h2>
            <p className="feature-desc">
              800,000 films. Filter by decade, genre, language, runtime.
              Find something you'd never have thought to look for.
            </p>
          </div>
          <Link to="/explore" className="feature-link font-mono">
            Browse &rarr;
          </Link>
        </div>

        <div className="feature-row">
          <div className="feature-index font-mono">02</div>
          <div className="feature-body">
            <h2 className="feature-title font-serif">Roulette</h2>
            <p className="feature-desc">
              Can't decide what to watch? Set your constraints and let us
              find you a film.
            </p>
          </div>
          <Link to="/roulette" className="feature-link font-mono">
            Roll &rarr;
          </Link>
        </div>

        <div className="feature-row">
          <div className="feature-index font-mono">03</div>
          <div className="feature-body">
            <h2 className="feature-title font-serif">Diary</h2>
            <p className="feature-desc">
              Log every film you watch. Rate it, write a note, mark the rewatch.
              A permanent record that's yours, not theirs.
            </p>
          </div>
          {currentUser ? (
            <Link to="/diary" className="feature-link font-mono">
              Log &rarr;
            </Link>
          ) : (
            <Link to="/login" className="feature-link font-mono">
              Sign in &rarr;
            </Link>
          )}
        </div>
      </section>

      <style>{`
        .home-root {
          padding-bottom: 120px;
        }
        .features-section {
          padding-top: 48px;
        }
        .feature-row {
          display: grid;
          grid-template-columns: 48px 1fr auto;
          align-items: baseline;
          gap: 32px;
          padding: 32px 0;
          border-bottom: 1px solid var(--border-subtle);
        }
        .feature-index {
          font-size: 11px;
          color: var(--text-muted);
        }
        .feature-title {
          font-size: 24px;
          margin-bottom: 8px;
        }
        .feature-desc {
          font-size: 14px;
          color: var(--text-secondary);
          max-width: 480px;
          line-height: 1.6;
        }
        .feature-link {
          font-size: 12px;
          color: var(--text-muted);
          letter-spacing: 0.06em;
          transition: color var(--transition-fast);
        }
        .feature-link:hover {
          color: var(--text-primary);
        }
        @media (max-width: 1200px) {
          .features-section {
            padding-top: 32px;
          }
          .feature-row {
            padding: 24px 0;
          }
        }
        @media (max-width: 640px) {
          .features-section {
            padding-top: 24px;
            padding-left: 20px;
            padding-right: 20px;
          }
          .feature-row {
            grid-template-columns: 1fr;
            gap: 12px;
          }
        }
      `}</style>
    </div>
  );
};

export default HomePage;
