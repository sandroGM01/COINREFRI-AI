fetch('http://localhost:3000/api/sanipes/consulta', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ Matricula: 'PL-69692-CM' })
}).then(res => res.json()).then(data => {
  console.log("Length:", data.htmlLength);
  console.log("Includes:", data.includesMatricula);
  console.log("Preview:", data.htmlPreview);
  const extractField = (label) => {
    const regex = new RegExp(`${label}:\\s*([^<]+)`);
    const match = data.html.match(regex);
    return match ? match[1].trim() : '';
  };
  console.log("Extracted Matricula:", extractField('Matricula'));
});
