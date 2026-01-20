import cron from "node-cron";
import { getDatabaseConnection, getDatabasePath } from "../db/db.js";
import { EmailService } from "./EmailService.js";

export class BackupScheduler {
  private static cronJob: cron.ScheduledTask | null = null;
  private static fallbackInterval: NodeJS.Timeout | null = null;

  static init() {
    console.log("Initializing backup scheduler...");

    // Check immediately on startup (fallback for missed backups)
    this.checkAndSendBackup(true);

    // Schedule daily backup at 10:00 PM (22:00)
    // Cron format: minute hour * * *
    // "0 22 * * *" = At 22:00 (10 PM) every day
    this.cronJob = cron.schedule("0 22 * * *", () => {
      console.log("Scheduled 10 PM backup triggered");
      this.checkAndSendBackup(false);
    });

    console.log("Scheduled backup at 10:00 PM daily");

    // Fallback: Check every hour to catch missed backups
    // (e.g., if app was closed at 10 PM or no internet connection)
    this.fallbackInterval = setInterval(() => {
      console.log("Hourly fallback check triggered");
      this.checkAndSendBackup(true);
    }, 60 * 60 * 1000); // Every hour

    console.log("Hourly fallback check enabled");
  }

  static stop() {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
      console.log("10 PM cron job stopped");
    }
    if (this.fallbackInterval) {
      clearInterval(this.fallbackInterval);
      this.fallbackInterval = null;
      console.log("Fallback interval stopped");
    }
  }

  private static async checkAndSendBackup(isFallback: boolean = false) {
    const checkType = isFallback ? "Fallback" : "Scheduled";
    console.log(`[${checkType}] Checking backup status...`);
    
    const db = getDatabaseConnection();

    // 1. Get settings
    const row = db.prepare("SELECT value FROM settings WHERE key = ?").get("last_backup_sent_at") as { value: string } | undefined;
    const lastSentStr = row?.value || "";

    const enabledRow = db.prepare("SELECT value FROM settings WHERE key = ?").get("backup_enabled") as { value: string } | undefined;
    const enabled = enabledRow?.value === "true";

    if (!enabled) {
      console.log(`[${checkType}] Backup is disabled.`);
      return;
    }

    // 2. Check if already sent today
    const today = new Date().toDateString(); // "Sun Jan 19 2026"
    if (lastSentStr === today) {
      console.log(`[${checkType}] Backup already sent today.`);
      return;
    }

    // 3. Send backup
    console.log(`[${checkType}] Starting backup process...`);
    
    try {
      const dbPath = getDatabasePath();
      const success = await EmailService.sendBackup(dbPath);

      if (success) {
        // 4. Update last_sent timestamp
        db.prepare("UPDATE settings SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE key = ?")
          .run(today, "last_backup_sent_at");
        console.log(`[${checkType}] Backup sent successfully and status updated.`);
      } else {
        console.log(`[${checkType}] Backup failed to send (EmailService returned false).`);
      }
    } catch (err) {
      console.error(`[${checkType}] Backup failed with error:`, err);
    }
  }
}
