// Builds a jobs file for shoot_frames.mjs that walks the round-three site:
// the home film (via window.__home.seek), the four One Frame pages, the nav
// dropdowns (real hover and real keys), and the reduced-motion pages.
// Usage: node scripts/page_jobs.mjs <outDir> [base] > jobs.json
const out = process.argv[2];
const base = process.argv[3] ?? "http://localhost:3001";

// Scroll a pinned runway to p and pin its progress there.
const pin = (sel, name, P) => `(()=>{window.__home?.release();const vh=innerHeight;const el=document.querySelector('${sel}');const top=el.getBoundingClientRect().top+scrollY;scrollTo({top:top+(el.offsetHeight-vh)*${P},behavior:'instant'});window.__home?.seek('${name}',${P});return scrollY})()`;
const y = (f) => `(()=>{window.__home?.release();scrollTo({top:innerHeight*${f},behavior:'instant'});return scrollY})()`;
const el = (sel, off = 0) => `(()=>{window.__home?.release();const r=document.querySelector('${sel}').getBoundingClientRect();scrollTo({top:r.top+scrollY+${off},behavior:'instant'});return scrollY})()`;
// One Frame pages scroll themselves on a seek.
const seek = (name, P) => `(()=>{window.__home.release();window.__home.seek('${name}',${P});return new Promise(r=>setTimeout(()=>{window.__home.release();r(scrollY)},120))})()`;
const center = (sel, i) => `(()=>{const r=document.querySelectorAll('${sel}')[${i}].getBoundingClientRect();return [r.x+r.width/2,r.y+r.height/2]})()`;
const pad = (p) => p.toFixed(3).replace(/^0\./, "");

const home = (pfx) => [
  { out: `${out}/${pfx}-home-hero.png`, eval: y(0), waitMs: 2400 },
  ...[0.02, 0.17, 0.22, 0.25, 0.42, 0.47, 0.5, 0.72, 0.97, 1.0].map((P) => ({ out: `${out}/${pfx}-home-ch-${pad(P)}.png`, eval: pin("#chapters", "chapters", P), waitMs: 350 })),
  ...[0.0, 0.5, 1.0].map((P) => ({ out: `${out}/${pfx}-home-va-${pad(P)}.png`, eval: pin("#values", "values", P), waitMs: 350 })),
  { out: `${out}/${pfx}-home-vision.png`, eval: el("#vision", -40), waitMs: 1000 },
];
const page = (pfx, name, n) =>
  Array.from({ length: n }, (_, i) => i / (n - 1)).map((P) => ({
    out: `${out}/${pfx}-${name}-${pad(P)}.png`, eval: seek(name, P), waitMs: 450,
  }));

const desk = (path, frames) => ({ url: base + path, out: `${out}/d.png`, w: 1440, h: 900, waitMs: 2200, frames });
const phone = (path, frames) => ({ url: base + path, out: `${out}/m.png`, w: 390, h: 844, mobile: true, dpr: 2, waitMs: 2200, frames });

const shots = [
  desk("/", home("d")),
  phone("/", home("m")),
  ...[["story", 22], ["voices", 26], ["work", 16], ["vision", 14]].flatMap(([name, n]) => [
    desk(`/${name}`, page("d", name, n)),
    phone(`/${name}`, page("m", name, Math.round(n * 1.3))),
  ]),
  // Nav: real hover on Story and Work, real keys on Voices, and a tap through the phone sheet.
  desk("/story", [
    { out: `${out}/d-nav-hover-story.png`, eval: y(0), waitMs: 300, mouseExpr: center(".snav-label", 0) },
    { out: `${out}/d-nav-hover-work.png`, mouseExpr: center(".snav-label", 2) },
    { out: `${out}/d-nav-keys-voices.png`, mouse: [700, 600], eval: "(()=>{document.querySelectorAll('.snav-chev')[1].focus();return document.activeElement.className})()", log: true, keys: ["ArrowDown", "ArrowDown"] },
    { out: `${out}/d-nav-keys-escape.png`, keys: ["Escape"], eval: "document.activeElement.className", log: true },
  ]),
  phone("/voices", [
    { out: `${out}/m-nav-sheet.png`, eval: y(0), waitMs: 300, mouseExpr: center(".snav-burger", 0), click: true },
    { out: `${out}/m-nav-sheet-story.png`, mouseExpr: center(".snav-sg-chev", 0), click: true },
  ]),
  { ...desk("/story", [0, 1.2, 3].map((f) => ({ out: `${out}/r-story-${f}.png`, eval: y(f), waitMs: 600 }))), reducedMotion: true },
  { url: base + "/story", out: `${out}/r-story-full.png`, w: 1440, h: 900, waitMs: 2500, reducedMotion: true, full: true },
  { url: base + "/voices", out: `${out}/r-voices-full.png`, w: 1440, h: 900, waitMs: 2500, reducedMotion: true, full: true },
];
console.log(JSON.stringify({ gl: "default", shots }));
