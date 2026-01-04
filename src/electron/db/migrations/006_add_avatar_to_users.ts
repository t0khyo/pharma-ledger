import type { Database } from "better-sqlite3";

export function addAvatarToUsers(db: Database) {
  console.log("Running migration: 006_add_avatar_to_users");

  try {
    db.exec(`
      ALTER TABLE users ADD COLUMN avatar_path TEXT;
    `);
    console.log("Migration complete: 006_add_avatar_to_users");
  } catch (error: any) {
    if (error.message.includes("duplicate column name")) {
      console.log("Column avatar_path already exists, skipping.");
    } else {
      throw error;
    }
  }
}
