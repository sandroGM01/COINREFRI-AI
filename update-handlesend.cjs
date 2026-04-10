const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const oldHandleSend = `  const handleSend = (textOverride?: string) => {
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
        responseText = \`[Agente: \${agent?.name}] Procesando con instrucciones personalizadas. \`;
      } else if (currentChat?.projectId) {
        const proj = projects.find(p => p.id === currentChat.projectId);
        responseText = \`[Proyecto: \${proj?.name}] Buscando en la base vectorial (\${proj?.files.length} archivos). \`;
      } else {
        responseText = \`[\${systemSettings.model}] \`;
      }

      if (newMsg.attachments?.some(a => a.type === 'pdf')) responseText += \`He analizado el PDF adjunto. \`;
      else if (newMsg.attachments?.some(a => a.type === 'image')) responseText += "He analizado la imagen con Visión. ";
      else responseText += "Respuesta generada correctamente.";

      setChats(prev => prev.map(c => c.id === currentChatId ? { ...c, messages: [...c.messages, { id: Date.now().toString(), role: 'assistant', content: responseText }], updatedAt: Date.now() } : c));
      setIsTyping(false);
    }, 1000);
  };`;

const newHandleSend = `  const handleSend = async (textOverride?: string) => {
    const textToSend = textOverride || input;
    if (!textToSend.trim() && attachments.length === 0) return;
    if (!currentChatId) return;

    const newMsg: Message = {
      id: Date.now().toString(), role: 'user', content: textToSend,
      attachments: attachments.map(f => ({ type: f.type.includes('pdf') ? 'pdf' : 'image', name: f.name }))
    };

    // Obtenemos el chat actual antes de actualizar el estado
    const chatToUpdate = chats.find(c => c.id === currentChatId);
    if (!chatToUpdate) return;

    setChats(prev => prev.map(c => {
      if (c.id === currentChatId) {
        const isFirst = c.messages.filter(m => m.role === 'user').length === 0;
        return { ...c, title: isFirst && !c.agentId && !c.projectId ? textToSend.slice(0, 25) + '...' : c.title, messages: [...c.messages, newMsg], updatedAt: Date.now() };
      }
      return c;
    }));

    setInput(''); setAttachments([]); setIsTyping(true);

    try {
      let systemInstruction = systemSettings.systemPrompt;
      
      if (chatToUpdate.agentId) {
        const agent = agents.find(a => a.id === chatToUpdate.agentId);
        if (agent) systemInstruction = agent.instructions;
      } else if (chatToUpdate.projectId) {
        const proj = projects.find(p => p.id === chatToUpdate.projectId);
        if (proj) systemInstruction = \`Eres un asistente para el proyecto \${proj.name}. \${proj.description}\`;
      }

      // Preparamos el historial de mensajes para enviar a la API
      const messagesToSend = [...chatToUpdate.messages, newMsg].map(m => ({
        role: m.role,
        content: m.content
      }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messagesToSend,
          systemInstruction,
          model: systemSettings.model
        })
      });

      if (!response.ok) throw new Error('Error en la respuesta de la API');
      
      const data = await response.json();
      
      setChats(prev => prev.map(c => c.id === currentChatId ? { 
        ...c, 
        messages: [...c.messages, { id: Date.now().toString(), role: 'assistant', content: data.text }], 
        updatedAt: Date.now() 
      } : c));

    } catch (error) {
      console.error("Error al enviar mensaje:", error);
      setChats(prev => prev.map(c => c.id === currentChatId ? { 
        ...c, 
        messages: [...c.messages, { id: Date.now().toString(), role: 'assistant', content: 'Lo siento, ocurrió un error al procesar tu solicitud.' }], 
        updatedAt: Date.now() 
      } : c));
    } finally {
      setIsTyping(false);
    }
  };`;

content = content.replace(oldHandleSend, newHandleSend);
fs.writeFileSync('src/App.tsx', content);
console.log('handleSend updated to use Gemini API.');
