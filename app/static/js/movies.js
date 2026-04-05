const IMAGE_BASE = "https://image.tmdb.org/t/p/w500";
function renderMovieCard(movie, options = {}) {
  const card = document.createElement("div");
  card.className = "movie-card" + (options.watchlistClass ? ` ${options.watchlistClass}` : "");
  card.dataset.id = movie.id;
  const posterHtml = movie.poster_url
    ? `<img class="movie-card-poster" src="${movie.poster_url}" alt="${movie.title}" loading="lazy">`
    : `<div class="movie-card-poster-placeholder">🎬</div>`;
  card.innerHTML = `
    ${posterHtml}
    <div class="movie-card-body">
      <div class="movie-card-title">${movie.title}</div>
      <div class="movie-card-year">${movie.release_year || "—"} · ${movie.rating || ""}</div>
      ${options.extraHtml || ""}
    </div>
  `;
  if (options.onClick) {
    card.addEventListener("click", (e) => {
      if (e.target.tagName === "BUTTON") return;
      options.onClick(movie);
    });
  }
  return card;
}
function openMovieModal(movie) {
  const modal = document.getElementById("movieModal");
  const body = document.getElementById("modalBody");
  const posterHtml = movie.poster_url
    ? `<img class="modal-poster" src="${movie.poster_url}" alt="${movie.title}">`
    : "";
  const providers = movie.streaming_providers?.length
    ? `<p class="result-providers" style="margin-top:0.5rem"><strong>Streaming:</strong> ${movie.streaming_providers.join(", ")}</p>`
    : "";
  body.innerHTML = `
    <div class="modal-poster-row">
      ${posterHtml}
      <div class="modal-header">
        <div class="modal-title">${movie.title}</div>
        <div class="modal-meta">
          <span class="badge">${movie.release_year || "—"}</span>
          <span class="badge badge-accent">${movie.rating || "NR"}</span>
          <span class="badge">${movie.genre || ""}</span>
        </div>
        ${providers}
      </div>
    </div>
    ${movie.overview ? `<p class="modal-overview">${movie.overview}</p>` : ""}
    <div id="trailersSection" class="modal-trailers"></div>
    <div id="recommendationsSection" class="modal-recommendations"></div>
    <div class="modal-reviews" id="modalReviews">
      <h3>REVIEWS</h3>
      <div id="reviewsList"></div>
      <div id="reviewFormContainer"></div>
    </div>
    <div class="modal-actions" id="modalActions"></div>
  `;
  renderModalActions(movie);
  loadReviews(movie.id);
  loadTrailers(movie.id);
  loadRecommendations(movie.id);
  modal.classList.remove("hidden");
}
function closeModal() {
  document.getElementById("movieModal").classList.add("hidden");
}
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("modalClose")?.addEventListener("click", closeModal);
  document.querySelector(".modal-backdrop")?.addEventListener("click", closeModal);
});
function renderModalActions(movie) {
  const actionsEl = document.getElementById("modalActions");
  if (!actionsEl) return;
  actionsEl.innerHTML = "";
  if (currentUser) {
    const addWlBtn = document.createElement("button");
    addWlBtn.className = "btn-primary";
    addWlBtn.textContent = "＋ Add to Watchlist";
    addWlBtn.onclick = async () => {
      try {
        await API.post("/api/watchlist/", { movie_id: movie.id });
        showToast(`"${movie.title}" added to watchlist!`, "success");
      } catch (e) {
        showToast(e.message, "error");
      }
    };
    actionsEl.appendChild(addWlBtn);
    const deleteBtn = document.createElement("button");
    deleteBtn.className = "btn-danger";
    deleteBtn.textContent = "Delete Movie";
    deleteBtn.onclick = async () => {
      if (!confirm(`Delete "${movie.title}" from the vault?`)) return;
      try {
        await API.delete(`/api/movies/${movie.id}`);
        showToast(`"${movie.title}" deleted.`, "success");
        closeModal();
        if (typeof loadMovies === "function") loadMovies();
      } catch (e) {
        showToast(e.message, "error");
      }
    };
    actionsEl.appendChild(deleteBtn);
  }
}
async function loadReviews(movieId) {
  try {
    const data = await API.get(`/api/movies/${movieId}`);
    const reviews = data.reviews || [];
    const listEl = document.getElementById("reviewsList");
    const formEl = document.getElementById("reviewFormContainer");
    if (reviews.length === 0) {
      listEl.innerHTML = `<p style="color:var(--text-muted);font-size:0.85rem;margin-bottom:1rem">No reviews yet.</p>`;
    } else {
      listEl.innerHTML = reviews.map(r => `
        <div class="review-item">
          <div class="review-item-header">
            <span class="review-author">${r.user}</span>
            <span class="review-rating">${r.rating}/10</span>
          </div>
          ${r.body ? `<p class="review-body">${r.body}</p>` : ""}
        </div>
      `).join("");
    }
    if (currentUser) {
      const alreadyReviewed = reviews.some(r => r.user === currentUser.username);
      if (!alreadyReviewed) {
        formEl.innerHTML = `
          <form class="review-form" id="reviewForm">
            <input type="number" id="reviewRating" placeholder="Rating (1–10)" min="1" max="10" required>
            <textarea id="reviewBody" placeholder="Your thoughts… (optional)" rows="3"></textarea>
            <button type="submit" class="btn-primary">Submit Review</button>
          </form>
        `;
        document.getElementById("reviewForm").onsubmit = async (e) => {
          e.preventDefault();
          try {
            await API.post(`/api/movies/${movieId}/reviews`, {
              rating: parseInt(document.getElementById("reviewRating").value),
              body: document.getElementById("reviewBody").value,
            });
            showToast("Review added!", "success");
            loadReviews(movieId);
          } catch (err) {
            showToast(err.message, "error");
          }
        };
      }
    }
  } catch {
  }
}
async function loadTrailers(movieId) {
  const section = document.getElementById("trailersSection");
  if (!section) return;
  try {
    const data = await API.get(`/api/movies/${movieId}/trailers`);
    const trailers = data.trailers;

    if (!trailers || trailers.length === 0) {
      section.innerHTML = "";
      return;
    }
    // Show the first trailer embedded, with buttons for additional ones
    section.innerHTML = `
      <div class="trailer-container">
        <h3 class="trailer-title">TRAILER</h3>
        <div class="trailer-wrapper">
          <iframe
            id="trailerFrame"
            src="https://www.youtube.com/embed/${trailers[0].key}?rel=0"
            title="${trailers[0].name}"
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen
          ></iframe>
        </div>
        ${trailers.length > 1 ? `
          <div class="trailer-tabs">
            ${trailers.map((t, i) => `
              <button
                class="trailer-tab ${i === 0 ? "active" : ""}"
                onclick="switchTrailer('${t.key}', '${t.name}', this)"
              >
                ${t.name}
              </button>
            `).join("")}
          </div>
        ` : ""}
      </div>
    `;
  } catch {
  }
}
function switchTrailer(key, name, btn) {
  document.getElementById("trailerFrame").src =
    `https://www.youtube.com/embed/${key}?rel=0&autoplay=1`;
  document.querySelectorAll(".trailer-tab").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
}
async function loadRecommendations(movieId) {
  const section = document.getElementById("recommendationsSection");
  if (!section) return;
  section.innerHTML = "";
  try {
    const data = await API.get(`/api/movies/${movieId}/recommendations`);
    const recs = data.recommendations;
    if (!recs || recs.length === 0) {
      section.innerHTML = "";
      return;
    }
    section.innerHTML = `
      <div class="recommendations-container">
        <h3 class="recommendations-title">YOU MIGHT ALSO LIKE</h3>
        <div class="recommendations-grid" id="recsGrid"></div>
      </div>
    `;
    const grid = document.getElementById("recsGrid");
    // Also fetch saved movies so we can link to ones already in the vault
    let savedMovies = [];
    try {
      const saved = await API.get("/api/movies/?per_page=200");
      savedMovies = saved.movies;
    } catch { /* ignore */ }
    recs.forEach(rec => {
      const savedMatch = savedMovies.find(m => m.tmdb_id === rec.tmdb_id);
      const card = document.createElement("div");
      card.className = "rec-card";
      const posterHtml = rec.poster_url
        ? `<img class="rec-poster" src="${rec.poster_url}" alt="${rec.title}" loading="lazy">`
        : `<div class="rec-poster-placeholder">🎬</div>`;
      card.innerHTML = `
        ${posterHtml}
        <div class="rec-info">
          <div class="rec-title">${rec.title}</div>
          <div class="rec-year">${rec.release_year || "—"}</div>
        </div>
        ${savedMatch ? `<div class="rec-saved-badge">In Vault</div>` : ""}
      `;
      // If the movie is already in the vault, open its modal
      // Otherwise search for it on TMDB
      card.onclick = () => {
        if (savedMatch) {
          openMovieModal(savedMatch);
        } else {
          closeModal();
          document.getElementById("searchInput").value = rec.title;
          document.getElementById("searchForm").dispatchEvent(new Event("submit"));
          window.scrollTo(0, 0);
        }
      };
      grid.appendChild(card);
    });
  } catch {
  }
}
