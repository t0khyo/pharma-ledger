import { app, BrowserWindow } from "electron";
import path from "path";

type test = string;

const a: test = "Hello";

console.log(a);

app.on("ready", () => {
    const mainWindow = new BrowserWindow({});
    mainWindow.loadFile(path.join(app.getAppPath(), 'dist-react/index.html'));
});
