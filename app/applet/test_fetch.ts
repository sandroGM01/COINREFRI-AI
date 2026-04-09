const params = new URLSearchParams();
params.append('Matricula', 'PL-69692-CM');
params.append('cod_habilitacion', '');
params.append('Nombre', '');

fetch('http://app02.sanipes.gob.pe:8089/Publico/Consulta_protocolos_embarcacion_pesca', {
  method: 'POST',
  body: params,
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded'
  }
}).then(res => res.text()).then(html => {
  const extractField = (label) => {
    const regex = new RegExp(`${label}:\\s*([^<]+)`);
    const match = html.match(regex);
    return match ? match[1].trim() : '';
  };
  console.log("Matricula:", extractField('Matricula'));
  console.log("Nombre:", extractField('Nombre'));
});
