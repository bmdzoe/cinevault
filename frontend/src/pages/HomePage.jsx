import { useState, useEffect } from 'react'
import api from '../api'
import MovieRow from '../components/MovieRow'
import MovieModal from '../components/MovieModal'
export default function HomePage() {
  const [popular, setPopular] = useState([])
  const [topRated, setTopRated] = useState([])
  const [nowPlaying, setNowPlaying] = useState([])
  const [upcoming, setUpcoming] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedMovie, setSelectedMovie] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResult, setSearchResult] = useState(null)
  const [searching, setSearching] = useState(false)
  useEffect(() => {
    Promise.all([
      api.get('/api/movies/popular'),
      api.get('/api/movies/top_rated'),
      api.get('/api/movies/now_playing'),
      api.get('/api/movies/upcoming'),
    ]).then(([pop, top, now, up]) => {
      setPopular(pop.data.movies)
      setTopRated(top.data.movies)
      setNowPlaying(now.data.movies)
      setUpcoming(up.data.movies)
    }).catch(console.error)
      .finally(() => setLoading(false))
  }, [])
  const handleSearch = async (e) => {
    e.preventDefault()
    if (!searchQuery.trim()) return
    setSearching(true)
    setSearchResult(null)
    try {
      const res = await api.get(`/api/movies/search?title=${encodeURIComponent(searchQuery)}`)
      setSearchResult(res.data)
    } catch {
      setSearchResult({ error: 'Movie not found.' })
    } finally {
      setSearching(false)
    }
  }
  return (
    <>
      <section className="hero">
        <div className="hero-text">
          <h1 className="hero-title">DISCOVER<br /><span className="accent">GREAT FILMS</span></h1>
          <p className="hero-sub">Browse what's popular, top rated, and coming soon.</p>
        </div>
        <form className="search-bar" onSubmit={handleSearch}>
          <input
            type="text"
            className="search-input"
            placeholder="Search for a movie…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          <button type="submit" className="btn-primary" disabled={searching}>
            {searching ? '...' : 'SEARCH'}
          </button>
        </form>
      </section>
      {searchResult && (
        <div className="search-result">
          {searchResult.error
            ? <p style={{color: 'var(--red)', padding: '1rem'}}>{searchResult.error}</p>
            : (
              <div className="result-card">
                {searchResult.poster_url || searchResult.poster_path
                  ? <img
                      className="result-poster"
                      src={searchResult.poster_url || `https://image.tmdb.org/t/p/w500${searchResult.poster_path}`}
                      alt={searchResult.title}
                    />
                  : <div className="result-poster-placeholder">🎬</div>
                }
                <div className="result-info">
                  <div className="result-title">{searchResult.title}</div>
                  <div className="result-meta">
                    <span className="badge">{searchResult.release_year || '—'}</span>
                    <span className="badge badge-accent">{searchResult.rating || 'NR'}</span>
                    <span className="badge">{searchResult.genre || '—'}</span>
                  </div>
                  {searchResult.overview && <p className="result-overview">{searchResult.overview}</p>}
                  {searchResult.streaming_providers?.length > 0 && (
                    <p className="result-providers">
                      <strong>Streaming on:</strong> {searchResult.streaming_providers.join(', ')}
                    </p>
                  )}
                  <div className="result-actions">
                    <button
                      className="btn-primary"
                      onClick={() => setSelectedMovie({ ...searchResult, isTMDB: true })}
                    >
                      ＋ Save to Vault
                    </button>
                  </div>
                </div>
              </div>
            )
          }
        </div>
      )}
      <div className="categories-container">
        <MovieRow title="🔥 Popular Right Now" movies={popular} onMovieClick={m => setSelectedMovie({...m, isTMDB: true})} loading={loading} />
        <MovieRow title="⭐ Top Rated" movies={topRated} onMovieClick={m => setSelectedMovie({...m, isTMDB: true})} loading={loading} />
        <MovieRow title="🎬 Now Playing" movies={nowPlaying} onMovieClick={m => setSelectedMovie({...m, isTMDB: true})} loading={loading} />
        <MovieRow title="🗓 Coming Soon" movies={upcoming} onMovieClick={m => setSelectedMovie({...m, isTMDB: true})} loading={loading} />
      </div>
      {selectedMovie && (
        <MovieModal
          movie={selectedMovie}
          isTMDB={selectedMovie.isTMDB}
          onClose={() => setSelectedMovie(null)}
        />
      )}
    </>
  )
}