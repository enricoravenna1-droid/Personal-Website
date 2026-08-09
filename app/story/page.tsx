import type { Metadata } from "next";
import Image from "next/image";
import { PageNav } from "@/components/page-nav";
import { CHAPTERS, INTERLUDE } from "@/lib/content";

export const metadata: Metadata = {
  title: "The Story",
  description:
    "Soldier, builder, leader. Born in Israel, IDF veteran, then a career built across an entire region, a single generation on campus, and now a whole state.",
};

export default function StoryPage() {
  return (
    <>
      <header className="page-head">
        <div className="container">
          <p className="label reveal">The Story</p>
          <h1 className="reveal d1">
            Three chapters.
            <br />
            <em>One through-line.</em>
          </h1>
        </div>
      </header>

      <section id="journey" className="section-rise">
        <div className="container">
          <div className="journey-body">
            <div className="journey-track" aria-hidden="true">
              <div id="journey-fill" />
            </div>

            <div className="journey-chapters">
              {CHAPTERS.map((ch, i) => (
                <div key={ch.id}>
                  <article
                    className={`journey-chapter ch-${i + 1}`}
                    aria-labelledby={`${ch.id}-h`}
                  >
                    <div className="ch-dot" aria-hidden="true" />
                    <p className="ch-label">{ch.label}</p>

                    <div className="ch-grid">
                      <div className="ch-photo-col">
                        <div className="ch-photo-wrap" data-tilt data-tilt-max="6">
                          <Image
                            src={ch.photo}
                            alt={ch.alt}
                            className="ch-photo"
                            width={480}
                            height={580}
                            sizes="(max-width: 800px) 90vw, 400px"
                          />
                        </div>
                      </div>
                      <div className="ch-text-col">
                        <div className="ch-text">
                          <h2 className="ch-headline" id={`${ch.id}-h`}>
                            {ch.headline} <em>{ch.headlineAccent}</em>
                          </h2>
                          <div className="ch-body">
                            {ch.body.map((p, j) => (
                              <p key={j}>{p}</p>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </article>

                  {/* The interlude sits between chapters one and two because
                      it is the reason chapter two happened at all. */}
                  {i === 0 ? (
                    <aside className="ch-interlude" id="ch-interlude">
                      <p className="interlude-kicker">{INTERLUDE.kicker}</p>
                      <blockquote className="interlude-pull">
                        {INTERLUDE.pull}
                      </blockquote>
                      <p className="interlude-body">{INTERLUDE.body}</p>
                    </aside>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <PageNav current="/story" />
    </>
  );
}
