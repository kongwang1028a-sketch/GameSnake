export type FruitKind = "normal" | "gold" | "speed" | "shield" | "jackpot";

export type FruitSpec = {
  kind: FruitKind;
  name: string;
  weight: number;
  score: number;
  color: string;
  glow: string;
  hasteTicks: number;
  jackpotTicks: number;
  shields: number;
};

export const FRUIT_TABLE: readonly FruitSpec[] = [
  {
    kind: "normal",
    name: "普通果",
    weight: 70,
    score: 10,
    color: "#ff5c7a",
    glow: "rgba(255, 92, 122, 0.45)",
    hasteTicks: 0,
    jackpotTicks: 0,
    shields: 0,
  },
  {
    kind: "gold",
    name: "金色果",
    weight: 18,
    score: 50,
    color: "#f5c542",
    glow: "rgba(245, 197, 66, 0.5)",
    hasteTicks: 0,
    jackpotTicks: 0,
    shields: 0,
  },
  {
    kind: "speed",
    name: "加速果",
    weight: 7,
    score: 20,
    color: "#5cc8ff",
    glow: "rgba(92, 200, 255, 0.5)",
    hasteTicks: 28,
    jackpotTicks: 0,
    shields: 0,
  },
  {
    kind: "shield",
    name: "護盾果",
    weight: 4,
    score: 15,
    color: "#8b9bff",
    glow: "rgba(139, 155, 255, 0.5)",
    hasteTicks: 0,
    jackpotTicks: 0,
    shields: 1,
  },
  {
    kind: "jackpot",
    name: "大獎果",
    weight: 1,
    score: 200,
    color: "#ff9d3d",
    glow: "rgba(255, 157, 61, 0.55)",
    hasteTicks: 0,
    jackpotTicks: 40,
    shields: 0,
  },
];

export const GAME_PARAMS = {
  gridSize: 20,
  baseSpeedMs: 160,
  minSpeedMs: 70,
  scoreSpeedStep: 40,
  scoreSpeedDrop: 12,
  hasteSpeedMs: 78,
  jackpotSpeedMs: 52,
};

export function fruitByKind(kind: FruitKind): FruitSpec {
  return FRUIT_TABLE.find((item) => item.kind === kind) ?? FRUIT_TABLE[0];
}

export function pickWeighted<T extends { weight: number }>(
  items: readonly T[],
  random: () => number = Math.random,
): T {
  const total = items.reduce((sum, item) => sum + item.weight, 0);
  let roll = random() * total;
  for (const item of items) {
    roll -= item.weight;
    if (roll < 0) return item;
  }
  return items[items.length - 1]!;
}

export function fruitChance(kind: FruitKind): number {
  const total = FRUIT_TABLE.reduce((sum, item) => sum + item.weight, 0);
  const spec = fruitByKind(kind);
  return Math.round((spec.weight / total) * 100);
}
