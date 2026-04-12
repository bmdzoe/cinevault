let currentPage = 1;
async function loadMovies() {
  const genre = document.getElementById("filterGenre")?.value || "";
  const rating = document.getElementById("filterRating")?.value || "";
  const sortBy = document.getElementById("sortBy")?.value || "added_at";
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
      grid.innerHTML = `<p class="empty-state" style="grid-column:1/-1">The vault is empty. <a href="/">Discover movies →</a></p>`;
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
    [...genres].sort().forEach(g => {
      const opt = document.createElement("option");
      opt.value = g; opt.textContent = g;
      select.appendChild(opt);
    });
  } catch { /* ignore */ }
}
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("filterGenre")?.addEventListener("change", () => { currentPage = 1; loadMovies(); });
  document.getElementById("filterRating")?.addEventListener("change", () => { currentPage = 1; loadMovies(); });
  document.getElementById("sortBy")?.addEventListener("change", () => { currentPage = 1; loadMovies(); });
  loadMovies();
  populateGenreFilter();
});
