import type { Direction } from "./game";

const KEY_MAP: Record<string, Direction> = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
  w: "up",
  a: "left",
  s: "down",
  d: "right",
  W: "up",
  A: "left",
  S: "down",
  D: "right",
};

export function bindInput(options: {
  canvas: HTMLCanvasElement;
  onDirection: (dir: Direction) => void;
  onPause: () => void;
  onConfirm: () => void;
}): () => void {
  const onKey = (event: KeyboardEvent) => {
    const target = event.target;
    if (
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      target instanceof HTMLSelectElement
    ) {
      return;
    }
    if (event.key === " " || event.code === "Space") {
      event.preventDefault();
      options.onPause();
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      options.onConfirm();
      return;
    }
    const dir = KEY_MAP[event.key];
    if (!dir) return;
    event.preventDefault();
    options.onDirection(dir);
  };

  let startX = 0;
  let startY = 0;
  let tracking = false;

  const onTouchStart = (event: TouchEvent) => {
    const touch = event.changedTouches[0];
    if (!touch) return;
    tracking = true;
    startX = touch.clientX;
    startY = touch.clientY;
  };

  const onTouchEnd = (event: TouchEvent) => {
    if (!tracking) return;
    tracking = false;
    const touch = event.changedTouches[0];
    if (!touch) return;
    const dx = touch.clientX - startX;
    const dy = touch.clientY - startY;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
    if (Math.abs(dx) > Math.abs(dy)) {
      options.onDirection(dx > 0 ? "right" : "left");
    } else {
      options.onDirection(dy > 0 ? "down" : "up");
    }
  };

  window.addEventListener("keydown", onKey);
  options.canvas.addEventListener("touchstart", onTouchStart, { passive: true });
  options.canvas.addEventListener("touchend", onTouchEnd, { passive: true });

  return () => {
    window.removeEventListener("keydown", onKey);
    options.canvas.removeEventListener("touchstart", onTouchStart);
    options.canvas.removeEventListener("touchend", onTouchEnd);
  };
}
