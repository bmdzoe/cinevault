import { useState, useEffect } from 'react'
import api from '../api'
import MovieCard from '../components/MovieCard'
import MovieModal from '../components/MovieModal'
export default function VaultPage() {
  const [movies, setMovies] = useState([])
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)
  const [currentPage, setCurrentPage] = useState(1)
  const [genre, setGenre] = useState('')
  const [rating, setRating] = useState('')
  const [sortBy, setSortBy] = useState('added_at')
  const [genres, setGenres] = useState([])
  const [selectedMovie, setSelectedMovie] = useState(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    loadMovies()
  }, [currentPage, genre, rating, sortBy])
  useEffect(() => {
    api.get('/api/movies/?per_page=200')
      .then(res => {
        const g = new Set()
        res.data.movies.forEach(m => m.genre?.split(',').forEach(x => g.add(x.trim())))
        setGenres([...g].sort())
      }).catch(() => {})
  }, [])
  const loadMovies = async () => {
    setLoading(true)
    const params = new URLSearchParams({
      page: currentPage, per_page: 12,
      sort_by: sortBy, order: sortBy === 'title' ? 'asc' : 'desc',
      ...(genre && { genre }), ...(rating && { rating }),
    })
    try {
      const res = await api.get(`/api/movies/?${params}`)
      setMovies(res.data.movies)
      setTotal(res.data.total)
      setPages(res.data.pages)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }
  return (
    <>
      <section className="page-header">
        <div>
          <h1 className="page-title">THE <span className="accent">VAULT</span></h1>
          <p style={{color: 'var(--text-muted)', marginTop: '0.5rem'}}>Every movie the community has discovered.</p>
        </div>
        <div className="filters">
          <select className="filter-select" value={genre} onChange={e => { setGenre(e.target.value); setCurrentPage(1) }}>
            <option value="">All Genres</option>
            {genres.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
          <select className="filter-select" value={rating} onChange={e => { setRating(e.target.value); setCurrentPage(1) }}>
            <option value="">All Ratings</option>
            {['G','PG','PG-13','R','NC-17','NR'].map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <select className="filter-select" value={sortBy} onChange={e => { setSortBy(e.target.value); setCurrentPage(1) }}>
            <option value="added_at">Recently Added</option>
            <option value="title">Title A–Z</option>
            <option value="release_year">Release Year</option>
          </select>
        </div>
      </section>
      <div className="browse-section">
        {loading
          ? <div className="movies-grid">
              {Array(12).fill(0).map((_, i) => (
                <div key={i} className="skeleton" style={{aspectRatio: '2/3', borderRadius: '4px'}} />
              ))}
            </div>
          : movies.length === 0
            ? <p className="empty-state">The vault is empty. <a href="/">Discover movies →</a></p>
            : <div className="movies-grid">
                {movies.map(movie => (
                  <MovieCard key={movie.id} movie={movie} onClick={setSelectedMovie} />
                ))}
              </div>
        }
        {pages > 1 && (
          <div className="pagination">
            {Array.from({length: pages}, (_, i) => i + 1).map(p => (
              <button
                key={p}
                className={`page-btn ${p === currentPage ? 'active' : ''}`}
                onClick={() => setCurrentPage(p)}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>
      {selectedMovie && (
        <MovieModal
          movie={selectedMovie}
          isTMDB={false}
          onClose={() => { setSelectedMovie(null); loadMovies() }}
        />
      )}
    </>
  )
}