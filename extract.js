const fs = require('fs');
const sql = fs.readFileSync('drizzle/0000_giant_demogoblin.sql', 'utf8');
const stmts = sql.split(';');
const missing = ['occasion_requests', 'burial_requests', 'broadcasts', 'broadcast_recipients'];
const res = stmts.filter(s => missing.some(m => s.includes('CREATE TABLE `' + m + '`')));
// Also we need constraints (Foreign keys) for these tables if they exist in the file
const constraints = stmts.filter(s => missing.some(m => s.includes('ALTER TABLE `' + m + '` ADD CONSTRAINT')));

fs.writeFileSync('fix.sql', res.join(';') + ';' + constraints.join(';') + ';');
