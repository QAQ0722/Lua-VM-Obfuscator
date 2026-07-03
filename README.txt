Lua VM 混淆器網頁版

資料夾內容：
- index.html
- style.css
- script.js
- README.txt

使用方式：
1. 直接打開 index.html。
2. 把 Lua 程式貼進左邊。
3. 按「開始 VM 混淆」。
4. 複製或下載右邊結果。

GitHub Pages：
把這 4 個檔案上傳到 repository 根目錄即可。

特色：
- 不使用 Lua 二進位 bytecode。
- 不使用 string.dump。
- 不使用 bit32。
- 不使用 utf8 library。
- 使用 UTF-8 bytes 轉 VM 數字指令。
- 輸出 Lua 只使用基本 table / string.char / table.concat / loadstring 或 load。

限制：
執行混淆後的 Lua 時，目標環境必須支援 loadstring 或 load。
如果平台完全禁用 loadstring/load，這種 Loader 型混淆不能執行。
