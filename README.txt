Lua VM 混淆器：檔案導入下載版

資料夾內容：
- index.html
- style.css
- script.js
- worker.js
- README.txt

這版改動：
- 不再把原始 Lua 和完整混淆結果放在大文字框。
- 使用「選擇檔案」導入 Lua。
- 使用 Web Worker 在背景混淆，避免主畫面卡死。
- 混淆完成後用下載方式取得 .lua。
- 頁面只顯示前 2500 字元預覽。

使用方式：
1. 打開 index.html。
2. 選擇 .lua 或 .txt 檔案。
3. 按「開始 VM 混淆」。
4. 完成後按「下載混淆結果」。

GitHub Pages：
請把這 5 個檔案全部上傳到 repository 根目錄：
- index.html
- style.css
- script.js
- worker.js
- README.txt

注意：
- 因為這版用了 worker.js，GitHub 上一定要一起上傳 worker.js。
- 開網站後如果不是新版，請 Ctrl + F5，或網址後面加 ?v=4。
- 混淆後的 Lua 仍需要目標環境支援 loadstring 或 load。
