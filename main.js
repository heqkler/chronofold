const { app, BrowserWindow, Menu } = require("electron");
const path = require("path");

/* one game at a time: a second launch just focuses the first */
if (!app.requestSingleInstanceLock()) app.quit();

let win = null;

function createWindow() {
  win = new BrowserWindow({
    width: 1010,
    height: 800,
    autoHideMenuBar: true,
    backgroundColor: "#0d0b1e",
    title: "CHRONOFOLD",
    icon: path.join(__dirname, "build", "icon.png"),
    resizable: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });
  win.loadFile("chronofold.html");

  /* F11 toggles fullscreen (menu is hidden, so handle it on the page's input) */
  win.webContents.on("before-input-event", (event, input) => {
    if (input.type === "keyDown" && input.key === "F11") {
      win.setFullScreen(!win.isFullScreen());
      event.preventDefault();
    }
  });
  /* the game never needs to open or navigate anywhere else */
  win.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  win.webContents.on("will-navigate", e => e.preventDefault());
  win.on("closed", () => { win = null; });
}

app.on("second-instance", () => {
  if (win) { if (win.isMinimized()) win.restore(); win.focus(); }
});

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  createWindow();
});

app.on("window-all-closed", () => app.quit());
