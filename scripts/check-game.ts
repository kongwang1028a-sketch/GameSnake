import { SnakeGame } from "../src/game.ts";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

const idle = new SnakeGame();
idle.start();
for (let i = 0; i < 30; i += 1) {
  assert(idle.tick() === "idle", "snake must stay still until the first direction");
}
assert(idle.alive, "waiting snake must remain alive");
assert(idle.snake[0].x === 9 && idle.snake[0].y === 10, "head stays at the start cell");

const moving = new SnakeGame();
moving.start();
moving.queueDirection("right");
assert(!moving.awaitingInput, "first direction should start movement");

const first = moving.tick();
assert(first === "move" || first === "eat", `first tick should move, got ${first}`);
assert(moving.alive, "first tick must not kill the snake");
assert(moving.snake[0].x === 10, "head should step right from the start cell");

let died = false;
for (let i = 0; i < 20; i += 1) {
  if (moving.tick() === "die") {
    died = true;
    break;
  }
}
assert(died, "continuing right should eventually hit the wall");
assert(moving.score === 0 || moving.score > 0, "score remains a number");

console.log("game checks passed");
