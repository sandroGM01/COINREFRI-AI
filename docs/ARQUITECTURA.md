# Arquitectura de la Plataforma IA Empresarial Local

## 1. Visión General
El sistema está diseñado con una arquitectura de microservicios orientada a la privacidad total (On-Premise) y al aislamiento estricto de datos entre usuarios (Multi-tenant).

## 2. Estructura de Carpetas del Proyecto

```text
/enterprise-local-ai
â”œâ”€â”€ docker-compose.yml          # OrquestaciÃ³n de servicios base (DBs, Ollama)
â”œâ”€â”€ .env                        # Variables de entorno globales
â”œâ”€â”€ frontend/                   # AplicaciÃ³n Next.js (React)
â”‚   â”œâ”€â”€ src/
â”‚   â”‚   â”œâ”€â”€ app/                # App Router de Next.js (Rutas)
â”‚   â”‚   â”œâ”€â”€ components/         # Componentes UI (Chat, Sidebar, Admin Dashboard)
â”‚   â”‚   â”œâ”€â”€ lib/                # Utilidades, llamadas a API
â”‚   â”‚   â””â”€â”€ store/              # GestiÃ³n de estado (Zustand o Redux)
â”‚   â””â”€â”€ package.json
â”œâ”€â”€ backend/                    # AplicaciÃ³n FastAPI (Python)
â”‚   â”œâ”€â”€ app/
â”‚   â”‚   â”œâ”€â”€ api/                # Endpoints (routers)
â”‚   â”‚   â”‚   â”œâ”€â”€ v1/
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ auth.py     # Login/Logout, JWT
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ chat.py     # LÃ³gica de interacciÃ³n con LLM
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ admin.py    # CRUD usuarios, cuotas
â”‚   â”‚   â”‚   â”‚   â””â”€â”€ files.py    # Subida y procesamiento de PDFs/ImÃ¡genes
â”‚   â”‚   â”œâ”€â”€ core/               # ConfiguraciÃ³n, seguridad, dependencias
â”‚   â”‚   â”œâ”€â”€ models/             # Modelos SQLAlchemy (PostgreSQL)
â”‚   â”‚   â”œâ”€â”€ schemas/            # Modelos Pydantic (ValidaciÃ³n de datos)
â”‚   â”‚   â”œâ”€â”€ services/           # LÃ³gica de negocio pesada
â”‚   â”‚   â”‚   â”œâ”€â”€ llm_service.py  # IntegraciÃ³n LangChain/Ollama
â”‚   â”‚   â”‚   â”œâ”€â”€ rag_service.py  # Chunking, Embeddings, Qdrant
â”‚   â”‚   â”‚   â””â”€â”€ image_gen.py    # Llamadas a API de Stable Diffusion
â”‚   â”‚   â””â”€â”€ main.py             # Punto de entrada FastAPI
â”‚   â”œâ”€â”€ requirements.txt
â”‚   â””â”€â”€ Dockerfile
â””â”€â”€ data/                       # Volumen montado para persistencia (Aislamiento)
    â”œâ”€â”€ postgres/               # Datos relacionales
    â”œâ”€â”€ qdrant/                 # Vectores
    â””â”€â”€ usuarios/               # Carpetas dinÃ¡micas por usuario
        â”œâ”€â”€ {user_id_1}/
        â”‚   â”œâ”€â”€ documentos/     # PDFs subidos
        â”‚   â”œâ”€â”€ imagenes/       # Fotos subidas
        â”‚   â””â”€â”€ generados/      # ImÃ¡genes creadas por SD
        â””â”€â”€ {user_id_2}/
```

## 3. Flujo de Datos y Aislamiento (Multi-tenant Strict)

1. **AutenticaciÃ³n**: El usuario hace login en Next.js. FastAPI devuelve un JWT que contiene el `user_id` y su `role` (user/admin).
2. **Subida de Archivos**: Al subir un PDF, FastAPI lee el JWT, extrae el `user_id`, y guarda el archivo fÃ­sicamente en `/data/usuarios/{user_id}/documentos/`.
3. **Procesamiento RAG**: El PDF se procesa (chunking). Al guardar los embeddings en Qdrant, se aÃ±ade un payload (metadata): `{"user_id": "12345"}`.
4. **Consulta RAG**: Cuando el usuario pregunta algo, LangChain construye la consulta a Qdrant aplicando un filtro estricto: `Filter(must=[FieldCondition(key="user_id", match=MatchValue(value="12345"))])`. Esto garantiza matemÃ¡ticamente que la IA no vea datos de otros.

## 4. Control de Cuotas
En PostgreSQL se mantiene una tabla `user_quotas`. Un middleware en FastAPI intercepta las peticiones de generaciÃ³n, verifica los tokens consumidos en el dÃ­a actual y bloquea la peticiÃ³n si excede el lÃ­mite.
