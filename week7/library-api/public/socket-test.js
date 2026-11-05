const statusEl = document.getElementById("status");
const logEl = document.getElementById("log");
const onlineEl = document.getElementById("online");

const log = (text) => {
  const li = document.createElement("li");
  li.textContent = text;
  logEl.append(li);
};

// the token is sent with every (re)connect
const socket = io({
  auth: (send) => send({ token: sessionStorage.getItem("token") }),
});

document.getElementById("login").addEventListener("submit", async (event) => {
  event.preventDefault();
  const response = await fetch("/api/v1/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: document.getElementById("email").value,
      password: document.getElementById("password").value,
    }),
  });
  const body = await response.json();
  if (!response.ok) {
    log(`login failed: ${body.message}`);
    return;
  }
  sessionStorage.setItem("token", body.accessToken);
  log(`logged in as ${body.user.id}`);
  // reconnect so the new token goes in the handshake
  socket.disconnect().connect();
});

socket.on("connect", () => {
  statusEl.textContent = `connected (${socket.id})`;
  socket.emit("client:hello", { text: "Hello from the browser" });
  log("sent: Hello from the browser");
});

// refused by the server's io.use (no token, expired, logged out...)
socket.on("connect_error", (err) => {
  statusEl.textContent = "rejected";
  log(`connection rejected: ${err.message}`);
});

socket.on("server:hello", (message) => {
  log(`received: ${message.text}`);
});

socket.on("disconnect", (reason) => {
  statusEl.textContent = "disconnected";
  // the old number can't be trusted while we're not connected
  onlineEl.textContent = "unknown";
  log(`disconnected: ${reason}`);
});

socket.on("server:presence:changed", ({ members, sockets }) => {
  onlineEl.textContent = `${members} members (${sockets} sockets)`;
});

socket.io.on("reconnect_attempt", (attempt) => {
  log(`reconnecting, attempt ${attempt}`);
});

socket.io.on("reconnect", () => {
  log("reconnected");
});

const ACK_TIMEOUT_MS = 3000;

const logAck = (err, response) => {
  if (err) {
    log(`no answer after ${ACK_TIMEOUT_MS / 1000}s`);
  } else {
    log(`ack: ${JSON.stringify(response)}`);
  }
};

document.getElementById("form").addEventListener("submit", (event) => {
  event.preventDefault();
  const text = document.getElementById("text").value;
  socket.timeout(ACK_TIMEOUT_MS).emit("client:hello", { text }, logAck);
  log(`sent: ${text}`);
});

document.getElementById("no-answer").addEventListener("click", () => {
  socket
    .timeout(ACK_TIMEOUT_MS)
    .emit("client:nobody-answers", { text: "anyone?" }, logAck);
  log("sent: client:nobody-answers");
});

document.querySelectorAll(".demo").forEach((button) => {
  button.addEventListener("click", () => {
    socket.emit("client:demo:send", { mode: button.dataset.mode });
  });
});

socket.on("server:demo:message", ({ mode, from }) => {
  log(`got "${mode}" message from ${from === socket.id ? "me" : from}`);
});

socket.on("server:book:availability-changed", (event) => {
  log(`availability: ${JSON.stringify(event)}`);
});

// the page pretends to be a book page: socket-test.html?book=bk-1
let watchedBook = new URLSearchParams(location.search).get("book");
const watchingEl = document.getElementById("watching");

const watch = (bookId) => {
  socket.timeout(3000).emit("client:book:watch", { bookId }, (err, res) => {
    if (err || !res.ok) {
      log(`could not watch ${bookId}`);
      return;
    }
    watchingEl.textContent = bookId;
  });
};

// on every connect, including reconnects, the server has forgotten our rooms
socket.on("connect", () => {
  if (watchedBook) watch(watchedBook);
});

document.getElementById("watch").addEventListener("click", () => {
  const bookId = document.getElementById("book-id").value.trim();
  if (!bookId) return;
  if (watchedBook) socket.emit("client:book:unwatch", { bookId: watchedBook });
  watchedBook = bookId;
  watch(bookId);
});

socket.on("server:borrow-request:created", (request) => {
  log(`new borrow request: ${JSON.stringify(request)}`);
});

document.querySelectorAll(".decide").forEach((button) => {
  button.addEventListener("click", () => {
    const id = document.getElementById("request-id").value.trim();
    socket
      .timeout(ACK_TIMEOUT_MS)
      .emit("client:borrow-request:decide", { id, status: button.dataset.status }, logAck);
  });
});

// the server disconnects us when the token runs out; Socket.IO doesn't
// reconnect after a server disconnect, so get a new token and reconnect
socket.on("server:session:expired", async () => {
  log("session expired, refreshing the token");
  const response = await fetch("/api/v1/auth/refresh", { method: "POST" });
  if (!response.ok) {
    log("refresh failed, log in again");
    return;
  }
  const body = await response.json();
  sessionStorage.setItem("token", body.accessToken);
  socket.connect();
});
