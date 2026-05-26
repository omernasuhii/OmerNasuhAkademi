import fetch from 'node-fetch';

async function test() {
  const reqData = ["30.00","15.00","20.00","10.00", "20.00","5.00","5.00", "8.00","8.00","8.00","5.00", "30.00", "10.00","10.00","10.00", "70.00", "40,00"];
  
  const res = await fetch('https://ogmmateryal.eba.gov.tr/yks-puan-hesaplama', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(reqData)
  });
  
  const data = await res.text();
  console.log(data);
}
test();
