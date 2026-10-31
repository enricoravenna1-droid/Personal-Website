import { FILM, SITE } from "@/lib/content";

/** The through-line and the ask. Static: by here the film has earned a plain page. */
export function Vision() {
  const { vision, contact } = FILM;
  return (
    <>
      <section id="vision" className="hs hs-vision" aria-label="Vision">
        <div className="hs-wrap">
          <p className="hs-kicker reveal">{vision.kicker}</p>
          <h2 className="hs-statement reveal d1">{vision.statement}</h2>
          <div className="hs-beats">
            {vision.beats.map((b, i) => (
              <div key={b.title} className={`hs-beat reveal d${i + 1}`}>
                <h3>{b.title}</h3>
                <p>{b.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="contact" className="hs hs-contact" aria-label="Contact">
        <div className="hs-wrap">
          <p className="hs-kicker reveal">{contact.kicker}</p>
          <h2 className="hs-ask reveal d1">{contact.headline}</h2>
          <p className="hs-sub reveal d2">{contact.sub}</p>
          <div className="hs-links reveal d3">
            <a href={`mailto:${SITE.email}`} className="hh-btn hh-btn-p">Email me</a>
            <a href={SITE.linkedin} target="_blank" rel="noopener noreferrer" className="hh-btn hh-btn-s">LinkedIn</a>
          </div>
        </div>
      </section>
    </>
  );
}
