fetch('http://localhost:3000/api/sanipes/consulta', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ Matricula: 'PL-69692-CM' })
}).then(res => res.json()).then(data => {
  console.log("Matricula:", data.matricula);
  console.log("Nombre:", data.nombre);
  console.log("Tipo:", data.tipo);
  console.log("Actividad:", data.actividad);
  console.log("Codigo:", data.codigoHabilitacion);
});
