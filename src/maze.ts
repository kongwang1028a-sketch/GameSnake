import { GAME_PARAMS, fruitByKind, getFruitTable, pickWeighted, type FruitKind, type FruitSpec } from "./params.ts";
import type { Direction, Point } from "./game.ts";

const LAYOUT = [
  "###########",
  "#S..C.....#",
  "#.###.###.#",
  "#.#...C.#.#",
  "#.###.#.#.#",
  "#....C...E#",
  "###########",
];

const DELTA: Record<Direction, Point> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

export type MazeChest = {
  x: number;
  y: number;
  opened: boolean;
  prize: FruitSpec | null;
};

export type MazeMoveResult = {
  moved: boolean;
  prize: FruitSpec | null;
  finished: boolean;
};

export class ChanceMaze {
  readonly cols: number;
  readonly rows: number;
  readonly durationMs: number;
  readonly map: string[];
  player: Point;
  readonly exit: Point;
  chests: MazeChest[] = [];
  startedAt = 0;
  pausedAt: number | null = null;
  pausedElapsed = 0;
  finished = false;
  finishReason: "exit" | "time" | null = null;
  lastPrize: FruitSpec | null = null;

  private readonly random: () => number;

  constructor(random: () => number = Math.random) {
    this.random = random;
    this.durationMs = GAME_PARAMS.mazeDurationMs;
    this.map = LAYOUT;
    this.rows = LAYOUT.length;
    this.cols = LAYOUT[0]!.length;
    this.player = findCell(LAYOUT, "S") ?? { x: 1, y: 1 };
    this.exit = findCell(LAYOUT, "E") ?? { x: this.cols - 2, y: this.rows - 2 };
    this.chests = findAll(LAYOUT, "C").map((point) => ({
      ...point,
      opened: false,
      prize: null,
    }));
  }

  start(now: number): void {
    this.startedAt = now;
    this.pausedAt = null;
    this.pausedElapsed = 0;
    this.finished = false;
    this.finishReason = null;
    this.lastPrize = null;
  }

  openedCount(): number {
    return this.chests.filter((chest) => chest.opened).length;
  }

  remainingMs(now: number): number {
    const elapsed = (this.pausedAt ?? now) - this.startedAt - this.pausedElapsed;
    return Math.max(0, this.durationMs - elapsed);
  }

  togglePause(now: number): void {
    if (this.finished) return;
    if (this.pausedAt === null) {
      this.pausedAt = now;
      return;
    }
    this.pausedElapsed += now - this.pausedAt;
    this.pausedAt = null;
  }

  isPaused(): boolean {
    return this.pausedAt !== null;
  }

  cell(x: number, y: number): string {
    return this.map[y]?.[x] ?? "#";
  }

  isWall(x: number, y: number): boolean {
    return this.cell(x, y) === "#";
  }

  update(now: number): void {
    if (this.finished || this.isPaused()) return;
    if (this.remainingMs(now) <= 0) {
      this.finished = true;
      this.finishReason = "time";
    }
  }

  move(dir: Direction): MazeMoveResult {
    if (this.finished || this.isPaused()) {
      return { moved: false, prize: null, finished: this.finished };
    }
    const delta = DELTA[dir];
    const next = { x: this.player.x + delta.x, y: this.player.y + delta.y };
    if (this.isWall(next.x, next.y)) {
      return { moved: false, prize: null, finished: false };
    }
    this.player = next;
    const prize = this.openChestAt(next);
    if (next.x === this.exit.x && next.y === this.exit.y) {
      this.finished = true;
      this.finishReason = "exit";
    }
    return { moved: true, prize, finished: this.finished };
  }

  private openChestAt(point: Point): FruitSpec | null {
    const chest = this.chests.find((item) => item.x === point.x && item.y === point.y && !item.opened);
    if (!chest) return null;
    const rolled = pickWeighted(getFruitTable(), this.random);
    const prize = mazePrize(rolled.kind);
    chest.opened = true;
    chest.prize = prize;
    this.lastPrize = prize;
    return prize;
  }
}

export function mazePrize(kind: FruitKind): FruitSpec {
  const spec = fruitByKind(kind);
  if (kind !== "jackpot") return { ...spec };
  return {
    ...spec,
    name: "迷宮大獎",
    score: 200,
    jackpotTicks: 40,
  };
}

function findCell(map: string[], mark: string): Point | null {
  for (let y = 0; y < map.length; y += 1) {
    const x = map[y].indexOf(mark);
    if (x >= 0) return { x, y };
  }
  return null;
}

function findAll(map: string[], mark: string): Point[] {
  const found: Point[] = [];
  for (let y = 0; y < map.length; y += 1) {
    for (let x = 0; x < map[y].length; x += 1) {
      if (map[y][x] === mark) found.push({ x, y });
    }
  }
  return found;
}
