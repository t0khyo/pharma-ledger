import cron, { type ScheduledTask } from "node-cron";
import { Notification } from "electron";
import { getDatabaseConnection, getDatabasePath } from "../db/db.js";
import { EmailService } from "./EmailService.js";

export class BackupScheduler {
  private static cronJob: ScheduledTask | null = null;
  private static localCronJob: ScheduledTask | null = null;
  private static fallbackInterval: NodeJS.Timeout | null = null;

  static init() {
    console.log("Initializing backup scheduler...");

    // Check immediately on startup (fallback for missed email backups)
    this.checkAndSendBackup(true);
    
    // Perform an initial local backup shortly after startup
    setTimeout(() => this.performLocalBackup(), 5000);

    // Schedule daily email backup at 10:00 PM (22:00) Egypt time
    this.cronJob = cron.schedule("0 22 * * *", () => {
      console.log("Scheduled 10 PM email backup triggered (Egypt time)");
      this.checkAndSendBackup(false);
    }, {
      timezone: "Africa/Cairo"
    });

    // Schedule local backup every 2 hours
    this.localCronJob = cron.schedule("0 */2 * * *", () => {
      console.log("Scheduled 2-hour local backup triggered");
      this.performLocalBackup();
    });

    console.log("Scheduled email backup at 10:00 PM daily, local backup every 2 hours");

    // Fallback: Check every hour to catch missed email backups
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
    if (this.localCronJob) {
      this.localCronJob.stop();
      this.localCronJob = null;
      console.log("2-hour local cron job stopped");
    }
    if (this.fallbackInterval) {
      clearInterval(this.fallbackInterval);
      this.fallbackInterval = null;
      console.log("Fallback interval stopped");
    }
  }

  private static async performLocalBackup() {
    console.log("[Local Backup] Checking status...");
    const db = getDatabaseConnection();
    
    const enabledRow = db.prepare("SELECT value FROM settings WHERE key = ?").get("backup_enabled") as { value: string } | undefined;
    if (enabledRow?.value !== "true") {
        console.log("[Local Backup] Backup is disabled.");
        return;
    }

    try {
      const dbPath = getDatabasePath();
      await EmailService.saveLocalBackup(dbPath);
      console.log("[Local Backup] Successfully updated today's backup file.");
    } catch (err) {
      console.error("[Local Backup] Failed:", err);
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

    // 3. Send backup (email + local)
    console.log(`[${checkType}] Starting backup process...`);
    
    try {
      const dbPath = getDatabasePath();
      
      // Always save local backup first
      const localBackupSuccess = await EmailService.saveLocalBackup(dbPath);
      if (localBackupSuccess) {
        console.log(`[${checkType}] Local backup saved successfully`);
      } else {
        console.log(`[${checkType}] Local backup failed`);
      }
      
      // Then try to send email backup
      const emailSuccess = await EmailService.sendBackup(dbPath);

      if (emailSuccess) {
        // 4. Update last_sent timestamp only if email succeeded
        db.prepare("UPDATE settings SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE key = ?")
          .run(today, "last_backup_sent_at");
        console.log(`[${checkType}] Email backup sent successfully and status updated.`);
      } else {
        console.log(`[${checkType}] Email backup failed to send (EmailService returned false).`);
      }

      // Show desktop notification based on results
      if (localBackupSuccess && emailSuccess) {
        new Notification({
          title: "نسخة احتياطية ناجحة",
          body: "تم حفظ النسخة الاحتياطية محلياً وإرسالها بالبريد الإلكتروني",
          icon: undefined,
        }).show();
      } else if (localBackupSuccess && !emailSuccess) {
        new Notification({
          title: "نسخة احتياطية محلية",
          body: "تم حفظ النسخة الاحتياطية محلياً فقط (فشل إرسال البريد)",
          icon: undefined,
        }).show();
      } else if (!localBackupSuccess && emailSuccess) {
        new Notification({
          title: "نسخة احتياطية بالبريد",
          body: "تم إرسال النسخة بالبريد الإلكتروني (فشل الحفظ المحلي)",
          icon: undefined,
        }).show();
      } else {
        new Notification({
          title: "فشل النسخة الاحتياطية",
          body: "فشل حفظ النسخة الاحتياطية محلياً وعبر البريد",
          icon: undefined,
        }).show();
      }
    } catch (err) {
      console.error(`[${checkType}] Backup failed with error:`, err);
      
      // Show error notification
      new Notification({
        title: "خطأ في النسخة الاحتياطية",
        body: "حدث خطأ أثناء إنشاء النسخة الاحتياطية",
        icon: undefined,
      }).show();
    }
  }
}
