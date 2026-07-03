Lua VM 混淆器：本機可用檔案版

這版修正：
- 不使用 worker.js。
- 可以直接用 file:// 開啟 index.html。
- 不會出現 Failed to construct 'Worker' 錯誤。
- 使用分段處理，避免畫面長時間完全卡死。

資料夾內容：
- index.html
- style.css
- script.js
- README.txt

使用：
1. 直接開 index.html。
2. 選擇 .lua 或 .txt。
3. 按開始 VM 混淆。
4. 按下載混淆結果。

GitHub Pages：
上傳這 4 個檔案到根目錄即可。
如果不是新版，網址後面加 ?v=5 或 Ctrl + F5。
