let currentPage = 1;

async function searchMovie(e) {
  e.preventDefault();
  const title = document.getElementById("searchInput").value.trim();
  if (!title) return;

  const resultEl = document.getElementById("searchResult");
  resultEl.innerHTML = `<div class="skeleton" style="height:200px;border-radius:4px"></div>`;
  resultEl.classList.remove("hidden");

  try {
    const movie = await API.get(`/api/movies/search?title=${encodeURIComponent(title)}`);
    renderSearchResult(movie, resultEl);
  } catch (err) {
    resultEl.innerHTML = `<p style="color:var(--red);padding:1rem">${err.message}</p>`;
  }
}

function renderSearchResult(movie, container) {
  const posterHtml = movie.poster_url
    ? `<img class="result-poster" src="${movie.poster_url}" alt="${movie.title}">`
    : `<div class="result-poster-placeholder">🎬</div>`;

  const providers = movie.streaming_providers?.length
    ? `<p class="result-providers"><strong>Streaming on:</strong> ${movie.streaming_providers.join(", ")}</p>`
    : `<p class="result-providers" style="color:var(--text-muted)">Not available for streaming</p>`;

  container.innerHTML = `
    <div class="result-card">
      ${posterHtml}
      <div class="result-info">
        <div class="result-title">${movie.title}</div>
        <div class="result-meta">
          <span class="badge">${movie.release_year || "—"}</span>
          <span class="badge badge-accent">${movie.rating || "NR"}</span>
          <span class="badge">${movie.genre || "—"}</span>
        </div>
        ${movie.overview ? `<p class="result-overview">${movie.overview}</p>` : ""}
        ${providers}
        <div class="result-actions">
          <button class="btn-primary" id="saveMovieBtn">＋ Save to Vault</button>
        </div>
      </div>
    </div>
  `;

  document.getElementById("saveMovieBtn").onclick = async () => {
    if (!currentUser) {
      showToast("Log in to save movies.", "error");
      return;
    }
    try {
      await API.post("/api/movies/", { tmdb_id: movie.tmdb_id, title: movie.title });
      showToast(`"${movie.title}" saved to the vault!`, "success");
      loadMovies();
    } catch (err) {
      showToast(err.message, "error");
    }
  };
}

async function loadMovies() {
  const genre = document.getElementById("filterGenre").value;
  const rating = document.getElementById("filterRating").value;
  const sortBy = document.getElementById("sortBy").value;

  const params = new URLSearchParams({
    page: currentPage,
    per_page: 12,
    sort_by: sortBy,
    order: sortBy === "title" ? "asc" : "desc",
    ...(genre && { genre }),
    ...(rating && { rating }),
  });

  const grid = document.getElementById("moviesGrid");
  grid.innerHTML = Array(6).fill(`<div class="skeleton" style="aspect-ratio:2/3;border-radius:4px"></div>`).join("");

  try {
    const data = await API.get(`/api/movies/?${params}`);
    grid.innerHTML = "";

    if (data.movies.length === 0) {
      grid.innerHTML = `<p class="empty-state" style="grid-column:1/-1">No movies in the vault yet.</p>`;
    } else {
      data.movies.forEach(movie => {
        const card = renderMovieCard(movie, { onClick: openMovieModal });
        grid.appendChild(card);
      });
    }

    renderPagination(data.pages, data.current_page);
  } catch (err) {
    grid.innerHTML = `<p style="color:var(--red);padding:1rem">${err.message}</p>`;
  }
}

function renderPagination(totalPages, current) {
  const el = document.getElementById("pagination");
  el.innerHTML = "";
  if (totalPages <= 1) return;

  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement("button");
    btn.className = "page-btn" + (i === current ? " active" : "");
    btn.textContent = i;
    btn.onclick = () => { currentPage = i; loadMovies(); window.scrollTo(0, 0); };
    el.appendChild(btn);
  }
}

async function populateGenreFilter() {
  try {
    const data = await API.get("/api/movies/?per_page=200");
    const genres = new Set();
    data.movies.forEach(m => m.genre?.split(", ").forEach(g => genres.add(g.trim())));
    const select = document.getElementById("filterGenre");
    genres.forEach(g => {
      const opt = document.createElement("option");
      opt.value = g; opt.textContent = g;
      select.appendChild(opt);
    });
  } catch { /* ignore */ }
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("searchForm")?.addEventListener("submit", searchMovie);
  document.getElementById("filterGenre")?.addEventListener("change", () => { currentPage = 1; loadMovies(); });
  document.getElementById("filterRating")?.addEventListener("change", () => { currentPage = 1; loadMovies(); });
  document.getElementById("sortBy")?.addEventListener("change", () => { currentPage = 1; loadMovies(); });
  loadMovies();
  populateGenreFilter();
});
