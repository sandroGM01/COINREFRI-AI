import http from 'http';
import fs from 'fs';

const postData = JSON.stringify({
  Matricula: 'PL-69692-CM'
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/sanipes/consulta',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    const html = JSON.parse(data).html;
    fs.writeFileSync('test_html.txt', html);
    console.log("Saved to test_html.txt");
  });
});

req.on('error', (e) => console.error(e));
req.write(postData);
req.end();
