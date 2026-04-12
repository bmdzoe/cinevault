export default function MovieRow({ title, movies, onMovieClick, loading }) {
  return (
    <section className="category-section">
      <h2 className="category-title">{title}</h2>
      <div className="movie-row">
        {loading
          ? Array(8).fill(0).map((_, i) => (
              <div key={i} className="row-card skeleton" />
            ))
          : movies.map(movie => (
              <div
                key={movie.tmdb_id}
                className="row-card"
                onClick={() => onMovieClick(movie)}
              >
                {movie.poster_url
                  ? <img className="row-card-poster" src={movie.poster_url} alt={movie.title} loading="lazy" />
                  : <div className="row-card-placeholder">🎬</div>
                }
                <div className="row-card-overlay">
                  <div className="row-card-title">{movie.title}</div>
                  <div className="row-card-year">{movie.release_year || '—'}</div>
                </div>
              </div>
            ))
        }
      </div>
    </section>
  )
}