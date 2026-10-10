const Database = require('better-sqlite3');
const db = new Database('C:/Users/abdelrahman/AppData/Roaming/pharma-ledger/database.sqlite');
const q = "WITH RECURSIVE dates(date) AS (SELECT '2026-10-09' UNION ALL SELECT date(date, '+1 day') FROM dates WHERE date < '2026-11-08' AND CAST(JULIANDAY(date) - JULIANDAY('2026-10-09') AS INTEGER) < 100) SELECT d.date, COALESCE(SUM(CASE WHEN t.type = 'payment' THEN t.amount ELSE 0 END), 0) as income, COALESCE(SUM(CASE WHEN t.type = 'debt' THEN t.amount ELSE 0 END), 0) as expenses FROM dates d LEFT JOIN transactions t ON date(t.date) = d.date AND t.is_deleted = 0 GROUP BY d.date ORDER BY d.date ASC;";
console.log(db.prepare(q).all());
process.exit(0);
