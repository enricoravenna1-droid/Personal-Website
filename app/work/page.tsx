import type { Metadata } from "next";
import { PageNav } from "@/components/page-nav";
import { Beat, OneFrame, type Frame } from "@/components/one-frame";
import { AREAS, INITIATIVES, NUMBERS } from "@/lib/content";

export const metadata: Metadata = {
  title: "The Work",
  description:
    "Active initiatives, the areas Enrico Omri Ravenna works in, and the numbers behind a Federation turnaround: 700+ engagements, 18 programs, four security partnerships.",
};

/**
 * The frame holds each initiative's photograph; the areas and the numbers
 * scroll past as two ledgers over the Federation stage. No cards, no glass,
 * no icons: a numeral, a title, a line, a hairline.
 */
const IDS = ["aj-2054", "campus", "on-air"] as const;
const POS: Record<string, [string, string]> = {
  "reut-spotlight": ["82% 40%", "80% 40%"],
  spotlight: ["44% 38%", "44% 36%"],
  "elswick-spotlight": ["46% 40%", "46% 36%"],
};

const FRAMES: Frame[] = [
  ...INITIATIVES.map((it) => ({ src: it.photo, alt: it.alt, pos: POS[it.id]?.[0], posM: POS[it.id]?.[1] })),
  { src: "/photo-leader.jpg", alt: "Enrico Omri Ravenna on stage at a Jewish Federation of Arkansas event", pos: "30% 40%", posM: "34% 36%" },
];

export default function WorkPage() {
  return (
    <>
      <h1 className="sr-only">The Work</h1>
      <OneFrame name="work" frames={FRAMES}>
        {INITIATIVES.map((it, i) => (
          <Beat key={it.id} id={IDS[i]} frame={i} labelledBy={`${IDS[i]}-h`}>
            <p className="of-kicker" data-depth>{it.kicker}</p>
            <h2 className="of-h" id={`${IDS[i]}-h`}>
              {it.headline} <em>{it.headlineAccent}</em>
            </h2>
            <div className="of-body"><p>{it.body}</p></div>
            {it.cta ? (
              <a href={it.cta.href} target="_blank" rel="noopener noreferrer" className="of-link">
                {it.cta.label} <span aria-hidden="true">→</span>
              </a>
            ) : null}
          </Beat>
        ))}

        <Beat id="add-value" frame={3} labelledBy="add-value-h">
          <p className="of-kicker" data-depth>Areas I work in</p>
          <h2 className="of-h" id="add-value-h">Where I <em>add value.</em></h2>
          <ol className="of-ledger">
            {AREAS.map((a, i) => (
              <li key={a.title}>
                <span className="n">{String(i + 1).padStart(2, "0")}</span>
                <h3>{a.title}</h3>
                <p>{a.desc}</p>
              </li>
            ))}
          </ol>
        </Beat>

        <Beat id="numbers" frame={3} labelledBy="numbers-h">
          <p className="of-kicker" data-depth>The numbers</p>
          <h2 className="of-h" id="numbers-h">People, not just <em>programs.</em></h2>
          <ul className="of-ledger of-nums">
            {NUMBERS.map((n) => (
              <li key={n.display}>
                <span className="num">{n.display}</span>
                <p>{n.text}</p>
              </li>
            ))}
          </ul>
        </Beat>
      </OneFrame>
      <PageNav current="/work" />
    </>
  );
}
