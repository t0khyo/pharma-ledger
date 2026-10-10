import Database from 'better-sqlite3';
const db = new Database('C:/Users/abdelrahman/AppData/Roaming/Pharma Ledger/app.db');
const query = `
WITH RECURSIVE dates(date) AS (
  SELECT ?
  UNION ALL
  SELECT date(date, '+1 day')
  FROM dates
  WHERE date < ? AND CAST(JULIANDAY(date) - JULIANDAY(?) AS INTEGER) < 100
)
SELECT * FROM dates;
`;
console.log(db.prepare(query).all('2026-10-09', '2026-11-08', '2026-10-09'));
