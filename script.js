const fileInput = document.getElementById("fileInput");
const fileName = document.getElementById("fileName");
const fileInfo = document.getElementById("fileInfo");

const obfuscateBtn = document.getElementById("obfuscateBtn");
const downloadBtn = document.getElementById("downloadBtn");
const resetBtn = document.getElementById("resetBtn");

const statusText = document.getElementById("statusText");
const progressBar = document.getElementById("progressBar");
const inputSize = document.getElementById("inputSize");
const outputSize = document.getElementById("outputSize");
const previewText = document.getElementById("previewText");
const toast = document.getElementById("toast");

let selectedFile = null;
let outputBlob = null;
let outputFileName = "output_obfuscated.lua";
let worker = null;

function showToast(text) {
  toast.textContent = text;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 1400);
}

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
  return (bytes / 1024 / 1024).toFixed(2) + " MB";
}

function setProgress(value) {
  progressBar.style.width = Math.max(0, Math.min(100, value)) + "%";
}

function resetOutput() {
  outputBlob = null;
  downloadBtn.disabled = true;
  outputSize.textContent = "0 KB";
  previewText.textContent = "混淆完成後，這裡只會顯示前面一小段預覽，完整內容請用下載。";
  setProgress(0);
}

fileInput.addEventListener("change", () => {
  const file = fileInput.files[0];

  selectedFile = file || null;
  resetOutput();

  if (!selectedFile) {
    fileName.textContent = "點這裡選擇 Lua 檔案";
    fileInfo.textContent = "尚未選擇檔案";
    inputSize.textContent = "0 KB";
    obfuscateBtn.disabled = true;
    statusText.textContent = "等待導入檔案";
    return;
  }

  fileName.textContent = selectedFile.name;
  fileInfo.textContent = `${formatBytes(selectedFile.size)} ｜ ${selectedFile.type || "Lua/Text file"}`;
  inputSize.textContent = formatBytes(selectedFile.size);
  obfuscateBtn.disabled = false;
  statusText.textContent = "檔案已導入，可以開始混淆";
  outputFileName = selectedFile.name.replace(/\.(lua|txt)$/i, "") + "_obfuscated.lua";
});

obfuscateBtn.addEventListener("click", async () => {
  if (!selectedFile) {
    showToast("請先選擇檔案");
    return;
  }

  resetOutput();

  obfuscateBtn.disabled = true;
  statusText.textContent = "正在讀取檔案...";
  setProgress(5);

  try {
    const sourceText = await selectedFile.text();

    if (!sourceText.trim()) {
      statusText.textContent = "檔案是空的";
      showToast("檔案是空的");
      obfuscateBtn.disabled = false;
      return;
    }

    statusText.textContent = "正在背景混淆...";
    setProgress(15);

    if (worker) {
      worker.terminate();
    }

    worker = new Worker("worker.js?v=4");

    worker.onmessage = (event) => {
      const data = event.data;

      if (data.type === "progress") {
        statusText.textContent = data.message;
        setProgress(data.progress);
      }

      if (data.type === "done") {
        outputBlob = new Blob([data.output], { type: "text/plain;charset=utf-8" });
        outputSize.textContent = formatBytes(outputBlob.size);
        previewText.textContent = data.output.slice(0, 2500) + (data.output.length > 2500 ? "\n\n...預覽結束，完整內容請下載..." : "");
        downloadBtn.disabled = false;
        obfuscateBtn.disabled = false;
        statusText.textContent = "混淆完成，可以下載";
        setProgress(100);
        showToast("混淆完成");
        worker.terminate();
        worker = null;
      }

      if (data.type === "error") {
        statusText.textContent = "混淆失敗";
        previewText.textContent = data.message;
        obfuscateBtn.disabled = false;
        setProgress(0);
        showToast("混淆失敗");
        worker.terminate();
        worker = null;
      }
    };

    worker.onerror = (error) => {
      statusText.textContent = "Worker 發生錯誤";
      previewText.textContent = error.message || "未知錯誤";
      obfuscateBtn.disabled = false;
      setProgress(0);
      showToast("混淆失敗");
      if (worker) {
        worker.terminate();
        worker = null;
      }
    };

    worker.postMessage({
      type: "obfuscate",
      sourceText
    });
  } catch (error) {
    statusText.textContent = "讀取失敗";
    previewText.textContent = error.message || "讀取檔案失敗";
    obfuscateBtn.disabled = false;
    setProgress(0);
  }
});

downloadBtn.addEventListener("click", () => {
  if (!outputBlob) {
    showToast("沒有可下載的結果");
    return;
  }

  const url = URL.createObjectURL(outputBlob);
  const a = document.createElement("a");
  a.href = url;
  a.download = outputFileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  showToast("已下載");
});

resetBtn.addEventListener("click", () => {
  if (worker) {
    worker.terminate();
    worker = null;
  }

  selectedFile = null;
  fileInput.value = "";
  fileName.textContent = "點這裡選擇 Lua 檔案";
  fileInfo.textContent = "尚未選擇檔案";
  inputSize.textContent = "0 KB";
  obfuscateBtn.disabled = true;
  statusText.textContent = "等待導入檔案";
  resetOutput();
  showToast("已重設");
});
