const API_URL = process.env.NEXT_PUBLIC_API_URL;

async function get(path) {
  const response = await fetch(`${API_URL}${path}`);
  const body = await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(body?.message ??"Request failed.");
    error.status = response.status;
    throw error;
  }

  return body;
}

export function listBooks({ filter = "all", search = "", page = 1 } = {}) {
  const params = new URLSearchParams({ page: String(page) });

  if (filter !== "all") {
    params.set("status", filter);
  }

  if (search.trim()) {
    params.set("q", search.trim());
  }

  return get(`/books?${params}`);
}

export function getBook(id) {
  return get(`/books/${id}`);
}
