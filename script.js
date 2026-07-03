const inputLua = document.getElementById("inputLua");
const outputLua = document.getElementById("outputLua");
const statusText = document.getElementById("statusText");
const obfuscateBtn = document.getElementById("obfuscateBtn");
const copyBtn = document.getElementById("copyBtn");
const downloadBtn = document.getElementById("downloadBtn");
const clearBtn = document.getElementById("clearBtn");
const sampleBtn = document.getElementById("sampleBtn");
const toast = document.getElementById("toast");

const LUA_RESERVED = new Set([
  "and", "break", "do", "else", "elseif", "end", "false", "for", "function",
  "goto", "if", "in", "local", "nil", "not", "or", "repeat", "return",
  "then", "true", "until", "while"
]);

function showToast(text) {
  toast.textContent = text;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 1400);
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

function chunkNumbers(numbers, perLine = 18) {
  const lines = [];

  for (let i = 0; i < numbers.length; i += perLine) {
    const part = numbers.slice(i, i + perLine).join(", ");
    lines.push("  " + part + ",");
  }

  return lines.join("\\n");
}

function makeObfuscatedLua(sourceText) {
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
  const program = [];

  for (let i = 0; i < bytes.length; i++) {
    const index = i + 1;
    const encrypted = (bytes[i] + key + ((index * step) % 251)) % 256;
    program.push(opByte, encrypted);
  }

  program.push(opRun);

  const programText = chunkNumbers(program);

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

function runObfuscate() {
  const source = inputLua.value;

  if (!source.trim()) {
    outputLua.value = "";
    statusText.textContent = "請先輸入 Lua";
    showToast("請先輸入 Lua 程式");
    return;
  }

  try {
    const result = makeObfuscatedLua(source);
    outputLua.value = result;
    statusText.textContent = `完成：${result.length} 字元`;
    showToast("混淆完成");
  } catch (error) {
    outputLua.value = "";
    statusText.textContent = "混淆失敗";
    showToast("混淆失敗");
  }
}

async function copyOutput() {
  if (!outputLua.value) {
    showToast("沒有可複製的結果");
    return;
  }

  try {
    await navigator.clipboard.writeText(outputLua.value);
    showToast("已複製");
  } catch (error) {
    showToast("複製失敗，請手動複製");
  }
}

function downloadOutput() {
  if (!outputLua.value) {
    showToast("沒有可下載的結果");
    return;
  }

  const blob = new Blob([outputLua.value], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "output_obfuscated.lua";
  document.body.appendChild(a);
  a.click();
  a.remove();

  URL.revokeObjectURL(url);
  showToast("已下載");
}

function clearAll() {
  inputLua.value = "";
  outputLua.value = "";
  statusText.textContent = "等待輸入";
  showToast("已清空");
}

function loadSample() {
  inputLua.value = `print("Hello Lua VM Obfuscator!")
print("中文測試：不同設備只要支援 load/loadstring 就比較不容易出錯")

local a = 10
local b = 25
print("a + b =", a + b)

for i = 1, 3 do
  print("count", i)
end`;
  showToast("已放入範例");
}

obfuscateBtn.addEventListener("click", runObfuscate);
copyBtn.addEventListener("click", copyOutput);
downloadBtn.addEventListener("click", downloadOutput);
clearBtn.addEventListener("click", clearAll);
sampleBtn.addEventListener("click", loadSample);
