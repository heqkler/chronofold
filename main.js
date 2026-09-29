const { app, BrowserWindow } = require("electron");

app.whenReady().then(() => {
  const win = new BrowserWindow({
    width: 1010,
    height: 800,
    autoHideMenuBar: true,
    backgroundColor: "#0d0b1e",
    title: "CHRONOFOLD",
    resizable: true
  });
  win.loadFile("chronofold.html");
});

app.on("window-all-closed", () => app.quit());
