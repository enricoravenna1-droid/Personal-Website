import Link from "next/link";
import { Hero } from "@/components/hero";
import { ArcCinematic } from "@/components/globe/arc-cinematic";
import { PageNav } from "@/components/page-nav";
import { SITE } from "@/lib/content";

export default function Home() {
  return (
    <>
      <Hero />
      <ArcCinematic />

      {/* Target for the cinematic's skip link. */}
      <section id="after-arc" className="home-outro section-rise">
        <div className="container">
          <p className="label reveal">Where to next</p>
          <h2 className="reveal d1">
            Three chapters. <em>One through-line.</em>
          </h2>
          <p className="home-outro-body reveal d2">
            The arc above is the short version. The long version is a soldier, a
            builder, and a leader, plus the people who watched it happen and were
            willing to put their names to it.
          </p>
          <div className="home-outro-links reveal d3">
            <Link href="/story" className="btn-primary">
              Read the story
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
            </Link>
            <a
              href={SITE.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary"
            >
              Connect on LinkedIn
            </a>
          </div>
        </div>
      </section>

      <PageNav current="/" />
    </>
  );
}
