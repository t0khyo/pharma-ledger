import cron from "node-cron";
import { Notification } from "electron";
import { getDatabaseConnection, getDatabasePath } from "../db/db.js";
import { EmailService } from "./EmailService.js";

export class BackupScheduler {
  private static cronJob: cron.ScheduledTask | null = null;
  private static fallbackInterval: NodeJS.Timeout | null = null;

  static init() {
    console.log("Initializing backup scheduler...");

    // Check immediately on startup (fallback for missed backups)
    this.checkAndSendBackup(true);

    // Schedule daily backup at 10:00 PM (22:00) Egypt time
    // Cron format: minute hour * * *
    // "0 22 * * *" = At 22:00 (10 PM) every day
    // Timezone: Africa/Cairo (Egypt Standard Time / Eastern European Time)
    this.cronJob = cron.schedule("0 22 * * *", () => {
      console.log("Scheduled 10 PM backup triggered (Egypt time)");
      this.checkAndSendBackup(false);
    }, {
      timezone: "Africa/Cairo"
    });

    console.log("Scheduled backup at 10:00 PM daily (Egypt/Cairo timezone)");

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
