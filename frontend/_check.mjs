import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await (await b.newContext({ viewport:{width:1440,height:820} })).newPage();
p.on('console', m => { if (m.type()==='error') console.log('CONSOLE ERR:', m.text().slice(0,140)); });
const failed = [];
p.on('response', r => { if (r.url().includes('/uploads/') || r.url().includes('/auth/me')) console.log('NET', r.status(), r.url().replace('http://localhost:3000','')); });
p.on('requestfailed', r => failed.push(r.url()));

await p.goto('http://localhost:5199/mediademo/login', { waitUntil:'networkidle' });
await p.fill('input[type="email"]', 'owner@mediademo.test');
await p.fill('input[type="password"]', 'Password123!');
await p.click('button[type="submit"]');
await p.waitForTimeout(4000);
console.log('URL after login:', p.url());

const state = await p.evaluate(() => {
  const imgs = [...document.querySelectorAll('img')].map(i => ({
    src: i.getAttribute('src'), cls: i.className, w: i.naturalWidth,
  }));
  return { imgs, bodyHasSidebar: !!document.querySelector('nav') };
});
console.log(JSON.stringify(state, null, 1));
console.log('requestfailed:', failed.filter(u=>u.includes('uploads')));
await p.screenshot({ path: 'check-app.png' });
await b.close();
