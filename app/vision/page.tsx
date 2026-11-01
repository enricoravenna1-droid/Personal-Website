import type { Metadata } from "next";
import { PageNav } from "@/components/page-nav";
import { Beat, BeatGroup, OneFrame, type Frame } from "@/components/one-frame";
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

/** One still of him, held for the whole page; the beats and the ask scroll past. */
const FRAMES: Frame[] = [
  { src: "/photo-now.jpg", alt: "Enrico Omri Ravenna, studio portrait", pos: "50% 22%", posM: "50% 18%" },
];

/** ARC_THESIS marks its emphasis with |pipes| so the copy stays plain text. */
function Thesis({ text }: { text: string }) {
  return (
    <p className="of-thesis">
      {text.split("|").map((part, i) =>
        i % 2 === 1 ? <em key={i}>{part}</em> : <span key={i}>{part}</span>,
      )}
    </p>
  );
}

export default function VisionPage() {
  return (
    <>
      <OneFrame name="vision" frames={FRAMES}>
        <Beat id="building" frame={0}>
          <p className="of-kicker" data-depth>My vision</p>
          <h1 className="of-h">This is what I&apos;m building toward.</h1>
          <Thesis text={ARC_THESIS} />
          <blockquote className="of-body">
            <p>&ldquo;{VISION_PULL.quote}&rdquo;</p>
            <cite className="of-cite">{VISION_PULL.cite}</cite>
          </blockquote>
        </Beat>

        <BeatGroup id="beats">
          {VISION_BEATS.map((b, i) => (
            <Beat key={b.statement} frame={0} labelledBy={`beat-${i + 1}`}>
              <p className="of-kicker" data-depth>Beat {String(i + 1).padStart(2, "0")} · of 03</p>
              <h2 className="of-h" id={`beat-${i + 1}`}>{b.statement}</h2>
              <div className="of-body"><p>{b.body}</p></div>
            </Beat>
          ))}
        </BeatGroup>

        <Beat frame={0}>
          <blockquote className="of-pull">
            &ldquo;Where there is a possibility, there&apos;s a responsibility.&rdquo;
          </blockquote>
          <cite className="of-cite">{SITE.name}</cite>
        </Beat>

        <Beat id="writing" frame={0} labelledBy="writing-h">
          <p className="of-kicker" data-depth>From LinkedIn</p>
          <h2 className="of-h" id="writing-h">What I&apos;m thinking about.</h2>
          <ul className="of-ledger of-writing">
            {INSIGHTS.map((post) => (
              <li key={post.title}>
                <span className="of-tag">{post.tag}</span>
                <h3>
                  <a href={post.href} target="_blank" rel="noopener noreferrer">
                    {post.title} <span className="of-arrow" aria-hidden="true">↗</span>
                    <span className="sr-only"> (LinkedIn, opens in a new tab)</span>
                  </a>
                </h3>
              </li>
            ))}
          </ul>
        </Beat>

        <Beat id="talk" frame={0} labelledBy="talk-h">
          <p className="of-kicker" data-depth>{CTA.label}</p>
          <h2 className="of-h" id="talk-h">{CTA.headline}</h2>
          <div className="of-body"><p>{CTA.sub}</p></div>
          <div className="of-btns">
            <a href={SITE.linkedin} target="_blank" rel="noopener noreferrer" className="of-btn of-btn-p">
              Connect on LinkedIn
            </a>
            <a href={`mailto:${SITE.email}`} className="of-btn">Email me</a>
            <a href={SITE.resume} download className="of-btn">Download resume</a>
          </div>
        </Beat>
      </OneFrame>
      <PageNav current="/vision" />
    </>
  );
}
