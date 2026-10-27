const socket = io();
socket.emit("client:book:watch", { bookId: "bk-1" });
socket.onAny((event, data) => {
  document.getElementById("log").textContent += `${event} ${JSON.stringify(data)}\n`;
});
socket.on("connect_error", (err) => {
  document.getElementById("log").textContent += `rejected: ${err.message} ${JSON.stringify(err.data)}\n`;
});
