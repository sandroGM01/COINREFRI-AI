import http from 'http';

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
    console.log(data.substring(0, 1000));
  });
});

req.on('error', (e) => console.error(e));
req.write(postData);
req.end();
