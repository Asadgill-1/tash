const fs = require('node:fs');
const path = require('node:path');
const files = ['index.html', 'app.js', 'engine.js', 'style.css', 'tokens.css', 'design.html', 'design.js'];
fs.mkdirSync(path.join(__dirname, 'dist'), {recursive:true});
for (const file of files) fs.copyFileSync(path.join(__dirname, file), path.join(__dirname, 'dist', file));
console.log(`Built ${files.length} static files in dist.`);
