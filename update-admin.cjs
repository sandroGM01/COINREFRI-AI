const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Add new state variables for user creation
const stateVars = `  const [newUsername, setNewUsername] = useState('');
  const [newUserRole, setNewUserRole] = useState<Role>('user');`;

const newStateVars = `  const [newUsername, setNewUsername] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<Role>('user');
  const [newUserPermissions, setNewUserPermissions] = useState<string[]>(['projects', 'agents', 'sanipes', 'dicapi', 'saved_vessels']);`;

content = content.replace(stateVars, newStateVars);

// 2. Update handleCreateUser
const oldHandleCreateUser = `  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || usersDb.some(u => u.username === newUsername)) return showAlert('Usuario inválido o ya existe');
    setUsersDb([...usersDb, { id: Date.now().toString(), username: newUsername.trim(), role: newUserRole }]);
    setNewUsername('');
  };`;

const newHandleCreateUser = `  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || usersDb.some(u => u.username === newUsername)) return showAlert('Usuario inválido o ya existe');
    setUsersDb([...usersDb, { id: Date.now().toString(), username: newUsername.trim(), password: newUserPassword, role: newUserRole, permissions: newUserPermissions }]);
    setNewUsername('');
    setNewUserPassword('');
    setNewUserPermissions(['projects', 'agents', 'sanipes', 'dicapi', 'saved_vessels']);
  };
  
  const togglePermission = (perm: string) => {
    setNewUserPermissions(prev => prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm]);
  };`;

content = content.replace(oldHandleCreateUser, newHandleCreateUser);

// 3. Replace the UI for User Management
const oldUserManagement = `<h2 className="text-2xl font-bold text-white pt-6 border-t border-white/5">Gestión de Usuarios</h2>
              <div className="grid md:grid-cols-3 gap-6">
                <form onSubmit={handleCreateUser} className="bg-[#1C1C1E]/60 backdrop-blur-3xl border border-white/5 p-5 rounded-xl h-fit space-y-4">
                  <h3 className="font-medium text-white flex items-center gap-2"><UserPlus size={18} className="text-[#0A84FF]"/> Nuevo Usuario</h3>
                  <input type="text" value={newUsername} onChange={e=>setNewUsername(e.target.value)} placeholder="Username" className="w-full bg-white/10 text-white rounded-2xl px-3 py-2 border border-white/20" required />
                  <select value={newUserRole} onChange={e=>setNewUserRole(e.target.value as Role)} className="w-full bg-white/10 text-white rounded-2xl px-3 py-2 border border-white/20">
                    <option value="user">Usuario</option><option value="admin">Admin</option>
                  </select>
                  <button type="submit" className="w-full bg-emerald-600 text-white py-2 rounded-2xl">Crear</button>
                </form>
                <div className="md:col-span-2 bg-[#1C1C1E]/60 backdrop-blur-3xl border border-white/5 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-sm text-gray-400">
                    <thead className="bg-white/10/50 text-xs uppercase"><tr><th className="px-4 py-3">Usuario</th><th className="px-4 py-3">Rol</th><th className="px-4 py-3 text-right">Acción</th></tr></thead>
                    <tbody>
                      {usersDb.map(u => (
                        <tr key={u.id} className="border-b border-white/5">
                          <td className="px-4 py-3 text-gray-200">{u.username}</td>
                          <td className="px-4 py-3">{u.role}</td>
                          <td className="px-4 py-3 text-right">
                            <button onClick={()=>handleDeleteUser(u.id)} className="text-red-400 hover:text-red-300"><Trash2 size={16}/></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>`;

const newUserManagement = `<h2 className="text-2xl font-bold text-white pt-6 border-t border-white/5">Gestión de Usuarios</h2>
              <div className="grid md:grid-cols-3 gap-6">
                <form onSubmit={handleCreateUser} className="bg-[#1C1C1E]/60 backdrop-blur-3xl border border-white/5 p-5 rounded-xl h-fit space-y-4">
                  <h3 className="font-medium text-white flex items-center gap-2"><UserPlus size={18} className="text-[#0A84FF]"/> Nuevo Usuario</h3>
                  <input type="text" value={newUsername} onChange={e=>setNewUsername(e.target.value)} placeholder="Usuario" className="w-full bg-white/10 text-white rounded-2xl px-3 py-2 border border-white/20 focus:border-[#0A84FF] outline-none" required />
                  <input type="password" value={newUserPassword} onChange={e=>setNewUserPassword(e.target.value)} placeholder="Contraseña" className="w-full bg-white/10 text-white rounded-2xl px-3 py-2 border border-white/20 focus:border-[#0A84FF] outline-none" required />
                  <select value={newUserRole} onChange={e=>setNewUserRole(e.target.value as Role)} className="w-full bg-white/10 text-white rounded-2xl px-3 py-2 border border-white/20 focus:border-[#0A84FF] outline-none">
                    <option value="user">Usuario</option><option value="admin">Admin</option>
                  </select>
                  
                  {newUserRole === 'user' && (
                    <div className="space-y-2 mt-4">
                      <label className="text-xs font-semibold text-gray-400 uppercase">Permisos de Acceso</label>
                      <div className="flex flex-col gap-2">
                        {[
                          { id: 'projects', label: 'Proyectos' },
                          { id: 'agents', label: 'Agentes Generados' },
                          { id: 'sanipes', label: 'SANIPES' },
                          { id: 'dicapi', label: 'CONSULTAS DICAPI' },
                          { id: 'saved_vessels', label: 'Naves Guardadas' }
                        ].map(perm => (
                          <label key={perm.id} className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                            <input type="checkbox" checked={newUserPermissions.includes(perm.id)} onChange={() => togglePermission(perm.id)} className="rounded border-white/20 bg-white/10 text-[#0A84FF] focus:ring-[#0A84FF]" />
                            {perm.label}
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  <button type="submit" className="w-full bg-[#0A84FF] hover:bg-[#007AFF] active:scale-[0.98] transition-all duration-200 text-white py-2 rounded-2xl mt-2">Crear Usuario</button>
                </form>
                <div className="md:col-span-2 bg-[#1C1C1E]/60 backdrop-blur-3xl border border-white/5 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-sm text-gray-400">
                    <thead className="bg-white/10 text-xs uppercase"><tr><th className="px-4 py-3">Usuario</th><th className="px-4 py-3">Contraseña</th><th className="px-4 py-3">Rol</th><th className="px-4 py-3">Permisos</th><th className="px-4 py-3 text-right">Acción</th></tr></thead>
                    <tbody>
                      {usersDb.map(u => (
                        <tr key={u.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="px-4 py-3 text-gray-200 font-medium">{u.username}</td>
                          <td className="px-4 py-3 font-mono text-xs text-gray-500">{u.password || 'N/A'}</td>
                          <td className="px-4 py-3">
                            <span className={\`px-2 py-1 rounded-full text-xs \${u.role === 'admin' ? 'bg-[#0A84FF]/20 text-[#0A84FF]' : 'bg-gray-500/20 text-gray-300'}\`}>{u.role}</span>
                          </td>
                          <td className="px-4 py-3 text-xs">
                            {u.role === 'admin' ? 'Acceso Total' : (u.permissions?.length ? u.permissions.join(', ') : 'Ninguno')}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button onClick={()=>handleDeleteUser(u.id)} className="text-gray-500 hover:text-red-400 active:scale-[0.98] transition-all p-1"><Trash2 size={16}/></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>`;

content = content.replace(oldUserManagement, newUserManagement);

fs.writeFileSync('src/App.tsx', content);
console.log('Admin user management updated.');
