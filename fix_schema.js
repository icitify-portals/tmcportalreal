const fs = require('fs');
const file = 'lib/db/schema.ts';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/\.\(\(\) => new Date\(\)\)\.\(\(\) => new Date\(\)\)/g, '.$defaultFn(() => new Date()).$onUpdateFn(() => new Date())');
fs.writeFileSync(file, content);
