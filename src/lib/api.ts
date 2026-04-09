/**
 * Cliente API para Producción
 * 
 * Este archivo contiene la lógica para conectar el Frontend de React
 * con el Backend de FastAPI en un entorno de producción real.
 * 
 * Para usarlo, reemplaza las llamadas a LocalStorage en App.tsx
 * por estas funciones.
 */

const API_URL = import.meta.env.VITE_API_URL || '/api';

export const api = {
  // --- Autenticación ---
  login: async (username: string, password: string) => {
    // En producción real, esto debería usar OAuth2 con JWT
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    if (!response.ok) throw new Error('Login fallido');
    return response.json();
  },

  // --- Proyectos (RAG) ---
  getProjects: async (userId: string) => {
    const res = await fetch(`${API_URL}/projects/${userId}`);
    return res.json();
  },
  
  createProject: async (userId: string, data: any) => {
    const res = await fetch(`${API_URL}/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, ...data })
    });
    return res.json();
  },

  uploadFilesToProject: async (projectId: string, files: FileList) => {
    const formData = new FormData();
    Array.from(files).forEach(file => formData.append('files', file));
    
    const res = await fetch(`${API_URL}/projects/${projectId}/upload`, {
      method: 'POST',
      body: formData
    });
    return res.json();
  },

  // --- Chat y Agentes ---
  sendMessage: async (chatId: string, content: string, attachments: File[]) => {
    const formData = new FormData();
    formData.append('content', content);
    attachments.forEach(file => formData.append('attachments', file));

    const res = await fetch(`${API_URL}/chats/${chatId}/message`, {
      method: 'POST',
      body: formData
    });
    return res.json();
  }
};
