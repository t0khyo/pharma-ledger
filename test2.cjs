const Database = require('better-sqlite3');
const db = new Database(':memory:');
console.log(db.prepare("SELECT date('2026-10-09T22:00:00.000Z', 'localtime') as d").get());
process.exit(0);
