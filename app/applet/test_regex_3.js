import fs from 'fs';

const html = fs.readFileSync('test_html.txt', 'utf8');

const extractField = (label) => {
  // Look for the text inside a td element
  const regex = new RegExp(`td[^>]*>\\s*${label}:\\s*([^<\\n]+)`);
  const match = html.match(regex);
  return match ? match[1].trim() : '';
};

console.log("Matricula:", extractField('Matricula'));
console.log("Nombre:", extractField('Nombre'));
console.log("Tipo:", extractField('Tipo'));
console.log("Actividad:", extractField('Actividad'));
console.log("Código de Habilitación:", extractField('Código de Habilitación'));
