const BOOK_ID = "bk-1";
const API = "/api/v1";
const OPEN = ["pending", "queued", "held", "approved"];

const $ = (id) => document.getElementById(id);

let me = JSON.parse(sessionStorage.getItem("demoUser") || "null");
let myRequestId = null;

const socket = io({
  autoConnect: false,
  auth: (send) => send({ token: sessionStorage.getItem("token") }),
});

const api = async (method, path, body) => {
  const response = await fetch(`${API}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${sessionStorage.getItem("token")}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || response.statusText);
  }
  return data;
};

const number = (id) => Number(id.replace(/\D/g, ""));

const show = (id, visible) => {
  $(id).hidden = !visible;
};

const renderMember = async () => {
  const { data } = await api(
    "GET",
    `/borrow-requests?userId=${me.id}&bookId=${BOOK_ID}`,
  );
  const open = data
    .filter((request) => OPEN.includes(request.status))
    .sort((a, b) => number(b.id) - number(a.id))[0];
  myRequestId = open ? open.id : null;

  show("banner", false);
  show("join", !open);
  show("leave", open && ["pending", "queued", "held"].includes(open.status));

  if (!open) {
    $("my-status").textContent = "You are not in the queue.";
    return;
  }
  if (open.status === "queued") {
    const { data: queue } = await api("GET", `/borrow-requests/${open.id}/queue`);
    $("my-status").textContent = `You are #${queue.position} in the queue.`;
    return;
  }
  if (open.status === "held") {
    $("banner").textContent = `A copy of ${open.bookTitle} is held for you until ${open.holdUntil}. Collect it from the desk.`;
    show("banner", true);
    $("my-status").textContent = "It's your turn.";
    return;
  }
  if (open.status === "approved") {
    $("my-status").textContent = `You have it. Due back on ${open.dueDate}.`;
    return;
  }
  $("my-status").textContent = "Waiting for a librarian.";
};

const renderLibrarian = async () => {
  const [loans, queued, held] = await Promise.all(
    ["approved", "queued", "held"].map((status) =>
      api("GET", `/borrow-requests?bookId=${BOOK_ID}&status=${status}`),
    ),
  );

  $("loans").replaceChildren(
    ...loans.data.map((loan) => {
      const li = document.createElement("li");
      li.textContent = `${loan.id} ${loan.memberName}, due ${loan.dueDate} `;
      const button = document.createElement("button");
      button.textContent = "Return";
      button.dataset.returnId = loan.id;
      button.addEventListener("click", async () => {
        button.disabled = true;
        await api("POST", `/borrow-requests/${loan.id}/return`);
        await renderLibrarian();
      });
      li.append(button);
      return li;
    }),
  );

  $("queue").replaceChildren(
    ...queued.data
      .sort((a, b) => number(a.id) - number(b.id))
      .map((request) => {
        const li = document.createElement("li");
        li.textContent = `${request.memberName} (${request.id})`;
        return li;
      }),
  );

  $("desk").replaceChildren(
    ...held.data.map((request) => {
      const li = document.createElement("li");
      li.textContent = `Held for ${request.memberName} until ${request.holdUntil}`;
      return li;
    }),
  );
};

const renderNow = async () => {
  if (!me) return;
  try {
    if (me.role === "user") {
      await renderMember();
    } else {
      await renderLibrarian();
    }
  } catch (err) {
    $("my-status").textContent = `Could not load: ${err.message}`;
  }
};

let rendering = Promise.resolve();
const render = () => {
  rendering = rendering.then(renderNow);
  return rendering;
};

const showLoggedIn = () => {
  show("login", !me);
  show("who", Boolean(me));
  show("member", me && me.role === "user");
  show("librarian", me && me.role !== "user");
  if (me) {
    $("name").textContent = me.name;
    $("role").textContent = me.role;
  }
};

$("login").addEventListener("submit", async (event) => {
  event.preventDefault();
  $("login-error").textContent = "";
  try {
    const data = await (
      await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: $("email").value,
          password: $("password").value,
        }),
      })
    ).json();
    if (!data.accessToken) {
      throw new Error(data.message || "Login failed");
    }
    sessionStorage.setItem("token", data.accessToken);
    me = data.user;
    sessionStorage.setItem("demoUser", JSON.stringify(me));
    showLoggedIn();
    socket.connect();
  } catch (err) {
    $("login-error").textContent = err.message;
  }
});

$("logout").addEventListener("click", () => {
  sessionStorage.clear();
  me = null;
  socket.disconnect();
  showLoggedIn();
});

$("join").addEventListener("click", async () => {
  $("join").disabled = true;
  try {
    await api("POST", "/borrow-requests", { bookId: BOOK_ID });
  } finally {
    $("join").disabled = false;
  }
  await render();
});

$("leave").addEventListener("click", async () => {
  if (!myRequestId) return;
  await api("POST", `/borrow-requests/${myRequestId}/cancel`);
  await render();
});

socket.on("connect", () => {
  $("live").textContent = "connected";
  render();
});
socket.on("disconnect", () => {
  $("live").textContent = "disconnected";
});
socket.on("connect_error", (err) => {
  $("live").textContent = `error: ${err.message}`;
});
socket.on("server:queue:position-changed", () => render());
socket.on("server:queue:promoted", () => render());
socket.on("server:book:availability-changed", () => render());
socket.on("server:session:expired", async () => {
  const response = await fetch(`${API}/auth/refresh`, { method: "POST" });
  if (!response.ok) {
    $("live").textContent = "session expired, log in again";
    return;
  }
  const body = await response.json();
  sessionStorage.setItem("token", body.accessToken);
  socket.connect();
});

showLoggedIn();
if (me) {
  socket.connect();
}
