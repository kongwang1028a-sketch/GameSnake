# 貪食蛇

線上遊玩：[kongwang1028a-sketch.github.io/GameSnake](https://kongwang1028a-sketch.github.io/GameSnake/)

倉庫：[github.com/kongwang1028a-sketch/GameSnake](https://github.com/kongwang1028a-sketch/GameSnake)

瀏覽器就能玩的經典貪食蛇，果實用權重抽出。吃到橙色特殊果會進入 30 秒機率迷宮，沿路三個寶箱用同一套權重開獎。

## 果實獎池

權重可在遊戲畫面的「果實獎池」直接改，會存進這個瀏覽器。也可以按「恢復預設」。預設值如下：

| 果實 | 權重 | 效果 |
|------|------|------|
| 普通 | 67 | +10 分、變長 |
| 金色 | 18 | +50 分 |
| 加速 | 7 | 短暫變快 |
| 護盾 | 4 | 可擋一次撞牆 |
| 特殊 | 3 | 進入短局機率迷宮 |

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

## 可見性

遊戲頁已加上 `noindex` 與 `robots.txt`，請搜尋引擎不要收錄。知道網址的人仍可打開。倉庫若維持公開，GitHub 上還是搜得到專案名稱。
