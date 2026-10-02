CHRONOFOLD
A puzzle game about cooperating with your past selves.

CONTROLS
  Left/Right or A/D   move
  Up / W / Space      jump
  R                   FOLD TIME: rewind, and an echo of your run replays beside you
  Z                   reset the level (wipes echoes, resets crates)
  M                   mute
  Esc                 pause (resume / restart / level select / sound, music, SFX volume)
  Enter               start / select / continue
  F11                 fullscreen (Electron build)

RUN IT
  Browser:   open chronofold.html (no build step, no server needed)
  Electron:  npm install, then npm start
  Tests:     npm test   (plain Node, no extra dependencies)

BUILD A WINDOWS EXE
  npm install
  npm run pack     -> Chronofold-win32-x64\Chronofold.exe
                      (ship the whole Chronofold-win32-x64 folder)
  npm run dist     -> dist\ , one self-contained portable exe (electron-builder)

PROJECT LAYOUT
  chronofold.html   page shell
  src/style.css     page styling
  src/levels.js     level data
  src/game.js       engine, rendering, input, audio, saves
  main.js           Electron entry
  test/run.js       headless tests, including a level-data validator

ADDING A LEVEL
  Append an object to LEVELS in src/levels.js:
    name, hint, maxEchoes, par, spawn:[x,y], exit:[x,y], solids:[[x,y,w,h]...],
    plates:[{id,x,y,w}], doors:[{x,y,w,h,req:[ids; "!id" = must be off]}],
    lifts:[{x,y,w,h,up,speed,req}], lasers:[{x,y,w,h,period,duty,offset}],
    optional: toggles:[{id,x,y}], crates:[[x,y]], erasers:[{x,y,w,h}]
  Level select, unlocks and the win screen pick it up automatically.
  Run npm test: the validator catches bad ids, impossible timings, spawns or
  exits inside solids, and out-of-bounds objects.
