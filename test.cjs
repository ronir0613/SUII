const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.text().includes('[DEBUG]')) {
      console.log(msg.text());
    }
  });

  await page.goto('http://localhost:4321');
  
  // Wait for React to mount and the button to be in DOM
  await page.waitForFunction(() => document.getElementById('challenge-btn') !== null);
  
  // click to start
  await page.evaluate(() => document.getElementById('challenge-btn').click());
  
  // Wait for Play Again to appear
  await page.waitForFunction(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    return btns.some(b => b.textContent.includes('Play Again'));
  }, { timeout: 20000 });
  
  await page.waitForTimeout(500); // let animation settle
  
  // Rapidly click Play Again 5 times synchronously
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const playAgain = btns.find(b => b.textContent.includes('Play Again'));
    if (playAgain) {
      console.log('[DEBUG] Simulating 5 rapid clicks on Play Again');
      for(let i=0; i<5; i++) {
        playAgain.click();
      }
    } else {
      console.log('[DEBUG] Play Again button not found');
    }
  });
  
  await page.waitForTimeout(1000);
  
  // Now click Start Challenge again and rapid click it!
  await page.evaluate(() => {
    const btn = document.getElementById('challenge-btn');
    if (btn) {
      console.log('[DEBUG] Simulating 5 rapid clicks on Start Challenge');
      for(let i=0; i<5; i++) btn.click();
    } else {
      console.log('[DEBUG] Start Challenge button not found');
    }
  });

  await page.waitForTimeout(2000);
  await browser.close();
})();
