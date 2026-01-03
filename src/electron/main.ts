import { app, BrowserWindow } from "electron";
import path from "path";
import { isDev } from "./util.js";
import { getPreloadPath } from "./pathResolver.js";
import { initDb } from "./db/migrations/index.js";
import { closeDatabaseConnection } from "./db/db.js";
import { registerAllHandlers } from "./ipc/index.js";
import { BackupScheduler } from "./services/BackupScheduler.js";

let mainWindow: BrowserWindow | null = null;

app.on("ready", () => {
  initDb(); // connect DB & run migrations
  registerAllHandlers();
  BackupScheduler.init();
  createMainWindow();
});

// Quit when all windows are closed
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  closeDatabaseConnection();
});

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: getPreloadPath(),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Load React app
  if (isDev()) {
    mainWindow.loadURL("http://localhost:5123");
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(app.getAppPath(), "dist-react/index.html"));
  }
}
