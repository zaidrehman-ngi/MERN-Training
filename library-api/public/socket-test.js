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
