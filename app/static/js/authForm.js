document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("authForm");
  const errorEl = document.getElementById("authError");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorEl.classList.add("hidden");
    errorEl.textContent = "";

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
      if (MODE === "register") {
        const username = document.getElementById("username").value;
        await API.post("/auth/register", { username, email, password });
        showToast("Account created! Welcome.", "success");
      } else {
        await API.post("/auth/login", { email, password });
        showToast("Logged in.", "success");
      }
      setTimeout(() => window.location.href = "/", 800);
    } catch (err) {
      errorEl.textContent = err.message;
      errorEl.classList.remove("hidden");
    }
  });
});
