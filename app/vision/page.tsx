import type { Metadata } from "next";
import { PageNav } from "@/components/page-nav";
import { SectionMark } from "@/components/section-mark";
import {
  ARC_THESIS,
  CTA,
  INSIGHTS,
  SITE,
  VISION_BEATS,
  VISION_PULL,
} from "@/lib/content";

export const metadata: Metadata = {
  title: "The Vision",
  description:
    "Relationship over transaction. Security without losing joy. The next generation leads now. What Enrico Omri Ravenna is building toward.",
};

/** ARC_THESIS marks its emphasis with |pipes| so the copy stays plain text. */
function Thesis({ text }: { text: string }) {
  const parts = text.split("|");
  return (
    <p className="arc-thesis">
      {parts.map((part, i) =>
        i % 2 === 1 ? <em key={i}>{part}</em> : <span key={i}>{part}</span>,
      )}
    </p>
  );
}

export default function VisionPage() {
  return (
    <>
      <header className="page-head">
        <div className="container">
          <p className="label reveal">My Vision</p>
          <h1 className="reveal d1">This is what I&apos;m building toward.</h1>
        </div>
      </header>

      <section id="vision" className="section-rise">
        <div className="container">
          <Thesis text={ARC_THESIS} />

          <blockquote className="vision-pull-quote reveal">
            <q>{VISION_PULL.quote}</q>
            <cite>— {VISION_PULL.cite}</cite>
          </blockquote>

          <div className="vision-beats">
            {VISION_BEATS.map((b, i) => (
              <article key={b.statement} className={`vision-beat vb-${i + 1}`}>
                <h2 className="vb-statement">{b.statement}</h2>
                <p className="vb-body">{b.body}</p>
              </article>
            ))}
          </div>

          <div className="vision-quote-bridge reveal">
            <blockquote>
              &ldquo;Where there is a possibility, there&apos;s a
              responsibility.&rdquo;
            </blockquote>
            <cite>— {SITE.name}</cite>
          </div>
        </div>
      </section>

      <section id="insights" className="section-rise">
        <div className="container">
          <SectionMark name="insight" />
          <p className="label reveal">From LinkedIn</p>
          <h2 className="reveal d1">What I&apos;m thinking about.</h2>
          <div className="insights-grid">
            {INSIGHTS.map((post, i) => (
              <article
                key={post.title}
                className={`insight-card glass insight-card-${i + 1} reveal d${i + 1}`}
              >
                <span className="insight-edge" aria-hidden="true" />
                <p className="insight-tag">{post.tag}</p>
                <h3 className="insight-title">{post.title}</h3>
                <a
                  href={post.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="insight-link"
                >
                  Read on LinkedIn
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
                    />
                  </svg>
                </a>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="cta" className="section-rise">
        <div className="container">
          <SectionMark name="connect" />
          <p className="label reveal">{CTA.label}</p>
          <h2 className="reveal d1">{CTA.headline}</h2>
          <p className="sub reveal d2">{CTA.sub}</p>
          <div className="cta-row reveal d3">
            <a
              href={SITE.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
            >
              Connect on LinkedIn
            </a>
            <a href={`mailto:${SITE.email}`} className="btn-secondary">
              Email Me
            </a>
            <a href={SITE.resume} download className="btn-secondary">
              Download Resume
            </a>
          </div>
        </div>
      </section>

      <PageNav current="/vision" />
    </>
  );
}
