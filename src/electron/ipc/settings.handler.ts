import { ipcMain } from "electron";
import { getDatabaseConnection } from "../db/db.js";
import { EmailService } from "../services/EmailService.js";

export function registerSettingsHandlers() {
  ipcMain.handle("settings:get", () => {
    const db = getDatabaseConnection();
    const rows = db.prepare("SELECT key, value FROM settings").all() as { key: string; value: string }[];
    
    const settings: Record<string, string> = {};
    rows.forEach(row => {
      settings[row.key] = row.value;
    });
    return settings;
  });

  ipcMain.handle("settings:save", (_, settings: Record<string, string>) => {
    const db = getDatabaseConnection();
    const insert = db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)");
    
    const transaction = db.transaction((data: Record<string, string>) => {
      for (const [key, value] of Object.entries(data)) {
        insert.run(key, value);
      }
    });

    try {
      transaction(settings);
      return { success: true };
    } catch (error) {
      console.error("Failed to save settings:", error);
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle("settings:test-email", async (_, settings: any) => {
      try {
          await EmailService.verifyConnection({
              host: settings.host,
              port: parseInt(settings.port),
              user: settings.user,
              pass: settings.pass,
              sender: settings.sender,
              recipient: settings.recipient
          });
          return { success: true };
      } catch (error) {
          return { success: false, error: String(error) };
      }
  });
}
