const statusEl = document.getElementById("status");
const logEl = document.getElementById("log");

const log = (text) => {
  const li = document.createElement("li");
  li.textContent = text;
  logEl.append(li);
};

const socket = io();

socket.on("connect", () => {
  statusEl.textContent = `connected (${socket.id})`;
  socket.emit("client:hello", { text: "Hello from the browser" });
  log("sent: Hello from the browser");
});

socket.on("server:hello", (message) => {
  log(`received: ${message.text}`);
});

socket.on("disconnect", () => {
  statusEl.textContent = "disconnected";
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
