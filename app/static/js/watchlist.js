let watchlistFilter = "";
async function loadWatchlist() {
  const grid = document.getElementById("watchlistGrid");
  const empty = document.getElementById("emptyState");
  grid.innerHTML = Array(4).fill(`<div class="skeleton" style="aspect-ratio:2/3;border-radius:4px"></div>`).join("");
  try {
    const params = watchlistFilter !== "" ? `?watched=${watchlistFilter}` : "";
    const data = await API.get(`/api/watchlist/${params}`);
    grid.innerHTML = "";
    if (data.watchlist.length === 0) {
      empty.classList.remove("hidden");
      return;
    }
    empty.classList.add("hidden");
    data.watchlist.forEach(item => {
      const movie = item.movie;
      const watchedBadge = item.watched
        ? `<div class="wl-watched-badge">✓ Watched</div>` : "";
      const extraHtml = `
        <div class="wl-actions">
          <button class="btn-ghost" onclick="toggleWatched(${item.id}, this)">
            ${item.watched ? "Unwatch" : "Mark Watched"}
          </button>
          <button class="btn-danger" onclick="removeFromWatchlist(${item.id}, this)">✕</button>
        </div>
      `;
      const card = renderMovieCard(movie, {
        watchlistClass: "wl-card",
        onClick: openMovieModal,
        extraHtml,
      });
      const posterEl = card.querySelector(".movie-card-poster, .movie-card-poster-placeholder");
      if (posterEl && item.watched) {
        const badge = document.createElement("div");
        badge.className = "wl-watched-badge";
        badge.textContent = "✓ Watched";
        card.style.position = "relative";
        card.insertBefore(badge, posterEl.nextSibling);
      }
      grid.appendChild(card);
    });
  } catch (err) {
    grid.innerHTML = `<p style="color:var(--red);padding:1rem">${err.message}</p>`;
  }
}
async function toggleWatched(itemId, btn) {
  try {
    await API.patch(`/api/watchlist/${itemId}/watched`);
    showToast("Updated!", "success");
    loadWatchlist();
  } catch (err) {
    showToast(err.message, "error");
  }
}
async function removeFromWatchlist(itemId, btn) {
  try {
    await API.delete(`/api/watchlist/${itemId}`);
    showToast("Removed from watchlist.", "success");
    loadWatchlist();
  } catch (err) {
    showToast(err.message, "error");
  }
}
document.addEventListener("DOMContentLoaded", () => {
  loadWatchlist();
  document.querySelectorAll(".filter-pill").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".filter-pill").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      watchlistFilter = btn.dataset.filter;
      loadWatchlist();
    });
  });
});
