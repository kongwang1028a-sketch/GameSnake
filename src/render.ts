import type { Direction, SnakeGame } from "./game";
import { fruitByKind } from "./params.ts";

const COLORS = {
  board: "#0b1c14",
  rushBoard: "#1a120c",
  grid: "rgba(124, 255, 107, 0.06)",
  snakeHead: "#c8ff8a",
  snakeTail: "#217a38",
  shieldHead: "#d7dcff",
  eye: "#07140f",
};

export class Renderer {
  private readonly ctx: CanvasRenderingContext2D;

  constructor(private readonly canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("無法建立畫布");
    this.ctx = ctx;
  }

  resize(): void {
    const size = Math.min(520, Math.floor(window.innerWidth - 32), Math.floor(window.innerHeight - 320));
    const next = Math.max(280, size);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.style.width = `${next}px`;
    this.canvas.style.height = `${next}px`;
    this.canvas.width = Math.floor(next * dpr);
    this.canvas.height = Math.floor(next * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  draw(game: SnakeGame, now: number): void {
    const cssSize = this.canvas.clientWidth;
    const cell = cssSize / game.gridSize;
    this.ctx.clearRect(0, 0, cssSize, cssSize);
    this.drawBoard(cssSize, cell, game.gridSize, game.jackpotTicks > 0);
    this.drawFood(game, cell, now);
    this.drawSnake(game, cell);
  }

  private drawBoard(size: number, cell: number, gridSize: number, rushing: boolean): void {
    this.ctx.fillStyle = rushing ? COLORS.rushBoard : COLORS.board;
    this.roundRect(0, 0, size, size, 18);
    this.ctx.fill();

    this.ctx.strokeStyle = rushing ? "rgba(255, 157, 61, 0.12)" : COLORS.grid;
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    for (let i = 1; i < gridSize; i += 1) {
      this.ctx.moveTo(i * cell, 0);
      this.ctx.lineTo(i * cell, size);
      this.ctx.moveTo(0, i * cell);
      this.ctx.lineTo(size, i * cell);
    }
    this.ctx.stroke();
  }

  private drawFood(game: SnakeGame, cell: number, now: number): void {
    const spec = fruitByKind(game.food.kind);
    const pulse = 0.85 + Math.sin(now / 180) * 0.15;
    const cx = game.food.x * cell + cell / 2;
    const cy = game.food.y * cell + cell / 2;
    const radius = cell * (game.food.kind === "jackpot" ? 0.32 : 0.28) * pulse;

    this.ctx.fillStyle = spec.glow;
    this.ctx.beginPath();
    this.ctx.arc(cx, cy, radius * 1.9, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = spec.color;
    this.ctx.beginPath();
    this.ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = "rgba(255,255,255,0.55)";
    this.ctx.beginPath();
    this.ctx.arc(cx - radius * 0.3, cy - radius * 0.3, radius * 0.28, 0, Math.PI * 2);
    this.ctx.fill();
  }

  private drawSnake(game: SnakeGame, cell: number): void {
    const shielded = game.shields > 0;
    game.snake.forEach((part, index) => {
      const t = game.snake.length === 1 ? 0 : index / (game.snake.length - 1);
      const color = mix(shielded ? COLORS.shieldHead : COLORS.snakeHead, COLORS.snakeTail, t);
      const pad = index === 0 ? cell * 0.08 : cell * 0.14;
      const x = part.x * cell + pad;
      const y = part.y * cell + pad;
      const size = cell - pad * 2;
      this.ctx.fillStyle = game.alive ? color : "#5a6b5e";
      this.roundRect(x, y, size, size, size * 0.28);
      this.ctx.fill();
    });

    const head = game.snake[0];
    const hx = head.x * cell + cell / 2;
    const hy = head.y * cell + cell / 2;
    const eyeOffset = cell * 0.16;
    const [ex, ey] = eyeShift(game.direction, eyeOffset);
    this.ctx.fillStyle = COLORS.eye;
    this.ctx.beginPath();
    this.ctx.arc(hx + ex - cell * 0.1, hy + ey, cell * 0.06, 0, Math.PI * 2);
    this.ctx.arc(hx + ex + cell * 0.1, hy + ey, cell * 0.06, 0, Math.PI * 2);
    this.ctx.fill();
  }

  private roundRect(x: number, y: number, w: number, h: number, r: number): void {
    const radius = Math.min(r, w / 2, h / 2);
    this.ctx.beginPath();
    this.ctx.moveTo(x + radius, y);
    this.ctx.arcTo(x + w, y, x + w, y + h, radius);
    this.ctx.arcTo(x + w, y + h, x, y + h, radius);
    this.ctx.arcTo(x, y + h, x, y, radius);
    this.ctx.arcTo(x, y, x + w, y, radius);
    this.ctx.closePath();
  }
}

function eyeShift(direction: Direction, offset: number): [number, number] {
  if (direction === "up") return [0, -offset];
  if (direction === "down") return [0, offset];
  if (direction === "left") return [-offset, 0];
  return [offset, 0];
}

function mix(a: string, b: string, t: number): string {
  const pa = hexToRgb(a);
  const pb = hexToRgb(b);
  const r = Math.round(pa[0] + (pb[0] - pa[0]) * t);
  const g = Math.round(pa[1] + (pb[1] - pa[1]) * t);
  const bl = Math.round(pa[2] + (pb[2] - pa[2]) * t);
  return `rgb(${r}, ${g}, ${bl})`;
}

function hexToRgb(hex: string): [number, number, number] {
  const value = hex.replace("#", "");
  return [
    parseInt(value.slice(0, 2), 16),
    parseInt(value.slice(2, 4), 16),
    parseInt(value.slice(4, 6), 16),
  ];
}
