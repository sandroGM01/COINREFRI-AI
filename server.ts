import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import * as cheerio from "cheerio";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Proxy for DICAPI
  app.post("/api/dicapi/consulta", async (req, res) => {
    try {
      const { tipoConsulta = '1', query } = req.body;
      if (!query) {
        return res.status(400).json({ error: 'Query is required' });
      }

      // 1. Search for the nave
      const params = new URLSearchParams();
      params.append('ddlTipoConsultaID', tipoConsulta);
      params.append('txtNave', query);

      const searchResponse = await fetch('https://consultas.dicapi.mil.pe/ConsultarNaves/Naves/ConsultarNave?class=form-horizontal%20contForm', {
        method: 'POST',
        body: params,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      
      const searchHtml = await searchResponse.text();
      const $search = cheerio.load(searchHtml);
      
      // Find the link with CodigoNave
      const detailLink = $search('a[href*="CodigoNave="]').attr('href');
      
      if (!detailLink) {
        const bodyText = $search('body').text().replace(/\s+/g, ' ');
        const match = bodyText.match(/No se registra ninguna embarcación.{0,100}/i);
        const errorMsg = match ? match[0].trim() : 'Nave no encontrada';
        return res.status(404).json({ error: errorMsg });
      }
      
      // Extract CodigoNave
      const urlParams = new URLSearchParams(detailLink.split('?')[1]);
      const codigoNave = urlParams.get('CodigoNave');
      
      if (!codigoNave) {
        return res.status(404).json({ error: 'Código de nave no encontrado' });
      }

      // 2. Fetch details
      const detailResponse = await fetch(`https://consultas.dicapi.mil.pe/ConsultarNaves/Naves/VerDetalleNave?CodigoNave=${codigoNave}`);
      const detailHtml = await detailResponse.text();
      const $detail = cheerio.load(detailHtml);
      
      const extractField = (label: string) => {
        let value = '';
        $detail('li.formTextoBold').each((i, el) => {
          const text = $detail(el).text().trim();
          if (text.includes(label)) {
            value = $detail(el).next('li.formatTexto').text().trim();
          }
        });
        return value;
      };

      const result = {
        matricula: extractField('Matricula:'),
        nombre: extractField('Nave:'),
        arqueoBruto: extractField('Arqueo Bruto:'),
        eslora: extractField('Eslora:'),
        puntal: extractField('Puntal:'),
        tieneRadiobaliza: extractField('Tiene radiobaliza:'),
        arqueoNeto: extractField('Arqueo Neto:'),
        manga: extractField('Manga:'),
        capacidadBodega: extractField('Capacidad de bodega:'),
        codRadiobaliza: extractField('Cod.Radiobaliza:'),
        propietarios: [] as any[],
        certificados: [] as any[],
        certMedioAmbiente: [] as any[]
      };

      $detail('.TabbedPanelsContent').eq(0).find('table tr').each((i, el) => {
        if (i === 0) return; // skip header
        const tds = $detail(el).find('td');
        if (tds.length >= 2) {
          result.propietarios.push({
            nombre: $detail(tds[0]).text().trim(),
            docIdentidad: $detail(tds[1]).text().trim()
          });
        }
      });

      $detail('.TabbedPanelsContent').eq(1).find('table tr').each((i, el) => {
        if (i === 0) return; // skip header
        const tds = $detail(el).find('td');
        if (tds.length >= 6) {
          const certDigitalLink = $detail(tds[5]).find('a').attr('href');
          result.certificados.push({
            nCertificado: $detail(tds[0]).text().trim(),
            nombreNave: $detail(tds[1]).text().trim(),
            tipoCertificado: $detail(tds[2]).text().trim(),
            fechaExpedicion: $detail(tds[3]).text().trim(),
            vctoRefrenda: $detail(tds[4]).text().trim(),
            certDigital: certDigitalLink ? `https://consultas.dicapi.mil.pe${certDigitalLink.startsWith('/') ? '' : '/'}${certDigitalLink}` : null
          });
        }
      });

      $detail('.TabbedPanelsContent').eq(2).find('table tr').each((i, el) => {
        if (i === 0) return; // skip header
        const tds = $detail(el).find('td');
        if (tds.length >= 6) {
          const certDigitalLink = $detail(tds[5]).find('a').attr('href');
          result.certMedioAmbiente.push({
            nCertificado: $detail(tds[0]).text().trim(),
            nombreNave: $detail(tds[1]).text().trim(),
            tipoCertificado: $detail(tds[2]).text().trim(),
            fechaExpedicion: $detail(tds[3]).text().trim(),
            fechaVcto: $detail(tds[4]).text().trim(),
            certDigital: certDigitalLink ? `https://consultas.dicapi.mil.pe${certDigitalLink.startsWith('/') ? '' : '/'}${certDigitalLink}` : null
          });
        }
      });

      res.json(result);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to fetch from DICAPI' });
    }
  });

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
