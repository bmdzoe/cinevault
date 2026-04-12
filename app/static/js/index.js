function renderRow(movies, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = "";

  if (!movies || movies.length === 0) {
    container.innerHTML = `<p style="color:var(--text-muted);padding:1rem">Nothing to show.</p>`;
    return;
  }
  movies.forEach(movie => {
    const card = document.createElement("div");
    card.className = "row-card";
    const poster = movie.poster_url
      ? `<img class="row-card-poster" src="${movie.poster_url}" alt="${movie.title}" loading="lazy">`
      : `<div class="row-card-placeholder">🎬</div>`;
    card.innerHTML = `
      ${poster}
      <div class="row-card-overlay">
        <div class="row-card-title">${movie.title}</div>
        <div class="row-card-year">${movie.release_year || "—"}</div>
      </div>
    `;
    // Clicking opens the search modal so user can save it
    card.onclick = () => openTMDBModal(movie);
    container.appendChild(card);
  });
}
// Opens a modal for a TMDB movie that may not be saved yet
function openTMDBModal(movie) {
  const modal = document.getElementById("movieModal");
  const body = document.getElementById("modalBody");
  body.innerHTML = "";
  modal.dataset.movieId = movie.tmdb_id;
  const posterHtml = movie.poster_url
    ? `<img class="modal-poster" src="${movie.poster_url}" alt="${movie.title}">`
    : "";
  body.innerHTML = `
    <div class="modal-poster-row">
      ${posterHtml}
      <div class="modal-header">
        <div class="modal-title">${movie.title}</div>
        <div class="modal-meta">
          <span class="badge">${movie.release_year || "—"}</span>
          ${movie.rating ? `<span class="badge badge-accent">★ ${typeof movie.rating === 'number' ? movie.rating.toFixed(1) : movie.rating}</span>` : ""}
        </div>
      </div>
    </div>
    ${movie.overview ? `<p class="modal-overview">${movie.overview}</p>` : ""}
    <div class="modal-actions" id="modalActions"></div>
  `;
  // Save to vault button
  const actionsEl = document.getElementById("modalActions");
  if (currentUser) {
    const saveBtn = document.createElement("button");
    saveBtn.className = "btn-primary";
    saveBtn.textContent = "＋ Save to Vault";
    saveBtn.onclick = async () => {
      try {
        // First save to vault via search
        const searchData = await API.get(`/api/movies/search?title=${encodeURIComponent(movie.title)}`);
        if (searchData.tmdb_id === movie.tmdb_id || true) {
          await API.post("/api/movies/", { tmdb_id: movie.tmdb_id, title: movie.title });
          showToast(`"${movie.title}" saved to the vault!`, "success");
        }
      } catch (err) {
        showToast(err.message, "error");
      }
    };
    actionsEl.appendChild(saveBtn);
  } else {
    actionsEl.innerHTML = `<p style="color:var(--text-muted);font-size:0.85rem"><a href="/login">Log in</a> to save movies to the vault.</p>`;
  }
  modal.classList.remove("hidden");
}
// Search functionality
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
  const posterUrl = movie.poster_url || (movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null);
  const posterHtml = posterUrl
    ? `<img class="result-poster" src="${posterUrl}" alt="${movie.title}">`
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
    } catch (err) {
      showToast(err.message, "error");
    }
  };
}
// Load all category rows on page load
async function loadCategories() {
  const categories = [
    { endpoint: "/api/movies/popular", rowId: "popularRow" },
    { endpoint: "/api/movies/top_rated", rowId: "topRatedRow" },
    { endpoint: "/api/movies/now_playing", rowId: "nowPlayingRow" },
    { endpoint: "/api/movies/upcoming", rowId: "upcomingRow" },
  ];
  // Show skeletons while loading
  categories.forEach(({ rowId }) => {
    const container = document.getElementById(rowId);
    if (container) {
      container.innerHTML = Array(6).fill(
        `<div class="skeleton row-card" style="flex-shrink:0"></div>`
      ).join("");
    }
  });
  // Load all categories in parallel for speed
  await Promise.all(categories.map(async ({ endpoint, rowId }) => {
    try {
      const data = await API.get(endpoint);
      renderRow(data.movies, rowId);
    } catch {
      const container = document.getElementById(rowId);
      if (container) container.innerHTML = `<p style="color:var(--text-muted);padding:1rem">Failed to load.</p>`;
    }
  }));
}
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("searchForm")?.addEventListener("submit", searchMovie);
  document.getElementById("modalClose")?.addEventListener("click", () => {
    document.getElementById("movieModal").classList.add("hidden");
  });
  document.querySelector(".modal-backdrop")?.addEventListener("click", () => {
    document.getElementById("movieModal").classList.add("hidden");
  });
  loadCategories();
});
