const http = require('http');
const PORT = process.env.PORT || 4510;

const server = http.createServer((req, res) => {
  const { method, url } = req;
  const urlPath = url.split('?')[0];

  res.setHeader('Content-Type', 'application/json');

  // ─── AUTH ────────────────────────────────────────────────────────────────

  // @endpoint POST /api/v1/auth/login
  if (method === 'POST' && urlPath === '/api/v1/auth/login') {
    res.writeHead(200);
    res.end(JSON.stringify({
      accessToken: 'example-access-token',
      user: {
        id: 1,
        name: 'Aisha Khan',
        email: 'aisha@example.com',
        role: 'user'
      }
    }));
    return;
  }

  // @endpoint POST /api/v1/auth/logout
  if (method === 'POST' && urlPath === '/api/v1/auth/logout') {
    res.writeHead(200);
    res.end(JSON.stringify({ message: 'Logged out successfully.' }));
    return;
  }

  // @endpoint POST /api/v1/auth/refresh
  if (method === 'POST' && urlPath === '/api/v1/auth/refresh') {
    res.writeHead(200);
    res.end(JSON.stringify({ accessToken: 'example-refreshed-access-token' }));
    return;
  }

  // ─── BOOKS ───────────────────────────────────────────────────────────────

  // @endpoint GET /api/v1/books
  if (method === 'GET' && urlPath === '/api/v1/books') {
    res.writeHead(200);
    res.end(JSON.stringify({
      data: [
        { id: 12, title: 'Dune', author: 'Frank Herbert', isbn: '9780441172719', year: 1965, availableCopies: 4 },
        { id: 13, title: 'Neuromancer', author: 'William Gibson', isbn: '9780441569595', year: 1984, availableCopies: 2 }
      ]
    }));
    return;
  }

  // @endpoint POST /api/v1/books
  if (method === 'POST' && urlPath === '/api/v1/books') {
    res.writeHead(201);
    res.end(JSON.stringify({
      id: 12,
      title: 'Dune',
      author: 'Frank Herbert',
      isbn: '9780441172719',
      year: 1965,
      availableCopies: 4
    }));
    return;
  }

  // @endpoint GET /api/v1/books/:id
  if (method === 'GET' && /^\/api\/v1\/books\/\d+$/.test(urlPath)) {
    res.writeHead(200);
    res.end(JSON.stringify({
      id: 12,
      title: 'Dune',
      author: 'Frank Herbert',
      isbn: '9780441172719',
      year: 1965,
      availableCopies: 4
    }));
    return;
  }

  // @endpoint PATCH /api/v1/books/:id
  if (method === 'PATCH' && /^\/api\/v1\/books\/\d+$/.test(urlPath)) {
    res.writeHead(200);
    res.end(JSON.stringify({
      id: 12,
      title: 'Dune',
      author: 'Frank Herbert',
      isbn: '9780441172719',
      year: 1965,
      availableCopies: 3
    }));
    return;
  }

  // @endpoint DELETE /api/v1/books/:id
  if (method === 'DELETE' && /^\/api\/v1\/books\/\d+$/.test(urlPath)) {
    res.writeHead(204);
    res.end();
    return;
  }

  // ─── USERS ───────────────────────────────────────────────────────────────

  // @endpoint GET /api/v1/users
  if (method === 'GET' && urlPath === '/api/v1/users') {
    res.writeHead(200);
    res.end(JSON.stringify({
      data: [
        { id: 1, name: 'Aisha Khan', email: 'aisha@example.com', phone: '03001234567', role: 'user', membershipStatus: 'active' },
        { id: 2, name: 'Omar Ali', email: 'omar@example.com', phone: '03111234567', role: 'user', membershipStatus: 'active' }
      ]
    }));
    return;
  }

  // @endpoint POST /api/v1/users
  if (method === 'POST' && urlPath === '/api/v1/users') {
    res.writeHead(201);
    res.end(JSON.stringify({
      id: 1,
      name: 'Aisha Khan',
      email: 'aisha@example.com',
      phone: '03001234567',
      role: 'user',
      membershipStatus: 'active'
    }));
    return;
  }

  // @endpoint GET /api/v1/users/:id
  if (method === 'GET' && /^\/api\/v1\/users\/\d+$/.test(urlPath)) {
    res.writeHead(200);
    res.end(JSON.stringify({
      id: 1,
      name: 'Aisha Khan',
      email: 'aisha@example.com',
      phone: '03001234567',
      role: 'user',
      membershipStatus: 'active'
    }));
    return;
  }

  // @endpoint PATCH /api/v1/users/:id
  if (method === 'PATCH' && /^\/api\/v1\/users\/\d+$/.test(urlPath)) {
    res.writeHead(200);
    res.end(JSON.stringify({
      id: 1,
      name: 'Aisha Khan',
      email: 'aisha@example.com',
      phone: '03001234567',
      role: 'user',
      membershipStatus: 'active'
    }));
    return;
  }

  // @endpoint DELETE /api/v1/users/:id
  if (method === 'DELETE' && /^\/api\/v1\/users\/\d+$/.test(urlPath)) {
    res.writeHead(204);
    res.end();
    return;
  }

  // ─── BORROW REQUESTS ─────────────────────────────────────────────────────

  // @endpoint GET /api/v1/borrow-requests
  if (method === 'GET' && urlPath === '/api/v1/borrow-requests') {
    res.writeHead(200);
    res.end(JSON.stringify({
      data: [
        { id: 9, userId: 1, bookId: 12, status: 'pending', requestedAt: '2026-09-07T10:00:00Z' },
        { id: 10, userId: 2, bookId: 13, status: 'approved', requestedAt: '2026-09-06T09:30:00Z' }
      ]
    }));
    return;
  }

  // @endpoint POST /api/v1/borrow-requests
  if (method === 'POST' && urlPath === '/api/v1/borrow-requests') {
    res.writeHead(201);
    res.end(JSON.stringify({
      id: 9,
      userId: 1,
      bookId: 12,
      status: 'pending',
      requestedAt: '2026-09-07T10:00:00Z'
    }));
    return;
  }

  // @endpoint GET /api/v1/borrow-requests/:id
  if (method === 'GET' && /^\/api\/v1\/borrow-requests\/\d+$/.test(urlPath)) {
    res.writeHead(200);
    res.end(JSON.stringify({
      id: 9,
      userId: 1,
      bookId: 12,
      status: 'pending',
      requestedAt: '2026-09-07T10:00:00Z'
    }));
    return;
  }

  // @endpoint PATCH /api/v1/borrow-requests/:id
  if (method === 'PATCH' && /^\/api\/v1\/borrow-requests\/\d+$/.test(urlPath)) {
    res.writeHead(200);
    res.end(JSON.stringify({
      id: 9,
      userId: 1,
      bookId: 12,
      status: 'approved',
      requestedAt: '2026-09-07T10:00:00Z'
    }));
    return;
  }

  // @endpoint POST /api/v1/borrow-requests/:id/return
  if (method === 'POST' && /^\/api\/v1\/borrow-requests\/\d+\/return$/.test(urlPath)) {
    res.writeHead(200);
    res.end(JSON.stringify({
      id: 9,
      userId: 1,
      bookId: 12,
      status: 'returned',
      requestedAt: '2026-09-07T10:00:00Z'
    }));
    return;
  }

  // ─── FALLBACK ────────────────────────────────────────────────────────────
  res.writeHead(404);
  res.end(JSON.stringify({ error: 'Mock route not defined', method, url }));
});

server.listen(PORT, () => console.log('Karachi Central Library Mock Server running on port ' + PORT));
