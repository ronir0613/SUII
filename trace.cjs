const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  const client = await page.context().newCDPSession(page);
  await client.send('Tracing.start', {
    categories: '-*,devtools.timeline,v8.execute,disabled-by-default-devtools.timeline,disabled-by-default-devtools.timeline.frame,toplevel,blink.console,blink.user_timing,latencyInfo,cc,viz,blink.user_timing,benchmark',
    options: 'record-until-full'
  });
  
  console.log('Navigating...');
  await page.goto('https://subsequent-ring.ronirapaka13.workers.dev', { waitUntil: 'networkidle' });

  
  await page.waitForTimeout(1000); // let it settle
  
  console.log('Rapid clicking...');
  for (let i = 0; i < 60; i++) {
    await page.mouse.click(200, 200);
    await page.waitForTimeout(16); // ~60fps clicks
  }
  
  console.log('Waiting for animations to play out...');
  await page.waitForTimeout(2000);
  
  console.log('Stopping trace...');
  const traceEvents = [];
  client.on('Tracing.dataCollected', event => {
    traceEvents.push(...event.value);
  });
  
  await client.send('Tracing.end');
  await new Promise(r => setTimeout(r, 1500));
  
  console.log(`Collected ${traceEvents.length} trace events.`);
  
  // Calculate Frame times
  const frames = traceEvents.filter(e => e.name === 'DrawFrame' && e.cat.includes('benchmark'));
  let droppedFrames = 0;
  if (frames.length > 1) {
    let lastTime = frames[0].ts;
    let totalTime = 0;
    for (let i = 1; i < frames.length; i++) {
      let duration = (frames[i].ts - lastTime) / 1000; // ms
      totalTime += duration;
      if (duration > 32) droppedFrames++; // >32ms means <30fps
      lastTime = frames[i].ts;
    }
    console.log(`Average frame time: ${(totalTime / (frames.length - 1)).toFixed(2)}ms`);
    console.log(`Dropped frames (>32ms): ${droppedFrames} out of ${frames.length}`);
  }
  
  const updateLayoutTree = traceEvents.filter(e => e.name === 'UpdateLayoutTree');
  const layouts = traceEvents.filter(e => e.name === 'Layout');
  const paints = traceEvents.filter(e => e.name === 'Paint');
  
  let styleDur = updateLayoutTree.reduce((sum, e) => sum + (e.dur || 0), 0) / 1000;
  let layoutDur = layouts.reduce((sum, e) => sum + (e.dur || 0), 0) / 1000;
  let paintDur = paints.reduce((sum, e) => sum + (e.dur || 0), 0) / 1000;
  
  console.log(`Time spent in UpdateLayoutTree (Style Recalc): ${styleDur.toFixed(2)}ms (${updateLayoutTree.length} events)`);
  console.log(`Time spent in Layout: ${layoutDur.toFixed(2)}ms (${layouts.length} events)`);
  console.log(`Time spent in Paint: ${paintDur.toFixed(2)}ms (${paints.length} events)`);

  const gpuEvents = traceEvents.filter(e => e.name === 'GPUTask' || e.name === 'CompositorGpuThread::GPUTask');
  console.log(`GPU Tasks: ${gpuEvents.length}`);

  await browser.close();
})();
