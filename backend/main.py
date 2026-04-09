from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from database import engine, Base, get_db
from app import models
from passlib.context import CryptContext

# Crear tablas en la base de datos
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Enterprise Local AI API - Producción",
    description="Backend robusto para plataforma de IA multimodal y multi-tenant",
    version="1.0.0"
)

# Configuración CORS para producción
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # En producción estricta, cambiar por el dominio del frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password):
    return pwd_context.hash(password)

# --- Endpoints de Inicialización ---
@app.on_event("startup")
def create_initial_admin():
    """Crea el usuario admin por defecto si no existe al arrancar."""
    db = next(get_db())
    admin = db.query(models.User).filter(models.User.username == "admin").first()
    if not admin:
        new_admin = models.User(
            username="admin",
            hashed_password=get_password_hash("admin123"), # Cambiar en prod
            role="admin"
        )
        db.add(new_admin)
        db.commit()

# --- Endpoints de Usuarios ---
@app.get("/api/users")
def get_users(db: Session = Depends(get_db)):
    return db.query(models.User).all()

# --- Endpoints de Proyectos ---
@app.get("/api/projects/{user_id}")
def get_projects(user_id: str, db: Session = Depends(get_db)):
    return db.query(models.Project).filter(models.Project.user_id == user_id).all()

# --- Endpoints de Agentes ---
@app.get("/api/agents/{user_id}")
def get_agents(user_id: str, db: Session = Depends(get_db)):
    return db.query(models.Agent).filter(models.Agent.user_id == user_id).all()

# --- Endpoints de Chat ---
@app.get("/api/chats/{user_id}")
def get_chats(user_id: str, db: Session = Depends(get_db)):
    return db.query(models.Chat).filter(models.Chat.user_id == user_id).all()

@app.get("/api/health")
def health_check():
    return {"status": "healthy", "services": ["postgres", "qdrant", "ollama"]}
