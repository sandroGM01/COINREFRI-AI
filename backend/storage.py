import os
from pathlib import Path

# Ruta base donde se almacenarán los datos de los usuarios
BASE_DATA_DIR = Path(os.getenv("DATA_DIR", "/data/usuarios"))

def create_user_directory(user_id: str) -> Path:
    """
    Crea la estructura de directorios aislada para un usuario específico.
    Retorna la ruta base del usuario.
    """
    user_dir = BASE_DATA_DIR / str(user_id)
    
    # Subcarpetas para organizar los datos del usuario
    subdirs = ["historial", "documentos", "imagenes", "generados"]
    
    for subdir in subdirs:
        path = user_dir / subdir
        path.mkdir(parents=True, exist_ok=True)
        
    return user_dir

def get_user_document_path(user_id: str, filename: str) -> Path:
    """Obtiene la ruta segura para un documento de un usuario."""
    return BASE_DATA_DIR / str(user_id) / "documentos" / filename
