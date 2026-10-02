"use strict";
/* Headless tests: runs the real game code (src/levels.js + src/game.js) inside a Node vm
   with a stubbed DOM/canvas. No dependencies. Usage: node test/run.js */
const fs = require("fs"), path = require("path"), vm = require("vm");

const SRC = ["levels.js", "game.js"].map(f => fs.readFileSync(path.join(__dirname, "..", "src", f), "utf8"));

function boot(storage = {}) {
  const handlers = {};
  const ctx = new Proxy({}, {
    get: (t, k) => k in t ? t[k] : (k === "createLinearGradient" || k === "createRadialGradient")
      ? () => ({ addColorStop() {} }) : () => {},
    set: (t, k, v) => (t[k] = v, true)
  });
  const canvas = { width: 960, height: 540, style: {}, getContext: () => ctx, addEventListener() {} };
  const sb = {
    document: { getElementById: () => canvas },
    localStorage: { getItem: k => (k in storage ? storage[k] : null), setItem: (k, v) => { storage[k] = String(v); } },
    performance: { now: () => 0 },
    requestAnimationFrame() {},
    addEventListener: (t, f) => { (handlers[t] = handlers[t] || []).push(f); },
    devicePixelRatio: 1, console
  };
  sb.window = sb;
  const c = vm.createContext(sb);
  SRC.forEach((s, i) => vm.runInContext(s, c, { filename: ["levels.js", "game.js"][i] }));
  const g = {
    ctx: c, storage,
    run: code => vm.runInContext(code, c),
    fire(type, ev = {}) { (handlers[type] || []).forEach(f => f({ preventDefault() {}, repeat: false, ...ev })); },
    down(key, code, extra) { g.fire("keydown", { key, code: code || key, ...extra }); },
    up(key, code) { g.fire("keyup", { key, code: code || key }); },
    step(n = 1) { for (let i = 0; i < n; i++) vm.runInContext("update()", c); },
    until(cond, max) { for (let i = 0; i < max; i++) { if (g.run(cond)) return true; g.step(); } return !!g.run(cond); }
  };
  return g;
}

let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log("  ok   " + name); }
  catch (e) { failed++; console.log("  FAIL " + name + "\n       " + (e && e.message)); }
}
function eq(a, b, msg) { if (a !== b) throw new Error((msg || "expected equal") + ": got " + a + ", wanted " + b); }
function ok(c, msg) { if (!c) throw new Error(msg || "assertion failed"); }

/* a boring test arena: flat floor, nothing else */
const ARENA = { name: "00 · TEST", maxEchoes: 3, par: 1, hint: "", spawn: [60, 466],
  solids: [[0, 500, 960, 40], [300, 420, 100, 16]], plates: [], doors: [], lifts: [], lasers: [], exit: [900, 40] };
function arena(g, extra = {}) {
  g.ctx.__arena = Object.assign({}, ARENA, extra);
  g.run("LEVELS.push(__arena); loadLevel(LEVELS.length - 1); state = 'PLAY';");
}

console.log("level data");
{
  const g = boot();
  const n = g.run("LEVELS.length");
  const rects = lv => lv.solids.map(s => ({ x: s[0], y: s[1], w: s[2], h: s[3] }));
  const hit = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  for (let i = 0; i < n; i++) {
    test("level " + (i + 1) + " is well-formed", () => {
      const lv = g.run("LEVELS[" + i + "]"), W = 960, H = 540;
      ok(lv.name && lv.hint, "needs name and hint");
      ok(lv.par >= 1 && lv.par <= lv.maxEchoes + 0, "par must be 1..maxEchoes");
      const ids = new Set();
      for (const p of lv.plates) { ok(!ids.has(p.id), "duplicate id " + p.id); ids.add(p.id); }
      for (const t of lv.toggles || []) { ok(!ids.has(t.id), "duplicate id " + t.id); ids.add(t.id); }
      const reqs = [...lv.doors, ...lv.lifts].flatMap(o => o.req);
      for (const r of reqs) ok(ids.has(r.replace(/^!/, "")), "unknown signal " + r);
      for (const p of lv.plates) ok(reqs.some(r => r.replace(/^!/, "") === p.id), "plate " + p.id + " controls nothing");
      for (const l of lv.lasers) ok(l.duty > 0 && l.duty < l.period, "laser needs 0 < duty < period (always-on/off laser)");
      const player = { x: lv.spawn[0], y: lv.spawn[1], w: 26, h: 34 };
      const exit = { x: lv.exit[0], y: lv.exit[1], w: 34, h: 44 };
      for (const s of rects(lv)) {
        ok(!hit(player, s), "spawn inside a solid");
        ok(!hit(exit, s), "exit inside a solid");
        ok(s.x >= 0 && s.y >= 0 && s.x + s.w <= W && s.y + s.h <= H, "solid out of bounds");
      }
      ok(exit.x >= 0 && exit.x + exit.w <= W && exit.y >= 0 && exit.y + exit.h <= H, "exit out of bounds");
      for (const d of lv.doors) ok(d.x >= 0 && d.x + d.w <= W && d.y >= 0 && d.y + d.h <= H, "door out of bounds");
      for (const l of lv.lifts) ok(l.y - l.up >= 0 && l.x + l.w <= W, "lift travel leaves the screen");
      for (const c of lv.crates || []) for (const s of rects(lv)) ok(!hit({ x: c[0], y: c[1], w: 30, h: 30 }, s), "crate inside solid");
      for (const l of lv.lasers) ok(!hit(player, l), "laser on spawn");
    });
  }
  test("level names are unique", () => {
    const names = g.run("LEVELS.map(l => l.name)");
    eq(new Set(names).size, names.length);
  });
}

console.log("input");
test("Enter/click during play doesn't fire later in the pause menu", () => {
  const g = boot(); g.run("loadLevel(0); state = 'PLAY'");
  g.down("Enter"); g.step(); g.down("Escape"); g.step();
  eq(g.run("state"), "PAUSE");
  g.step(5);
  eq(g.run("state"), "PAUSE", "stale Enter resumed the game");
});
test("R pressed during CLEAR/REWIND doesn't leak into the next level", () => {
  const g = boot(); g.run("loadLevel(0); state = 'CLEAR'; clearT = 5");
  g.down("r"); g.down("z"); g.step(10);
  eq(g.run("state"), "PLAY"); eq(g.run("rPressed || zPressed"), false);
});
test("auto-repeat of R/Z/Enter is ignored", () => {
  const g = boot(); g.run("loadLevel(0); state = 'PLAY'");
  g.down("r", "KeyR", { repeat: true }); g.down("z", "KeyZ", { repeat: true }); g.down("Enter", "Enter", { repeat: true });
  eq(g.run("rPressed || zPressed || enterPressed"), false);
});
test("blur releases keys and pauses a live run", () => {
  const g = boot(); g.run("loadLevel(0); state = 'PLAY'");
  g.down("ArrowRight"); g.fire("blur");
  eq(g.run("state"), "PAUSE"); eq(g.run("liveInput()"), 0);
});
test("WASD works by physical key position (non-QWERTY layouts)", () => {
  const g = boot(); g.down("ö", "KeyA");
  eq(g.run("liveInput()") & 1, 1);
});
test("Tab and Backspace are swallowed", () => {
  const g = boot(); let blocked = 0;
  for (const k of ["Tab", "Backspace"]) g.fire("keydown", { key: k, code: k, preventDefault() { blocked++; } });
  eq(blocked, 2);
});

console.log("simulation");
test("level 1 is beatable: plate + echo + walk to the portal", () => {
  const g = boot(); g.run("loadLevel(0); state = 'PLAY'");
  g.down("ArrowRight");
  ok(g.until("player.x >= 345", 400), "never reached plate");
  g.up("ArrowRight"); g.step(20);
  g.down("r"); g.up("r"); g.step();
  eq(g.run("state"), "REWIND");
  ok(g.until("state === 'PLAY'", 600), "rewind never finished");
  eq(g.run("echoes.length"), 1);
  g.down("ArrowRight");
  ok(g.until("state === 'CLEAR'", 900), "level not cleared; player.x=" + g.run("player.x") + " deaths=" + g.run("deaths"));
  eq(g.run("results[0].folds"), 1); eq(g.run("results[0].medal"), "GOLD");
  ok(JSON.parse(g.storage["chronofold.save.v1"]).best[0], "best not saved");
});
test("echo replays the recorded run exactly (deterministic)", () => {
  const g = boot(); arena(g);
  let seed = 12345; const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
  const trace = [];
  for (let f = 0; f < 500; f++) {
    if (f % 12 === 0) {
      for (const k of ["ArrowLeft", "ArrowRight", "ArrowUp"]) g.up(k);
      for (const k of ["ArrowLeft", "ArrowRight", "ArrowUp"]) if (rnd() < 0.45) g.down(k);
    }
    g.step(); trace.push(g.run("[player.x, player.y]"));
  }
  for (const k of ["ArrowLeft", "ArrowRight", "ArrowUp"]) g.up(k);
  g.down("r"); g.up("r"); g.step(); ok(g.until("state === 'PLAY'", 900));
  for (let f = 0; f < 500; f++) {
    g.step();
    const [ex, ey] = g.run("[echoes[0].x, echoes[0].y]");
    if (Math.abs(ex - trace[f][0]) > 1e-9 || Math.abs(ey - trace[f][1]) > 1e-9) throw new Error("diverged at frame " + f);
  }
});
test("recording cap: input past the cap is dropped so the echo can't diverge", () => {
  const g = boot(); arena(g);
  g.step(2705);
  eq(g.run("recording.length"), 2700);
  g.down("ArrowRight"); const x0 = g.run("player.x"); g.step(60);
  eq(g.run("player.x"), x0, "player moved after the cap");
  eq(g.run("recording.length"), 2700);
});
test("echoes push and respect crates (no tunnelling)", () => {
  const g = boot(); arena(g, { crates: [[200, 470]], solids: [[0, 500, 960, 40]] });
  g.down("ArrowRight"); g.step(120); g.up("ArrowRight"); g.step(10);
  const x1 = g.run("crates[0].x"); ok(x1 > 200, "player didn't push the crate");
  g.down("r"); g.up("r"); g.step(); ok(g.until("state === 'PLAY'", 900));
  eq(g.run("crates[0].x"), x1, "crate must persist through the fold");
  let max = x1;
  for (let f = 0; f < 150; f++) {
    g.step();
    ok(!g.run("overlap(erect(echoes[0]), crect(crates[0]))"), "echo inside crate at frame " + f);
    max = Math.max(max, g.run("crates[0].x"));
  }
  ok(max > x1, "echo didn't push the crate");
});
test("a door closing on a motionless entity pushes it aside, not onto its roof", () => {
  const g = boot(); g.run("loadLevel(0); state = 'PLAY'; player.x = 598; player.y = 466; player.grounded = true");
  g.run("simulateFrame()");
  eq(g.run("player.y"), 466, "launched onto/under the door");
  ok(!g.run("overlap(erect(player), {x:600,y:170,w:16,h:330})"), "still inside the door");
});
test("lifts carry crates", () => {
  const g = boot(); g.run("loadLevel(3); state = 'PLAY'; crates = [{x:840, y:456, vy:0}]; player.x = 320; player.y = 466");
  g.step(1);
  const y0 = g.run("crates[0].y");
  g.step(60);
  ok(g.run("crates[0].y") < y0 - 30, "crate did not rise with the lift");
  eq(g.run("crates[0].y + 30"), g.run("levelLiftTop = LEVELS[3].lifts[0].y + liftOffs[0]"), "crate not resting on lift");
});
test("lasers hurt the player, not echoes (level 5)", () => {
  const g = boot(); g.run("loadLevel(4); state = 'PLAY'");
  g.run("player.x = 376; player.y = 466; frame = 0");
  eq(g.run("simulateFrame()"), "desync");
});

console.log("persistence & rendering");
test("save sanitiser drops garbage and keeps valid data", () => {
  const g = boot();
  const s = g.run(`sanitizeSave({best:{0:{folds:1,par:1,time:90,medal:"GOLD"},1:{folds:"x"},99:{folds:1,par:1,time:1,medal:"GOLD"},2:{folds:1,par:1,time:1,medal:"PLATINUM"}},settings:{music:99,sfx:-3}})`);
  eq(Object.keys(s.best).join(), "0"); eq(s.settings.music, 5); eq(s.settings.sfx, 0);
  for (const bad of ["null", "42", "[]", '"x"', "{best:null}"]) g.run("sanitizeSave(" + bad + ")");
});
test("corrupt localStorage falls back to a fresh save", () => {
  const g = boot({ "chronofold.save.v1": "{not json" });
  eq(g.run("Object.keys(save.best).length"), 0);
});
test("volume settings persist and clamp", () => {
  const g = boot();
  g.run("adjustVolume('music', -9); adjustVolume('sfx', 1)");
  eq(g.run("save.settings.music"), 0); eq(g.run("save.settings.sfx"), 5);
  eq(JSON.parse(g.storage["chronofold.save.v1"]).settings.music, 0);
});
test("pause menu: left/right changes volume, Enter on a slider does nothing", () => {
  const g = boot(); g.run("loadLevel(0); state = 'PAUSE'; pauseIdx = 4");
  g.down("ArrowLeft"); g.step(); eq(g.run("save.settings.music"), 4);
  g.down("Enter"); g.step(); eq(g.run("state"), "PAUSE"); eq(g.run("muted"), false);
});
test("every state renders without throwing, for every level", () => {
  const g = boot(); const n = g.run("LEVELS.length");
  g.run("render()");                                  // TITLE
  g.run("state = 'SELECT'; render()");
  for (let i = 0; i < n; i++) {
    g.run("loadLevel(" + i + "); state = 'PLAY'");
    g.step(30); g.run("render()");
    g.run("state = 'PAUSE'; render()");
    g.run("state = 'PLAY'; recording.length = 30; foldTime()");
    g.step(5); g.run("render()");                     // REWIND
    g.run("state = 'PLAY'; results[levelIdx] = {name:'x',folds:1,par:1,time:60,deaths:2,medal:'GOLD'}; state='CLEAR'; render()");
  }
});
test("win screen is built from saved bests, with all levels", () => {
  const best = {}; for (let i = 0; i < 10; i++) best[i] = { folds: 1, par: 1, time: 100, medal: "GOLD" };
  const g = boot({ "chronofold.save.v1": JSON.stringify({ best }) });
  g.run("state = 'WIN'; results = []"); g.step(10); g.run("render()");
  eq(g.run("Object.keys(save.best).length"), 10);
});
test("render() doesn't advance simulation timers (refresh-rate independent)", () => {
  const g = boot(); g.run("loadLevel(0); state = 'PLAY'; msgT = 100");
  for (let i = 0; i < 20; i++) g.run("render()");
  eq(g.run("msgT"), 100); eq(g.run("particles.length"), 0);
});

console.log("\n" + passed + " passed, " + failed + " failed");
process.exit(failed ? 1 : 0);
