// Centralized API helper with consistent error handling
const API = {
  async request(method, url, body = null) {
    const opts = {
      method,
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
    };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(url, opts);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = data.error || data.errors || `Error ${res.status}`;
      throw new Error(typeof msg === "object" ? JSON.stringify(msg) : msg);
    }
    return data;
  },
  get: (url) => API.request("GET", url),
  post: (url, body) => API.request("POST", url, body),
  put: (url, body) => API.request("PUT", url, body),
  patch: (url, body) => API.request("PATCH", url, body),
  delete: (url) => API.request("DELETE", url),
};
