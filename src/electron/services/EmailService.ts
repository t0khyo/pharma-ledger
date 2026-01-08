import nodemailer from "nodemailer";
import { getDatabaseConnection, getDatabasePath } from "../db/db.js";

interface EmailSettings {
  host: string;
  port: number;
  user: string;
  pass: string;
  sender: string;
  recipient: string;
}

export class EmailService {
  private static getSettings(): EmailSettings | null {
    const db = getDatabaseConnection();
    
    // Helper to get value
    const getVal = (key: string) => {
      const row = db.prepare("SELECT value FROM settings WHERE key = ?").get(key) as { value: string } | undefined;
      return row?.value || "";
    };

    const host = getVal("backup_smtp_host");
    const port = parseInt(getVal("backup_smtp_port") || "587");
    const user = getVal("backup_smtp_user");
    const pass = getVal("backup_smtp_pass");
    const sender = getVal("backup_email_sender");
    const recipient = getVal("backup_email_recipient");
    const enabled = getVal("backup_enabled") === "true";

    if (!enabled || !host || !user || !pass || !recipient) {
      return null;
    }

    return { host, port, user, pass, sender, recipient };
  }

  private static getBackupFilename(): string {
    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    return `pharma_ledger_${date}.db`;
  }

  static async sendBackup(filePath: string): Promise<boolean> {
    const settings = this.getSettings();
    if (!settings) {
      console.log("Backup skipped: Settings missing or disabled.");
      return false;
    }

    const transporter = nodemailer.createTransport({
      host: settings.host,
      port: settings.port,
      secure: settings.port === 465, // true for 465, false for other ports
      auth: {
        user: settings.user,
        pass: settings.pass,
      },
      tls: {
          rejectUnauthorized: false
      }
    });

    try {
      const info = await transporter.sendMail({
        from: `"${settings.sender || "Pharma Ledger"}" <${settings.user}>`,
        to: settings.recipient,
        subject: `Database Backup: ${new Date().toLocaleDateString()}`,
        text: "Attached is the daily database backup for Pharma Ledger.",
        attachments: [
          {
            filename: this.getBackupFilename(),
            path: filePath,
          },
        ],
      });

      console.log("Backup sent: %s", info.messageId);
      return true;
    } catch (error) {
      console.error("Error sending backup email:", error);
      return false;
    }
  }

  static async verifyConnection(testSettings: EmailSettings): Promise<boolean> {
    const transporter = nodemailer.createTransport({
      host: testSettings.host,
      port: testSettings.port,
      secure: testSettings.port === 465, 
      auth: {
        user: testSettings.user,
        pass: testSettings.pass,
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    try {
      await transporter.verify();

      // Get DB path for attachment
      const dbPath = getDatabasePath();

      // Send test email with database backup
      await transporter.sendMail({
        from: `"${testSettings.sender || "Pharma Ledger"}" <${testSettings.user}>`,
        to: testSettings.recipient,
        subject: `Test Backup: ${new Date().toLocaleDateString()}`,
        text: "This is a test email to confirm your backup settings are configured correctly. \n\nAttached is the current database backup.",
        attachments: [
          {
            filename: this.getBackupFilename(),
            path: dbPath,
          },
        ],
      });

      return true;
    } catch (error) {
      console.error("SMTP Verify Error:", error);
      throw error;
    }
  }
}
