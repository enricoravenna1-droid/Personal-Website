// Headless Chrome screenshot runner over raw CDP, no puppeteer (Node 24 has
// a global WebSocket). Built to check The Playbook frame by frame: the
// in-app preview pane throttles requestAnimationFrame and cannot judge an
// animation, so each frame is rendered on demand with
// window.__ajPlaybook.seek(t) and captured here at a real viewport size.
//
// Usage: node scripts/shoot_frames.mjs jobs.json
// jobs.json: { "gl": "swiftshader"|"default", "shots": [ { url, out, w, h, mobile, dpr, waitMs, eval, evalAfterLoad, clip:[x,y,w,h], scroll } ] }
import { spawn } from "node:child_process";
import { readFileSync, writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const jobs = JSON.parse(readFileSync(process.argv[2], "utf8"));
const port = 9300 + Math.floor(Math.random() * 500);
const profile = mkdtempSync(join(tmpdir(), "shoot-"));
const args = [
  "--headless=new",
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${profile}`,
  "--hide-scrollbars",
  "--mute-audio",
  "--no-first-run",
  "--no-default-browser-check",
  "--autoplay-policy=no-user-gesture-required",
  "--window-size=1440,900",
];
if (jobs.gl === "swiftshader") args.push("--use-angle=swiftshader", "--enable-unsafe-swiftshader");
const chrome = spawn("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", args, { stdio: "ignore" });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let ver;
for (let i = 0; i < 60; i++) {
  try { ver = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json(); break; } catch { await sleep(150); }
}
if (!ver) { console.error("chrome did not start"); process.exit(1); }

const ws = new WebSocket(ver.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener("open", r, { once: true }));
let id = 0;
const pending = new Map();
const listeners = [];
ws.addEventListener("message", (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { const { res, rej } = pending.get(m.id); pending.delete(m.id); m.error ? rej(new Error(JSON.stringify(m.error))) : res(m.result); }
  else for (const l of listeners) l(m);
});
const send = (method, params = {}, sessionId) => new Promise((res, rej) => { const i = ++id; pending.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params, sessionId })); });

const results = [];
for (const s of jobs.shots) {
  const { targetId } = await send("Target.createTarget", { url: "about:blank" });
  const { sessionId } = await send("Target.attachToTarget", { targetId, flatten: true });
  const S = (m, p) => send(m, p, sessionId);
  await S("Page.enable"); await S("Runtime.enable");
  const logs = [];
  listeners.push((m) => {
    if (m.sessionId !== sessionId) return;
    if (m.method === "Runtime.consoleAPICalled") logs.push(`${m.params.type}: ${m.params.args.map((a) => a.value ?? a.description).join(" ")}`);
    if (m.method === "Runtime.exceptionThrown") logs.push(`EXC: ${m.params.exceptionDetails.exception?.description ?? m.params.exceptionDetails.text}`);
  });
  const w = s.w ?? 1440, h = s.h ?? 900;
  await S("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: s.dpr ?? 1, mobile: !!s.mobile });
  if (s.mobile) await S("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
  if (s.reducedMotion) await S("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
  if (s.evalBeforeLoad) await S("Page.addScriptToEvaluateOnNewDocument", { source: s.evalBeforeLoad });
  const loaded = new Promise((r) => listeners.push((m) => m.sessionId === sessionId && m.method === "Page.loadEventFired" && r()));
  await S("Page.navigate", { url: s.url });
  await Promise.race([loaded, sleep(20000)]);
  await sleep(s.waitMs ?? 1500);
  let evalResult;
  if (s.eval) {
    const r = await S("Runtime.evaluate", { expression: s.eval, awaitPromise: true, returnByValue: true });
    evalResult = r.result?.value ?? r.exceptionDetails?.exception?.description;
    await sleep(s.waitAfterEvalMs ?? 300);
  }
  const frames = s.frames ?? [{ out: s.out, eval: null }];
  const outs = [];
  for (const f of frames) {
    if (f.eval) { const r = await S("Runtime.evaluate", { expression: f.eval, awaitPromise: true, returnByValue: true }); if (r.exceptionDetails) logs.push("frame eval EXC " + (r.exceptionDetails.exception?.description ?? "")); await sleep(f.waitMs ?? 120); }
    const p = { format: "png", captureBeyondViewport: false };
    if (f.clip ?? s.clip) { const [x, y, cw, ch] = f.clip ?? s.clip; p.clip = { x, y, width: cw, height: ch, scale: 1 }; }
    const shot = await S("Page.captureScreenshot", p);
    writeFileSync(f.out, Buffer.from(shot.data, "base64"));
    outs.push(f.out);
  }
  results.push({ url: s.url, outs, evalResult, logs: logs.slice(0, 30) });
  await send("Target.closeTarget", { targetId });
}
console.log(JSON.stringify(results, null, 1));
ws.close();
chrome.kill();
