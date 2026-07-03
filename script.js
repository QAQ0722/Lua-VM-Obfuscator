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
let isRunning = false;

const LUA_RESERVED = new Set([
  "and", "break", "do", "else", "elseif", "end", "false", "for", "function",
  "goto", "if", "in", "local", "nil", "not", "or", "repeat", "return",
  "then", "true", "until", "while"
]);

function sleep(ms = 0) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

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

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomName(used, length = 11) {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

  while (true) {
    let name = "_";

    for (let i = 0; i < length; i++) {
      name += chars[randomInt(0, chars.length - 1)];
    }

    if (!used.has(name) && !LUA_RESERVED.has(name)) {
      used.add(name);
      return name;
    }
  }
}

async function makeProgramText(numbers, perLine = 18) {
  const lines = [];

  for (let i = 0; i < numbers.length; i += perLine) {
    if (i % 12000 === 0) {
      setProgress(55 + Math.min(30, Math.floor((i / Math.max(numbers.length, 1)) * 30)));
      statusText.textContent = "正在建立輸出內容...";
      await sleep(0);
    }

    lines.push("  " + numbers.slice(i, i + perLine).join(", ") + ",");
  }

  return lines.join("\n");
}

async function makeObfuscatedLua(sourceText) {
  statusText.textContent = "正在轉成 UTF-8 bytes...";
  setProgress(15);
  await sleep(0);

  const bytes = new TextEncoder().encode(sourceText);
  const used = new Set();

  const nProgram = randomName(used);
  const nIp = randomName(used);
  const nOp = randomName(used);
  const nOut = randomName(used);
  const nCount = randomName(used);
  const nValue = randomName(used);
  const nByte = randomName(used);
  const nSrc = randomName(used);
  const nLoader = randomName(used);
  const nFn = randomName(used);
  const nErr = randomName(used);
  const nDecode = randomName(used);

  const opByte = randomInt(30, 220);
  let opRun = randomInt(30, 220);

  while (opRun === opByte) {
    opRun = randomInt(30, 220);
  }

  const key = randomInt(1, 255);
  const step = randomInt(3, 250);
  const program = new Array(bytes.length * 2 + 1);

  statusText.textContent = "正在建立 VM 指令...";
  setProgress(25);
  await sleep(0);

  let p = 0;

  for (let i = 0; i < bytes.length; i++) {
    if (i % 8000 === 0) {
      setProgress(25 + Math.min(30, Math.floor((i / Math.max(bytes.length, 1)) * 30)));
      await sleep(0);
    }

    const index = i + 1;
    const encrypted = (bytes[i] + key + ((index * step) % 251)) % 256;
    program[p++] = opByte;
    program[p++] = encrypted;
  }

  program[p] = opRun;

  const programText = await makeProgramText(program);

  statusText.textContent = "正在封裝 Lua Loader...";
  setProgress(90);
  await sleep(0);

  return `--[[
Portable Lua VM Obfuscator Output
No bytecode / No string.dump / No bit32 / No utf8 library
Requirement: loadstring or load
]]

local ${nProgram} = {
${programText}
}

local ${nIp} = 1
local ${nOut} = {}
local ${nCount} = 0

local function ${nDecode}(${nValue}, ${nCount})
  return (${nValue} - ${key} - ((${nCount} * ${step}) % 251)) % 256
end

while true do
  local ${nOp} = ${nProgram}[${nIp}]
  ${nIp} = ${nIp} + 1

  if ${nOp} == ${opByte} then
    local ${nValue} = ${nProgram}[${nIp}]
    ${nIp} = ${nIp} + 1

    ${nCount} = ${nCount} + 1
    local ${nByte} = ${nDecode}(${nValue}, ${nCount})

    ${nOut}[#${nOut} + 1] = string.char(${nByte})

  elseif ${nOp} == ${opRun} then
    local ${nSrc} = table.concat(${nOut})
    local ${nLoader} = loadstring or load

    if not ${nLoader} then
      error("This Lua environment does not support loadstring or load.")
    end

    local ${nFn}, ${nErr} = ${nLoader}(${nSrc})

    if not ${nFn} then
      error(${nErr})
    end

    return ${nFn}()

  else
    error("VM error: invalid opcode")
  end
end
`;
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
  if (!selectedFile || isRunning) {
    return;
  }

  resetOutput();
  isRunning = true;
  obfuscateBtn.disabled = true;
  downloadBtn.disabled = true;

  try {
    statusText.textContent = "正在讀取檔案...";
    setProgress(5);
    await sleep(0);

    const sourceText = await selectedFile.text();

    if (!sourceText.trim()) {
      statusText.textContent = "檔案是空的";
      showToast("檔案是空的");
      return;
    }

    const output = await makeObfuscatedLua(sourceText);

    outputBlob = new Blob([output], { type: "text/plain;charset=utf-8" });
    outputSize.textContent = formatBytes(outputBlob.size);
    previewText.textContent = output.slice(0, 2500) + (output.length > 2500 ? "\n\n...預覽結束，完整內容請下載..." : "");
    downloadBtn.disabled = false;
    statusText.textContent = "混淆完成，可以下載";
    setProgress(100);
    showToast("混淆完成");
  } catch (error) {
    statusText.textContent = "混淆失敗";
    previewText.textContent = error.message || String(error);
    setProgress(0);
    showToast("混淆失敗");
  } finally {
    isRunning = false;
    obfuscateBtn.disabled = false;
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
  if (isRunning) {
    showToast("正在處理中，請等完成");
    return;
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
