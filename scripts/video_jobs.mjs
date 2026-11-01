// Builds a jobs file for shoot_frames.mjs that renders a 60 fps scroll
// video of each named page. The scroll path is computed in the page: wheel
// notches every 8 frames in bursts, followed by an exponential glide the
// way Lenis follows the wheel, with short pauses so the soft stops show.
// Each frame is one window.__home.frame(y) call: a fixed 1/60 s step.
// Usage: node scripts/video_jobs.mjs <outDir> <page>... > jobs.json
// Then: ffmpeg -framerate 60 -i <outDir>/<page>/%06d.jpg -c:v libx264 -pix_fmt yuv420p -crf 18 out.mp4
const [out, ...pages] = process.argv.slice(2);
const base = "http://localhost:3001";
const ysExpr = `(()=>{
  const el=document.querySelector('.of')||document.body;
  const end=Math.min(document.documentElement.scrollHeight-innerHeight, el.getBoundingClientRect().top+scrollY+el.offsetHeight-innerHeight);
  const ys=[];let pos=0,target=0,f=0;
  while(pos<end-1&&ys.length<4000){
    const cyc=f%170; // 2.2 s of wheeling, 0.6 s of rest
    if(cyc<132&&cyc%8===0)target=Math.min(end,target+90);
    pos+=(target-pos)*(1-Math.exp(-(1/60)/0.16));
    ys.push(Math.round(pos*100)/100);f++;
  }
  for(let i=0;i<40;i++)ys.push(end);
  return ys;})()`;
const shots = pages.map((p) => ({
  url: `${base}/${p}`, w: 1440, h: 900, waitMs: 3000,
  evalBeforeLoad: "",
  video: { dir: `${out}/${p}`, ysExpr },
}));
console.log(JSON.stringify({ gl: "default", shots }));
