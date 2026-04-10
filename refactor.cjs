const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Add motion import
if (!content.includes("import { motion, AnimatePresence }")) {
  content = content.replace(
    "import { BarChart",
    "import { motion, AnimatePresence } from 'motion/react';\nimport { BarChart"
  );
}

// 2. Color replacements (Dark mode iOS style)
content = content.replace(/bg-\[\#1e1e2e\]/g, 'bg-[#000000]'); // Main background to pure black
content = content.replace(/bg-\[\#181825\]/g, 'bg-[#1C1C1E]/80 backdrop-blur-xl'); // Elevated elements to glassy dark gray
content = content.replace(/bg-\[\#313244\]/g, 'bg-white/10'); // Hover states / inputs
content = content.replace(/border-\[\#313244\]/g, 'border-white/10'); // Borders
content = content.replace(/border-\[\#45475a\]/g, 'border-white/20'); // Input borders
content = content.replace(/text-\[\#cdd6f4\]/g, 'text-gray-100'); // Main text
content = content.replace(/text-\[\#a6adc8\]/g, 'text-gray-400'); // Muted text

// 3. Replace oranges with blues
content = content.replace(/orange-600/g, 'blue-600');
content = content.replace(/orange-500/g, 'blue-500');
content = content.replace(/orange-400/g, 'blue-400');
content = content.replace(/orange-700/g, 'blue-700');
content = content.replace(/orange-800/g, 'blue-800');

// 4. Update shapes
content = content.replace(/rounded-md/g, 'rounded-xl');
content = content.replace(/rounded-lg/g, 'rounded-2xl');

// 5. Add active:scale-95 to buttons for iOS tap effect
content = content.replace(/hover:bg-([a-zA-Z0-9\/\[\]\#\-]+) /g, 'hover:bg-$1 active:scale-[0.98] transition-all duration-200 ');

fs.writeFileSync('src/App.tsx', content);
console.log('Refactor applied.');
