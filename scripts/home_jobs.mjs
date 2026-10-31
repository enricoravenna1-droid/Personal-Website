// Builds a jobs file for shoot_frames.mjs that walks the home film.
// Usage: node scripts/home_jobs.mjs <outDir> > jobs.json
const out = process.argv[2];
const url = "http://localhost:3001/";
const at = (sel, P) => `(()=>{const vh=innerHeight;const el=document.querySelector('${sel}');const top=el.getBoundingClientRect().top+scrollY;const span=el.offsetHeight-vh;scrollTo({top:top+span*${P},behavior:'instant'});return scrollY})()`;
const y = (f) => `(()=>{scrollTo({top:innerHeight*${f},behavior:'instant'});return scrollY})()`;
const el = (sel, off=0) => `(()=>{const r=document.querySelector('${sel}').getBoundingClientRect();scrollTo({top:r.top+scrollY+${off},behavior:'instant'});return scrollY})()`;
const frames = (pfx) => [
  { out: `${out}/${pfx}-hero-0.png`, eval: y(0), waitMs: 2400 },
  { out: `${out}/${pfx}-hero-05.png`, eval: y(0.5), waitMs: 250 },
  { out: `${out}/${pfx}-ch-0.02.png`, eval: at('#chapters', 0.02), waitMs: 500 },
  { out: `${out}/${pfx}-ch-0.21.png`, eval: at('#chapters', 0.21), waitMs: 250 },
  { out: `${out}/${pfx}-ch-0.235.png`, eval: at('#chapters', 0.235), waitMs: 250 },
  { out: `${out}/${pfx}-ch-0.30.png`, eval: at('#chapters', 0.30), waitMs: 250 },
  { out: `${out}/${pfx}-ch-0.37.png`, eval: at('#chapters', 0.37), waitMs: 250 },
  { out: `${out}/${pfx}-ch-0.62.png`, eval: at('#chapters', 0.62), waitMs: 250 },
  { out: `${out}/${pfx}-ch-0.87.png`, eval: at('#chapters', 0.87), waitMs: 250 },
  { out: `${out}/${pfx}-ch-1.00.png`, eval: at('#chapters', 1.0), waitMs: 250 },
  { out: `${out}/${pfx}-va-0.00.png`, eval: at('#values', 0.0), waitMs: 400 },
  { out: `${out}/${pfx}-va-0.25.png`, eval: at('#values', 0.25), waitMs: 250 },
  { out: `${out}/${pfx}-va-0.50.png`, eval: at('#values', 0.5), waitMs: 250 },
  { out: `${out}/${pfx}-va-1.00.png`, eval: at('#values', 1.0), waitMs: 250 },
  { out: `${out}/${pfx}-vision.png`, eval: el('#vision', -40), waitMs: 1200 },
  { out: `${out}/${pfx}-contact.png`, eval: el('#contact', -40), waitMs: 1200 },
];
const jobs = { gl: "default", shots: [
  { url, out: `${out}/d.png`, w: 1440, h: 900, waitMs: 1800, frames: frames("d") },
  { url, out: `${out}/m.png`, w: 390, h: 844, mobile: true, dpr: 2, waitMs: 1800, frames: frames("m") },
]};
console.log(JSON.stringify(jobs));
