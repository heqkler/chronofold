# Chronofold TODO

## Gameplay
- [x] Save progress (current level, best folds per level) in localStorage
- [x] Level select screen from the title
- [ ] Undo last fold (without resetting the whole level)
- [ ] More levels (11-15) with new mechanics: moving platforms, one-way platforms, timed doors
- [ ] Star/medal rating per level based on par
- [ ] Hint system (show ghost of a suggested first echo after N failed resets)

## Polish
- [x] Pause menu (Esc) with resume / restart / mute
- [ ] Separate music and SFX volume sliders
- [ ] Screen shake and stronger particles on fold
- [ ] Level transition animation
- [ ] Gamepad support

## Tech
- [ ] Split chronofold.html into html / css / js files
- [ ] Add Electron fullscreen toggle (F11) and window icon
- [ ] Add `npm run dist` with electron-builder for a portable exe
- [ ] Expand README.txt (controls, how to build, how to add levels)
- [ ] Simple level-format validator to catch unsolvable/broken levels
