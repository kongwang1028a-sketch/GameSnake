import { ChanceMaze, mazePrize } from "../src/maze.ts";
import { SnakeGame } from "../src/game.ts";
import { FRUIT_TABLE, getFruitTable, pickWeighted, resetFruitWeights, setFruitWeights } from "../src/params.ts";

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

resetFruitWeights();
setFruitWeights({ normal: 0, gold: 0, speed: 0, shield: 0, jackpot: 10 });
assert(pickWeighted(getFruitTable(), () => 0.5).kind === "jackpot", "custom weights should control the fruit pool");
resetFruitWeights();
assert(getFruitTable().find((item) => item.kind === "normal")?.weight === 67, "reset should restore default weights");

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

const special = new SnakeGame(() => 0);
special.start();
special.queueDirection("right");
special.setFoodForTest({ x: 10, y: 10, kind: "jackpot" });
assert(special.tick() === "maze", "special fruit should enter the probability maze");
assert(special.inMaze, "snake should freeze while the maze is active");
assert(special.score === 0, "maze entry should not award jackpot points immediately");

const maze = new ChanceMaze(() => 0);
maze.start(0);
assert(maze.chests.length === 3, "maze should have three chests");
maze.move("right");
maze.move("right");
const chestOpen = maze.move("right");
assert(chestOpen.prize?.kind === "normal", "the first chest should roll from the weight table");
assert(maze.openedCount() === 1, "walking onto a chest should open it");
assert(mazePrize("jackpot").score === 200, "a jackpot chest should pay 200 without nesting another maze");

maze.update(30_001);
assert(maze.finished && maze.finishReason === "time", "the maze should end when time runs out");

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
