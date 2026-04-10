const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Add imports
const imports = `import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';`;

content = content.replace("import { \n  MessageSquare", `${imports}\nimport { \n  MessageSquare`);

// Replace message rendering
const oldMsgRender = `<div className={\`px-4 py-3 rounded-2xl text-sm \${msg.role === 'user' ? 'bg-[#004b87] text-white rounded-tr-sm' : 'bg-white/10 text-gray-200 rounded-tl-sm border border-white/20'}\`}>
                        {msg.content}
                      </div>`;

const newMsgRender = `<div className={\`px-4 py-3 rounded-2xl text-sm \${msg.role === 'user' ? 'bg-[#004b87] text-white rounded-tr-sm' : 'bg-white/10 text-gray-200 rounded-tl-sm border border-white/20 overflow-x-auto'}\`}>
                        {msg.role === 'user' ? (
                          msg.content
                        ) : (
                          <div className="markdown-body prose prose-invert max-w-none prose-sm prose-p:leading-relaxed prose-pre:bg-black/50 prose-pre:border prose-pre:border-white/10 prose-td:border prose-td:border-white/10 prose-th:border prose-th:border-white/10 prose-th:bg-white/5">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {msg.content}
                            </ReactMarkdown>
                          </div>
                        )}
                      </div>`;

content = content.replace(oldMsgRender, newMsgRender);

fs.writeFileSync('src/App.tsx', content);
console.log('Added react-markdown.');
