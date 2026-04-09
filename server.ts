import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import * as cheerio from "cheerio";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Proxy for SANIPES POST
  app.post("/api/sanipes/consulta", async (req, res) => {
    try {
      const { Matricula, cod_habilitacion, Nombre } = req.body;
      const params = new URLSearchParams();
      params.append('Matricula', Matricula || '');
      params.append('cod_habilitacion', cod_habilitacion || '');
      params.append('Nombre', Nombre || '');

      const response = await fetch('http://app02.sanipes.gob.pe:8089/Publico/Consulta_protocolos_embarcacion_pesca', {
        method: 'POST',
        body: params,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      
      const html = await response.text();
      const $ = cheerio.load(html);
      
      const extractField = (label: string) => {
        let value = '';
        $('td').each((i, el) => {
          const text = $(el).text();
          if (text.includes(label + ':')) {
            value = text.replace(label + ':', '').trim();
          }
        });
        return value;
      };

      const matriculaEncontrada = extractField('Matricula');
      const nombreEncontrado = extractField('Nombre');
      const tipoEncontrado = extractField('Tipo');
      const actividadEncontrada = extractField('Actividad');
      const codHabilitacionEncontrado = extractField('Código de Habilitación');

      res.json({
        htmlLength: html.length,
        includesMatricula: html.includes('Matricula:'),
        matricula: matriculaEncontrada,
        nombre: nombreEncontrado,
        tipo: tipoEncontrado,
        actividad: actividadEncontrada,
        codigoHabilitacion: codHabilitacionEncontrado,
        htmlPreview: html.substring(0, 500),
        html: html
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to fetch from SANIPES' });
    }
  });

  // Proxy for SANIPES GET protocols
  app.get("/api/sanipes/protocolos", async (req, res) => {
    try {
      const { matricula } = req.query;
      const response = await fetch(`http://app02.sanipes.gob.pe:8089/Publico/llenar_protocolo_embarcacion_pesca?matricula=${matricula}`);
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to fetch protocols' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
