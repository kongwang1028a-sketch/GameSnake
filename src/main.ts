import "./style.css";
import { GameAudio } from "./audio";
import { SnakeGame, type Direction } from "./game";
import { bindInput } from "./input";
import { Renderer } from "./render";

const canvas = document.querySelector<HTMLCanvasElement>("#board")!;
const overlay = document.querySelector<HTMLDivElement>("#overlay")!;
const overlayKicker = document.querySelector<HTMLParagraphElement>("#overlay-kicker")!;
const overlayTitle = document.querySelector<HTMLHeadingElement>("#overlay-title")!;
const overlayMsg = document.querySelector<HTMLParagraphElement>("#overlay-msg")!;
const overlayScore = document.querySelector<HTMLParagraphElement>("#overlay-score")!;
const overlayHint = document.querySelector<HTMLParagraphElement>("#overlay-hint")!;
const primaryBtn = document.querySelector<HTMLButtonElement>("#primary-btn")!;
const pauseBtn = document.querySelector<HTMLButtonElement>("#pause-btn")!;
const scoreEl = document.querySelector<HTMLElement>("#score")!;
const highEl = document.querySelector<HTMLElement>("#high")!;
const lengthEl = document.querySelector<HTMLElement>("#length")!;

const game = new SnakeGame();
const renderer = new Renderer(canvas);
const audio = new GameAudio();

let lastTick = 0;
let raf = 0;

function updateHud(): void {
  scoreEl.textContent = String(game.score);
  highEl.textContent = String(game.highScore);
  lengthEl.textContent = String(game.snake.length);
  pauseBtn.textContent = game.paused ? "繼續" : "暫停";
}

function showStart(): void {
  overlay.classList.remove("hidden");
  overlayKicker.textContent = "經典街機";
  overlayTitle.textContent = "貪食蛇";
  overlayMsg.textContent = "吃掉發光果實變長，撞牆或咬到自己就結束。";
  overlayScore.classList.add("hidden");
  overlayHint.textContent = "方向鍵或 WASD 移動 · 空白鍵暫停";
  primaryBtn.textContent = "開始遊戲";
}

function showPause(): void {
  overlay.classList.remove("hidden");
  overlayKicker.textContent = "先喘口氣";
  overlayTitle.textContent = "暫停中";
  overlayMsg.textContent = "再按一次空白鍵或下方按鈕就能繼續。";
  overlayScore.classList.add("hidden");
  overlayHint.textContent = "目前分數 " + game.score;
  primaryBtn.textContent = "繼續遊戲";
}

function showGameOver(): void {
  overlay.classList.remove("hidden");
  overlayKicker.textContent = "本局結束";
  overlayTitle.textContent = "遊戲結束";
  overlayMsg.textContent = game.score >= game.highScore && game.score > 0
    ? "新的最高分！再來一局挑戰自己。"
    : "再試一次，看看能走多遠。";
  overlayScore.classList.remove("hidden");
  overlayScore.textContent = `分數 ${game.score} · 最高 ${game.highScore}`;
  overlayHint.textContent = "按 Enter 立刻重來";
  primaryBtn.textContent = "再玩一次";
}

function hideOverlay(): void {
  overlay.classList.add("hidden");
}

function startGame(): void {
  audio.unlock();
  audio.start();
  game.start();
  lastTick = performance.now();
  hideOverlay();
  updateHud();
}

function confirmAction(): void {
  audio.unlock();
  if (!game.started || !game.alive) {
    startGame();
    return;
  }
  if (game.paused) {
    game.togglePause();
    hideOverlay();
    updateHud();
  }
}

function pauseAction(): void {
  if (!game.started || !game.alive) return;
  game.togglePause();
  if (game.paused) showPause();
  else hideOverlay();
  updateHud();
}

function onDirection(dir: Direction): void {
  if (!game.started || !game.alive) return;
  if (game.paused) {
    game.togglePause();
    hideOverlay();
    updateHud();
  }
  game.queueDirection(dir);
}

function loop(now: number): void {
  renderer.draw(game, now);
  if (game.started && game.alive && !game.paused && now - lastTick >= game.speedMs()) {
    const result = game.tick();
    lastTick = now;
    if (result === "eat") audio.eat();
    if (result === "die") {
      audio.die();
      showGameOver();
    }
    updateHud();
  }
  raf = requestAnimationFrame(loop);
}

primaryBtn.addEventListener("click", confirmAction);
pauseBtn.addEventListener("click", pauseAction);

document.querySelectorAll<HTMLButtonElement>("[data-dir]").forEach((button) => {
  const dir = button.dataset.dir as Direction;
  button.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    onDirection(dir);
  });
});

window.addEventListener("resize", () => renderer.resize());
bindInput({
  canvas,
  onDirection,
  onPause: pauseAction,
  onConfirm: confirmAction,
});

renderer.resize();
updateHud();
showStart();
raf = requestAnimationFrame(loop);

window.addEventListener("beforeunload", () => cancelAnimationFrame(raf));
