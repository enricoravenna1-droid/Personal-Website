// Tiles a set of frames into one PNG with headless Chrome.
// Usage: node scripts/contact_sheet.mjs <out.png> <cols> <tileWidth> <frame>...
import { writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { resolve, basename } from "node:path";
const [out, cols, tw, ...files] = process.argv.slice(2);
const html = `<html><body style="margin:0;background:#111;display:grid;grid-template-columns:repeat(${cols},${tw}px);gap:6px;padding:6px;font:11px -apple-system,sans-serif;color:#bbb">${files
  .map((f) => `<div><img src="file://${resolve(f)}" style="width:${tw}px;display:block"><div>${basename(f)}</div></div>`).join("")}</body></html>`;
const tmp = resolve(out + ".html");
writeFileSync(tmp, html);
execFileSync("node", ["-e", `
const {spawnSync}=require('child_process');
`]);
const rows = Math.ceil(files.length / cols);
// Height is a guess from the first tile's aspect; generous on purpose, then trimmed by --screenshot window.
const h = Number(process.env.SHEET_H || rows * (Number(tw) * 0.75 + 24) + 12);
execFileSync("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", [
  "--headless=new", `--screenshot=${resolve(out)}`, `--window-size=${Number(cols) * (Number(tw) + 6) + 6},${Math.ceil(h)}`,
  "--hide-scrollbars", "--allow-file-access-from-files", "--default-background-color=111111ff", `file://${tmp}`,
], { stdio: "ignore" });
console.log(out);
