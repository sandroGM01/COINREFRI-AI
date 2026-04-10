const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

// Replace deep blues with iOS Blue
content = content.replace(/bg-\[\#00509e\]/g, 'bg-[#0A84FF]');
content = content.replace(/bg-\[\#003b73\]/g, 'bg-[#007AFF]');
content = content.replace(/text-\[\#4da6ff\]/g, 'text-[#0A84FF]');
content = content.replace(/text-\[\#00A8FF\]/g, 'text-[#0A84FF]');

// Replace purple buttons with blue
content = content.replace(/bg-purple-600/g, 'bg-[#0A84FF]');
content = content.replace(/hover:bg-purple-500/g, 'hover:bg-[#007AFF]');

// Replace blue-600 with iOS blue
content = content.replace(/bg-blue-600/g, 'bg-[#0A84FF]');
content = content.replace(/hover:bg-blue-500/g, 'hover:bg-[#007AFF]');
content = content.replace(/text-blue-400/g, 'text-[#0A84FF]');

// Add a subtle glow to the background
if (!content.includes('bg-[#0A84FF]/10 blur-[120px]')) {
  content = content.replace(
    '{/* Sidebar */}',
    '<div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#0A84FF]/10 blur-[120px] rounded-full pointer-events-none" />\n      {/* Sidebar */}'
  );
}

fs.writeFileSync('src/App.tsx', content);
console.log('Colors updated to iOS Blue.');
