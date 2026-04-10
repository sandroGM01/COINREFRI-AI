const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Wrap renderContent in motion.div
if (!content.includes('<AnimatePresence mode="wait">')) {
  content = content.replace(
    '<div className="flex-1 flex flex-col min-w-0 overflow-hidden">',
    '<div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#000000]">'
  );
  
  content = content.replace(
    '{renderContent()}',
    `<AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="flex-1 overflow-y-auto"
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>`
  );
  
  // Remove the overflow-y-auto from the inner divs of renderContent if possible, or just let it be.
  // Actually, renderContent returns divs that might have overflow-y-auto. Let's leave it for now.
}

// 2. Unify sidebar colors to blue
content = content.replace(/text-emerald-400/g, 'text-[#00A8FF]');
content = content.replace(/text-purple-400/g, 'text-[#00A8FF]');
content = content.replace(/text-yellow-400/g, 'text-[#00A8FF]');
content = content.replace(/text-blue-400/g, 'text-[#00A8FF]');
content = content.replace(/text-orange-400/g, 'text-[#00A8FF]');

// 3. Header glassmorphism
content = content.replace(
  /className="bg-\[\#1C1C1E\]\/80 backdrop-blur-xl border-b border-white\/10 p-4 flex items-center justify-between shrink-0"/g,
  'className="bg-[#1C1C1E]/60 backdrop-blur-2xl border-b border-white/10 p-4 flex items-center justify-between shrink-0 sticky top-0 z-10"'
);

// 4. Make cards more iOS-like (more blur, lighter borders)
content = content.replace(/bg-\[\#1C1C1E\]\/80 backdrop-blur-xl/g, 'bg-[#1C1C1E]/60 backdrop-blur-3xl');
content = content.replace(/border-white\/10/g, 'border-white/5');

// 5. Add a subtle blue glow to the main background
content = content.replace(
  /bg-\[\#000000\] text-gray-100 font-sans overflow-hidden/g,
  'bg-[#000000] text-gray-100 font-sans overflow-hidden relative'
);

// Add a background glow element right after the main wrapper
if (!content.includes('bg-blue-600/20 blur-[120px]')) {
  content = content.replace(
    '{/* Sidebar */}',
    '<div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none" />\n      {/* Sidebar */}'
  );
}

fs.writeFileSync('src/App.tsx', content);
console.log('Refactor 2 applied.');
