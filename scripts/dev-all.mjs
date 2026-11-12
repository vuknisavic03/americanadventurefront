import { spawn } from "node:child_process";

const isWin = process.platform === "win32";
const npmCmd = isWin ? "npm.cmd" : "npm";

console.log("\x1b[36m%s\x1b[0m", "==================================================");
console.log("\x1b[36m%s\x1b[0m", " 🚀 American Adventure: Pokretanje FRONT + BACK    ");
console.log("\x1b[36m%s\x1b[0m", "==================================================");
console.log("   • Frontend:  http://localhost:5173/");
console.log("   • Backend:   http://localhost:3000/");
console.log("--------------------------------------------------\n");

function startProcess(name, args, color) {
  const fullCmd = `${npmCmd} ${args.join(" ")}`;
  const p = spawn(fullCmd, {
    stdio: ["inherit", "pipe", "pipe"],
    shell: true,
  });

  p.stdout.on("data", (data) => {
    const lines = data.toString().split("\n");
    for (const line of lines) {
      if (line.trim()) {
        console.log(`${color}[${name}]\x1b[0m ${line}`);
      }
    }
  });

  p.stderr.on("data", (data) => {
    const lines = data.toString().split("\n");
    for (const line of lines) {
      if (line.trim()) {
        console.error(`${color}[${name}]\x1b[0m ${line}`);
      }
    }
  });

  p.on("close", (code) => {
    console.log(`${color}[${name}]\x1b[0m proces završen (kod: ${code})`);
  });

  return p;
}

const back = startProcess("BACK", ["--prefix", "apps/platform", "run", "dev"], "\x1b[35m");
const front = startProcess("FRONT", ["--prefix", "front", "run", "dev"], "\x1b[32m");

function shutdown() {
  console.log("\n\x1b[33mZaustavljanje servera...\x1b[0m");
  if (isWin) {
    if (front.pid) spawn("taskkill", ["/pid", String(front.pid), "/f", "/t"]);
    if (back.pid) spawn("taskkill", ["/pid", String(back.pid), "/f", "/t"]);
  } else {
    front.kill();
    back.kill();
  }
  process.exit();
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
