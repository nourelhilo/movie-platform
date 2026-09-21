import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import Navbar from './components/layout/Navbar.jsx';
import HomePage from './pages/HomePage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import ExplorePage from './pages/ExplorePage.jsx';
import MovieDetailPage from './pages/MovieDetailPage.jsx';
import WatchlistPage from './pages/WatchlistPage.jsx';
import DiaryPage from './pages/DiaryPage.jsx';
import RoulettePage from './pages/RoulettePage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import ProtectedRoute from './components/common/ProtectedRoute.jsx';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app-container">
          <Navbar />
          <main className="main-content">
            <Routes>
              {/* public pages */}
              <Route path="/" element={<HomePage />} />
              <Route path="/explore" element={<ExplorePage />} />
              <Route path="/movie/:tmdbId" element={<MovieDetailPage />} />
              <Route path="/roulette" element={<RoulettePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<LoginPage />} />

              {/* protected user pages */}
              <Route
                path="/diary"
                element={
                  <ProtectedRoute>
                    <DiaryPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/watchlist"
                element={
                  <ProtectedRoute>
                    <WatchlistPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/u/:username"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />

              {/* fallback */}
              <Route path="*" element={<HomePage />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
