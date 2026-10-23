import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const appPath = process.env.GLACIER_URL ?? '/glacier-atlas/';

for (const width of [390, 1440]) {
  test(`axe names, contrast and semantics at ${width}px in day, map and night`, async ({ page }) => {
    await page.setViewportSize({ width, height:900 });
    await page.goto(appPath);
    for (const state of ['landscape', 'map', 'night'] as const) {
      if (state === 'map') await page.getByTestId('view-map').click();
      if (state === 'night') await page.getByTestId('night-toggle').click();
      const result = await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
      expect(result.violations, JSON.stringify(result.violations.map(v => ({ id:v.id, impact:v.impact, nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary})) })), null, 2)).toEqual([]);
    }
  });
}

test('keyboard opens chapters, modes and export with a visible focus indicator', async ({ page }) => {
  await page.goto(appPath);
  await page.keyboard.press('Tab');
  await page.getByTestId('chapter-1').focus();
  await expect(page.getByTestId('chapter-1')).toBeFocused();
  const focus = await page.getByTestId('chapter-1').evaluate(el => {
    const s = getComputedStyle(el);
    return {style:s.outlineStyle,width:s.outlineWidth,color:s.outlineColor};
  });
  expect(focus.style).not.toBe('none');
  expect(parseFloat(focus.width)).toBeGreaterThan(0);
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('active-chapter')).toContainText('Across the blue');
  await page.getByTestId('view-map').focus();
  await page.keyboard.press('Space');
  await expect(page.getByTestId('view-map')).toHaveAttribute('aria-pressed', 'true');
  await page.getByTestId('export-card').focus();
  const [download] = await Promise.all([page.waitForEvent('download'),page.keyboard.press('Enter')]);
  expect(download.suggestedFilename()).toMatch(/\.svg$/);
});

test('reduced motion and touch layouts remain functional without overflow', async ({ browser, baseURL }) => {
  for (const size of [{width:320,height:740},{width:390,height:844},{width:768,height:1024},{width:844,height:390}]) {
    const context = await browser.newContext({baseURL,viewport:size,hasTouch:true,reducedMotion:'reduce',deviceScaleFactor:1});
    const page = await context.newPage();
    await page.goto(appPath);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.getByTestId('chapter-2').tap();
    await expect(page.getByTestId('active-chapter')).toContainText('The white horizon');
    await page.getByTestId('view-map').tap();
    await expect(page.getByTestId('view-map')).toHaveAttribute('aria-pressed', 'true');
    await page.getByTestId('night-toggle').tap();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await context.close();
  }
});
