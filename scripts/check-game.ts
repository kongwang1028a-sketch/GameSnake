import { SnakeGame } from "../src/game.ts";
import { FRUIT_TABLE, pickWeighted } from "../src/params.ts";

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

assert(pickWeighted(FRUIT_TABLE, () => 0).kind === "normal", "low rolls pick the common fruit");
assert(pickWeighted(FRUIT_TABLE, () => 0.999).kind === "jackpot", "high rolls pick the jackpot fruit");

const shielded = new SnakeGame(() => 0);
shielded.start();
shielded.queueDirection("right");
shielded.shields = 1;
shielded.snake = [{ x: 19, y: 10 }, { x: 18, y: 10 }, { x: 17, y: 10 }];
shielded.direction = "right";
assert(shielded.tick() === "move", "a shield should bounce off the wall");
assert(shielded.alive, "wall bounce must not kill the snake");
assert(shielded.shields === 0, "the shield charge should be consumed");
assert(shielded.direction === "left", "the snake should reverse after a shielded wall hit");

const jackpot = new SnakeGame(() => 0);
jackpot.start();
jackpot.queueDirection("right");
jackpot.setFoodForTest({ x: 10, y: 10, kind: "jackpot" });
assert(jackpot.tick() === "eat", "the snake should eat a jackpot on the next cell");
assert(jackpot.score === 200, "jackpot fruit should award 200");
assert(jackpot.jackpotTicks > 0, "jackpot should start a rush");

let died = false;
const wall = new SnakeGame();
wall.start();
wall.queueDirection("right");
for (let i = 0; i < 20; i += 1) {
  if (wall.tick() === "die") {
    died = true;
    break;
  }
}
assert(died, "continuing right without a shield should eventually hit the wall");

console.log("game checks passed");
