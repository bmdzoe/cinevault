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
    <div class="modal-reviews" id="modalReviews">
      <h3>REVIEWS</h3>
      <div id="reviewsList"></div>
      <div id="reviewFormContainer"></div>
    </div>
    <div class="modal-actions" id="modalActions"></div>
  `;
  renderModalActions(movie);
  loadReviews(movie.id);
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
    // silently fail
  }
}
