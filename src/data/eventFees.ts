export type FeeUnit = "per_person" | "per_team" | "per_sport" | "free" | "tba";

export type EventFee = {
  amountInr: number;
  unit: FeeUnit;
  source: "Events.pdf";
};

/**
 * Fees extracted from `d:/YATRA 2026/Events.pdf` (Day-1/Day-2 fee table).
 *
 * Important:
 * - `avatar-portfolio` is NIL → `free`.
 * - Some event ids exist in `src/data/events.ts` but are not present in the fee sheet → `tba`.
 */
export const EVENT_FEES: Record<string, EventFee> = {
  // Day 1
  "group-dance": { amountInr: 800, unit: "per_team", source: "Events.pdf" },
  "kids-solo-dance": { amountInr: 150, unit: "per_person", source: "Events.pdf" },
  "solo-dance": { amountInr: 250, unit: "per_person", source: "Events.pdf" },
  "adaptune-solo": { amountInr: 250, unit: "per_person", source: "Events.pdf" },
  "lyric-quest": { amountInr: 150, unit: "per_person", source: "Events.pdf" },
  "rj-hunt": { amountInr: 250, unit: "per_person", source: "Events.pdf" },
  "k-drama-vs-anime-quiz": { amountInr: 150, unit: "per_team", source: "Events.pdf" },
  "balloon-bursting-challenge": { amountInr: 150, unit: "per_person", source: "Events.pdf" },
  "avatar-portfolio": { amountInr: 0, unit: "free", source: "Events.pdf" },
  "cricket-commentary": { amountInr: 200, unit: "per_person", source: "Events.pdf" },
  "red-light-green-light": { amountInr: 200, unit: "per_person", source: "Events.pdf" },
  "brain-teasers-arena": { amountInr: 200, unit: "per_team", source: "Events.pdf" },
  "short-film": { amountInr: 200, unit: "per_team", source: "Events.pdf" },
  "ethnic-food-contest": { amountInr: 200, unit: "per_team", source: "Events.pdf" },
  "brawl-stars": { amountInr: 200, unit: "per_sport", source: "Events.pdf" },
  "pubg": { amountInr: 200, unit: "per_sport", source: "Events.pdf" },
  "photography": { amountInr: 200, unit: "per_person", source: "Events.pdf" },
  "mehandi": { amountInr: 200, unit: "per_team", source: "Events.pdf" },
  "mega-origami": { amountInr: 200, unit: "per_team", source: "Events.pdf" },
  "poster-designing": { amountInr: 200, unit: "per_person", source: "Events.pdf" },
  "box-cricket": { amountInr: 200, unit: "per_team", source: "Events.pdf" },
  "tug-of-war": { amountInr: 250, unit: "per_team", source: "Events.pdf" },
  "gonggi-pebble-toss": { amountInr: 150, unit: "per_person", source: "Events.pdf" },
  "dont-laugh": { amountInr: 150, unit: "per_person", source: "Events.pdf" },
  "channel-surfing": { amountInr: 250, unit: "per_team", source: "Events.pdf" },

  // Day 2
  "classical-dance": { amountInr: 250, unit: "per_person", source: "Events.pdf" },
  "battle-of-beats": { amountInr: 600, unit: "per_team", source: "Events.pdf" },
  "jam": { amountInr: 150, unit: "per_person", source: "Events.pdf" },
  "beat-box-battle": { amountInr: 200, unit: "per_person", source: "Events.pdf" },
  "singing": { amountInr: 250, unit: "per_person", source: "Events.pdf" },
  "tongue-twister-tournament": { amountInr: 150, unit: "per_person", source: "Events.pdf" },
  "mono-acting-challenge": { amountInr: 150, unit: "per_person", source: "Events.pdf" },
  "adzap": { amountInr: 150, unit: "per_person", source: "Events.pdf" },
  "mime": { amountInr: 300, unit: "per_team", source: "Events.pdf" },
  "meme-creation-challenge": { amountInr: 200, unit: "per_person", source: "Events.pdf" },
  "mock-parliament": { amountInr: 200, unit: "per_team", source: "Events.pdf" },
  "stand-up-comedy-solo": { amountInr: 150, unit: "per_person", source: "Events.pdf" },
  "the-opposite": { amountInr: 150, unit: "per_person", source: "Events.pdf" },
  "debate": { amountInr: 200, unit: "per_team", source: "Events.pdf" },
  "free-fire": { amountInr: 200, unit: "per_team", source: "Events.pdf" },
  "valorant": { amountInr: 200, unit: "per_team", source: "Events.pdf" },
  "rangoli": { amountInr: 200, unit: "per_team", source: "Events.pdf" },
  "stumble-guys": { amountInr: 200, unit: "per_person", source: "Events.pdf" },
  "treasure-hunt": { amountInr: 200, unit: "per_team", source: "Events.pdf" },
  "oratory-english-tamil": { amountInr: 150, unit: "per_person", source: "Events.pdf" },
  "face-fiesta": { amountInr: 150, unit: "per_team", source: "Events.pdf" },
  "pencil-art-painting": { amountInr: 150, unit: "per_person", source: "Events.pdf" },
  "tower-build": { amountInr: 200, unit: "per_team", source: "Events.pdf" },
  "drone-challenge-bioscope": { amountInr: 200, unit: "per_team", source: "Events.pdf" },
  "fake-news-or-fact": { amountInr: 200, unit: "per_team", source: "Events.pdf" },

  // Not present in Events.pdf fee table
  "k-cosplay": { amountInr: 0, unit: "tba", source: "Events.pdf" },
  "duo-dance": { amountInr: 0, unit: "tba", source: "Events.pdf" },
  "dance-battle": { amountInr: 0, unit: "tba", source: "Events.pdf" },
};

export function formatFee(fee: EventFee): string {
  if (fee.unit === "free") return "Free";
  if (fee.unit === "tba") return "Fee: TBA";
  const suffix =
    fee.unit === "per_person"
      ? "per person"
      : fee.unit === "per_team"
        ? "per team"
        : "per sport";
  return `₹${fee.amountInr} ${suffix}`;
}

