import type { Metadata } from "next";
import Image from "next/image";
import { PageNav } from "@/components/page-nav";
import { AreaIcon } from "@/components/area-icon";
import { CountUp } from "@/components/count-up";
import { AREAS, INITIATIVES, NUMBERS, TICKER } from "@/lib/content";

export const metadata: Metadata = {
  title: "The Work",
  description:
    "Active initiatives, the areas Enrico Omri Ravenna works in, and the numbers behind a Federation turnaround: 700+ engagements, 18 programs, four security partnerships.",
};

export default function WorkPage() {
  return (
    <>
      <header className="page-head">
        <div className="container">
          <p className="label reveal">The Work</p>
          <h1 className="reveal d1">
            <em>In motion.</em>
          </h1>
          <p className="page-sub reveal d2">
            What is running right now, what I am relied on for, and the numbers
            underneath it.
          </p>
        </div>
      </header>

      {INITIATIVES.map((item) => (
        <section
          key={item.id}
          id={item.id}
          className="section-rise"
          data-accent={item.accent}
        >
          <div className="container">
            <div className="spotlight-grid">
              <div className="reveal">
                <span className="spotlight-kicker">{item.kicker}</span>
                <h2 className="spotlight-h">
                  {item.headline} <em>{item.headlineAccent}</em>
                </h2>
                <p className="spotlight-body">{item.body}</p>
                {item.cta ? (
                  <a
                    href={item.cta.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary"
                  >
                    {item.cta.label}
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
                      />
                    </svg>
                  </a>
                ) : null}
              </div>
              <div className="spotlight-img-panel reveal d2" data-fit={item.fit}>
                <Image
                  src={item.photo}
                  alt={item.alt}
                  className="spotlight-img"
                  width={1200}
                  height={900}
                  sizes="(max-width: 700px) 92vw, 44vw"
                />
              </div>
            </div>
          </div>
        </section>
      ))}

      <section id="areas" className="section-rise">
        <div className="container">
          <p className="label reveal">Areas I Work In</p>
          <h2 className="reveal d1">
            Where I <em>add value.</em>
          </h2>
          <div className="areas-grid">
            {AREAS.map((a, i) => (
              <article key={a.title} className={`area-card glass reveal d${(i % 6) + 1}`}>
                <AreaIcon name={a.icon} />
                <h3 className="area-title">{a.title}</h3>
                <p className="area-desc">{a.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <div className="ticker-wrap" aria-hidden="true">
        <div className="ticker-track">
          {/* Doubled: the -50% keyframe assumes exactly two copies, so the
              loop point lands where the first copy ends. */}
          {[...TICKER, ...TICKER].map((t, i) => (
            <span key={i} className="ticker-item">
              {t}
              <span className="ticker-dot" />
            </span>
          ))}
        </div>
      </div>

      <section id="people" className="section-rise">
        <div className="container">
          <p className="label reveal">Who I&apos;ve Walked With</p>
          <h2 className="reveal d1">People, not just programs.</h2>
          <div className="people-list">
            {NUMBERS.map((n, i) => (
              <div key={n.display} className={`people-item reveal d${(i % 5) + 1}`}>
                <CountUp
                  value={n.value}
                  suffix={"suffix" in n ? (n.suffix as string) : ""}
                  display={n.display}
                />
                <p className="people-text">{n.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <PageNav current="/work" />
    </>
  );
}
