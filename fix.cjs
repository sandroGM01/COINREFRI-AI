const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

// The issue is that I added `<motion.div>` but didn't close it before the `)}` of each view.
// Let's find all instances of `)}` that immediately precede a `{/* --- VISTA:` comment or `{/* --- MODALS --- */}`

const viewComments = [
  '{/* --- VISTA: SETTINGS --- */}',
  '{/* --- VISTA: PROYECTOS --- */}',
  '{/* --- VISTA: AGENTES --- */}',
  '{/* --- VISTA: SANIPES --- */}',
  '{/* --- VISTA: DICAPI --- */}',
  '{/* --- VISTA: NAVES GUARDADAS --- */}',
  '{/* --- VISTA: CHAT --- */}',
  '</AnimatePresence>'
];

viewComments.forEach(comment => {
  // We need to replace `        )}\n        ${comment}` with `        </motion.div>\n        )}\n        ${comment}`
  // But the indentation might vary. Let's use regex.
  const regex = new RegExp(`\\s*\\)\\}\\s*${comment.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}`, 'g');
  content = content.replace(regex, (match) => {
    return `\n          </motion.div>\n        )}\n        ${comment}`;
  });
});

// For the last view (CHAT), it might end before `</AnimatePresence>`
const chatEndRegex = /\s*\)\}\s*<\/AnimatePresence>/g;
content = content.replace(chatEndRegex, '\n          </motion.div>\n        )}\n        </AnimatePresence>');

fs.writeFileSync('src/App.tsx', content);
console.log('Fix applied.');
