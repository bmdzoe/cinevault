// Manages navbar auth state on every page
let currentUser = null;

async function loadAuthState() {
  const navAuth = document.getElementById("nav-auth");
  if (!navAuth) return;
  try {
    const data = await API.get("/auth/me");
    currentUser = data.user;
    navAuth.innerHTML = `
      <span style="color:var(--text-muted);font-size:0.8rem">${currentUser.username}</span>
      <button class="btn-ghost" id="logoutBtn">Logout</button>
    `;
    document.getElementById("logoutBtn").addEventListener("click", async () => {
      await API.post("/auth/logout");
      currentUser = null;
      window.location.reload();
    });
  } catch {
    navAuth.innerHTML = `
      <a href="/login" class="btn-ghost">Log In</a>
      <a href="/register" class="btn-primary" style="font-size:0.85rem;padding:0.5rem 1rem">Register</a>
    `;
  }
}

document.addEventListener("DOMContentLoaded", loadAuthState);
