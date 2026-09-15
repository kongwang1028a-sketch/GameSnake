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

export const DEFAULT_FRUIT_TABLE: readonly FruitSpec[] = [
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

export const FRUIT_TABLE = DEFAULT_FRUIT_TABLE;

const WEIGHTS_KEY = "snake-fruit-weights";

export type FruitWeights = Record<FruitKind, number>;

function defaultWeights(): FruitWeights {
  return {
    normal: 70,
    gold: 18,
    speed: 7,
    shield: 4,
    jackpot: 1,
  };
}

function readWeights(): FruitWeights {
  const fallback = defaultWeights();
  try {
    const raw = globalThis.localStorage?.getItem(WEIGHTS_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<FruitWeights>;
    return sanitizeWeights({ ...fallback, ...parsed });
  } catch {
    return fallback;
  }
}

function sanitizeWeights(input: FruitWeights): FruitWeights {
  const next = defaultWeights();
  (Object.keys(next) as FruitKind[]).forEach((kind) => {
    const value = Number(input[kind]);
    next[kind] = Number.isFinite(value) ? Math.max(0, Math.min(999, Math.round(value))) : 0;
  });
  if (Object.values(next).every((weight) => weight === 0)) return defaultWeights();
  return next;
}

let currentWeights = readWeights();

export function getFruitWeights(): FruitWeights {
  return { ...currentWeights };
}

export function getFruitTable(): FruitSpec[] {
  return DEFAULT_FRUIT_TABLE.map((item) => ({
    ...item,
    weight: currentWeights[item.kind],
  }));
}

export function setFruitWeights(next: Partial<FruitWeights>): FruitWeights {
  currentWeights = sanitizeWeights({ ...currentWeights, ...next });
  try {
    globalThis.localStorage?.setItem(WEIGHTS_KEY, JSON.stringify(currentWeights));
  } catch {
    // Ignore storage failures in private mode or non-browser tests.
  }
  return getFruitWeights();
}

export function resetFruitWeights(): FruitWeights {
  currentWeights = defaultWeights();
  try {
    globalThis.localStorage?.removeItem(WEIGHTS_KEY);
  } catch {
    // Ignore storage failures.
  }
  return getFruitWeights();
}

export function fruitPercents(): Record<FruitKind, number> {
  const table = getFruitTable();
  const total = table.reduce((sum, item) => sum + item.weight, 0);
  const percents = {} as Record<FruitKind, number>;
  for (const item of table) {
    percents[item.kind] = total === 0 ? 0 : Math.round((item.weight / total) * 100);
  }
  return percents;
}

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
  return getFruitTable().find((item) => item.kind === kind) ?? getFruitTable()[0];
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
  return fruitPercents()[kind];
}
