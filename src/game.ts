import { FRUIT_TABLE, GAME_PARAMS, fruitByKind, pickWeighted, type FruitKind, type FruitSpec } from "./params.ts";

export type Direction = "up" | "down" | "left" | "right";
export type Point = { x: number; y: number };
export type Food = Point & { kind: FruitKind };

const OPPOSITE: Record<Direction, Direction> = {
  up: "down",
  down: "up",
  left: "right",
  right: "left",
};

const DELTA: Record<Direction, Point> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

const HIGH_SCORE_KEY = "snake-high-score";

export class SnakeGame {
  readonly gridSize = GAME_PARAMS.gridSize;
  snake: Point[] = [];
  direction: Direction = "right";
  food: Food = { x: 10, y: 10, kind: "normal" };
  score = 0;
  highScore = 0;
  alive = true;
  started = false;
  paused = false;
  awaitingInput = false;
  shields = 0;
  hasteTicks = 0;
  jackpotTicks = 0;
  lastPickup: FruitSpec | null = null;

  private pending: Direction[] = [];
  private readonly random: () => number;

  constructor(random: () => number = Math.random) {
    this.random = random;
    this.highScore = readHighScore();
    this.reset();
  }

  reset(): void {
    const mid = Math.floor(this.gridSize / 2);
    this.snake = [
      { x: mid - 1, y: mid },
      { x: mid - 2, y: mid },
      { x: mid - 3, y: mid },
    ];
    this.direction = "right";
    this.pending = [];
    this.score = 0;
    this.alive = true;
    this.paused = false;
    this.awaitingInput = true;
    this.shields = 0;
    this.hasteTicks = 0;
    this.jackpotTicks = 0;
    this.lastPickup = null;
    this.placeFood();
  }

  start(): void {
    this.reset();
    this.started = true;
    this.awaitingInput = true;
  }

  togglePause(): void {
    if (!this.started || !this.alive) return;
    this.paused = !this.paused;
  }

  statusLabel(): string {
    if (this.jackpotTicks > 0) return "狂暴";
    if (this.hasteTicks > 0) return "加速";
    if (this.shields > 0) return "護盾";
    return "一般";
  }

  queueDirection(next: Direction): void {
    if (!this.started || !this.alive || this.paused) return;
    if (this.awaitingInput) {
      if (next === OPPOSITE[this.direction]) return;
      this.direction = next;
      this.awaitingInput = false;
      return;
    }
    const last = this.pending.at(-1) ?? this.direction;
    if (next === last || next === OPPOSITE[last]) return;
    if (this.pending.length >= 2) return;
    this.pending.push(next);
  }

  tick(): "move" | "eat" | "die" | "idle" {
    if (!this.started || !this.alive || this.paused || this.awaitingInput) return "idle";

    while (this.pending.length > 0) {
      const next = this.pending.shift()!;
      if (next !== OPPOSITE[this.direction]) {
        this.direction = next;
        break;
      }
    }

    const head = this.snake[0];
    const delta = DELTA[this.direction];
    const nextHead = { x: head.x + delta.x, y: head.y + delta.y };

    if (
      nextHead.x < 0 ||
      nextHead.y < 0 ||
      nextHead.x >= this.gridSize ||
      nextHead.y >= this.gridSize
    ) {
      if (this.shields > 0) {
        this.shields -= 1;
        this.direction = OPPOSITE[this.direction];
        this.decayBoosts();
        return "move";
      }
      return this.die();
    }

    const eating = nextHead.x === this.food.x && nextHead.y === this.food.y;
    const body = eating ? this.snake : this.snake.slice(0, -1);
    if (body.some((part) => part.x === nextHead.x && part.y === nextHead.y)) {
      return this.die();
    }

    this.snake.unshift(nextHead);

    if (eating) {
      this.applyFruit(this.food.kind);
      this.placeFood();
      this.decayBoosts();
      return "eat";
    }

    this.snake.pop();
    this.decayBoosts();
    return "move";
  }

  speedMs(): number {
    if (this.jackpotTicks > 0) return GAME_PARAMS.jackpotSpeedMs;
    if (this.hasteTicks > 0) return GAME_PARAMS.hasteSpeedMs;
    const steps = Math.floor(this.score / GAME_PARAMS.scoreSpeedStep);
    return Math.max(
      GAME_PARAMS.minSpeedMs,
      GAME_PARAMS.baseSpeedMs - steps * GAME_PARAMS.scoreSpeedDrop,
    );
  }

  setFoodForTest(food: Food): void {
    this.food = food;
  }

  private applyFruit(kind: FruitKind): void {
    const spec = fruitByKind(kind);
    this.lastPickup = spec;
    this.score += spec.score;
    this.hasteTicks = Math.max(this.hasteTicks, spec.hasteTicks);
    this.jackpotTicks = Math.max(this.jackpotTicks, spec.jackpotTicks);
    this.shields += spec.shields;
    if (this.score > this.highScore) {
      this.highScore = this.score;
      writeHighScore(this.highScore);
    }
  }

  private decayBoosts(): void {
    if (this.hasteTicks > 0) this.hasteTicks -= 1;
    if (this.jackpotTicks > 0) this.jackpotTicks -= 1;
  }

  private die(): "die" {
    this.alive = false;
    this.paused = false;
    return "die";
  }

  private placeFood(): void {
    const occupied = new Set(this.snake.map((part) => `${part.x},${part.y}`));
    const free: Point[] = [];
    for (let y = 0; y < this.gridSize; y += 1) {
      for (let x = 0; x < this.gridSize; x += 1) {
        if (!occupied.has(`${x},${y}`)) free.push({ x, y });
      }
    }
    const spot = free[Math.floor(this.random() * free.length)] ?? { x: 0, y: 0 };
    const spec = pickWeighted(FRUIT_TABLE, this.random);
    this.food = { x: spot.x, y: spot.y, kind: spec.kind };
  }
}

function readHighScore(): number {
  try {
    const saved = Number(globalThis.localStorage?.getItem(HIGH_SCORE_KEY) ?? 0);
    return Number.isFinite(saved) ? saved : 0;
  } catch {
    return 0;
  }
}

function writeHighScore(score: number): void {
  try {
    globalThis.localStorage?.setItem(HIGH_SCORE_KEY, String(score));
  } catch {
    // Ignore storage failures in private mode or non-browser tests.
  }
}
