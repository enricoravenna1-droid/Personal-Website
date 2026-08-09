import type { Metadata } from "next";
import Image from "next/image";
import { PageNav } from "@/components/page-nav";
import { FeaturedTestimonial, SoloQuote } from "@/components/testimonial";
import {
  COLLEAGUES,
  COMMUNITY_VOICES,
  FIELD_VOICE,
  TEAM_VOICES,
} from "@/lib/content";

export const metadata: Metadata = {
  title: "Voices",
  description:
    "What an IDF commander, Federation peers, his own team, and Christian community leaders say about working with Enrico Omri Ravenna.",
};

export default function VoicesPage() {
  return (
    <>
      <header className="page-head">
        <div className="container">
          <p className="label reveal">Voices</p>
          <h1 className="reveal d1">
            People who have <em>seen the work.</em>
          </h1>
          <p className="page-sub reveal d2">
            A commander from the Israeli north, two Federation peers, the team
            he managed, and two Christian leaders who had no obligation to say
            anything at all.
          </p>
        </div>
      </header>

      <section id="field-voice" className="section-rise">
        <div className="container">
          <p className="label reveal">A Voice From Israel</p>
          <h2 className="reveal d1">
            Seen from the <em>front lines.</em>
          </h2>
          <div style={{ marginTop: "clamp(40px,6vh,72px)" }}>
            <FeaturedTestimonial person={FIELD_VOICE}>
              <div className="field-voice-stats reveal" style={{ marginTop: 20 }}>
                {FIELD_VOICE.stats.map((s) => (
                  <div className="field-voice-stat" key={s.label}>
                    <span className="field-voice-num">{s.num}</span>
                    <span className="field-voice-label">{s.label}</span>
                  </div>
                ))}
              </div>
            </FeaturedTestimonial>
          </div>
        </div>
      </section>

      <section id="colleagues" className="section-rise">
        <div className="container">
          <p className="label reveal">What Colleagues Say</p>
          <h2 className="reveal d1">
            Peers who&apos;ve seen it <em>up close.</em>
          </h2>
          <div style={{ marginTop: "clamp(40px,6vh,72px)" }}>
            {COLLEAGUES.map((person, i) => (
              <div key={person.name}>
                {i > 0 ? <hr className="testimonial-divider" /> : null}
                <FeaturedTestimonial person={person} reverse={i % 2 === 1} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="team-voices" className="section-rise">
        <div className="container">
          <p className="label reveal">From My Team</p>
          <h2 className="reveal d1">
            People who work <em>alongside me.</em>
          </h2>
          {TEAM_VOICES.map((person, i) => (
            <div key={person.name}>
              {i > 0 ? <hr className="testimonial-divider" /> : null}
              <SoloQuote person={person} />
            </div>
          ))}
        </div>
      </section>

      <section id="community-voices" className="section-rise">
        <div className="container">
          <p className="label reveal">Voices From the Community</p>
          <h2 className="reveal d1">
            What those outside the Jewish world <em>see.</em>
          </h2>

          <div className="cv-cards">
            {COMMUNITY_VOICES.map((v, i) => (
              <figure key={v.name} className={`cv-card reveal${i > 0 ? " d2" : ""}`}>
                <Image
                  src={v.photo}
                  alt={v.alt}
                  className="cv-card-photo"
                  width={1200}
                  height={900}
                  sizes="(max-width: 640px) 92vw, 44vw"
                />
                <div className="cv-card-overlay" aria-hidden="true" />
                <figcaption className="cv-card-content">
                  <span className="cv-card-open" aria-hidden="true">
                    &ldquo;
                  </span>
                  <blockquote className="cv-card-quote">{v.quote}</blockquote>
                  <p className="cv-card-name">{v.name}</p>
                  <p className="cv-card-title">{v.title}</p>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <PageNav current="/voices" />
    </>
  );
}
