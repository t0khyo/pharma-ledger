import nodemailer from "nodemailer";
import { statSync } from "fs";
import { getDatabaseConnection, getDatabasePath } from "../db/db.js";

interface EmailSettings {
  host: string;
  port: number;
  user: string;
  pass: string;
  sender: string;
  recipient: string;
}

interface BackupStats {
  totalCustomers: number;
  totalTransactions: number;
  unpaidDebts: number;
  monthlyIncome: number;
  totalCompanies: number;
  backupSize: string;
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

  private static getBackupStats(): BackupStats {
    const db = getDatabaseConnection();
    const dbPath = getDatabasePath();

    // Get total customers
    const customersResult = db.prepare("SELECT COUNT(*) as count FROM customers").get() as { count: number };
    const totalCustomers = customersResult.count || 0;

    // Get total transactions
    const transactionsResult = db.prepare("SELECT COUNT(*) as count FROM transactions WHERE is_deleted = 0").get() as { count: number };
    const totalTransactions = transactionsResult.count || 0;

    // Get unpaid debts
    const unpaidDebtsQuery = `
      SELECT 
        SUM(CASE 
          WHEN balance < 0 THEN ABS(balance) 
          ELSE 0 
        END) as unpaidDebts
      FROM (
        SELECT 
          SUM(CASE 
            WHEN t.type = 'payment' THEN t.amount 
            WHEN t.type = 'debt' THEN -t.amount 
            ELSE 0 
          END) as balance
        FROM transactions t
        WHERE t.is_deleted = 0
        GROUP BY t.customer_id
      ) as customer_balances
    `;
    const unpaidResult = db.prepare(unpaidDebtsQuery).get() as any;
    const unpaidDebts = unpaidResult?.unpaidDebts || 0;

    // Get monthly income
    const incomeResult = db.prepare(`
      SELECT SUM(amount) as total 
      FROM transactions 
      WHERE type = 'payment' 
      AND is_deleted = 0 
      AND date(date) >= date('now', 'start of month')
    `).get() as { total: number };
    const monthlyIncome = incomeResult.total || 0;

    // Get total companies
    const companiesResult = db.prepare("SELECT COUNT(*) as count FROM company").get() as { count: number };
    const totalCompanies = companiesResult.count || 0;

    // Get backup file size
    let backupSize = "0 KB";
    try {
      const stats = statSync(dbPath);
      const sizeInBytes = stats.size;
      const sizeInKB = (sizeInBytes / 1024).toFixed(2);
      const sizeInMB = (sizeInBytes / (1024 * 1024)).toFixed(2);
      backupSize = sizeInBytes > 1024 * 1024 ? `${sizeInMB} MB` : `${sizeInKB} KB`;
    } catch (error) {
      console.error("Error getting file size:", error);
    }

    return {
      totalCustomers,
      totalTransactions,
      unpaidDebts,
      monthlyIncome,
      totalCompanies,
      backupSize
    };
  }

  private static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    }).format(amount) + ' ج.م';
  }

  private static formatNumber(num: number): string {
    return new Intl.NumberFormat('en-US').format(num);
  }

  private static generateEmailHTML(stats: BackupStats, isTest: boolean = false): string {
    const currentDate = new Date().toLocaleDateString('ar-EG', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    const currentTime = new Date().toLocaleTimeString('ar-EG', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    return`
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>نسخة احتياطية</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5; direction: rtl;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f5f5f5; padding: 20px 5px;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #0d9488 0%, #115e59 100%); padding: 32px 20px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: bold;">
                ${isTest ? 'اختبار النسخ الاحتياطي' : 'نسخة احتياطية يومية'}
              </h1>
              <p style="margin: 8px 0 0 0; color: #ccfbf1; font-size: 15px;">
                صيدلية الدكتور صبحي شعبان
              </p>
            </td>
          </tr>

          <!-- Date & Time Bar -->
          <tr>
            <td style="padding: 16px 20px; background-color: #f8fafc; border-bottom: 1px solid #e2e8f0;">
              <p style="margin: 0; color: #64748b; font-size: 13px; text-align: center;">
                ${currentDate} • ${currentTime}
              </p>
            </td>
          </tr>

          <!-- Stats Title -->
          <tr>
            <td style="padding: 24px 20px 12px;">
              <h2 style="margin: 0; color: #1e293b; font-size: 18px; font-weight: bold;">
                إحصائيات قاعدة البيانات
              </h2>
            </td>
          </tr>

          <!-- Statistics - Single Column for Mobile -->
          <tr>
            <td style="padding: 0 20px 24px;">
              
              <!-- Customer Count -->
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; margin-bottom: 12px; padding: 16px;">
                <tr>
                  <td style="text-align: right; width: 70%;">
                    <p style="margin: 0; color: #64748b; font-size: 13px;">عدد العملاء</p>
                  </td>
                  <td style="text-align: left; width: 30%;">
                    <p style="margin: 0; color: #1e293b; font-size: 20px; font-weight: bold;">${this.formatNumber(stats.totalCustomers)}</p>
                  </td>
                </tr>
              </table>

              <!-- Company Count -->
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; margin-bottom: 12px; padding: 16px;">
                <tr>
                  <td style="text-align: right; width: 70%;">
                    <p style="margin: 0; color: #64748b; font-size: 13px;">عدد الشركات</p>
                  </td>
                  <td style="text-align: left; width: 30%;">
                    <p style="margin: 0; color: #1e293b; font-size: 20px; font-weight: bold;">${this.formatNumber(stats.totalCompanies)}</p>
                  </td>
                </tr>
              </table>

              <!-- Transaction Count -->
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; margin-bottom: 12px; padding: 16px;">
                <tr>
                  <td style="text-align: right; width: 70%;">
                    <p style="margin: 0; color: #64748b; font-size: 13px;">إجمالي العمليات</p>
                  </td>
                  <td style="text-align: left; width: 30%;">
                    <p style="margin: 0; color: #1e293b; font-size: 20px; font-weight: bold;">${this.formatNumber(stats.totalTransactions)}</p>
                  </td>
                </tr>
              </table>

              <!-- Unpaid Debts (Red) -->
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; margin-bottom: 12px; padding: 16px;">
                <tr>
                  <td style="text-align: right; width: 50%;">
                    <p style="margin: 0; color: #64748b; font-size: 13px;">الديون غير المسددة</p>
                  </td>
                  <td style="text-align: left; width: 50%;">
                    <p style="margin: 0; color: #dc2626; font-size: 18px; font-weight: bold;">${this.formatCurrency(stats.unpaidDebts)}</p>
                  </td>
                </tr>
              </table>

              <!-- Monthly Income (Green) -->
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; margin-bottom: 12px; padding: 16px;">
                <tr>
                  <td style="text-align: right; width: 50%;">
                    <p style="margin: 0; color: #64748b; font-size: 13px;">إيرادات الشهر الحالي</p>
                  </td>
                  <td style="text-align: left; width: 50%;">
                    <p style="margin: 0; color: #059669; font-size: 18px; font-weight: bold;">${this.formatCurrency(stats.monthlyIncome)}</p>
                  </td>
                </tr>
              </table>

              <!-- Backup Size -->
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px;">
                <tr>
                  <td style="text-align: right; width: 70%;">
                    <p style="margin: 0; color: #64748b; font-size: 13px;">حجم النسخة الاحتياطية</p>
                  </td>
                  <td style="text-align: left; width: 30%;">
                    <p style="margin: 0; color: #1e293b; font-size: 20px; font-weight: bold;">${stats.backupSize}</p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Info Box -->
          <tr>
            <td style="padding: 0 20px 24px;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #eff6ff; border-radius: 6px; padding: 16px; border: 1px solid #dbeafe;">
                <tr>
                  <td>
                    <p style="margin: 0; color: #475569; font-size: 13px; line-height: 1.6;">
                      ${isTest ? 
                        'هذه رسالة اختبار للتأكد من عمل إعدادات النسخ الاحتياطي بشكل صحيح. تم إرفاق نسخة احتياطية من قاعدة البيانات الحالية.' :
                        'تم إنشاء النسخة الاحتياطية تلقائياً وإرفاقها بهذا البريد. يُنصح بالاحتفاظ بهذه النسخة في مكان آمن.'
                      }
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #1e293b; padding: 20px; text-align: center;">
              <p style="margin: 0 0 4px 0; color: #94a3b8; font-size: 13px;">
                صيدلية الدكتور صبحي شعبان
              </p>
              <p style="margin: 0; color: #64748b; font-size: 12px;">
                دفتر المحاسبة © ${new Date().getFullYear()}
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
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
      secure: settings.port === 465,
      auth: {
        user: settings.user,
        pass: settings.pass,
      },
      tls: {
          rejectUnauthorized: false
      }
    });

    try {
      const stats = this.getBackupStats();
      const htmlContent = this.generateEmailHTML(stats, false);

      const info = await transporter.sendMail({
        from: `"${settings.sender || "صيدلية الدكتور صبحي شعبان"}" <${settings.user}>`,
        to: settings.recipient,
        subject: `نسخة احتياطية - ${new Date().toLocaleDateString('ar-EG')}`,
        html: htmlContent,
        text: `النسخة الاحتياطية اليومية لقاعدة البيانات\n\nالإحصائيات:\n- العملاء: ${stats.totalCustomers}\n- العمليات: ${stats.totalTransactions}\n- الديون غير المسددة: ${this.formatCurrency(stats.unpaidDebts)}\n- إيرادات الشهر: ${this.formatCurrency(stats.monthlyIncome)}\n- الشركات: ${stats.totalCompanies}\n- حجم الملف: ${stats.backupSize}`,
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

      const dbPath = getDatabasePath();

      // Get stats using the same method as sendBackup
      const stats = this.getBackupStats();
      const htmlContent = this.generateEmailHTML(stats, true);

      // Send test email with database backup
      await transporter.sendMail({
        from: `"${testSettings.sender || "صيدلية الدكتور صبحي شعبان"}" <${testSettings.user}>`,
        to: testSettings.recipient,
        subject: `اختبار النسخ الاحتياطي - ${new Date().toLocaleDateString('ar-EG')}`,
        html: htmlContent,
        text: `هذا بريد اختبار لإعدادات النسخ الاحتياطي\n\nالإحصائيات:\n- العملاء: ${stats.totalCustomers}\n- العمليات: ${stats.totalTransactions}\n- الديون غير المسددة: ${this.formatCurrency(stats.unpaidDebts)}\n- إيرادات الشهر: ${this.formatCurrency(stats.monthlyIncome)}\n- الشركات: ${stats.totalCompanies}\n- حجم الملف: ${stats.backupSize}`,
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
