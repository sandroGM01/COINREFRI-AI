import http from 'http';

http.get('http://app02.sanipes.gob.pe:8089/Publico/Consulta_protocolos_embarcacion_pesca', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => console.log(data));
});
