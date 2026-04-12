export default function MovieCard({ movie, onClick }) {
  return (
    <div className="movie-card" onClick={() => onClick(movie)}>
      {movie.poster_url
        ? <img className="movie-card-poster" src={movie.poster_url} alt={movie.title} loading="lazy" />
        : <div className="movie-card-poster-placeholder">🎬</div>
      }
      <div className="movie-card-body">
        <div className="movie-card-title">{movie.title}</div>
        <div className="movie-card-year">{movie.release_year || '—'} · {movie.rating || ''}</div>
      </div>
    </div>
  )
}