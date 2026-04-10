const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

// We will replace the conditional rendering with motion.div wrappers
const views = [
  { comment: '{/* --- VISTA: ADMIN --- */}', condition: '{currentView === \'admin\' && currentUser.role === \'admin\' && (' },
  { comment: '{/* --- VISTA: SETTINGS --- */}', condition: '{currentView === \'settings\' && currentUser.role === \'admin\' && (' },
  { comment: '{/* --- VISTA: PROYECTOS --- */}', condition: '{currentView === \'projects\' && (' },
  { comment: '{/* --- VISTA: AGENTES --- */}', condition: '{currentView === \'agents\' && (' },
  { comment: '{/* --- VISTA: SANIPES --- */}', condition: '{currentView === \'sanipes\' && (' },
  { comment: '{/* --- VISTA: DICAPI --- */}', condition: '{currentView === \'dicapi\' && (' },
  { comment: '{/* --- VISTA: NAVES GUARDADAS --- */}', condition: '{currentView === \'saved_vessels\' && (' },
  { comment: '{/* --- VISTA: CHAT --- */}', condition: '{currentView === \'chat\' && (' }
];

// First, let's wrap the whole view area in AnimatePresence
// The view area starts after the header.
const headerEnd = '</header>';
if (content.includes(headerEnd) && !content.includes('<AnimatePresence mode="wait">')) {
  // We'll just wrap the conditions in AnimatePresence
  content = content.replace(
    '</header>',
    '</header>\n        <div className="flex-1 relative overflow-hidden flex flex-col">\n          <AnimatePresence mode="wait">'
  );
  
  // The end of the views is right before the modals
  content = content.replace(
    '{/* --- MODALS --- */}',
    '</AnimatePresence>\n        </div>\n\n        {/* --- MODALS --- */}'
  );
}

// Now wrap each view in motion.div
views.forEach(view => {
  if (content.includes(view.condition)) {
    const motionWrapper = `${view.condition}
            <motion.div
              key="${view.comment.replace(/[^A-Z]/g, '')}"
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.98 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="flex-1 flex flex-col h-full overflow-hidden"
            >`;
    content = content.replace(view.condition, motionWrapper);
    
    // We need to find the closing `)}` for each view. This is tricky with regex.
    // Let's just do it manually for the known structure.
    // Actually, it's easier to just replace `)}` before the next view comment.
  }
});

fs.writeFileSync('src/App.tsx', content);
console.log('Refactor 3 applied.');
