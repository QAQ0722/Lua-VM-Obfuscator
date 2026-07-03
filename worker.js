const LUA_RESERVED = new Set([
  "and", "break", "do", "else", "elseif", "end", "false", "for", "function",
  "goto", "if", "in", "local", "nil", "not", "or", "repeat", "return",
  "then", "true", "until", "while"
]);

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
    if (i % 9000 === 0) {
      postMessage({
        type: "progress",
        progress: 55 + Math.min(30, Math.floor((i / Math.max(numbers.length, 1)) * 30)),
        message: "正在建立輸出內容..."
      });
    }

    const part = numbers.slice(i, i + perLine).join(", ");
    lines.push("  " + part + ",");
  }

  return lines.join("\n");
}

function makeObfuscatedLua(sourceText) {
  postMessage({
    type: "progress",
    progress: 20,
    message: "正在轉成 UTF-8 bytes..."
  });

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

  postMessage({
    type: "progress",
    progress: 30,
    message: "正在建立 VM 指令..."
  });

  let p = 0;

  for (let i = 0; i < bytes.length; i++) {
    if (i % 12000 === 0) {
      postMessage({
        type: "progress",
        progress: 30 + Math.min(25, Math.floor((i / Math.max(bytes.length, 1)) * 25)),
        message: "正在建立 VM 指令..."
      });
    }

    const index = i + 1;
    const encrypted = (bytes[i] + key + ((index * step) % 251)) % 256;
    program[p++] = opByte;
    program[p++] = encrypted;
  }

  program[p] = opRun;

  const programText = chunkNumbers(program);

  postMessage({
    type: "progress",
    progress: 88,
    message: "正在封裝 Lua Loader..."
  });

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

self.onmessage = function(event) {
  const data = event.data;

  if (data.type !== "obfuscate") {
    return;
  }

  try {
    const output = makeObfuscatedLua(data.sourceText);

    postMessage({
      type: "done",
      output
    });
  } catch (error) {
    postMessage({
      type: "error",
      message: error.message || String(error)
    });
  }
};
