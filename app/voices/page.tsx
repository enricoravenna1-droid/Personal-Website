import type { Metadata } from "next";
import { CommunityVoiceCard } from "@/components/community-voice-card";
import { PageNav } from "@/components/page-nav";
import { SectionMark } from "@/components/section-mark";
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
          <SectionMark name="voices" />
          <p className="label reveal">From My Team</p>
          <h2 className="reveal d1">
            People who worked <em>alongside me.</em>
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

          <p className="cv-cards-hint reveal d2">
            Hover a card, or tap it, for the full quote.
          </p>
          <div className="cv-cards">
            {COMMUNITY_VOICES.map((v, i) => (
              <CommunityVoiceCard
                key={v.name}
                voice={v}
                delay={i > 0 ? "d2" : undefined}
              />
            ))}
          </div>
        </div>
      </section>

      <PageNav current="/voices" />
    </>
  );
}
