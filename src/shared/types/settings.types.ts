export interface EmailSettings {
  backup_enabled: string;
  backup_email_recipient: string;
  backup_email_sender: string;
  backup_smtp_host: string;
  backup_smtp_port: string;
  backup_smtp_user: string;
  backup_smtp_pass: string;
  last_backup_sent_at?: string;
  local_backup_path?: string;
}

export interface TestEmailSettings {
  host: string;
  port: string;
  user: string;
  pass: string;
  sender: string;
  recipient: string;
}
