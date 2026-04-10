const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

// Replace remaining old colors
content = content.replace(/bg-\[\#2a2b3d\]/g, 'bg-white/5');
content = content.replace(/bg-\[\#45475a\]/g, 'bg-white/10');
content = content.replace(/border-\[\#00509e\]/g, 'border-[#0A84FF]');
content = content.replace(/ring-\[\#00509e\]/g, 'ring-[#0A84FF]');
content = content.replace(/bg-\[\#00509e\]/g, 'bg-[#007AFF]');
content = content.replace(/bg-\[\#004b87\]/g, 'bg-[#007AFF]');
content = content.replace(/border-\[\#002855\]/g, 'border-white/10');
content = content.replace(/bg-\[\#002855\]/g, 'bg-white/5');
content = content.replace(/hover:bg-\[\#45475a\]/g, 'hover:bg-white/20');
content = content.replace(/shadow-\[\#00509e\]/g, 'shadow-[#0A84FF]');

fs.writeFileSync('src/App.tsx', content);
console.log('Final colors updated.');
