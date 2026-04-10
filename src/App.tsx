import React, { useState, useRef, useEffect } from 'react';
import { 
  MessageSquare, Settings, Plus, Image as ImageIcon, 
  Paperclip, Send, User, Shield, LogOut, 
  Menu, Bot, FileText, X, Loader2, Lock, Users, UserPlus, 
  Trash2, Edit2, Save, Folder, Cpu, Globe, Zap, UploadCloud, CheckCircle, Search, ArrowLeft, Download, Waves, List
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

// --- Tipos ---
type Role = 'admin' | 'user';

type UserAccount = { id: string; username: string; role: Role; };

type SavedVessel = {
  id: string;
  matricula: string;
  nombre: string;
  arqueoBruto: string;
  arqueoNeto: string;
  eslora: string;
  manga: string;
  puntal: string;
  capacidadBodega: string;
  tieneRadiobaliza: string;
  codRadiobaliza: string;
  propietarios: any[];
  savedAt: number;
};

type Message = {
  id: string; role: 'user' | 'assistant'; content: string;
  attachments?: { type: 'pdf' | 'image', name: string }[];
};

type ChatSession = {
  id: string; userId: string; title: string; messages: Message[];
  agentId: string | null; projectId: string | null; updatedAt: number;
  attachedDocument?: { name: string; data: any };
};

type Project = {
  id: string; userId: string; name: string; description: string;
  files: { name: string; size: number }[]; createdAt: number;
};

type Agent = {
  id: string; userId: string; name: string; description: string;
  instructions: string; projectId: string | null; urls: string[];
  quickResponses: string[]; createdAt: number;
};

type SystemSettings = {
  model: string; temperature: number; maxTokens: number; systemPrompt: string;
};

// --- Datos Iniciales ---
const INITIAL_USERS: UserAccount[] = [
  { id: '1', username: 'admin', role: 'admin' },
  { id: '2', username: 'usuario1', role: 'user' }
];

const INITIAL_SETTINGS: SystemSettings = {
  model: 'gemma-4-31b', temperature: 0.7, maxTokens: 4096,
  systemPrompt: 'Eres un asistente de IA empresarial avanzado.'
};

export default function App() {
  // --- Estados Globales (Persistencia LocalStorage) ---
  const [usersDb, setUsersDb] = useState<UserAccount[]>(() => {
    const saved = localStorage.getItem('ent_users'); return saved ? JSON.parse(saved) : INITIAL_USERS;
  });
  const [systemSettings, setSystemSettings] = useState<SystemSettings>(() => {
    const saved = localStorage.getItem('ent_settings'); return saved ? JSON.parse(saved) : INITIAL_SETTINGS;
  });
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    const saved = localStorage.getItem('ent_current_user'); return saved ? JSON.parse(saved) : null;
  });
  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem('ent_projects'); return saved ? JSON.parse(saved) : [];
  });
  const [agents, setAgents] = useState<Agent[]>(() => {
    const saved = localStorage.getItem('ent_agents'); return saved ? JSON.parse(saved) : [];
  });
  const [chats, setChats] = useState<ChatSession[]>(() => {
    const saved = localStorage.getItem('ent_chats'); return saved ? JSON.parse(saved) : [];
  });

  // --- Estados de UI ---
  const [currentView, setCurrentView] = useState<'chat' | 'admin' | 'settings' | 'projects' | 'agents' | 'sanipes' | 'dicapi' | 'saved_vessels'>('chat');
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null);

  // Saved Vessels State
  const [savedVessels, setSavedVessels] = useState<SavedVessel[]>(() => {
    const saved = localStorage.getItem('ent_saved_vessels'); return saved ? JSON.parse(saved) : [];
  });
  const [excelSuccessMessage, setExcelSuccessMessage] = useState('');
  const [selectedSavedVessel, setSelectedSavedVessel] = useState<SavedVessel | null>(null);

  // DICAPI State
  const [dicapiForm, setDicapiForm] = useState({ tipoConsulta: '1', query: '' });
  const [dicapiResult, setDicapiResult] = useState<any>(null);
  const [isDicapiLoading, setIsDicapiLoading] = useState(false);
  const [dicapiFormError, setDicapiFormError] = useState('');

  // Sanipes State
  const [sanipesForm, setSanipesForm] = useState({ matricula: '', nombre: '', protocolo: '' });
  const [sanipesResult, setSanipesResult] = useState<any>(null);
  const [isSanipesLoading, setIsSanipesLoading] = useState(false);
  const [sanipesFormError, setSanipesFormError] = useState('');
  
  // Sanipes Inline Chat State
  const [showSanipesChat, setShowSanipesChat] = useState(false);
  const [sanipesChatMessages, setSanipesChatMessages] = useState<Message[]>([]);
  const [sanipesChatInput, setSanipesChatInput] = useState('');
  const [isSanipesChatTyping, setIsSanipesChatTyping] = useState(false);
  const sanipesChatEndRef = useRef<HTMLDivElement>(null);
  const [showProtocolosModal, setShowProtocolosModal] = useState(false);
  const [selectedProtocolContext, setSelectedProtocolContext] = useState<any>(null);

  // Login
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Chat
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Formularios
  const [newUsername, setNewUsername] = useState('');
  const [newUserRole, setNewUserRole] = useState<Role>('user');
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', description: '' });
  const [showAgentForm, setShowAgentForm] = useState(false);
  const [newAgent, setNewAgent] = useState({ name: '', description: '', instructions: '', projectId: '', urls: [''], quickResponses: [''] });

  // Modal custom para reemplazar alert/confirm
  type ModalState = { type: 'alert' | 'confirm', message: string, onConfirm?: () => void };
  const [modal, setModal] = useState<ModalState | null>(null);
  const showAlert = (message: string) => setModal({ type: 'alert', message });
  const showConfirm = (message: string, onConfirm: () => void) => setModal({ type: 'confirm', message, onConfirm });

  // Modal Nuevo Chat
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [selectedNewChatType, setSelectedNewChatType] = useState<'general' | 'project' | 'agent'>('general');
  const [selectedNewChatId, setSelectedNewChatId] = useState<string>('');

  const openNewChatModal = () => {
    setSelectedNewChatType('general');
    setSelectedNewChatId('');
    setShowNewChatModal(true);
  };

  // --- Efectos ---
  useEffect(() => { localStorage.setItem('ent_users', JSON.stringify(usersDb)); }, [usersDb]);
  useEffect(() => { localStorage.setItem('ent_settings', JSON.stringify(systemSettings)); }, [systemSettings]);
  useEffect(() => { 
    if (currentUser) localStorage.setItem('ent_current_user', JSON.stringify(currentUser));
    else localStorage.removeItem('ent_current_user');
  }, [currentUser]);
  useEffect(() => { localStorage.setItem('ent_projects', JSON.stringify(projects)); }, [projects]);
  useEffect(() => { localStorage.setItem('ent_agents', JSON.stringify(agents)); }, [agents]);
  useEffect(() => { localStorage.setItem('ent_chats', JSON.stringify(chats)); }, [chats]);

  useEffect(() => {
    if (currentView === 'chat') messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chats, currentChatId, isTyping, currentView]);

  // --- Handlers: Login ---
  const handleLogin = (e: React.FormEvent) => {
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
  };

  const handleLogout = () => { setCurrentUser(null); setLoginUsername(''); setLoginPassword(''); };

  // --- Handlers: Chat ---
  const userChats = chats.filter(c => c.userId === currentUser?.id && !c.agentId).sort((a, b) => b.updatedAt - a.updatedAt);
  const currentChat = chats.find(c => c.id === currentChatId);
  const currentAgent = agents.find(a => a.id === currentChat?.agentId);
  const currentProject = projects.find(p => p.id === currentChat?.projectId);

  const handleDeleteChat = (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation();
    showConfirm('¿Eliminar este chat?', () => {
      const newChats = chats.filter(c => c.id !== chatId);
      setChats(newChats);
      if (currentChatId === chatId) {
        setCurrentChatId(newChats.length > 0 ? newChats[0].id : null);
        if (newChats.length === 0) setCurrentView('projects');
      }
    });
  };

  const handleNewChat = (userId: string = currentUser?.id || '', agentId: string | null = null, projectId: string | null = null) => {
    let title = 'Nuevo Chat';
    if (agentId) title = `Agente: ${agents.find(a=>a.id===agentId)?.name}`;
    else if (projectId) title = `Proyecto: ${projects.find(p=>p.id===projectId)?.name}`;

    const newChat: ChatSession = {
      id: Date.now().toString(), userId, title,
      messages: [{ id: Date.now().toString(), role: 'assistant', content: 'Hola. ¿En qué puedo ayudarte hoy?' }],
      agentId, projectId, updatedAt: Date.now()
    };
    setChats([newChat, ...chats]);
    setCurrentChatId(newChat.id);
    setCurrentView('chat');
  };

  const handleSend = (textOverride?: string) => {
    const textToSend = textOverride || input;
    if (!textToSend.trim() && attachments.length === 0) return;
    if (!currentChatId) return;

    const newMsg: Message = {
      id: Date.now().toString(), role: 'user', content: textToSend,
      attachments: attachments.map(f => ({ type: f.type.includes('pdf') ? 'pdf' : 'image', name: f.name }))
    };

    setChats(prev => prev.map(c => {
      if (c.id === currentChatId) {
        const isFirst = c.messages.filter(m => m.role === 'user').length === 0;
        return { ...c, title: isFirst && !c.agentId && !c.projectId ? textToSend.slice(0, 25) + '...' : c.title, messages: [...c.messages, newMsg], updatedAt: Date.now() };
      }
      return c;
    }));

    setInput(''); setAttachments([]); setIsTyping(true);

    setTimeout(() => {
      let responseText = "";
      if (currentChat?.agentId) {
        const agent = agents.find(a => a.id === currentChat.agentId);
        responseText = `[Agente: ${agent?.name}] Procesando con instrucciones personalizadas. `;
      } else if (currentChat?.projectId) {
        const proj = projects.find(p => p.id === currentChat.projectId);
        responseText = `[Proyecto: ${proj?.name}] Buscando en la base vectorial (${proj?.files.length} archivos). `;
      } else {
        responseText = `[${systemSettings.model}] `;
      }

      if (newMsg.attachments?.some(a => a.type === 'pdf')) responseText += `He analizado el PDF adjunto. `;
      else if (newMsg.attachments?.some(a => a.type === 'image')) responseText += "He analizado la imagen con Visión. ";
      else responseText += "Respuesta generada correctamente.";

      setChats(prev => prev.map(c => c.id === currentChatId ? { ...c, messages: [...c.messages, { id: Date.now().toString(), role: 'assistant', content: responseText }], updatedAt: Date.now() } : c));
      setIsTyping(false);
    }, 1000);
  };

  // --- Handlers: Sanipes ---
  const handleSanipesSearch = async () => {
    if (!sanipesForm.matricula && !sanipesForm.nombre && !sanipesForm.protocolo) {
      setSanipesFormError('Por favor ingresa al menos un criterio de búsqueda (Matrícula, Nombre o Protocolo).');
      return;
    }
    setSanipesFormError('');
    setIsSanipesLoading(true);
    setSanipesResult(null);

    try {
      const res = await fetch('/api/sanipes/consulta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          Matricula: sanipesForm.matricula,
          Nombre: sanipesForm.nombre,
          cod_habilitacion: sanipesForm.protocolo
        })
      });
      const data = await res.json();

      if (data.html && data.html.includes('No se encontraron registros')) {
        setSanipesFormError('No se encontraron registros en SANIPES con esos datos.');
        setIsSanipesLoading(false);
        return;
      }

      const matriculaEncontrada = data.matricula;
      const nombreEncontrado = data.nombre;
      const tipoEncontrado = data.tipo;
      const actividadEncontrada = data.actividad;
      const codHabilitacionEncontrado = data.codigoHabilitacion;

      if (!matriculaEncontrada) {
        setSanipesFormError('Error al procesar los datos de SANIPES. No se pudo extraer la matrícula.');
        setIsSanipesLoading(false);
        return;
      }

      const resProtocols = await fetch(`/api/sanipes/protocolos?matricula=${encodeURIComponent(matriculaEncontrada)}`);
      const protocols = await resProtocols.json();

      const historial = protocols.map((p: any) => ({
        protocolo: p.protocolo,
        fecha: p.fecha_inicio_text,
        pdfUrl: p.ruta_pdf
      }));

      const currentProtocol = historial.length > 0 ? historial[0] : null;

      setSanipesResult({
        nombre: nombreEncontrado || 'N/A',
        matricula: matriculaEncontrada,
        protocolo: currentProtocol ? currentProtocol.protocolo : 'N/A',
        codigoHabilitacion: codHabilitacionEncontrado || 'N/A',
        actividad: actividadEncontrada || 'N/A',
        tipo: tipoEncontrado || 'N/A',
        emision: currentProtocol ? currentProtocol.fecha : 'N/A',
        vencimiento: 'N/A',
        estado: 'VIGENTE',
        pdfUrl: currentProtocol ? currentProtocol.pdfUrl : null,
        historial: historial
      });
      
      if (currentProtocol) {
        setSelectedProtocolContext(currentProtocol);
      }

    } catch (error) {
      console.error(error);
      setSanipesFormError('Error de conexión con el servidor.');
    } finally {
      setIsSanipesLoading(false);
    }
  };

  const handleDownloadSanipesPDF = (dataToDownload?: any) => {
    const data = (dataToDownload && !dataToDownload.nativeEvent) ? dataToDownload : sanipesResult;
    if (!data || !data.pdfUrl) {
      return showAlert('El enlace al documento original no está disponible.');
    }
    window.open(data.pdfUrl, '_blank');
  };

  const handleOpenSanipesChat = () => {
    setShowSanipesChat(true);
  };

  const handleSanipesChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sanipesChatInput.trim()) return;
    
    const newMsg: Message = { id: Date.now().toString(), role: 'user', content: sanipesChatInput };
    setSanipesChatMessages(prev => [...prev, newMsg]);
    setSanipesChatInput('');
    setIsSanipesChatTyping(true);
    
    setTimeout(() => {
      const currentProt = selectedProtocolContext?.protocolo || sanipesResult?.protocolo;
      const currentFecha = selectedProtocolContext?.fecha || sanipesResult?.emision;
      
      const resp: Message = { 
        id: (Date.now() + 1).toString(), 
        role: 'assistant', 
        content: `**Análisis del Documento: ${currentProt}**\n\nHe procesado el documento PDF seleccionado. Aquí tienes la información detallada extraída del protocolo:\n\n*   **Embarcación:** ${sanipesResult?.nombre} (${sanipesResult?.matricula})\n*   **Actividad:** ${sanipesResult?.actividad}\n*   **Tipo:** ${sanipesResult?.tipo}\n*   **Estado Actual:** ${sanipesResult?.estado}\n*   **Vigencia:** Desde ${currentFecha}\n\n**Observaciones del Inspector:**\nLa habilitación sanitaria está sujeta a fiscalización sanitaria por parte del SANIPES. El presente protocolo certifica las condiciones operativas.\n\n**Respuesta a tu consulta:**\nEn relación a tu pregunta ("*${newMsg.content}*"), el documento certifica que la embarcación cumple con todos los requisitos de diseño, construcción y equipamiento para la extracción de recursos hidrobiológicos, manteniendo su condición operativa sin restricciones adicionales en este periodo.` 
      };
      setSanipesChatMessages(prev => [...prev, resp]);
      setIsSanipesChatTyping(false);
    }, 1500);
  };

  // --- Handlers: DICAPI ---
  const handleDicapiSearch = async () => {
    if (!dicapiForm.query) {
      setDicapiFormError('Por favor ingresa el valor de búsqueda.');
      return;
    }
    setDicapiFormError('');
    setIsDicapiLoading(true);
    setDicapiResult(null);

    try {
      const res = await fetch('/api/dicapi/consulta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipoConsulta: dicapiForm.tipoConsulta, query: dicapiForm.query })
      });
      const data = await res.json();

      if (!res.ok) {
        setDicapiFormError(data.error || 'Error al consultar DICAPI.');
        setIsDicapiLoading(false);
        return;
      }

      setDicapiResult(data);
    } catch (error) {
      console.error(error);
      setDicapiFormError('Error de conexión con el servidor.');
    } finally {
      setIsDicapiLoading(false);
    }
  };

  const handleSaveVessel = () => {
    if (!dicapiResult) return;
    
    // Check if already saved
    if (savedVessels.some(v => v.matricula === dicapiResult.matricula)) {
      alert('Esta embarcación ya está guardada en la lista.');
      return;
    }

    const newVessel: SavedVessel = {
      id: Date.now().toString(),
      matricula: dicapiResult.matricula,
      nombre: dicapiResult.nombre,
      arqueoBruto: dicapiResult.arqueoBruto,
      arqueoNeto: dicapiResult.arqueoNeto,
      eslora: dicapiResult.eslora,
      manga: dicapiResult.manga,
      puntal: dicapiResult.puntal,
      capacidadBodega: dicapiResult.capacidadBodega,
      tieneRadiobaliza: dicapiResult.tieneRadiobaliza,
      codRadiobaliza: dicapiResult.codRadiobaliza,
      propietarios: dicapiResult.propietarios || [],
      savedAt: Date.now()
    };

    const updatedVessels = [...savedVessels, newVessel];
    setSavedVessels(updatedVessels);
    localStorage.setItem('ent_saved_vessels', JSON.stringify(updatedVessels));
    alert('Embarcación guardada exitosamente.');
  };

  const handleDownloadExcel = async () => {
    if (savedVessels.length === 0) return;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Naves Guardadas');

    // Define columns
    worksheet.columns = [
      { header: 'Matrícula', key: 'matricula', width: 20 },
      { header: 'Nombre de la Nave', key: 'nombre', width: 30 },
      { header: 'Arqueo Bruto', key: 'arqueoBruto', width: 15 },
      { header: 'Arqueo Neto', key: 'arqueoNeto', width: 15 },
      { header: 'Eslora', key: 'eslora', width: 15 },
      { header: 'Manga', key: 'manga', width: 15 },
      { header: 'Puntal', key: 'puntal', width: 15 },
      { header: 'Capacidad de Bodega', key: 'capacidadBodega', width: 25 },
      { header: 'Tiene Radiobaliza', key: 'tieneRadiobaliza', width: 20 },
      { header: 'Cód. Radiobaliza', key: 'codRadiobaliza', width: 25 },
      { header: 'Propietarios', key: 'propietarios', width: 50 },
      { header: 'Fecha de Consulta', key: 'fechaConsulta', width: 25 },
    ];

    // Style the header row
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFEA580C' } // Tailwind blue-600
    };
    worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

    // Add rows
    savedVessels.forEach((v) => {
      const propietariosStr = v.propietarios && v.propietarios.length > 0
        ? v.propietarios.map(p => `${p.nombre} (${p.docIdentidad})`).join('\n')
        : 'Sin propietarios';

      const row = worksheet.addRow({
        matricula: v.matricula,
        nombre: v.nombre,
        arqueoBruto: v.arqueoBruto,
        arqueoNeto: v.arqueoNeto,
        eslora: v.eslora,
        manga: v.manga,
        puntal: v.puntal,
        capacidadBodega: v.capacidadBodega,
        tieneRadiobaliza: v.tieneRadiobaliza,
        codRadiobaliza: v.codRadiobaliza,
        propietarios: propietariosStr,
        fechaConsulta: new Date(v.savedAt).toLocaleString()
      });

      // Add basic border and alignment to all cells in the row
      row.eachCell({ includeEmpty: true }, (cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
          left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
          bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
          right: { style: 'thin', color: { argb: 'FFCCCCCC' } }
        };
        cell.alignment = { vertical: 'middle', wrapText: true };
      });
    });

    // Add border to header as well
    worksheet.getRow(1).eachCell({ includeEmpty: true }, (cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        right: { style: 'thin', color: { argb: 'FFCCCCCC' } }
      };
    });

    // Generate Excel file and trigger download
    const buffer = await workbook.xlsx.writeBuffer();
    const today = new Date().toISOString().split('T')[0];
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `Naves_DICAPI_${today}.xlsx`);

    // Clear list and show success message
    setSavedVessels([]);
    localStorage.removeItem('ent_saved_vessels');
    setExcelSuccessMessage(`¡Excel descargado! La lista de naves del día de hoy ha sido limpiada para nuevas consultas.`);
    
    // Hide message after 5 seconds
    setTimeout(() => {
      setExcelSuccessMessage('');
    }, 5000);
  };

  // --- Handlers: Admin & Settings ---
  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || usersDb.some(u => u.username === newUsername)) return showAlert('Usuario inválido o ya existe');
    setUsersDb([...usersDb, { id: Date.now().toString(), username: newUsername.trim(), role: newUserRole }]);
    setNewUsername('');
  };
  const handleDeleteUser = (id: string) => {
    if (id === currentUser?.id) return showAlert('No puedes eliminarte a ti mismo.');
    showConfirm('¿Eliminar usuario?', () => setUsersDb(usersDb.filter(u => u.id !== id)));
  };
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault(); showAlert('Configuración guardada.');
  };

  // --- Handlers: Proyectos & Agentes ---
  const handleDeleteProject = (projectId: string) => {
    showConfirm('¿Eliminar este proyecto y todos sus archivos?', () => {
      setProjects(projects.filter(p => p.id !== projectId));
      setAgents(agents.map(a => a.projectId === projectId ? { ...a, projectId: null } : a));
      const remainingChats = chats.filter(c => c.projectId !== projectId);
      setChats(remainingChats);
      if (currentChat?.projectId === projectId) {
        setCurrentChatId(remainingChats.length > 0 ? remainingChats[0].id : null);
        setCurrentView('projects');
      }
    });
  };

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    setProjects([{ id: Date.now().toString(), userId: currentUser!.id, name: newProject.name, description: newProject.description, files: [], createdAt: Date.now() }, ...projects]);
    setNewProject({ name: '', description: '' }); setShowProjectForm(false);
  };
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, projectId: string) => {
    if (e.target.files?.length) {
      const newFiles = Array.from(e.target.files).map((f: File) => ({ name: f.name, size: f.size }));
      setProjects(projects.map(p => p.id === projectId ? { ...p, files: [...p.files, ...newFiles] } : p));
    }
  };
  const handleCreateAgent = (e: React.FormEvent) => {
    e.preventDefault();
    setAgents([{
      id: Date.now().toString(), userId: currentUser!.id, name: newAgent.name, description: newAgent.description,
      instructions: newAgent.instructions, projectId: newAgent.projectId || null,
      urls: newAgent.urls.filter(u => u), quickResponses: newAgent.quickResponses.filter(q => q), createdAt: Date.now()
    }, ...agents]);
    setNewAgent({ name: '', description: '', instructions: '', projectId: '', urls: [''], quickResponses: [''] });
    setShowAgentForm(false);
  };

  // ==========================================
  // VISTA: LOGIN
  // ==========================================
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#000000] flex items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full bg-[#1C1C1E]/60 backdrop-blur-3xl rounded-2xl shadow-2xl border border-white/5 p-8">
          <div className="flex justify-center mb-6"><div className="w-16 h-16 rounded-2xl bg-[#0A84FF] flex items-center justify-center"><Waves size={32} className="text-white" /></div></div>
          <h2 className="text-2xl font-bold text-center text-white mb-6">COINREFRI AI</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-300 mb-1">Usuario</label>
              <input type="text" value={loginUsername} onChange={(e) => setLoginUsername(e.target.value)} className="w-full bg-white/10 border border-white/20 text-white rounded-2xl px-4 py-2.5 focus:outline-none focus:border-[#0A84FF]" placeholder="admin o usuario1" required />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1">Contraseña</label>
              <input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} className="w-full bg-white/10 border border-white/20 text-white rounded-2xl px-4 py-2.5 focus:outline-none focus:border-[#0A84FF]" placeholder="••••••••" required />
            </div>
            {loginError && <div className="text-red-400 text-sm text-center">{loginError}</div>}
            <button type="submit" className="w-full bg-[#007AFF] hover:bg-[#0A84FF] active:scale-[0.98] transition-all duration-200 text-white font-medium py-2.5 rounded-2xl mt-4">Ingresar</button>
          </form>
        </div>
      </div>
    );
  }

  // ==========================================
  // VISTA: PRINCIPAL
  // ==========================================
  return (
    <div className="flex h-screen bg-[#000000] text-gray-100 font-sans overflow-hidden relative">
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#0A84FF]/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#0A84FF]/10 blur-[120px] rounded-full pointer-events-none" />
      {/* Sidebar */}
      <div className={`${isSidebarOpen ? 'w-64' : 'w-0'} transition-all duration-300 bg-[#1C1C1E]/60 backdrop-blur-3xl flex flex-col border-r border-white/5 shrink-0`}>
        <div className="p-4 flex items-center gap-3 border-b border-white/5">
          <div className="w-8 h-8 rounded-2xl bg-[#0A84FF] flex items-center justify-center"><Waves size={20} className="text-white" /></div>
          <span className="font-semibold text-lg">COINREFRI AI</span>
        </div>
        <div className="p-3">
          <button onClick={openNewChatModal} className="w-full flex items-center gap-2 bg-[#007AFF] hover:bg-[#0A84FF] active:scale-[0.98] transition-all duration-200 text-white px-4 py-2.5 rounded-2xl text-sm font-medium">
            <Plus size={18} /> Nuevo Chat
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          <div>
            <div className="text-xs font-semibold text-gray-400 uppercase mb-2 px-2">Espacio de Trabajo</div>
            <div className="space-y-1">
              <button onClick={() => setCurrentView('projects')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-2xl text-sm ${currentView === 'projects' ? 'bg-white/10 text-[#0A84FF]' : 'hover:bg-white/10 active:scale-[0.98] transition-all duration-200 text-gray-400'}`}><Folder size={16} /> Proyectos</button>
              <button onClick={() => {setCurrentView('agents'); setActiveAgentId(null);}} className={`w-full flex items-center gap-3 px-3 py-2 rounded-2xl text-sm ${currentView === 'agents' ? 'bg-white/10 text-[#0A84FF]' : 'hover:bg-white/10 active:scale-[0.98] transition-all duration-200 text-gray-400'}`}><Cpu size={16} /> Agentes Generados</button>
              <button onClick={() => setCurrentView('sanipes')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-2xl text-sm ${currentView === 'sanipes' ? 'bg-white/10 text-[#0A84FF]' : 'hover:bg-white/10 active:scale-[0.98] transition-all duration-200 text-gray-400'}`}><Globe size={16} /> SANIPES</button>
              <button onClick={() => setCurrentView('dicapi')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-2xl text-sm ${currentView === 'dicapi' ? 'bg-white/10 text-[#0A84FF]' : 'hover:bg-white/10 active:scale-[0.98] transition-all duration-200 text-gray-400'}`}><Search size={16} /> CONSULTAS DICAPI</button>
              <button onClick={() => setCurrentView('saved_vessels')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-2xl text-sm ${currentView === 'saved_vessels' ? 'bg-white/10 text-[#0A84FF]' : 'hover:bg-white/10 active:scale-[0.98] transition-all duration-200 text-gray-400'}`}><List size={16} /> Naves Guardadas</button>
            </div>
          </div>
          <div>
            <div className="text-xs font-semibold text-gray-400 uppercase mb-2 px-2">Chats Recientes</div>
            <div className="space-y-1">
              {userChats.map(chat => (
                <div key={chat.id} className={`group flex items-center justify-between px-3 py-2 rounded-2xl text-sm ${currentChatId === chat.id && currentView === 'chat' ? 'bg-white/10 text-[#0A84FF]' : 'hover:bg-white/10 active:scale-[0.98] transition-all duration-200 text-gray-400'}`}>
                  <button onClick={() => { setCurrentChatId(chat.id); setCurrentView('chat'); }} className="flex items-center gap-3 truncate flex-1 text-left">
                    <MessageSquare size={16} className="shrink-0" /> <span className="truncate">{chat.title}</span>
                  </button>
                  <button onClick={(e) => handleDeleteChat(e, chat.id)} className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 p-1 rounded transition-opacity">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="p-3 border-t border-white/5 space-y-1">
          {currentUser.role === 'admin' && (
            <>
              <button onClick={() => setCurrentView('admin')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-2xl text-sm ${currentView === 'admin' ? 'bg-white/10 text-[#0A84FF]' : 'hover:bg-white/10 active:scale-[0.98] transition-all duration-200 text-gray-400'}`}><Shield size={18} /> Panel Admin</button>
              <button onClick={() => setCurrentView('settings')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-2xl text-sm ${currentView === 'settings' ? 'bg-white/10 text-[#0A84FF]' : 'hover:bg-white/10 active:scale-[0.98] transition-all duration-200 text-gray-400'}`}><Settings size={18} /> Configuración</button>
            </>
          )}
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2 rounded-2xl hover:bg-red-500/10 active:scale-[0.98] transition-all duration-200 text-gray-400 hover:text-red-400 text-sm mt-2"><LogOut size={18} /> Cerrar Sesión</button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#000000]">
        <header className="h-14 flex items-center px-4 border-b border-white/5 bg-[#000000]/80 shrink-0 gap-3">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-white/10 active:scale-[0.98] transition-all duration-200 rounded-2xl text-gray-400"><Menu size={20} /></button>
          <span className="font-medium text-gray-200">
            {currentView === 'admin' ? 'Panel de Administración' : currentView === 'settings' ? 'Configuración Global' : currentView === 'projects' ? 'Proyectos' : currentView === 'agents' ? (activeAgentId ? `Chat con Agente` : 'Agentes Generados') : currentView === 'sanipes' ? 'Consultas SANIPES' : currentAgent ? `Agente: ${currentAgent.name}` : currentProject ? `Proyecto: ${currentProject.name}` : 'Chat Principal'}
          </span>
        </header>
        

        {/* --- VISTA: ADMIN --- */}
        {currentView === 'admin' && currentUser.role === 'admin' && (
            
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-6xl mx-auto space-y-8">
              <h2 className="text-2xl font-bold text-white">Dashboard de Analíticas</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Chart 1: Tokens */}
                <div className="bg-[#1C1C1E]/60 backdrop-blur-3xl border border-white/5 p-5 rounded-xl">
                  <h3 className="text-sm font-medium text-gray-400 mb-4">Tokens Generados (Última Semana)</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={[
                        { name: 'Lun', tokens: 12000 }, { name: 'Mar', tokens: 19000 },
                        { name: 'Mie', tokens: 15000 }, { name: 'Jue', tokens: 22000 },
                        { name: 'Vie', tokens: 28000 }, { name: 'Sab', tokens: 9000 },
                        { name: 'Dom', tokens: 11000 }
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#313244" vertical={false} />
                        <XAxis dataKey="name" stroke="#a6adc8" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#a6adc8" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={{ backgroundColor: '#1e1e2e', borderColor: '#313244', color: '#fff', borderRadius: '8px' }} itemStyle={{ color: '#8b5cf6' }} />
                        <Line type="monotone" dataKey="tokens" stroke="#8b5cf6" strokeWidth={3} dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Chart 2: Storage */}
                <div className="bg-[#1C1C1E]/60 backdrop-blur-3xl border border-white/5 p-5 rounded-xl">
                  <h3 className="text-sm font-medium text-gray-400 mb-4">Almacenamiento por Usuario (MB)</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={usersDb.map((u, i) => ({ name: u.username, storage: [450, 120, 300, 250, 100][i % 5] || 50 }))}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#313244" vertical={false} />
                        <XAxis dataKey="name" stroke="#a6adc8" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#a6adc8" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={{ backgroundColor: '#1e1e2e', borderColor: '#313244', color: '#fff', borderRadius: '8px' }} cursor={{ fill: '#313244', opacity: 0.4 }} />
                        <Bar dataKey="storage" fill="#10b981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Chart 3: Tool Usage */}
                <div className="bg-[#1C1C1E]/60 backdrop-blur-3xl border border-white/5 p-5 rounded-xl md:col-span-2 lg:col-span-1">
                  <h3 className="text-sm font-medium text-gray-400 mb-4">Uso de Herramientas</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={[
                          { name: 'RAG (Documentos)', value: 65 },
                          { name: 'Gen. Imagen', value: 20 },
                          { name: 'Chat General', value: 15 }
                        ]} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                          <Cell fill="#10b981" />
                          <Cell fill="#8b5cf6" />
                          <Cell fill="#3b82f6" />
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#1e1e2e', borderColor: '#313244', color: '#fff', borderRadius: '8px' }} itemStyle={{ color: '#fff' }} />
                        <Legend wrapperStyle={{ fontSize: '12px', color: '#a6adc8' }} iconType="circle" />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <h2 className="text-2xl font-bold text-white pt-6 border-t border-white/5">Gestión de Usuarios</h2>
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
              </div>
            </div>
          </div>
          
        )}
        {/* --- VISTA: SETTINGS --- */}
        {currentView === 'settings' && currentUser.role === 'admin' && (
            
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-2xl mx-auto space-y-6">
              <h2 className="text-2xl font-bold text-white">Configuración del Sistema</h2>
              <form onSubmit={handleSaveSettings} className="bg-[#1C1C1E]/60 backdrop-blur-3xl border border-white/5 p-6 rounded-xl space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Modelo LLM</label>
                  <select value={systemSettings.model} onChange={e=>setSystemSettings({...systemSettings, model: e.target.value})} className="w-full bg-white/10 text-white rounded-2xl px-3 py-2 border border-white/20">
                    <option value="gemma-4-31b">Gemma 4 (31B)</option><option value="llama-3">Llama 3</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Temperatura: {systemSettings.temperature}</label>
                  <input type="range" min="0" max="1" step="0.1" value={systemSettings.temperature} onChange={e=>setSystemSettings({...systemSettings, temperature: parseFloat(e.target.value)})} className="w-full" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">System Prompt Global</label>
                  <textarea value={systemSettings.systemPrompt} onChange={e=>setSystemSettings({...systemSettings, systemPrompt: e.target.value})} className="w-full bg-white/10 text-white rounded-2xl px-3 py-2 border border-white/20" rows={4} />
                </div>
                <button type="submit" className="bg-[#0A84FF] text-white px-4 py-2 rounded-2xl flex items-center gap-2"><Save size={16}/> Guardar</button>
              </form>
            </div>
          </div>
          
        )}
        {/* --- VISTA: PROYECTOS --- */}
        {currentView === 'projects' && (
            
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-5xl mx-auto space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">Proyectos (RAG)</h2>
                <button onClick={() => setShowProjectForm(!showProjectForm)} className="bg-emerald-600 text-white px-4 py-2 rounded-2xl text-sm flex items-center gap-2"><Plus size={16}/> Crear Proyecto</button>
              </div>
              {showProjectForm && (
                <form onSubmit={handleCreateProject} className="bg-[#1C1C1E]/60 backdrop-blur-3xl border border-white/5 p-5 rounded-xl space-y-3">
                  <input type="text" value={newProject.name} onChange={e=>setNewProject({...newProject, name: e.target.value})} placeholder="Nombre del Proyecto" className="w-full bg-white/10 text-white rounded-2xl px-3 py-2 border border-white/20" required />
                  <textarea value={newProject.description} onChange={e=>setNewProject({...newProject, description: e.target.value})} placeholder="Descripción" className="w-full bg-white/10 text-white rounded-2xl px-3 py-2 border border-white/20" rows={2} />
                  <button type="submit" className="bg-emerald-600 text-white px-4 py-2 rounded-2xl text-sm">Guardar</button>
                </form>
              )}
              {projects.filter(p => p.userId === currentUser.id).length === 0 && !showProjectForm && (
                <div className="text-center py-12 bg-[#1C1C1E]/60 backdrop-blur-3xl border border-dashed border-white/20 rounded-xl">
                  <Folder size={48} className="mx-auto text-gray-500 mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">No tienes proyectos</h3>
                  <p className="text-gray-400 mb-4">Crea un proyecto para subir documentos y usar RAG.</p>
                  <button onClick={() => setShowProjectForm(true)} className="text-[#0A84FF] hover:text-emerald-300 font-medium">Crear mi primer proyecto</button>
                </div>
              )}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects.filter(p => p.userId === currentUser.id).map(p => (
                  <div key={p.id} className="bg-[#1C1C1E]/60 backdrop-blur-3xl border border-white/5 p-5 rounded-xl flex flex-col relative group">
                    <button onClick={() => handleDeleteProject(p.id)} className="absolute top-3 right-3 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1">
                      <Trash2 size={16} />
                    </button>
                    <h3 className="font-medium text-white flex items-center gap-2 mb-2 pr-6"><Folder className="text-[#0A84FF]" size={18}/> {p.name}</h3>
                    <p className="text-sm text-gray-400 mb-4 flex-1">{p.description}</p>
                    <div className="bg-white/10 rounded-2xl p-3 mb-4 text-center relative border border-dashed border-white/20 hover:border-emerald-500">
                      <input type="file" multiple onChange={(e) => handleFileUpload(e, p.id)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                      <UploadCloud size={20} className="mx-auto text-gray-400 mb-1" />
                      <span className="text-xs text-gray-400">{p.files.length} archivos indexados. Subir más.</span>
                    </div>
                    {/* BOTÓN CORREGIDO: Ahora crea un chat independiente vinculado al proyecto */}
                    <button onClick={() => handleNewChat(currentUser.id, null, p.id)} className="w-full py-2 bg-white/10 hover:bg-white/10 active:scale-[0.98] transition-all duration-200 text-white rounded-2xl text-sm">
                      Chatear con Proyecto
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
        )}
        {/* --- VISTA: AGENTES --- */}
        {currentView === 'agents' && !activeAgentId && (
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-5xl mx-auto space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">Agentes IA</h2>
                <button onClick={() => setShowAgentForm(!showAgentForm)} className="bg-[#0A84FF] text-white px-4 py-2 rounded-2xl text-sm flex items-center gap-2"><Plus size={16}/> Crear Agente</button>
              </div>
              {showAgentForm && (
                <form onSubmit={handleCreateAgent} className="bg-[#1C1C1E]/60 backdrop-blur-3xl border border-white/5 p-5 rounded-xl space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <input type="text" value={newAgent.name} onChange={e=>setNewAgent({...newAgent, name: e.target.value})} placeholder="Nombre del Agente" className="w-full bg-white/10 text-white rounded-2xl px-3 py-2 border border-white/20" required />
                    <select value={newAgent.projectId} onChange={e=>setNewAgent({...newAgent, projectId: e.target.value})} className="w-full bg-white/10 text-white rounded-2xl px-3 py-2 border border-white/20">
                      <option value="">Sin proyecto vinculado</option>
                      {projects.filter(p => p.userId === currentUser.id).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <textarea value={newAgent.instructions} onChange={e=>setNewAgent({...newAgent, instructions: e.target.value})} placeholder="Instrucciones del sistema (Prompt)" className="w-full bg-white/10 text-white rounded-2xl px-3 py-2 border border-white/20" rows={2} required />
                  <button type="submit" className="bg-[#0A84FF] text-white px-4 py-2 rounded-2xl text-sm">Guardar Agente</button>
                </form>
              )}
              {agents.filter(a => a.userId === currentUser.id).length === 0 && !showAgentForm && (
                <div className="text-center py-12 bg-[#1C1C1E]/60 backdrop-blur-3xl border border-dashed border-white/20 rounded-xl">
                  <Cpu size={48} className="mx-auto text-gray-500 mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">No tienes agentes</h3>
                  <p className="text-gray-400 mb-4">Crea un agente personalizado con instrucciones específicas.</p>
                  <button onClick={() => setShowAgentForm(true)} className="text-[#0A84FF] hover:text-purple-300 font-medium">Crear mi primer agente</button>
                </div>
              )}
              <div className="grid md:grid-cols-2 gap-4">
                {agents.filter(a => a.userId === currentUser.id).map(a => (
                  <div key={a.id} className="bg-[#1C1C1E]/60 backdrop-blur-3xl border border-white/5 p-5 rounded-xl flex flex-col">
                    <h3 className="font-medium text-white flex items-center gap-2 mb-2"><Cpu className="text-[#0A84FF]" size={18}/> {a.name}</h3>
                    <p className="text-xs text-gray-400 mb-4 flex-1 line-clamp-2">{a.instructions}</p>
                    <button onClick={() => {
                      let existingChat = chats.find(c => c.agentId === a.id && c.userId === currentUser.id);
                      if (existingChat) {
                        setCurrentChatId(existingChat.id);
                      } else {
                        const newChat: ChatSession = {
                          id: Date.now().toString(), userId: currentUser.id, title: `Agente: ${a.name}`,
                          messages: [{ id: Date.now().toString(), role: 'assistant', content: `Hola, soy ${a.name}. ¿En qué te ayudo?` }],
                          agentId: a.id, projectId: null, updatedAt: Date.now()
                        };
                        setChats([newChat, ...chats]);
                        setCurrentChatId(newChat.id);
                      }
                      setActiveAgentId(a.id);
                    }} className="w-full py-2 bg-[#0A84FF] hover:bg-[#007AFF] active:scale-[0.98] transition-all duration-200 text-white rounded-2xl text-sm">
                      Abrir Chat del Agente
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
        )}
        {/* --- VISTA: SANIPES --- */}
        {currentView === 'sanipes' && (
            
          <div className="flex-1 overflow-y-auto p-6 bg-[#000000]">
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="bg-[#1C1C1E]/60 backdrop-blur-3xl border border-white/5 p-6 rounded-xl shadow-lg">
                <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4">
                  <Globe size={28} className="text-[#0A84FF]" />
                  <div>
                    <h2 className="text-xl font-bold text-white">SANIPES - Consulta de Protocolos</h2>
                    <p className="text-sm text-gray-400">Agente automatizado para extracción de datos de embarcaciones pesqueras</p>
                  </div>
                </div>

                <div className="bg-[#000000] border border-white/5 rounded-2xl p-5 mb-6">
                  <div className="grid md:grid-cols-3 gap-6 mb-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">Matrícula</label>
                      <input type="text" value={sanipesForm.matricula} onChange={e=>{setSanipesForm({...sanipesForm, matricula: e.target.value}); setSanipesFormError('');}} placeholder="Ej. PT-67021-CM" className="w-full bg-[#1C1C1E]/60 backdrop-blur-3xl text-white rounded-xl px-3 py-2 border border-white/5 focus:border-[#0A84FF] focus:ring-1 focus:ring-[#0A84FF] outline-none transition-all" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">Nombre de Embarcación</label>
                      <input type="text" value={sanipesForm.nombre} onChange={e=>{setSanipesForm({...sanipesForm, nombre: e.target.value}); setSanipesFormError('');}} placeholder="Ej. MARIA I" className="w-full bg-[#1C1C1E]/60 backdrop-blur-3xl text-white rounded-xl px-3 py-2 border border-white/5 focus:border-[#0A84FF] focus:ring-1 focus:ring-[#0A84FF] outline-none transition-all" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">Nro. Protocolo</label>
                      <input type="text" value={sanipesForm.protocolo} onChange={e=>{setSanipesForm({...sanipesForm, protocolo: e.target.value}); setSanipesFormError('');}} placeholder="Ej. PTH-0970" className="w-full bg-[#1C1C1E]/60 backdrop-blur-3xl text-white rounded-xl px-3 py-2 border border-white/5 focus:border-[#0A84FF] focus:ring-1 focus:ring-[#0A84FF] outline-none transition-all" />
                    </div>
                  </div>
                  {sanipesFormError && <div className="text-red-400 text-sm mb-4 bg-red-400/10 p-2 rounded border border-red-400/20">{sanipesFormError}</div>}
                  <button onClick={handleSanipesSearch} disabled={isSanipesLoading} className="w-full bg-[#007AFF] hover:bg-[#0A84FF] active:scale-[0.98] transition-all duration-200 disabled:bg-white/5 text-white py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors">
                    {isSanipesLoading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
                    {isSanipesLoading ? 'Consultando al portal SANIPES...' : 'Realizar Consulta Automatizada'}
                  </button>
                </div>
              </div>

                {sanipesResult && (
                  <div className="bg-[#000000] border border-white/5 rounded-2xl overflow-hidden shadow-lg animate-in fade-in slide-in-from-bottom-4">
                    <div className="bg-[#007AFF] px-5 py-3 border-b border-white/10 flex items-center gap-2">
                      <CheckCircle size={18} className="text-white"/>
                      <h3 className="text-white font-medium">Resultado de la Consulta</h3>
                    </div>
                    <div className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                        <div>
                          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Nombre de Embarcación</p>
                          <p className="text-white font-medium text-lg">{sanipesResult.nombre}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Matrícula</p>
                          <p className="text-white font-medium text-lg">{sanipesResult.matricula}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Nro. Protocolo</p>
                          <p className="text-white font-medium">{sanipesResult.protocolo}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Código de Habilitación</p>
                          <p className="text-white font-medium">{sanipesResult.codigoHabilitacion}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Actividad</p>
                          <p className="text-white font-medium">{sanipesResult.actividad}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Tipo</p>
                          <p className="text-white font-medium">{sanipesResult.tipo}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Fechas</p>
                          <p className="text-white font-medium">Emisión: {sanipesResult.emision} <span className="text-gray-500 mx-2">|</span> Vencimiento: {sanipesResult.vencimiento}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Estado Actual</p>
                          <span className="inline-block px-3 py-1 bg-emerald-500/20 text-[#0A84FF] rounded-full text-sm font-bold border border-emerald-500/30">{sanipesResult.estado}</span>
                        </div>
                      </div>
                      
                      <div className="mt-8 pt-4 border-t border-white/5 flex justify-between items-center">
                        <span className="text-gray-300 text-sm font-medium">Ver Listado de Protocolos:</span>
                        <button onClick={() => setShowProtocolosModal(true)} className="text-[#0A84FF] hover:text-white hover:underline font-medium flex items-center gap-1 text-sm transition-colors">
                          Descargar
                        </button>
                      </div>
                      <div className="mt-6">
                        <button onClick={handleOpenSanipesChat} className="w-full bg-[#007AFF] hover:bg-[#0A84FF] active:scale-[0.98] transition-all duration-200 text-white py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors"><MessageSquare size={16}/> Chat de Consulta</button>
                      </div>
                    </div>
                  </div>
                )}

              {showSanipesChat && (
                <div className="bg-[#1C1C1E]/60 backdrop-blur-3xl border border-white/5 rounded-xl flex flex-col h-[500px] shadow-xl animate-in slide-in-from-bottom-4">
                  <div className="bg-[#000000] p-4 border-b border-white/5 flex justify-between items-center rounded-t-xl">
                    <div className="flex items-center gap-3">
                      <Waves size={20} className="text-[#0A84FF]"/>
                      <div>
                        <h3 className="text-white font-medium">Chat de Consulta</h3>
                        <p className="text-xs text-gray-400">Analizando: {selectedProtocolContext?.protocolo || sanipesResult?.protocolo}.pdf</p>
                      </div>
                    </div>
                    <button onClick={() => setShowSanipesChat(false)} className="text-gray-400 hover:text-white"><X size={20}/></button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {sanipesChatMessages.length === 0 ? (
                      <div className="text-center text-gray-500 mt-10">
                        <FileText size={40} className="mx-auto mb-3 opacity-50 text-[#0A84FF]"/>
                        <p className="text-gray-300 font-medium">Documento cargado en contexto</p>
                        <p className="text-sm mt-2">Haz una consulta sobre el protocolo de la embarcación {sanipesResult?.nombre}.</p>
                      </div>
                    ) : (
                      sanipesChatMessages.map(msg => (
                        <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          {msg.role === 'assistant' && <div className="w-8 h-8 rounded-full bg-[#0A84FF] flex items-center justify-center flex-shrink-0"><Waves size={16} className="text-white" /></div>}
                          <div className={`max-w-[80%] rounded-2xl p-3 text-sm ${msg.role === 'user' ? 'bg-[#007AFF] text-white rounded-tr-sm' : 'bg-white/10 text-gray-200 rounded-tl-sm'}`}>
                            <div className="markdown-body text-sm" dangerouslySetInnerHTML={{ __html: msg.content.replace(/\n/g, '<br/>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                          </div>
                          {msg.role === 'user' && <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0"><User size={16} className="text-white" /></div>}
                        </div>
                      ))
                    )}
                    {isSanipesChatTyping && (
                      <div className="flex gap-3 justify-start">
                        <div className="w-8 h-8 rounded-full bg-[#0A84FF] flex items-center justify-center flex-shrink-0"><Waves size={16} className="text-white" /></div>
                        <div className="bg-white/10 rounded-2xl rounded-tl-sm p-4 flex items-center gap-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    )}
                    <div ref={sanipesChatEndRef} />
                  </div>

                  <div className="p-4 border-t border-white/5 bg-[#000000] rounded-b-xl">
                    <form onSubmit={handleSanipesChatSubmit} className="flex gap-2">
                      <input 
                        type="text" 
                        value={sanipesChatInput}
                        onChange={(e) => setSanipesChatInput(e.target.value)}
                        placeholder="Escribe tu consulta sobre el protocolo..." 
                        className="flex-1 bg-white/10 text-white rounded-2xl px-4 py-2 border border-white/20 focus:border-[#0A84FF] outline-none text-sm"
                      />
                      <button type="submit" disabled={!sanipesChatInput.trim() || isSanipesChatTyping} className="bg-[#007AFF] hover:bg-[#0A84FF] active:scale-[0.98] transition-all duration-200 disabled:bg-white/5 disabled:text-gray-400 text-white p-2 rounded-2xl transition-colors">
                        <Send size={18} />
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {showProtocolosModal && sanipesResult?.historial && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-sm w-full max-w-2xl shadow-2xl overflow-hidden">
                    <div className="flex justify-between items-center p-4 border-b border-gray-200">
                      <h3 className="text-xl font-normal text-gray-700">Lista de Protocolos</h3>
                      <button onClick={() => setShowProtocolosModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
                    </div>
                    <div className="p-6 bg-gray-50">
                      <div className="bg-white border border-gray-200 rounded-sm">
                        {sanipesResult.historial.map((item: any, idx: number) => (
                          <div key={idx} className="border-b border-gray-200 last:border-0 p-3 flex justify-between items-center hover:bg-gray-50">
                            <div>
                              <p className={idx === 0 ? "text-[#0088cc] font-medium" : "text-gray-500"}>Protocolo: {item.protocolo}</p>
                            </div>
                            {idx === 0 && (
                              <button onClick={() => {
                                setSelectedProtocolContext(item);
                                window.open(item.pdfUrl, '_blank');
                              }} className="text-[#0088cc] font-bold hover:underline text-sm">
                                Descargar
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="p-4 border-t border-gray-200 bg-gray-100 flex justify-end">
                      <button onClick={() => setShowProtocolosModal(false)} className="bg-[#444] hover:bg-[#333] active:scale-[0.98] transition-all duration-200 text-white px-6 py-2 rounded-sm text-sm">Salir</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
        )}
        {/* --- VISTA: DICAPI --- */}
        {currentView === 'dicapi' && (
            
          <div className="flex-1 overflow-y-auto p-6 bg-[#000000]">
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="bg-[#1C1C1E]/60 backdrop-blur-3xl border border-white/5 p-6 rounded-xl shadow-lg">
                <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4">
                  <Search size={28} className="text-[#0A84FF]" />
                  <div>
                    <h2 className="text-xl font-bold text-white">CONSULTAS DICAPI</h2>
                    <p className="text-sm text-gray-400">Consulta de Matrículas de las Embarcaciones</p>
                  </div>
                </div>

                <div className="bg-[#000000] border border-white/5 rounded-2xl p-5 mb-6">
                  <div className="mb-4">
                    <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">Tipo de Búsqueda</label>
                    <select 
                      value={dicapiForm.tipoConsulta} 
                      onChange={e => { setDicapiForm({ ...dicapiForm, tipoConsulta: e.target.value }); setDicapiFormError(''); }}
                      className="w-full bg-[#1C1C1E]/60 backdrop-blur-3xl text-white rounded-xl px-3 py-2 border border-white/5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all mb-4"
                    >
                      <option value="1">Matrícula</option>
                      <option value="2">Nombre de la Nave</option>
                      <option value="3">Código de Radiobaliza</option>
                    </select>
                    <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">
                      {dicapiForm.tipoConsulta === '1' ? 'Matrícula' : dicapiForm.tipoConsulta === '2' ? 'Nombre de la Nave' : 'Código de Radiobaliza'}
                    </label>
                    <input type="text" value={dicapiForm.query} onChange={e=>{setDicapiForm({...dicapiForm, query: e.target.value}); setDicapiFormError('');}} placeholder={dicapiForm.tipoConsulta === '1' ? "Ej. CO-21414-BM" : dicapiForm.tipoConsulta === '2' ? "Ej. DELFIN II" : "Ej. 123456789"} className="w-full bg-[#1C1C1E]/60 backdrop-blur-3xl text-white rounded-xl px-3 py-2 border border-white/5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all" />
                  </div>
                  {dicapiFormError && (
                    <div className="mb-4 bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                      <div className="bg-red-500/20 p-1.5 rounded-full mt-0.5 shrink-0">
                        <X size={16} className="text-red-400" />
                      </div>
                      <div>
                        <h4 className="text-red-400 font-medium text-sm mb-1">
                          {dicapiFormError.includes('No se registra') ? 'Búsqueda sin resultados' : 'Error en la consulta'}
                        </h4>
                        <p className="text-red-300/90 text-sm">{dicapiFormError}</p>
                      </div>
                    </div>
                  )}
                  <button onClick={handleDicapiSearch} disabled={isDicapiLoading} className="w-full bg-[#0A84FF] hover:bg-blue-700 active:scale-[0.98] transition-all duration-200 disabled:bg-blue-800 text-white py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors">
                    {isDicapiLoading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
                    {isDicapiLoading ? 'Consultando DICAPI...' : 'Realizar Consulta'}
                  </button>
                </div>
              </div>

              {dicapiResult && (
                <div className="bg-[#000000] border border-white/5 rounded-2xl overflow-hidden shadow-lg animate-in fade-in slide-in-from-bottom-4">
                  <div className="bg-[#0A84FF] px-5 py-3 border-b border-blue-700 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle size={18} className="text-white"/>
                      <h3 className="text-white font-medium">Características Técnicas de la Nave</h3>
                    </div>
                    <button 
                      onClick={handleSaveVessel}
                      className="bg-white/20 hover:bg-white/30 active:scale-[0.98] transition-all duration-200 text-white px-3 py-1.5 rounded text-sm font-medium flex items-center gap-2 transition-colors"
                    >
                      <Save size={16} /> Guardar Nave
                    </button>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                      <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Nombre de la Nave</p>
                        <p className="text-white font-medium text-lg">{dicapiResult.nombre}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Matrícula</p>
                        <p className="text-white font-medium text-lg">{dicapiResult.matricula}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Arqueo Bruto</p>
                        <p className="text-white font-medium">{dicapiResult.arqueoBruto}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Arqueo Neto</p>
                        <p className="text-white font-medium">{dicapiResult.arqueoNeto}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Eslora</p>
                        <p className="text-white font-medium">{dicapiResult.eslora}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Manga</p>
                        <p className="text-white font-medium">{dicapiResult.manga}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Puntal</p>
                        <p className="text-white font-medium">{dicapiResult.puntal}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Capacidad de Bodega</p>
                        <p className="text-white font-medium">{dicapiResult.capacidadBodega}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Tiene Radiobaliza</p>
                        <p className="text-white font-medium">{dicapiResult.tieneRadiobaliza}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Cod. Radiobaliza</p>
                        <p className="text-white font-medium">{dicapiResult.codRadiobaliza}</p>
                      </div>
                    </div>
                  </div>

                  {/* Propietarios */}
                  {dicapiResult.propietarios && dicapiResult.propietarios.length > 0 && (
                    <div className="border-t border-white/5">
                      <div className="bg-white/5 px-5 py-2 border-b border-white/5">
                        <h4 className="text-gray-300 font-medium text-sm">Propietarios</h4>
                      </div>
                      <div className="p-0 overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-300">
                          <thead className="text-xs text-gray-400 uppercase bg-[#000000] border-b border-white/5">
                            <tr>
                              <th scope="col" className="px-6 py-3">Nombres / Razón Social</th>
                              <th scope="col" className="px-6 py-3">Doc. Identidad</th>
                            </tr>
                          </thead>
                          <tbody>
                            {dicapiResult.propietarios.map((prop: any, idx: number) => (
                              <tr key={idx} className="border-b border-white/5 hover:bg-white/5 active:scale-[0.98] transition-all duration-200 transition-colors">
                                <td className="px-6 py-3 font-medium text-white">{prop.nombre}</td>
                                <td className="px-6 py-3">{prop.docIdentidad}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Certificados */}
                  {dicapiResult.certificados && dicapiResult.certificados.length > 0 && (
                    <div className="border-t border-white/5">
                      <div className="bg-white/5 px-5 py-2 border-b border-white/5">
                        <h4 className="text-gray-300 font-medium text-sm">Certificados</h4>
                      </div>
                      <div className="p-0 overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-300">
                          <thead className="text-xs text-gray-400 uppercase bg-[#000000] border-b border-white/5">
                            <tr>
                              <th scope="col" className="px-6 py-3">N° Certificado</th>
                              <th scope="col" className="px-6 py-3">Tipo Certificado</th>
                              <th scope="col" className="px-6 py-3">Fecha Expedición</th>
                              <th scope="col" className="px-6 py-3">Vcto. Refrenda</th>
                              <th scope="col" className="px-6 py-3 text-center">Cert. Digital</th>
                            </tr>
                          </thead>
                          <tbody>
                            {dicapiResult.certificados.map((cert: any, idx: number) => (
                              <tr key={idx} className="border-b border-white/5 hover:bg-white/5 active:scale-[0.98] transition-all duration-200 transition-colors">
                                <td className="px-6 py-3 font-medium text-white">{cert.nCertificado}</td>
                                <td className="px-6 py-3">{cert.tipoCertificado}</td>
                                <td className="px-6 py-3">{cert.fechaExpedicion}</td>
                                <td className="px-6 py-3">{cert.vctoRefrenda}</td>
                                <td className="px-6 py-3 text-center">
                                  {cert.certDigital ? (
                                    <a href={cert.certDigital} target="_blank" rel="noopener noreferrer" className="text-[#0A84FF] hover:text-blue-300 flex items-center justify-center gap-1">
                                      <Download size={14} /> Descargar
                                    </a>
                                  ) : (
                                    <span className="text-gray-500">-</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Cert. Medio Ambiente */}
                  {dicapiResult.certMedioAmbiente && dicapiResult.certMedioAmbiente.length > 0 && (
                    <div className="border-t border-white/5">
                      <div className="bg-white/5 px-5 py-2 border-b border-white/5">
                        <h4 className="text-gray-300 font-medium text-sm">Certificados Medio Ambiente</h4>
                      </div>
                      <div className="p-0 overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-300">
                          <thead className="text-xs text-gray-400 uppercase bg-[#000000] border-b border-white/5">
                            <tr>
                              <th scope="col" className="px-6 py-3">N° Certificado</th>
                              <th scope="col" className="px-6 py-3">Tipo Certificado</th>
                              <th scope="col" className="px-6 py-3">Fecha Expedición</th>
                              <th scope="col" className="px-6 py-3">Fecha Vcto.</th>
                              <th scope="col" className="px-6 py-3 text-center">Cert. Digital</th>
                            </tr>
                          </thead>
                          <tbody>
                            {dicapiResult.certMedioAmbiente.map((cert: any, idx: number) => (
                              <tr key={idx} className="border-b border-white/5 hover:bg-white/5 active:scale-[0.98] transition-all duration-200 transition-colors">
                                <td className="px-6 py-3 font-medium text-white">{cert.nCertificado}</td>
                                <td className="px-6 py-3">{cert.tipoCertificado}</td>
                                <td className="px-6 py-3">{cert.fechaExpedicion}</td>
                                <td className="px-6 py-3">{cert.fechaVcto}</td>
                                <td className="px-6 py-3 text-center">
                                  {cert.certDigital ? (
                                    <a href={cert.certDigital} target="_blank" rel="noopener noreferrer" className="text-[#0A84FF] hover:text-blue-300 flex items-center justify-center gap-1">
                                      <Download size={14} /> Descargar
                                    </a>
                                  ) : (
                                    <span className="text-gray-500">-</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          
        )}
        {/* --- VISTA: NAVES GUARDADAS --- */}
        {currentView === 'saved_vessels' && (
            
          <div className="flex-1 overflow-y-auto p-6 bg-[#000000]">
            <div className="max-w-6xl mx-auto space-y-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <List size={28} className="text-[#0A84FF]" />
                  <div>
                    <h2 className="text-xl font-bold text-white">Naves Guardadas</h2>
                    <p className="text-sm text-gray-400">Listado de embarcaciones consultadas en DICAPI</p>
                  </div>
                </div>
                <button 
                  onClick={handleDownloadExcel}
                  disabled={savedVessels.length === 0}
                  className="bg-green-600 hover:bg-green-700 active:scale-[0.98] transition-all duration-200 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 transition-colors"
                >
                  <Download size={18} /> Descargar Excel
                </button>
              </div>

              {excelSuccessMessage && (
                <div className="bg-green-500/20 border border-green-500/50 text-green-400 px-4 py-3 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                  <CheckCircle size={20} />
                  <p>{excelSuccessMessage}</p>
                </div>
              )}

              {savedVessels.length === 0 ? (
                <div className="bg-[#1C1C1E]/60 backdrop-blur-3xl border border-white/5 rounded-xl p-12 text-center">
                  <Folder size={48} className="text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-300 mb-2">No hay naves guardadas</h3>
                  <p className="text-gray-500">Realiza consultas en la sección de DICAPI y guárdalas para verlas aquí.</p>
                </div>
              ) : (
                <div className="bg-[#1C1C1E]/60 backdrop-blur-3xl border border-white/5 rounded-xl overflow-hidden shadow-lg">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-300">
                      <thead className="text-xs text-gray-400 uppercase bg-white/5 border-b border-white/5">
                        <tr>
                          <th scope="col" className="px-6 py-4">Matrícula</th>
                          <th scope="col" className="px-6 py-4">Nombre de la Nave</th>
                          <th scope="col" className="px-6 py-4">Propietarios</th>
                          <th scope="col" className="px-6 py-4">Fecha de Guardado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {savedVessels.map((vessel) => (
                          <tr 
                            key={vessel.id} 
                            onClick={() => setSelectedSavedVessel(vessel)}
                            className="border-b border-white/5 hover:bg-white/10 active:scale-[0.98] transition-all duration-200 transition-colors cursor-pointer"
                          >
                            <td className="px-6 py-4 font-medium text-white whitespace-nowrap">{vessel.matricula}</td>
                            <td className="px-6 py-4">{vessel.nombre}</td>
                            <td className="px-6 py-4">
                              <div className="max-w-xs truncate" title={vessel.propietarios.map(p => p.nombre).join(', ')}>
                                {vessel.propietarios.length > 0 
                                  ? vessel.propietarios.map(p => p.nombre).join(', ') 
                                  : <span className="text-gray-500">Sin propietarios</span>}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">{new Date(vessel.savedAt).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="bg-white/5 px-6 py-3 border-t border-white/5 text-xs text-gray-400 text-right">
                    Total: {savedVessels.length} embarcaciones guardadas
                  </div>
                </div>
              )}
            </div>

            {/* Modal de Detalle de Nave Guardada */}
            {selectedSavedVessel && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
                <div className="bg-[#000000] border border-white/5 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
                  <div className="flex items-center justify-between p-5 border-b border-white/5">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                      <Search size={20} className="text-[#0A84FF]" />
                      Detalle de Nave: {selectedSavedVessel.nombre}
                    </h3>
                    <button onClick={() => setSelectedSavedVessel(null)} className="text-gray-400 hover:text-white transition-colors">
                      <X size={24} />
                    </button>
                  </div>
                  <div className="p-6 overflow-y-auto">
                    {/* Características Técnicas */}
                    <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Características Técnicas</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                      <div className="bg-[#1C1C1E]/60 backdrop-blur-3xl p-3 rounded-2xl border border-white/5">
                        <p className="text-xs text-gray-500 mb-1">Matrícula</p>
                        <p className="text-white font-medium">{selectedSavedVessel.matricula}</p>
                      </div>
                      <div className="bg-[#1C1C1E]/60 backdrop-blur-3xl p-3 rounded-2xl border border-white/5">
                        <p className="text-xs text-gray-500 mb-1">Arqueo Bruto</p>
                        <p className="text-white font-medium">{selectedSavedVessel.arqueoBruto}</p>
                      </div>
                      <div className="bg-[#1C1C1E]/60 backdrop-blur-3xl p-3 rounded-2xl border border-white/5">
                        <p className="text-xs text-gray-500 mb-1">Arqueo Neto</p>
                        <p className="text-white font-medium">{selectedSavedVessel.arqueoNeto}</p>
                      </div>
                      <div className="bg-[#1C1C1E]/60 backdrop-blur-3xl p-3 rounded-2xl border border-white/5">
                        <p className="text-xs text-gray-500 mb-1">Eslora</p>
                        <p className="text-white font-medium">{selectedSavedVessel.eslora}</p>
                      </div>
                      <div className="bg-[#1C1C1E]/60 backdrop-blur-3xl p-3 rounded-2xl border border-white/5">
                        <p className="text-xs text-gray-500 mb-1">Manga</p>
                        <p className="text-white font-medium">{selectedSavedVessel.manga}</p>
                      </div>
                      <div className="bg-[#1C1C1E]/60 backdrop-blur-3xl p-3 rounded-2xl border border-white/5">
                        <p className="text-xs text-gray-500 mb-1">Puntal</p>
                        <p className="text-white font-medium">{selectedSavedVessel.puntal}</p>
                      </div>
                      <div className="bg-[#1C1C1E]/60 backdrop-blur-3xl p-3 rounded-2xl border border-white/5">
                        <p className="text-xs text-gray-500 mb-1">Capacidad de Bodega</p>
                        <p className="text-white font-medium">{selectedSavedVessel.capacidadBodega}</p>
                      </div>
                      <div className="bg-[#1C1C1E]/60 backdrop-blur-3xl p-3 rounded-2xl border border-white/5">
                        <p className="text-xs text-gray-500 mb-1">Radiobaliza</p>
                        <p className="text-white font-medium">{selectedSavedVessel.tieneRadiobaliza} {selectedSavedVessel.codRadiobaliza ? `(${selectedSavedVessel.codRadiobaliza})` : ''}</p>
                      </div>
                    </div>

                    {/* Propietarios */}
                    <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Propietarios</h4>
                    {selectedSavedVessel.propietarios && selectedSavedVessel.propietarios.length > 0 ? (
                      <div className="bg-[#1C1C1E]/60 backdrop-blur-3xl rounded-2xl border border-white/5 overflow-hidden">
                        <table className="w-full text-sm text-left text-gray-300">
                          <thead className="text-xs text-gray-400 uppercase bg-white/5 border-b border-white/5">
                            <tr>
                              <th className="px-4 py-3">Nombre</th>
                              <th className="px-4 py-3">Doc. Identidad</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedSavedVessel.propietarios.map((prop, idx) => (
                              <tr key={idx} className="border-b border-white/5 last:border-0">
                                <td className="px-4 py-3 font-medium text-white">{prop.nombre}</td>
                                <td className="px-4 py-3">{prop.docIdentidad}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-gray-500 italic">No se encontraron propietarios.</p>
                    )}
                  </div>
                  <div className="p-5 border-t border-white/5 flex justify-end">
                    <button onClick={() => setSelectedSavedVessel(null)} className="bg-white/10 hover:bg-white/10 active:scale-[0.98] transition-all duration-200 text-white px-4 py-2 rounded-xl font-medium transition-colors">
                      Cerrar
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
          
        )}
        {/* --- VISTA: CHAT --- */}
        {(currentView === 'chat' || (currentView === 'agents' && activeAgentId)) && !currentChat && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
            <div className="w-24 h-24 bg-white/10 rounded-3xl flex items-center justify-center mb-6 shadow-lg border border-white/20">
              <Waves size={48} className="text-[#0A84FF]" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-3 tracking-tight">Bienvenido a COINREFRI AI</h2>
            <p className="text-gray-400 max-w-md mb-8 text-lg">Selecciona un chat en el menú lateral o inicia una nueva conversación para interactuar con tus datos y agentes.</p>
            <button onClick={openNewChatModal} className="bg-[#007AFF] hover:bg-[#0A84FF] active:scale-[0.98] transition-all duration-200 text-white px-6 py-3 rounded-xl font-medium flex items-center gap-2 transition-all hover:scale-105 shadow-lg shadow-[#0A84FF]/20">
              <Plus size={20} /> Iniciar Nuevo Chat
            </button>
          </div>
        )}

        {(currentView === 'chat' || (currentView === 'agents' && activeAgentId)) && currentChat && (
          <div className="flex-1 flex flex-col min-h-0">
            {currentView === 'agents' && activeAgentId && (
              <div className="bg-white/10 px-4 py-2 flex items-center gap-3 border-b border-white/20">
                <button onClick={() => setActiveAgentId(null)} className="text-gray-400 hover:text-white flex items-center gap-1 text-sm"><ArrowLeft size={16}/> Volver a Agentes</button>
                <span className="text-[#0A84FF] font-medium text-sm">| {agents.find(a=>a.id===activeAgentId)?.name}</span>
              </div>
            )}
            {currentChat.attachedDocument && (
              <div className="bg-[#000000] px-6 py-3 flex items-center justify-between border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/20 rounded-2xl">
                    <FileText size={20} className="text-[#0A84FF]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-200">Documento en contexto</p>
                    <p className="text-xs text-gray-400">{currentChat.attachedDocument.name}</p>
                  </div>
                </div>
                <button onClick={() => handleDownloadSanipesPDF(currentChat.attachedDocument?.data)} className="text-xs bg-white/10 hover:bg-white/10 active:scale-[0.98] transition-all duration-200 text-white px-4 py-2 rounded-2xl flex items-center gap-2 transition-colors border border-white/20">
                  <Download size={14} /> Descargar PDF
                </button>
              </div>
            )}
            <div className="flex-1 overflow-y-auto p-4 md:p-8">
              <div className="max-w-3xl mx-auto space-y-6">
                {currentChat.messages.map((msg) => (
                  <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.role === 'assistant' && (
                      <div className={`w-8 h-8 rounded-2xl flex items-center justify-center shrink-0 mt-1 ${currentAgent ? 'bg-[#0A84FF]' : currentProject ? 'bg-emerald-500' : 'bg-[#0A84FF]'}`}>
                        {currentAgent ? <Cpu size={18} className="text-white"/> : currentProject ? <Folder size={18} className="text-white"/> : <Waves size={18} className="text-white"/>}
                      </div>
                    )}
                    <div className={`flex flex-col gap-2 max-w-[80%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                      <div className={`px-4 py-3 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-[#007AFF] text-white rounded-tr-sm' : 'bg-white/10 text-gray-200 rounded-tl-sm border border-white/20'}`}>
                        {msg.content}
                      </div>
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex gap-4 justify-start">
                    <div className="w-8 h-8 rounded-2xl bg-[#0A84FF] flex items-center justify-center shrink-0 mt-1"><Loader2 size={18} className="text-white animate-spin"/></div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>
            <div className="p-4 bg-[#000000] shrink-0">
              <div className="max-w-3xl mx-auto">
                {currentAgent && currentAgent.quickResponses.length > 0 && (
                  <div className="flex gap-2 mb-3 overflow-x-auto pb-1 scrollbar-hide">
                    {currentAgent.quickResponses.map((qr, idx) => (
                      <button key={idx} onClick={() => handleSend(qr)} className="whitespace-nowrap px-4 py-1.5 bg-white/10 hover:bg-[#007AFF]/20 active:scale-[0.98] transition-all duration-200 hover:text-[#0A84FF] border border-white/20 hover:border-purple-500/50 rounded-full text-xs text-gray-300 transition-all">
                        {qr}
                      </button>
                    ))}
                  </div>
                )}
                {attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {attachments.map((file, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-2xl text-xs border border-white/20">
                        <Paperclip size={14} className="text-[#0A84FF]" />
                        <span className="truncate max-w-[150px] text-gray-200">{file.name}</span>
                        <button onClick={() => setAttachments(attachments.filter((_, i) => i !== idx))} className="text-gray-400 hover:text-red-400 ml-1"><X size={14}/></button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="relative bg-white/10 rounded-xl border border-white/20 flex items-end p-2 focus-within:border-[#0A84FF] transition-colors">
                  <label className="p-2 text-gray-400 hover:text-[#0A84FF] cursor-pointer shrink-0 transition-colors">
                    <input type="file" multiple className="hidden" onChange={(e) => { if(e.target.files) setAttachments([...attachments, ...Array.from(e.target.files)]) }} />
                    <Paperclip size={20} />
                  </label>
                  <textarea 
                    value={input} 
                    onChange={e=>setInput(e.target.value)} 
                    onKeyDown={e=>{if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); handleSend(); }}} 
                    placeholder="Escribe un mensaje..." 
                    className="flex-1 bg-transparent text-white px-3 py-2.5 focus:outline-none text-sm resize-none max-h-32" 
                    rows={1}
                  />
                  <button onClick={()=>handleSend()} disabled={!input.trim() && attachments.length === 0} className="p-2 bg-[#007AFF] hover:bg-[#0A84FF] active:scale-[0.98] transition-all duration-200 disabled:bg-white/10 disabled:text-gray-400 text-white rounded-2xl shrink-0 transition-colors mb-0.5 mr-0.5"><Send size={18}/></button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* --- MODAL NUEVO CHAT --- */}
      {showNewChatModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1C1C1E]/60 backdrop-blur-3xl p-6 rounded-xl border border-white/5 max-w-md w-full shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium text-white">Iniciar Nuevo Chat</h3>
              <button onClick={() => setShowNewChatModal(false)} className="text-gray-400 hover:text-white"><X size={20}/></button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                <button onClick={() => { setSelectedNewChatType('general'); setSelectedNewChatId(''); }} className={`py-2 rounded-2xl text-sm font-medium border transition-colors ${selectedNewChatType === 'general' ? 'bg-[#007AFF] border-[#0A84FF] text-white' : 'bg-white/10 border-white/20 text-gray-400 hover:bg-white/10'}`}>General</button>
                <button onClick={() => { setSelectedNewChatType('project'); setSelectedNewChatId(''); }} className={`py-2 rounded-2xl text-sm font-medium border transition-colors ${selectedNewChatType === 'project' ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-white/10 border-white/20 text-gray-400 hover:bg-white/10'}`}>Proyecto</button>
                <button onClick={() => { setSelectedNewChatType('agent'); setSelectedNewChatId(''); }} className={`py-2 rounded-2xl text-sm font-medium border transition-colors ${selectedNewChatType === 'agent' ? 'bg-[#0A84FF] border-purple-500 text-white' : 'bg-white/10 border-white/20 text-gray-400 hover:bg-white/10'}`}>Agente</button>
              </div>

              {selectedNewChatType === 'project' && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                  <label className="block text-sm text-gray-400 mb-1">Selecciona un Proyecto</label>
                  <select value={selectedNewChatId} onChange={e => setSelectedNewChatId(e.target.value)} className="w-full bg-white/10 text-white rounded-2xl px-3 py-2 border border-white/20 focus:outline-none focus:border-emerald-500">
                    <option value="">-- Seleccionar Proyecto --</option>
                    {projects.filter(p => p.userId === currentUser?.id).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              )}
              
              {selectedNewChatType === 'agent' && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                  <label className="block text-sm text-gray-400 mb-1">Selecciona un Agente</label>
                  <select value={selectedNewChatId} onChange={e => setSelectedNewChatId(e.target.value)} className="w-full bg-white/10 text-white rounded-2xl px-3 py-2 border border-white/20 focus:outline-none focus:border-purple-500">
                    <option value="">-- Seleccionar Agente --</option>
                    {agents.filter(a => a.userId === currentUser?.id).map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
              )}

              <button 
                onClick={() => {
                  if (selectedNewChatType === 'project' && !selectedNewChatId) return showAlert('Selecciona un proyecto para continuar.');
                  if (selectedNewChatType === 'agent' && !selectedNewChatId) return showAlert('Selecciona un agente para continuar.');
                  
                  handleNewChat(
                    currentUser?.id, 
                    selectedNewChatType === 'agent' ? selectedNewChatId : null, 
                    selectedNewChatType === 'project' ? selectedNewChatId : null
                  );
                  setShowNewChatModal(false);
                }}
                className="w-full bg-[#0A84FF] hover:bg-[#007AFF] active:scale-[0.98] transition-all duration-200 text-white py-2.5 rounded-2xl mt-4 font-medium transition-colors"
              >
                Iniciar Conversación
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL CUSTOM --- */}
      {modal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1C1C1E]/60 backdrop-blur-3xl p-6 rounded-xl border border-white/5 max-w-sm w-full shadow-2xl">
            <h3 className="text-lg font-medium text-white mb-6">{modal.message}</h3>
            <div className="flex justify-end gap-3">
              {modal.type === 'confirm' && (
                <button onClick={() => setModal(null)} className="px-4 py-2 text-gray-400 hover:text-white transition-colors">Cancelar</button>
              )}
              <button 
                onClick={() => { if (modal.onConfirm) modal.onConfirm(); setModal(null); }} 
                className={`px-4 py-2 text-white rounded-2xl transition-colors ${modal.type === 'confirm' ? 'bg-red-600 hover:bg-red-500' : 'bg-[#007AFF] hover:bg-[#0A84FF]'}`}
              >
                {modal.type === 'confirm' ? 'Eliminar' : 'Aceptar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
