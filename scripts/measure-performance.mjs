/* global process, window, performance, document, innerWidth, requestAnimationFrame, PerformanceObserver */
import { chromium } from '@playwright/test';
import { writeFile, readdir, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';

// A bounded browser measurement, not a Lighthouse score or a user-device guarantee.
const target = process.argv[2] ?? 'http://127.0.0.1:4186/glacier-atlas/';
const output = process.argv[3] ?? 'qa/performance-local.json';
const executablePath = process.env.CHROME_PATH ?? (process.platform === 'win32' ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' : '/usr/bin/google-chrome');
const browser = await chromium.launch({executablePath,headless:true});
const samples = [];
try {
  for (const viewport of [{width:1440,height:1000},{width:390,height:844}]) {
    for (let run=1; run<=3; run++) {
      const context = await browser.newContext({viewport,deviceScaleFactor:1,reducedMotion:'reduce',serviceWorkers:'block'});
      const page = await context.newPage();
      const issues = [];
      page.on('pageerror', error => issues.push({type:'pageerror',message:error.message}));
      page.on('console', message => { if (message.type()==='error') issues.push({type:'console',message:message.text()}); });
      page.on('requestfailed', request => issues.push({type:'requestfailed',url:request.url(),message:request.failure()?.errorText}));
      page.on('response', response => { if(response.status() >= 400) issues.push({type:'http',status:response.status(),url:response.url()}); });
      await page.addInitScript(() => {
        window.__glacierPerf = {lcp:0,longTasks:[],observerTypes:PerformanceObserver.supportedEntryTypes};
        try { new PerformanceObserver(list => { for (const entry of list.getEntries()) window.__glacierPerf.lcp = entry.startTime; }).observe({type:'largest-contentful-paint',buffered:true}); } catch { /* Browser support is reported through zero if unavailable. */ }
        try { new PerformanceObserver(list => { for (const entry of list.getEntries()) window.__glacierPerf.longTasks.push({start:entry.startTime,duration:entry.duration}); }).observe({type:'longtask',buffered:true}); } catch { /* Optional measurement only. */ }
      });
      const response = await page.goto(target,{waitUntil:'networkidle'});
      await page.getByTestId('view-map').waitFor();
      const initial = await page.evaluate(() => ({
        navigation:performance.getEntriesByType('navigation')[0]?.toJSON(),
        paint:performance.getEntriesByType('paint').map(e=>e.toJSON()),
        resources:performance.getEntriesByType('resource').map(e=>e.toJSON()),
        lcp:window.__glacierPerf.lcp,
        longTasks:window.__glacierPerf.longTasks,
        observerTypes:window.__glacierPerf.observerTypes,
        domElements:document.querySelectorAll('*').length,
        svgElements:document.querySelectorAll('svg *').length,
        horizontalOverflow:document.documentElement.scrollWidth > innerWidth,
      }));
      const client = await context.newCDPSession(page);
      await client.send('Performance.enable');
      const metrics = await client.send('Performance.getMetrics');
      const heap = metrics.metrics.find(m=>m.name==='JSHeapUsedSize')?.value;
      const interactions = [];
      for (const id of ['view-map','night-toggle','chapter-2','view-landscape']) {
        const start = performance.now();
        await page.getByTestId(id).click();
        if (id.startsWith('view-')) await page.getByTestId(id).evaluate(el => {if(el.getAttribute('aria-pressed') !== 'true') throw new Error('Selected view did not activate');});
        await page.evaluate(() => new Promise(resolve => requestAnimationFrame(()=>requestAnimationFrame(resolve))));
        interactions.push({control:id,automationClickToTwoAnimationFramesMs:Math.round((performance.now()-start)*100)/100});
      }
      samples.push({viewport,run,httpStatus:response?.status(),initial,heapUsedBytes:heap,interactions,issues});
      await context.close();
    }
  }
  const assets=[];
  try {
    for(const name of await readdir('dist/assets')) {
      const bytes=await readFile(path.join('dist/assets',name));
      assets.push({name,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')});
    }
  } catch { /* Live-only execution may have no local dist. */ }
  const report={
    measuredAt:new Date().toISOString(),target,browser:await browser.version(),
    conditions:{headless:true,operatingSystem:process.platform,viewportSamples:3,deviceScaleFactor:1,reducedMotion:'reduce',emulation:'Viewport size only; not physical mobile hardware or mobile CPU emulation',cache:'Fresh isolated browser context for each navigation',network:'Unthrottled; localhost for local target, normal connection for live target',cpu:'Unthrottled; shared desktop host',wait:'Playwright networkidle after navigation (500ms with no network connections); no extra delay',interactionMetric:'Playwright click start through DOM update and two animation frames, includes automation and scrolling; not INP',lcpLimit:'Synthetic Chrome run, SVG content may not count as LCP; no field-data claim'},
    assets,samples,
  };
  await writeFile(output,JSON.stringify(report,null,2)+'\n');
  process.stdout.write(JSON.stringify({output,browser:report.browser,samples:samples.map(s=>({viewport:s.viewport,run:s.run,status:s.httpStatus,lcp:s.initial.lcp,domContentLoaded:s.initial.navigation?.domContentLoadedEventEnd,load:s.initial.navigation?.loadEventEnd,heap:s.heapUsedBytes,issues:s.issues}))},null,2)+'\n');
} finally { await browser.close(); }
