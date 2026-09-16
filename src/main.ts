import "./style.css";
import { GameAudio } from "./audio";
import { SnakeGame, type Direction } from "./game";
import { bindInput } from "./input";
import {
  DEFAULT_FRUIT_TABLE,
  fruitPercents,
  getFruitWeights,
  resetFruitWeights,
  setFruitWeights,
  type FruitKind,
} from "./params.ts";
import { ChanceMaze } from "./maze.ts";
import { Renderer } from "./render";

const canvas = document.querySelector<HTMLCanvasElement>("#board")!;
const overlay = document.querySelector<HTMLDivElement>("#overlay")!;
const overlayKicker = document.querySelector<HTMLParagraphElement>("#overlay-kicker")!;
const overlayTitle = document.querySelector<HTMLHeadingElement>("#overlay-title")!;
const overlayMsg = document.querySelector<HTMLParagraphElement>("#overlay-msg")!;
const overlayScore = document.querySelector<HTMLParagraphElement>("#overlay-score")!;
const overlayHint = document.querySelector<HTMLParagraphElement>("#overlay-hint")!;
const playHint = document.querySelector<HTMLParagraphElement>("#play-hint")!;
const primaryBtn = document.querySelector<HTMLButtonElement>("#primary-btn")!;
const pauseBtn = document.querySelector<HTMLButtonElement>("#pause-btn")!;
const scoreEl = document.querySelector<HTMLElement>("#score")!;
const highEl = document.querySelector<HTMLElement>("#high")!;
const lengthEl = document.querySelector<HTMLElement>("#length")!;
const shieldsEl = document.querySelector<HTMLElement>("#shields")!;
const statusEl = document.querySelector<HTMLElement>("#status")!;
const pickupEl = document.querySelector<HTMLParagraphElement>("#pickup")!;
const weightList = document.querySelector<HTMLUListElement>("#weight-list")!;
const resetWeightsBtn = document.querySelector<HTMLButtonElement>("#reset-weights")!;

const game = new SnakeGame();
const renderer = new Renderer(canvas);
const audio = new GameAudio();
let maze: ChanceMaze | null = null;

let lastTick = 0;
let raf = 0;

function updateHud(): void {
  scoreEl.textContent = String(game.score);
  highEl.textContent = String(game.highScore);
  lengthEl.textContent = String(game.snake.length);
  shieldsEl.textContent = String(game.shields);
  statusEl.textContent = game.statusLabel();
  pauseBtn.textContent = (maze?.isPaused() ?? game.paused) ? "繼續" : "暫停";
  if (maze && !maze.finished) {
    const seconds = Math.ceil(maze.remainingMs(performance.now()) / 1000);
    playHint.classList.remove("hidden");
    playHint.textContent = `迷宮 ${seconds} 秒 · 寶箱 ${maze.openedCount()}/3 · 走到綠點離開`;
    return;
  }
  playHint.classList.toggle(
    "hidden",
    !game.started || !game.alive || game.paused || !game.awaitingInput,
  );
  if (game.awaitingInput && game.started && game.alive && !game.paused) {
    playHint.textContent = "按方向鍵或 WASD 開始移動";
  }
}

function showStart(): void {
  overlay.classList.remove("hidden");
  overlayKicker.textContent = "機率街機";
  overlayTitle.textContent = "貪食蛇";
  overlayMsg.textContent = "吃到橙色特殊果會進入短局機率迷宮。沿路開三個寶箱，用同一套權重開獎。";
  overlayScore.classList.add("hidden");
  overlayHint.textContent = "開始後先按方向鍵或螢幕按鈕，蛇才會出發";
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

function showPickup(): void {
  const pickup = game.lastPickup;
  if (!pickup) return;
  pickupEl.textContent = pickup.score > 0 ? `${pickup.name} +${pickup.score}` : pickup.name;
  pickupEl.style.color = pickup.color;
  pickupEl.classList.remove("hidden");
  window.clearTimeout(Number(pickupEl.dataset.timer));
  const timer = window.setTimeout(() => pickupEl.classList.add("hidden"), 900);
  pickupEl.dataset.timer = String(timer);
}

function startGame(): void {
  audio.unlock();
  audio.start();
  maze = null;
  game.start();
  lastTick = performance.now();
  hideOverlay();
  updateHud();
}

function confirmAction(): void {
  audio.unlock();
  if (maze && !maze.finished) {
    if (maze.isPaused()) pauseAction();
    return;
  }
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
  if (maze && !maze.finished) {
    maze.togglePause(performance.now());
    if (maze.isPaused()) {
      overlay.classList.remove("hidden");
      overlayKicker.textContent = "迷宮暫停";
      overlayTitle.textContent = "先停一下";
      overlayMsg.textContent = "再按暫停就能繼續開寶箱。";
      overlayScore.classList.add("hidden");
      overlayHint.textContent = `已開 ${maze.openedCount()}/3 個寶箱`;
      primaryBtn.textContent = "繼續迷宮";
    } else {
      hideOverlay();
    }
    updateHud();
    return;
  }
  if (!game.started || !game.alive) return;
  game.togglePause();
  if (game.paused) showPause();
  else hideOverlay();
  updateHud();
}

function enterMaze(now: number): void {
  maze = new ChanceMaze();
  maze.start(now);
  hideOverlay();
  updateHud();
}

function finishMaze(): void {
  maze = null;
  game.leaveMaze();
  hideOverlay();
  updateHud();
}

function onDirection(dir: Direction): void {
  if (maze && !maze.finished) {
    if (maze.isPaused()) return;
    const result = maze.move(dir);
    if (result.prize) {
      game.applyPrize(result.prize);
      audio.eat(result.prize.kind);
      showPickup();
    }
    if (result.finished) finishMaze();
    updateHud();
    return;
  }
  if (!game.started || !game.alive) return;
  if (game.paused) {
    game.togglePause();
    hideOverlay();
  }
  const wasWaiting = game.awaitingInput;
  game.queueDirection(dir);
  if (wasWaiting && !game.awaitingInput) {
    lastTick = performance.now() - game.speedMs();
  }
  updateHud();
}

function loop(now: number): void {
  if (maze) {
    maze.update(now);
    renderer.drawMaze(maze, now);
    if (maze.finished) finishMaze();
    updateHud();
    raf = requestAnimationFrame(loop);
    return;
  }
  renderer.draw(game, now);
  if (game.started && game.alive && !game.paused && now - lastTick >= game.speedMs()) {
    const result = game.tick();
    lastTick = now;
    if (result === "eat") {
      audio.eat(game.lastPickup?.kind ?? "normal");
      showPickup();
    }
    if (result === "maze") {
      audio.eat("jackpot");
      showPickup();
      enterMaze(now);
    }
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

function renderWeightEditor(): void {
  const weights = getFruitWeights();
  const percents = fruitPercents();
  weightList.innerHTML = DEFAULT_FRUIT_TABLE.map((item) => `
    <li>
      <i class="dot ${item.kind}"></i>
      <label for="weight-${item.kind}">${item.kind === "jackpot" ? `${item.name} · 迷宮` : `${item.name} · ${item.score}分`}</label>
      <input id="weight-${item.kind}" type="number" min="0" max="999" inputmode="numeric" data-kind="${item.kind}" value="${weights[item.kind]}" />
      <strong class="pct">${percents[item.kind]}%</strong>
    </li>
  `).join("");
}

function refreshPercents(syncInputs = false): void {
  const percents = fruitPercents();
  const weights = getFruitWeights();
  weightList.querySelectorAll<HTMLInputElement>("input[data-kind]").forEach((input) => {
    const kind = input.dataset.kind as FruitKind;
    if (syncInputs) input.value = String(weights[kind]);
    const pct = input.parentElement?.querySelector(".pct");
    if (pct) pct.textContent = `${percents[kind]}%`;
  });
}

weightList.addEventListener("input", (event) => {
  const input = event.target;
  if (!(input instanceof HTMLInputElement)) return;
  const kind = input.dataset.kind as FruitKind;
  setFruitWeights({ [kind]: Number(input.value) });
  refreshPercents();
});

weightList.addEventListener("change", () => refreshPercents(true));

resetWeightsBtn.addEventListener("click", () => {
  resetFruitWeights();
  renderWeightEditor();
});

renderWeightEditor();
