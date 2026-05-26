import http from 'http';

const req = http.request({
  hostname: 'localhost',
  port: 3000,
  path: '/api/student-assistant',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
}, res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('STATUS:', res.statusCode, 'BODY:', data));
});

req.on('error', e => console.error(e));
req.write(JSON.stringify({ history: [] }));
req.end();
