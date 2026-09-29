CHRONOFOLD -> Windows EXE

1) Unzip this folder anywhere (e.g. C:\Coding\chronofold-app)
2) Open a terminal in the folder and run:

   npm install --save-dev electron electron-packager
   npm run pack

3) Your game is at:  Chronofold-win32-x64\Chronofold.exe
   Ship the whole Chronofold-win32-x64 folder (the exe needs the files beside it).

Test it first without packaging:  npm start

Want ONE single .exe file instead of a folder?
   npm install --save-dev electron-builder
   npx electron-builder --win portable
   -> output in dist\ (one self-contained exe, slower first launch)
