const fs = require('fs');
const html = fs.readFileSync('old_index.html', 'utf-8');
const styleMatch = html.match(/<style>([\s\S]*?)<\/style>/);
if (styleMatch) {
  fs.writeFileSync('src/index.css', styleMatch[1].trim());
  console.log('CSS extracted successfully.');
} else {
  console.log('No CSS found!');
}
