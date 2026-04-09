import http from 'http';
import querystring from 'querystring';

const postData = querystring.stringify({
  'Matricula': 'PL-69692-CM',
  'cod_habilitacion': '',
  'Nombre': ''
});

const options = {
  hostname: 'app02.sanipes.gob.pe',
  port: 8089,
  path: '/Publico/Consulta_protocolos_embarcacion_pesca',
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => console.log(data));
});

req.on('error', (e) => console.error(e));
req.write(postData);
req.end();
