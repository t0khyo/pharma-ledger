import cron, { type ScheduledTask } from "node-cron";
import { Notification } from "electron";
import { getDatabaseConnection, getDatabasePath } from "../db/db.js";
import { EmailService } from "./EmailService.js";

export class BackupScheduler {
  private static cronJob: ScheduledTask | null = null;
  private static localCronJob: ScheduledTask | null = null;
  private static fallbackInterval: NodeJS.Timeout | null = null;
  private static isSendingEmail: boolean = false;

  private static getCairoDateString(date: Date = new Date()): string {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "Africa/Cairo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).format(date);
  }

  private static getCairoHour(date: Date = new Date()): number {
    const hourStr = new Intl.DateTimeFormat("en-US", {
      timeZone: "Africa/Cairo",
      hour: "numeric",
      hour12: false
    }).format(date);
    return parseInt(hourStr, 10);
  }

  static init() {
    console.log("Initializing backup scheduler...");

    // Check immediately on startup (fallback for missed email backups if past 10 PM)
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

    // Fallback: Check every hour to catch missed email backups (after 10 PM)
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
      console.log("[Local Backup] Successfully saved local backup snapshot.");
    } catch (err) {
      console.error("[Local Backup] Failed:", err);
    }
  }

  private static async checkAndSendBackup(isFallback: boolean = false) {
    const checkType = isFallback ? "Fallback" : "Scheduled";
    console.log(`[${checkType}] Checking backup status...`);

    // 1. Concurrency mutex to prevent duplicate simultaneous sends
    if (this.isSendingEmail) {
      console.log(`[${checkType}] Email backup already in progress. Skipping to avoid duplicates.`);
      return;
    }
    
    const db = getDatabaseConnection();

    // 2. Check if backup is enabled
    const enabledRow = db.prepare("SELECT value FROM settings WHERE key = ?").get("backup_enabled") as { value: string } | undefined;
    const enabled = enabledRow?.value === "true";

    if (!enabled) {
      console.log(`[${checkType}] Backup is disabled.`);
      return;
    }

    // 3. Deduplication check: verify if already sent today in Cairo timezone
    const today = this.getCairoDateString();
    const row = db.prepare("SELECT value FROM settings WHERE key = ?").get("last_backup_sent_at") as { value: string } | undefined;
    const lastSentStr = row?.value || "";

    if (lastSentStr === today) {
      console.log(`[${checkType}] Email backup already sent today (${today}). Skipping to avoid duplicates.`);
      return;
    }

    // 4. Fallback gate: only send missed backup if 10:00 PM (22:00) has already arrived/passed today
    if (isFallback) {
      const cairoHour = this.getCairoHour();
      if (cairoHour < 22) {
        console.log(`[${checkType}] Daily backup is scheduled for 10:00 PM (current Cairo hour: ${cairoHour}). Skipping fallback check.`);
        return;
      }
    }

    this.isSendingEmail = true;

    // 5. Send backup (local + email)
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
        // Use INSERT OR REPLACE to guarantee last_backup_sent_at is persisted even if not previously seeded
        db.prepare("INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES ('last_backup_sent_at', ?, CURRENT_TIMESTAMP)")
          .run(today);
        console.log(`[${checkType}] Email backup sent successfully and recorded for ${today}.`);
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
    } finally {
      this.isSendingEmail = false;
    }
  }
}
