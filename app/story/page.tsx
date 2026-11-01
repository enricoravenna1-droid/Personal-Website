import type { Metadata } from "next";
import { PageNav } from "@/components/page-nav";
import { Beat, OneFrame, type Frame } from "@/components/one-frame";
import { CHAPTERS, FILM, INTERLUDE } from "@/lib/content";

export const metadata: Metadata = {
  title: "The Story",
  description:
    "Soldier, builder, leader, visionary. Born in Israel, IDF veteran, then a career built across an entire region, a single generation on campus, a whole state, and now Reut USA.",
};

/**
 * Four chapters in One Frame: the Negev, the Golan, the stage, then him.
 * The words for 01 to 03 are the long-form CHAPTERS; the word, the number
 * and the fact pill are the home film's, so the two never disagree. The
 * interlude keeps its place after the soldier, because it is the reason
 * chapter two happened at all, and it keeps the soldier's photograph.
 */
const FRAMES: Frame[] = [
  { src: "/photo-idf.jpg", alt: FILM.chapters[0].alt, pos: "50% 26%", posM: "50% 22%" },
  { src: "/photo-mtf.jpg", alt: FILM.chapters[1].alt, pos: "58% 50%", posM: "55% 45%" },
  { src: "/photo-leader.jpg", alt: FILM.chapters[2].alt, pos: "30% 40%", posM: "34% 36%" },
  { src: "/hero-cutout.png", alt: FILM.chapters[3].alt, cutout: true },
];

export default function StoryPage() {
  const ch = FILM.chapters;
  const n = ch.length;
  return (
    <>
      <h1 className="sr-only">The Story</h1>
      <OneFrame name="story" frames={FRAMES}>
        {ch.map((c, i) => {
          const long = CHAPTERS.find((x) => x.id === c.id);
          const body = long ? long.body : [c.line];
          const next = ch[i + 1]?.word;
          return [
            <Beat key={c.id} id={c.id} frame={i} next={next} labelledBy={`${c.id}-h`}>
              <p className="of-kicker" data-depth>
                Chapter {c.n} · of {String(n).padStart(2, "0")}
              </p>
              <h2 className="of-word" id={`${c.id}-h`}>{c.word}</h2>
              <div className="of-body">
                {body.map((p, j) => <p key={j}>{p}</p>)}
              </div>
              <p className="of-pill">{c.stat}</p>
            </Beat>,
            i === 0 ? (
              <Beat key="thread" id="thread" frame={0} next={next} labelledBy="thread-h">
                <p className="of-kicker" data-depth id="thread-h">{INTERLUDE.kicker}</p>
                <blockquote className="of-pull">{INTERLUDE.pull}</blockquote>
                <div className="of-body"><p>{INTERLUDE.body}</p></div>
              </Beat>
            ) : null,
          ];
        })}
      </OneFrame>
      <PageNav current="/story" />
    </>
  );
}
