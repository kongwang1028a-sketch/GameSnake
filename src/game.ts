export type Direction = "up" | "down" | "left" | "right";
export type Point = { x: number; y: number };

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
  readonly gridSize = 20;
  snake: Point[] = [];
  direction: Direction = "right";
  food: Point = { x: 10, y: 10 };
  score = 0;
  highScore = 0;
  alive = true;
  started = false;
  paused = false;
  awaitingInput = false;

  private pending: Direction[] = [];

  constructor() {
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
      return this.die();
    }

    const eating = nextHead.x === this.food.x && nextHead.y === this.food.y;
    const body = eating ? this.snake : this.snake.slice(0, -1);
    if (body.some((part) => part.x === nextHead.x && part.y === nextHead.y)) {
      return this.die();
    }

    this.snake.unshift(nextHead);

    if (eating) {
      this.score += 10;
      if (this.score > this.highScore) {
        this.highScore = this.score;
        writeHighScore(this.highScore);
      }
      this.placeFood();
      return "eat";
    }

    this.snake.pop();
    return "move";
  }

  speedMs(): number {
    const steps = Math.floor(this.score / 40);
    return Math.max(70, 160 - steps * 12);
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
    this.food = free[Math.floor(Math.random() * free.length)] ?? { x: 0, y: 0 };
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
