# GuÃ­a: IntegraciÃ³n de Gemma 4 con LangChain y Function Calling

Gemma 4 (ej. a travÃ©s de Ollama) soporta llamadas a herramientas (Function Calling). Esto permite que el modelo decida cuÃ¡ndo usar RAG, cuÃ¡ndo generar una imagen o cuÃ¡ndo simplemente responder.

## 1. Requisitos
```bash
pip install langchain langchain-community langchain-experimental qdrant-client ollama
```

## 2. DefiniciÃ³n de Herramientas (Tools)

En LangChain, definimos las herramientas que Gemma 4 podrÃ¡ utilizar.

```python
from langchain.tools import tool
from pydantic import BaseModel, Field

# 1. Herramienta de RAG (BÃºsqueda en PDFs del usuario)
class RagInput(BaseModel):
    query: str = Field(description="La pregunta o tÃ©rmino a buscar en los documentos del usuario.")

@tool("buscar_en_documentos", args_schema=RagInput)
def buscar_en_documentos(query: str, user_id: str) -> str:
    """Busca informaciÃ³n en los PDFs y documentos privados del usuario."""
    # AquÃ­ va la lÃ³gica de conexiÃ³n a Qdrant filtrando por user_id
    # qdrant_client.search(..., query_filter=models.Filter(must=[models.FieldCondition(key="user_id", match=models.MatchValue(value=user_id))]))
    return f"Resultados de la base de datos para '{query}' del usuario {user_id}..."

# 2. Herramienta de GeneraciÃ³n de ImÃ¡genes (Stable Diffusion)
class ImageGenInput(BaseModel):
    prompt: str = Field(description="DescripciÃ³n detallada en inglÃ©s de la imagen a generar.")

@tool("generar_imagen", args_schema=ImageGenInput)
def generar_imagen(prompt: str, user_id: str) -> str:
    """Genera una imagen basada en una descripciÃ³n y devuelve la ruta donde se guardÃ³."""
    # Llamada a la API local de Automatic1111/ComfyUI
    # Guardar la imagen en /data/usuarios/{user_id}/generados/
    return f"Imagen generada exitosamente. Ruta: /data/usuarios/{user_id}/generados/imagen_123.png"
```

## 3. ConfiguraciÃ³n del Agente con Gemma 4

Para usar Function Calling con Ollama en LangChain, utilizamos `ChatOllama`.

```python
from langchain_community.chat_models import ChatOllama
from langchain.agents import AgentExecutor, create_tool_calling_agent
from langchain_core.prompts import ChatPromptTemplate

def get_ai_response(user_input: str, user_id: str):
    # 1. Inicializar el modelo (AsegÃºrate de tener el modelo descargado en Ollama: `ollama run gemma:latest` o la versiÃ³n especÃ­fica)
    llm = ChatOllama(model="gemma", temperature=0.2)
    
    # 2. Lista de herramientas disponibles
    tools = [buscar_en_documentos, generar_imagen]
    
    # 3. Vincular las herramientas al modelo
    llm_with_tools = llm.bind_tools(tools)
    
    # 4. Crear el Prompt del Agente
    prompt = ChatPromptTemplate.from_messages([
        ("system", "Eres un asistente de IA empresarial avanzado. Tienes acceso a herramientas para buscar en los documentos privados del usuario y para generar imÃ¡genes. Usa las herramientas sÃ³lo cuando sea necesario."),
        ("human", "{input}"),
        ("placeholder", "{agent_scratchpad}"),
    ])
    
    # 5. Crear el Agente
    agent = create_tool_calling_agent(llm_with_tools, tools, prompt)
    agent_executor = AgentExecutor(agent=agent, tools=tools, verbose=True)
    
    # IMPORTANTE: Inyectar el user_id en las herramientas. 
    # En un entorno real, se usa un patrÃ³n de inyecciÃ³n de dependencias o se envuelve la herramienta
    # para que el modelo sÃ³lo provea los argumentos de la funciÃ³n (query, prompt) y el backend inyecte el user_id.
    
    response = agent_executor.invoke({"input": user_input})
    return response["output"]
```

## 4. Manejo del Contexto Multimodal (VisiÃ³n)

Si el usuario sube una imagen y pide "Interpreta esta foto", no usamos una herramienta, sino que pasamos la imagen directamente al prompt multimodal de Gemma.

```python
import base64

def analyze_image(image_path: str, prompt: str):
    with open(image_path, "rb") as image_file:
        image_b64 = base64.b64encode(image_file.read()).decode('utf-8')
        
    llm = ChatOllama(model="gemma") # Asegurar que la variante soporte visiÃ³n
    
    from langchain_core.messages import HumanMessage
    
    message = HumanMessage(
        content=[
            {"type": "text", "text": prompt},
            {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{image_b64}"}}
        ]
    )
    
    response = llm.invoke([message])
    return response.content
```
