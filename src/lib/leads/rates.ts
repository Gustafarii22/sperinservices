export type RateCard = {
  firstHour: number;
  furtherHour: number;
  furtherHalfHour: number;
  dayRate: number; // 8-hour day
  mateDay: number;
  eicrUpTo6: number;
  eicr7to10: number;
  cuUpTo6: number;
  cu7to10: number;
  travelIncludedMinutes: number;
  baseOutward: string; // base postcode
  ownerSignature: string;
  vatRegistered: boolean;
};

export const DEFAULT_RATES: RateCard = {
  firstHour: 60,
  furtherHour: 40,
  furtherHalfHour: 20,
  dayRate: 300,
  mateDay: 150,
  eicrUpTo6: 160,
  eicr7to10: 200,
  cuUpTo6: 650,
  cu7to10: 800,
  travelIncludedMinutes: 35,
  baseOutward: "B66 4JB",
  ownerSignature: "Augustine\nSperin Services",
  vatRegistered: false,
};

export function mergeRates(stored: unknown): RateCard {
  const s = (stored && typeof stored === "object" ? stored : {}) as Partial<RateCard>;
  const out = { ...DEFAULT_RATES };
  for (const k of Object.keys(DEFAULT_RATES) as (keyof RateCard)[]) {
    const v = s[k];
    if (v === undefined || v === null) continue;
    if (typeof DEFAULT_RATES[k] === typeof v) (out as Record<string, unknown>)[k] = v;
  }
  return out;
}