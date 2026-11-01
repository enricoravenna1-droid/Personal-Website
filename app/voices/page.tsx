import type { Metadata } from "next";
import { PageNav } from "@/components/page-nav";
import { Beat, BeatGroup, OneFrame, type Frame } from "@/components/one-frame";
import {
  COLLEAGUES,
  COMMUNITY_VOICES,
  FIELD_VOICE,
  TEAM_VOICES,
  type Testimonial,
} from "@/lib/content";

export const metadata: Metadata = {
  title: "Voices",
  description:
    "What an IDF commander, Federation peers, his own team, and Christian community leaders say about working with Enrico Omri Ravenna.",
};

/**
 * Seven voices, one frame. The frame holds the speaker's face while their
 * words scroll beside it. Erin and Wendy have no portrait on file, so their
 * frame is the Federation stage they worked behind; it is labelled as him,
 * not as them.
 */
const FRAMES: Frame[] = [
  { src: "/photo-eyal.jpg", alt: FIELD_VOICE.alt ?? FIELD_VOICE.name, pos: "50% 22%", posM: "50% 18%" },
  { src: "/photo-jordenne.jpg", alt: COLLEAGUES[0].alt ?? COLLEAGUES[0].name, pos: "50% 30%", posM: "50% 26%" },
  { src: "/photo-jessie.jpg", alt: COLLEAGUES[1].alt ?? COLLEAGUES[1].name, pos: "54% 30%", posM: "54% 26%" },
  { src: "/photo-leader.jpg", alt: "Enrico Omri Ravenna on stage at a Jewish Federation of Arkansas event", pos: "30% 40%", posM: "34% 36%" },
  { src: "/photo-cathie.jpg", alt: COMMUNITY_VOICES[0].alt, pos: "60% 40%", posM: "62% 40%" },
  { src: "/photo-perry.jpg", alt: COMMUNITY_VOICES[1].alt, pos: "58% 46%", posM: "58% 46%" },
];

const slug = (name: string) =>
  "voice-" + name.toLowerCase().replace(/^(lt\. col\. \(res\.\)|dr\.|pastor) /, "").split(/[ ,]/)[0];

const INDEX = [
  { id: slug(FIELD_VOICE.name), label: "Eyal Dror" },
  ...COLLEAGUES.map((p) => ({ id: slug(p.name), label: p.name })),
  ...TEAM_VOICES.map((p) => ({ id: slug(p.name), label: p.name })),
  ...COMMUNITY_VOICES.map((p) => ({ id: slug(p.name), label: p.name.replace(/, PhD$/, "").replace(/^Dr\. /, "") })),
];
const TOTAL = String(INDEX.length).padStart(2, "0");

/** The first highlighted paragraph opens in display type; the rest keep their order. */
function Quote({ person }: { person: Testimonial }) {
  const [first, ...rest] = person.body;
  const lead = first.highlight;
  return (
    <>
      {lead ? <blockquote className="of-pull">&ldquo;{first.text}&rdquo;</blockquote> : null}
      <div className="of-quote">
        {(lead ? rest : person.body).map((p, j) => (
          <p key={j} className={p.highlight ? "of-hi" : undefined}>{p.text}</p>
        ))}
      </div>
    </>
  );
}

/**
 * The community quotes are short and their `pull` is a clause of the quote
 * itself, so printing both would say the same line twice. The first
 * sentence opens in display type instead and the rest follows.
 */
function CommunityQuote({ text }: { text: string }) {
  const m = text.match(/^(.+?[.!?])\s+(.+)$/s);
  const [lead, rest] = m ? [m[1], m[2]] : [text, ""];
  return (
    <>
      <blockquote className="of-pull">&ldquo;{lead}&rdquo;</blockquote>
      {rest ? <div className="of-quote"><p>{rest}</p></div> : null}
    </>
  );
}

function Who({ name, title }: { name: string; title: readonly string[] | string }) {
  return (
    <div className="of-who">
      <h2>{name}</h2>
      <span>{Array.isArray(title) ? title.join(" · ") : title}</span>
    </div>
  );
}

export default function VoicesPage() {
  let k = 0;
  const kicker = (label: string) => (
    <p className="of-kicker" data-depth>
      {label} · {String(++k).padStart(2, "0")} / {TOTAL}
    </p>
  );
  return (
    <>
      <h1 className="sr-only">Voices</h1>
      <OneFrame name="voices" frames={FRAMES} index={INDEX}>
        <BeatGroup id="from-israel">
          <Beat id={INDEX[0].id} group={INDEX[0].id} frame={0}>
            {kicker("A voice from Israel")}
            <Quote person={FIELD_VOICE} />
            <Who name={FIELD_VOICE.name} title={FIELD_VOICE.title} />
            <div className="of-stats">
              {FIELD_VOICE.stats.map((s) => (
                <div key={s.label}>
                  <b>{s.num}</b>
                  <span>{s.label}</span>
                </div>
              ))}
            </div>
          </Beat>
        </BeatGroup>

        <BeatGroup id="peers">
          {COLLEAGUES.map((p, i) => (
            <Beat key={p.name} id={slug(p.name)} group={slug(p.name)} frame={1 + i}>
              {kicker("Federation peers")}
              <Quote person={p} />
              <Who name={p.name} title={p.title} />
            </Beat>
          ))}
        </BeatGroup>

        <BeatGroup id="team">
          {TEAM_VOICES.map((p) => (
            <Beat key={p.name} id={slug(p.name)} group={slug(p.name)} frame={3}>
              {kicker("My team")}
              <Quote person={p} />
              <Who name={p.name} title={p.title} />
            </Beat>
          ))}
        </BeatGroup>

        <BeatGroup id="community">
          {COMMUNITY_VOICES.map((v, i) => (
            <Beat key={v.name} id={slug(v.name)} group={slug(v.name)} frame={4 + i}>
              {kicker("The community")}
              <CommunityQuote text={v.quote} />
              <Who name={v.name} title={v.title} />
            </Beat>
          ))}
        </BeatGroup>
      </OneFrame>
      <PageNav current="/voices" />
    </>
  );
}
