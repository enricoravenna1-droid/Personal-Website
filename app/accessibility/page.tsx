import type { Metadata } from "next";
import { A11Y, SITE } from "@/lib/content";

export const metadata: Metadata = {
  title: "Accessibility",
  description:
    "What this site does to stay usable, where it falls short, and how to tell Enrico Omri Ravenna if something here blocked you.",
};

/**
 * The footer has linked here since the rebuild; the route never existed, so
 * it 404'd in production. No PageNav: this is a utility page, not a stop on
 * the reading order, and PageNav returns null for anything outside it anyway.
 */
export default function AccessibilityPage() {
  return (
    <>
      <header className="page-head">
        <div className="container">
          <p className="label reveal">Accessibility</p>
          <h1 className="reveal d1">
            This site should work for <em>everyone</em> who comes to it.
          </h1>
          <p className="page-sub reveal d2">
            Accessibility here is a design constraint rather than a box to
            tick, so the commitments below are written to be specific enough
            that you can check them. The places this site still falls short
            are listed underneath them.
          </p>
        </div>
      </header>

      <section className="section-rise a11y-section">
        <div className="container">
          <p className="label reveal">What this site does</p>
          <dl className="a11y-list">
            {A11Y.does.map((item) => (
              <div key={item.heading} className="a11y-item reveal">
                <dt className="a11y-item-h">{item.heading}</dt>
                <dd className="a11y-item-b">{item.body}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="section-rise a11y-section">
        <div className="container">
          <p className="label reveal">Where it falls short</p>
          <dl className="a11y-list a11y-list-gaps">
            {A11Y.gaps.map((item) => (
              <div key={item.heading} className="a11y-item reveal">
                <dt className="a11y-item-h">{item.heading}</dt>
                <dd className="a11y-item-b">{item.body}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="section-rise a11y-section">
        <div className="container">
          <div className="a11y-contact glass reveal">
            <h2 className="a11y-contact-h">Something here blocked you?</h2>
            <p className="a11y-contact-b">
              Tell me and I will fix it. Send the page you were on and what
              happened. If it is easier to describe out loud than to write
              down, say so and we will do it that way instead.
            </p>
            <div className="cta-row">
              <a href={`mailto:${SITE.email}`} className="btn-primary">
                Email Me
              </a>
            </div>
            <p className="a11y-meta">
              Target standard: {A11Y.standard}. Last reviewed{" "}
              {A11Y.reviewed}.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
