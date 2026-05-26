import fetch from 'node-fetch';

async function test() {
  const params = new URLSearchParams();
  params.append('diploma', '80');
  params.append('kirikOBP', 'true');
  params.append('kirik', '1');
  params.append('tmd', '30');
  params.append('ttd', '30');
  params.append('tfd', '10');
  params.append('tsd', '10');
  params.append('md', '30');
  
  const res = await fetch('https://puango.net/api/hesaplama2.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString()
  });
  
  const text = await res.text();
  console.log(text.substring(text.indexOf('{')));
}
test();
