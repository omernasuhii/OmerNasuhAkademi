const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  page.on('requestfailed', request => {
    console.log('REQUEST FAILED:', request.url(), request.failure()?.errorText, request.response()?.status());
  });

  await page.goto('http://localhost:3000');
  
  await new Promise(r => setTimeout(r, 5000));
  
  // click login maybe?
  const content = await page.content();
  const fs = require('fs');
  fs.writeFileSync('page_content.html', content);
  
  await browser.close();
})();
