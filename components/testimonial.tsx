import Image from "next/image";
import type { Testimonial } from "@/lib/content";

/** The two-column testimonial: sticky portrait on the left, quote on the right. */
export function FeaturedTestimonial({
  person,
  reverse = false,
  children,
}: {
  person: Testimonial;
  /** Mirrors the layout so consecutive testimonials do not read as a list. */
  reverse?: boolean;
  /** Extra content under the attribution, e.g. the Operation Good Neighbor stats. */
  children?: React.ReactNode;
}) {
  return (
    <div
      className={`featured-testimonial${reverse ? " featured-testimonial--reverse" : ""}`}
    >
      <div className="featured-testimonial-photo-col reveal">
        {person.photo ? (
          <div className="featured-testimonial-photo-wrap">
            <div className="featured-testimonial-photo-glow" aria-hidden="true" />
            <Image
              src={person.photo}
              alt={person.alt ?? person.name}
              width={320}
              height={320}
              sizes="(max-width: 800px) 88px, 320px"
            />
          </div>
        ) : null}
        <div className="featured-testimonial-attr">
          <p className="featured-testimonial-name">{person.name}</p>
          <p className="featured-testimonial-title">
            {person.title.map((line, i) => (
              <span key={i}>
                {i > 0 ? <br /> : null}
                {line}
              </span>
            ))}
          </p>
        </div>
        {children}
      </div>

      <blockquote className="featured-testimonial-content reveal d2">
        <span className="featured-testimonial-open" aria-hidden="true">
          &ldquo;
        </span>
        <div className="featured-testimonial-body">
          {person.body.map((p, i) => (
            <p key={i} className={p.highlight ? "highlight" : undefined}>
              {p.text}
            </p>
          ))}
        </div>
      </blockquote>
    </div>
  );
}

/** Full-width quote with no portrait, for people without a usable headshot. */
export function SoloQuote({ person }: { person: Testimonial }) {
  return (
    <figure className="solo-quote reveal">
      <span className="solo-quote-open" aria-hidden="true">
        &ldquo;
      </span>
      <blockquote className="solo-quote-body">
        {person.body.map((p, i) => (
          <p
            key={i}
            className={`solo-quote-text${p.highlight ? " highlight" : ""}`}
          >
            {p.text}
          </p>
        ))}
      </blockquote>
      <figcaption className="solo-quote-attr">
        <span className="solo-quote-rule" aria-hidden="true" />
        <div>
          <p className="solo-quote-name">{person.name}</p>
          <p className="solo-quote-title">{person.title.join(" · ")}</p>
        </div>
      </figcaption>
    </figure>
  );
}
