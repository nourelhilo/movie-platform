import React from 'react';
import { Link } from 'react-router-dom';

const TMDB_IMG = 'https://image.tmdb.org/t/p/w342';

export const MovieCard = ({ movie }) => {
  const { id, title, release_date, poster_path } = movie;
  const year = release_date ? release_date.split('-')[0] : null;
  const poster = poster_path ? `${TMDB_IMG}${poster_path}` : null;

  return (
    <Link to={`/movie/${id}`} className="movie-card">
      <div className="movie-card-poster">
        {poster ? (
          <img src={poster} alt={title} loading="lazy" />
        ) : (
          <div className="movie-card-no-poster">
            <span className="font-mono">NO POSTER</span>
          </div>
        )}
        <div className="movie-card-overlay">
          <span className="movie-card-cta font-mono">VIEW FILM</span>
        </div>
      </div>
      <div className="movie-card-info">
        <p className="movie-card-title">{title}</p>
        {year && <span className="movie-card-year font-mono">{year}</span>}
      </div>

      <style>{`
        .movie-card {
          display: flex;
          flex-direction: column;
          gap: 10px;
          text-decoration: none;
          cursor: pointer;
        }
        .movie-card-poster {
          position: relative;
          aspect-ratio: 2/3;
          border-radius: var(--radius-md);
          overflow: hidden;
          background: var(--bg-tertiary);
          border: 1px solid var(--border-subtle);
        }
        .movie-card-poster img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          transition: transform 0.4s ease;
        }
        .movie-card:hover .movie-card-poster img {
          transform: scale(1.04);
        }
        .movie-card-no-poster {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-muted);
          font-size: 9px;
          letter-spacing: 0.1em;
        }
        .movie-card-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.55);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.25s ease;
        }
        .movie-card:hover .movie-card-overlay {
          opacity: 1;
        }
        .movie-card-cta {
          font-size: 10px;
          letter-spacing: 0.14em;
          color: #fff;
          border: 1px solid rgba(255,255,255,0.4);
          padding: 6px 14px;
          border-radius: var(--radius-sm);
        }
        .movie-card-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .movie-card-title {
          font-size: 13px;
          color: var(--text-primary);
          line-height: 1.4;
          font-weight: 500;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .movie-card-year {
          font-size: 11px;
          color: var(--text-muted);
          letter-spacing: 0.06em;
        }
      `}</style>
    </Link>
  );
};

export default MovieCard;
