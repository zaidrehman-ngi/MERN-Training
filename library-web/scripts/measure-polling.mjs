// Usage: node scripts/measure-polling.mjs [minutes] [pageUrl]
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const minutes = Number(process.argv[2] ?? 5);
const pageUrl = process.argv[3] ?? "http://localhost:5173/books";
const chromePath = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const port = 9333;

const profile = mkdtempSync(join(tmpdir(), "poll-test-"));
const chrome = spawn(chromePath, [
  "--headless=new",
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${profile}`,
  "about:blank",
]);

let target;
for (let i = 0; i < 50 && !target; i += 1) {
  await new Promise((r) => setTimeout(r, 200));
  try {
    const list = await (
      await fetch(`http://localhost:${port}/json/list`)
    ).json();
    target = list.find((t) => t.type === "page");
  } catch {}
}

const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener("open", r));

let nextId = 1;
const pending = new Map();
const send = (method, params = {}) =>
  new Promise((resolve) => {
    const id = nextId++;
    pending.set(id, resolve);
    ws.send(JSON.stringify({ id, method, params }));
  });

const requests = new Map();
const results = [];
let lastHash = null;

ws.addEventListener("message", async (event) => {
  const msg = JSON.parse(event.data);
  if (msg.id && pending.has(msg.id)) {
    pending.get(msg.id)(msg.result);
    pending.delete(msg.id);
    return;
  }
  const p = msg.params;
  if (msg.method === "Network.requestWillBeSent") {
    const { url, method } = p.request;
    if (method === "GET" && /\/api\/v1\/books(\?|$)/.test(url)) {
      requests.set(p.requestId, {});
    }
  } else if (
    msg.method === "Network.responseReceived" &&
    requests.has(p.requestId)
  ) {
    requests.get(p.requestId).status = p.response.status;
  } else if (
    msg.method === "Network.loadingFinished" &&
    requests.has(p.requestId)
  ) {
    const req = requests.get(p.requestId);
    let changed = false;
    if (req.status === 200) {
      const { body } = await send("Network.getResponseBody", {
        requestId: p.requestId,
      });
      const hash = createHash("sha256").update(body).digest("hex");
      changed = hash !== lastHash;
      lastHash = hash;
    }
    // headers + body
    results.push({ status: req.status, bytes: p.encodedDataLength, changed });
    requests.delete(p.requestId);
  }
});

await send("Network.enable");
await send("Page.enable");
await send("Page.navigate", { url: pageUrl });
console.log(`Watching ${pageUrl} for ${minutes} minute(s)...`);
await new Promise((r) => setTimeout(r, minutes * 60 * 1000));

ws.close();
chrome.kill();
setTimeout(() => rmSync(profile, { recursive: true, force: true }), 1000);

const total = results.length;
const changed = results.filter((r) => r.changed);
const totalBytes = results.reduce((sum, r) => sum + r.bytes, 0);
const wastedBytes = results
  .filter((r) => !r.changed)
  .reduce((sum, r) => sum + r.bytes, 0);
const byStatus = {};
for (const r of results) byStatus[r.status] = (byStatus[r.status] ?? 0) + 1;

console.log(`Catalogue requests made:            ${total}`);
console.log(`By status:                          ${JSON.stringify(byStatus)}`);
console.log(
  `Returned data that had changed:     ${changed.length} (the first load counts as a change)`,
);
console.log(`Bytes transferred in total:         ${totalBytes}`);
console.log(`Bytes transferred for nothing:      ${wastedBytes}`);
