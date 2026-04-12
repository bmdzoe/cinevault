import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import api from '../api'
export default function MovieModal({ movie, onClose, isTMDB = false }) {
  const { user } = useAuth()
  const { showToast } = useToast()
  const [trailers, setTrailers] = useState([])
  const [recommendations, setRecommendations] = useState([])
  const [reviews, setReviews] = useState([])
  const [reviewRating, setReviewRating] = useState('')
  const [reviewBody, setReviewBody] = useState('')
  const [activeTrailer, setActiveTrailer] = useState(null)
  useEffect(() => {
    if (!movie) return
    if (!isTMDB && movie.id) {
      // Load trailers, recommendations and reviews for saved movies
      api.get(`/api/movies/${movie.id}/trailers`)
        .then(res => {
          setTrailers(res.data.trailers || [])
          setActiveTrailer(res.data.trailers?.[0] || null)
        }).catch(() => {})

      api.get(`/api/movies/${movie.id}/recommendations`)
        .then(res => setRecommendations(res.data.recommendations || []))
        .catch(() => {})

      api.get(`/api/movies/${movie.id}`)
        .then(res => setReviews(res.data.reviews || []))
        .catch(() => {})
    }
  }, [movie, isTMDB])
  if (!movie) return null
  const handleSave = async () => {
    if (!user) { showToast('Log in to save movies.', 'error'); return }
    try {
      await api.post('/api/movies/', { tmdb_id: movie.tmdb_id || movie.id, title: movie.title })
      showToast(`"${movie.title}" saved to the vault!`, 'success')
    } catch (err) {
      showToast(err.response?.data?.error || 'Error saving movie.', 'error')
    }
  }
  const handleAddToWatchlist = async () => {
    if (!user) { showToast('Log in to use watchlist.', 'error'); return }
    try {
      await api.post('/api/watchlist/', { movie_id: movie.id })
      showToast(`Added to watchlist!`, 'success')
    } catch (err) {
      showToast(err.response?.data?.error || 'Error.', 'error')
    }
  }
  const handleReview = async (e) => {
    e.preventDefault()
    try {
      await api.post(`/api/movies/${movie.id}/reviews`, {
        rating: parseInt(reviewRating),
        body: reviewBody,
      })
      showToast('Review added!', 'success')
      setReviewRating('')
      setReviewBody('')
      const res = await api.get(`/api/movies/${movie.id}`)
      setReviews(res.data.reviews || [])
    } catch (err) {
      showToast(err.response?.data?.error || 'Error adding review.', 'error')
    }
  }
  return (
    <div className="modal" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        <div className="modal-poster-row">
          {movie.poster_url && (
            <img className="modal-poster" src={movie.poster_url} alt={movie.title} />
          )}
          <div className="modal-header">
            <div className="modal-title">{movie.title}</div>
            <div className="modal-meta">
              <span className="badge">{movie.release_year || '—'}</span>
              {movie.rating && <span className="badge badge-accent">{movie.rating}</span>}
              {movie.genre && <span className="badge">{movie.genre}</span>}
            </div>
            {movie.streaming_providers?.length > 0 && (
              <p className="result-providers" style={{marginTop: '0.5rem'}}>
                <strong>Streaming:</strong> {movie.streaming_providers.join(', ')}
              </p>
            )}
          </div>
        </div>
        {movie.overview && <p className="modal-overview">{movie.overview}</p>}
        {/* Trailers */}
        {activeTrailer && (
          <div className="modal-trailers">
            <div className="trailer-container">
              <h3 className="trailer-title">TRAILER</h3>
              <div className="trailer-wrapper">
                <iframe
                  src={`https://www.youtube.com/embed/${activeTrailer.key}?rel=0`}
                  title={activeTrailer.name}
                  frameBorder="0"
                  allowFullScreen
                />
              </div>
              {trailers.length > 1 && (
                <div className="trailer-tabs">
                  {trailers.map((t, i) => (
                    <button
                      key={i}
                      className={`trailer-tab ${activeTrailer.key === t.key ? 'active' : ''}`}
                      onClick={() => setActiveTrailer(t)}
                    >
                      {t.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div className="modal-recommendations">
            <div className="recommendations-container">
              <h3 className="recommendations-title">YOU MIGHT ALSO LIKE</h3>
              <div className="recommendations-grid">
                {recommendations.map(rec => (
                  <div key={rec.tmdb_id} className="rec-card">
                    {rec.poster_url
                      ? <img className="rec-poster" src={rec.poster_url} alt={rec.title} loading="lazy" />
                      : <div className="rec-poster-placeholder">🎬</div>
                    }
                    <div className="rec-info">
                      <div className="rec-title">{rec.title}</div>
                      <div className="rec-year">{rec.release_year || '—'}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        {/* Actions */}
        <div className="modal-actions">
          {isTMDB ? (
            <button className="btn-primary" onClick={handleSave}>＋ Save to Vault</button>
          ) : (
            <>
              {user && (
                <button className="btn-primary" onClick={handleAddToWatchlist}>＋ Add to Watchlist</button>
              )}
            </>
          )}
        </div>
        {/* Reviews */}
        {!isTMDB && (
          <div className="modal-reviews">
            <h3>REVIEWS</h3>
            {reviews.length === 0 && (
              <p style={{color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem'}}>No reviews yet.</p>
            )}
            {reviews.map(r => (
              <div key={r.id} className="review-item">
                <div className="review-item-header">
                  <span className="review-author">{r.user}</span>
                  <span className="review-rating">{r.rating}/10</span>
                </div>
                {r.body && <p className="review-body">{r.body}</p>}
              </div>
            ))}
            {user && (
              <form className="review-form" onSubmit={handleReview}>
                <input
                  type="number"
                  placeholder="Rating (1-10)"
                  min="1" max="10"
                  value={reviewRating}
                  onChange={e => setReviewRating(e.target.value)}
                  required
                />
                <textarea
                  placeholder="Your thoughts… (optional)"
                  rows="3"
                  value={reviewBody}
                  onChange={e => setReviewBody(e.target.value)}
                />
                <button type="submit" className="btn-primary">Submit Review</button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  )
}