const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

// Remove AnimatePresence wrappers
content = content.replace(/<div className="flex-1 relative overflow-hidden flex flex-col">\n          <AnimatePresence mode="wait">/g, '');
content = content.replace(/<\/AnimatePresence>\n        <\/div>/g, '');
content = content.replace(/<\/AnimatePresence>/g, '');

// Remove motion.div wrappers
const motionRegex = /<motion\.div\s+key="[^"]+"\s+initial=\{\{.*?\}\}\s+animate=\{\{.*?\}\}\s+exit=\{\{.*?\}\}\s+transition=\{\{.*?\}\}\s+className="flex-1 flex flex-col h-full overflow-hidden"\s*>/gs;
content = content.replace(motionRegex, '');

// Remove closing motion.divs
content = content.replace(/<\/motion\.div>/g, '');

fs.writeFileSync('src/App.tsx', content);
console.log('Cleaned up motion wrappers.');
