import requests
import base64
import os
import uuid
from pathlib import Path

SD_API_URL = os.getenv("SD_API_URL", "http://localhost:7860")

def generate_image_sd(prompt: str, user_dir: Path) -> str:
    """
    Llama a la API local de Stable Diffusion (Automatic1111) para generar una imagen.
    Guarda la imagen en la carpeta aislada del usuario.
    """
    payload = {
        "prompt": prompt,
        "negative_prompt": "ugly, blurry, low resolution, bad anatomy",
        "steps": 25,
        "width": 1024,
        "height": 1024,
        "cfg_scale": 7.0,
        "sampler_name": "DPM++ 2M Karras"
    }
    
    try:
        response = requests.post(f"{SD_API_URL}/sdapi/v1/txt2img", json=payload)
        response.raise_for_status()
        r = response.json()
        
        # SD devuelve la imagen en base64
        image_b64 = r['images'][0]
        image_data = base64.b64decode(image_b64)
        
        # Generar nombre único y guardar en la carpeta del usuario
        file_name = f"gen_{uuid.uuid4().hex[:8]}.png"
        file_path = user_dir / "generados" / file_name
        
        with open(file_path, "wb") as f:
            f.write(image_data)
            
        return str(file_path)
    
    except Exception as e:
        raise Exception(f"Error generando imagen con Stable Diffusion: {str(e)}")
