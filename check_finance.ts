import { db } from './lib/db';
Promise.all([
  'finance_transactions', 
  'finance_fund_requests', 
  'finance_budgets', 
  'fees', 
  'campaigns'
].map(table => 
  db.execute(`DESCRIBE ${table}`)
    .then(res => console.log(`\n=== ${table} ===\n`, res[0]))
    .catch(err => console.log(`\n=== ${table} (ERROR) ===\n`, err.message))
)).then(() => process.exit(0));
