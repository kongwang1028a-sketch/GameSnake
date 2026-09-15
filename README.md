# 貪食蛇

線上遊玩：[kongwang1028a-sketch.github.io/GameSnake](https://kongwang1028a-sketch.github.io/GameSnake/)

倉庫：[github.com/kongwang1028a-sketch/GameSnake](https://github.com/kongwang1028a-sketch/GameSnake)

瀏覽器就能玩的經典貪食蛇：吃果實變長、撞牆或咬到自己就結束。分數會存進瀏覽器，下次進來還看得到最高分。

## 操作

- 鍵盤：方向鍵或 `WASD` 轉向；開始後要先按一次方向鍵，蛇才會出發
- 空白鍵：暫停／繼續
- Enter：開始或再玩一次
- 手機：畫面滑動，或用下方方向鈕

分數愈高，蛇移動愈快。

## 本機執行

需要 Node.js 18 以上。

```bash
npm install
npm run dev
```

瀏覽器開啟終端機顯示的網址（預設 `http://localhost:4821`）。

正式建置：

```bash
npm run build
npm run preview
```
