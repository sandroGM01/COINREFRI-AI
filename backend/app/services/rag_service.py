from langchain_community.vectorstores import Qdrant
from langchain_community.embeddings import OllamaEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import PyPDFLoader
from qdrant_client import QdrantClient
from qdrant_client.http import models
import os
from pathlib import Path

# Configuración de Qdrant y Embeddings
QDRANT_URL = os.getenv("QDRANT_URL", "http://localhost:6333")
COLLECTION_NAME = "enterprise_docs"

# Usamos un modelo de embeddings ligero local (ej. nomic-embed-text)
embeddings = OllamaEmbeddings(model="nomic-embed-text", base_url="http://localhost:11434")
client = QdrantClient(url=QDRANT_URL)

def process_and_store_pdf(file_path: Path, user_id: str):
    """
    Procesa un PDF, lo divide en chunks y lo guarda en Qdrant
    inyectando el user_id en los metadatos para aislamiento estricto.
    """
    loader = PyPDFLoader(str(file_path))
    docs = loader.load()
    
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000, 
        chunk_overlap=200
    )
    splits = text_splitter.split_documents(docs)
    
    # INYECCIÓN DE METADATOS (Aislamiento Multi-tenant)
    for split in splits:
        split.metadata["user_id"] = user_id
        split.metadata["source_file"] = file_path.name

    # Guardar en Qdrant
    Qdrant.from_documents(
        splits,
        embeddings,
        url=QDRANT_URL,
        collection_name=COLLECTION_NAME,
    )
    
    return len(splits)

def get_user_retriever(user_id: str):
    """
    Devuelve un retriever de LangChain configurado para buscar
    ÚNICAMENTE en los documentos que pertenecen al user_id.
    """
    qdrant = Qdrant(
        client=client, 
        collection_name=COLLECTION_NAME, 
        embeddings=embeddings
    )
    
    # FILTRO ESTRICTO: Solo trae vectores donde metadata.user_id == user_id
    user_filter = models.Filter(
        must=[
            models.FieldCondition(
                key="metadata.user_id",
                match=models.MatchValue(value=user_id),
            )
        ]
    )
    
    return qdrant.as_retriever(
        search_kwargs={"filter": user_filter, "k": 5}
    )
