import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import api from '../api'
export default function WatchlistPage() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const [watchlist, setWatchlist] = useState([])
  const [filter, setFilter] = useState('')
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    if (!user) return
    loadWatchlist()
  }, [user, filter])
  const loadWatchlist = async () => {
    setLoading(true)
    try {
      const params = filter !== '' ? `?watched=${filter}` : ''
      const res = await api.get(`/api/watchlist/${params}`)
      setWatchlist(res.data.watchlist)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }
  const toggleWatched = async (itemId) => {
    try {
      await api.patch(`/api/watchlist/${itemId}/watched`)
      showToast('Updated!', 'success')
      loadWatchlist()
    } catch (err) {
      showToast('Error updating.', 'error')
    }
  }
  const removeItem = async (itemId) => {
    try {
      await api.delete(`/api/watchlist/${itemId}`)
      showToast('Removed from watchlist.', 'success')
      loadWatchlist()
    } catch (err) {
      showToast('Error removing.', 'error')
    }
  }
  if (!user) return (
    <div className="auth-section">
      <p style={{color: 'var(--text-muted)'}}>
        <a href="/login">Log in</a> to see your watchlist.
      </p>
    </div>
  )
  return (
    <>
      <section className="page-header">
        <h1 className="page-title">MY <span className="accent">WATCHLIST</span></h1>
        <div className="watchlist-filters">
          {[['', 'All'], ['false', 'To Watch'], ['true', 'Watched']].map(([val, label]) => (
            <button
              key={val}
              className={`filter-pill ${filter === val ? 'active' : ''}`}
              onClick={() => setFilter(val)}
            >
              {label}
            </button>
          ))}
        </div>
      </section>
      {loading
        ? <div className="movies-grid" style={{padding: '0 2.5rem'}}>
            {Array(6).fill(0).map((_, i) => (
              <div key={i} className="skeleton" style={{aspectRatio: '2/3', borderRadius: '4px'}} />
            ))}
          </div>
        : watchlist.length === 0
          ? <p className="empty-state">Nothing here. <a href="/">Discover movies →</a></p>
          : <div className="movies-grid" style={{padding: '0 2.5rem 4rem'}}>
              {watchlist.map(item => (
                <div key={item.id} className="movie-card wl-card">
                  {item.watched && <div className="wl-watched-badge">✓ Watched</div>}
                  {item.movie.poster_url
                    ? <img className="movie-card-poster" src={item.movie.poster_url} alt={item.movie.title} />
                    : <div className="movie-card-poster-placeholder">🎬</div>
                  }
                  <div className="movie-card-body">
                    <div className="movie-card-title">{item.movie.title}</div>
                    <div className="movie-card-year">{item.movie.release_year || '—'}</div>
                    <div className="wl-actions">
                      <button className="btn-ghost" onClick={() => toggleWatched(item.id)}>
                        {item.watched ? 'Unwatch' : 'Mark Watched'}
                      </button>
                      <button className="btn-danger" onClick={() => removeItem(item.id)}>✕</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
      }
    </>
  )
}