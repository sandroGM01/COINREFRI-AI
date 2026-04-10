const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Update UserAccount type
content = content.replace(
  "type UserAccount = { id: string; username: string; role: Role; };",
  "type UserAccount = { id: string; username: string; password?: string; role: Role; permissions: string[]; };"
);

// 2. Update INITIAL_USERS
content = content.replace(
  /const INITIAL_USERS: UserAccount\[\] = \[\n  \{ id: '1', username: 'admin', role: 'admin' \},\n  \{ id: '2', username: 'usuario1', role: 'user' \}\n\];/,
  `const INITIAL_USERS: UserAccount[] = [
  { id: '1', username: 'admin', password: '123', role: 'admin', permissions: ['projects', 'agents', 'sanipes', 'dicapi', 'saved_vessels'] },
  { id: '2', username: 'usuario1', password: '123', role: 'user', permissions: ['sanipes', 'dicapi'] }
];`
);

// 3. Update Login Logic
const oldLogin = `  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = usersDb.find(u => u.username.toLowerCase() === loginUsername.toLowerCase());
    if (user) {
      setCurrentUser(user); setLoginError(''); setCurrentView('chat');
      const userChats = chats.filter(c => c.userId === user.id);
      if (userChats.length === 0) handleNewChat(user.id);
      else setCurrentChatId(userChats[0].id);
    } else {
      setLoginError('Usuario no encontrado.');
    }
  };`;

const newLogin = `  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = usersDb.find(u => u.username.toLowerCase() === loginUsername.toLowerCase());
    if (user && (user.password === loginPassword || !user.password)) {
      setCurrentUser(user); setLoginError(''); setCurrentView('chat');
      const userChats = chats.filter(c => c.userId === user.id);
      if (userChats.length === 0) handleNewChat(user.id);
      else setCurrentChatId(userChats[0].id);
    } else {
      setLoginError('Usuario o contraseña incorrectos.');
    }
  };`;

content = content.replace(oldLogin, newLogin);

// 4. Update Sidebar to check permissions
// Replace the buttons in the sidebar
const sidebarButtons = [
  { view: 'projects', icon: 'Folder', label: 'Proyectos', color: 'emerald-400' },
  { view: 'agents', icon: 'Cpu', label: 'Agentes Generados', color: 'purple-400', extra: ' setActiveAgentId(null);' },
  { view: 'sanipes', icon: 'Globe', label: 'SANIPES', color: 'blue-400' },
  { view: 'dicapi', icon: 'Search', label: 'CONSULTAS DICAPI', color: 'blue-400' },
  { view: 'saved_vessels', icon: 'List', label: 'Naves Guardadas', color: 'yellow-400' }
];

let sidebarHtml = '';
sidebarButtons.forEach(btn => {
  const extra = btn.extra ? btn.extra : '';
  sidebarHtml += `              {(currentUser?.role === 'admin' || currentUser?.permissions?.includes('${btn.view}')) && (
                <button onClick={() => {setCurrentView('${btn.view}');${extra}}} className={\`w-full flex items-center gap-3 px-3 py-2 rounded-2xl text-sm \${currentView === '${btn.view}' ? 'bg-white/10 text-[#0A84FF]' : 'hover:bg-white/10 active:scale-[0.98] transition-all duration-200 text-gray-400'}\`}><${btn.icon} size={16} /> ${btn.label}</button>
              )}\n`;
});

// We need to find the block of buttons in the sidebar and replace it.
// Let's use regex.
const sidebarRegex = /<button onClick=\{\(\) => setCurrentView\('projects'\)\}.*?Naves Guardadas<\/button>/s;
content = content.replace(sidebarRegex, sidebarHtml.trim());

fs.writeFileSync('src/App.tsx', content);
console.log('User permissions and login updated.');
