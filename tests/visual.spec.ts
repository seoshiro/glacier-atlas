import { test, expect } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const baseUrl = process.env.BASE_URL ?? process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:4186/glacier-atlas/';
const phase = process.env.GLACIER_VISUAL_PHASE === 'after' ? 'after' : 'before';
const evidenceDirectory = path.resolve('qa/screenshots');
const viewports = [
  { name: 'mobile-320', width: 320, height: 780 },
  { name: 'mobile-390', width: 390, height: 844 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'desktop-1440', width: 1440, height: 1000 },
  { name: 'landscape-844', width: 844, height: 390 },
];

test.describe('independent visual evidence', () => {
  test('responsive narrative, readable controls, and reduced-motion captures', async ({ browser }) => {
    test.setTimeout(120_000);
    await mkdir(evidenceDirectory, { recursive: true });
    const measurements = [];
    for (const viewport of viewports) {
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
        reducedMotion: 'reduce',
        deviceScaleFactor: 1,
        isMobile: viewport.width < 768,
        hasTouch: viewport.width < 768,
      });
      const page = await context.newPage();
      const errors: string[] = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(baseUrl, { waitUntil: 'networkidle' });
      await expect(page.getByRole('heading', { level: 1 })).toContainText(/GLACIER/i);
      await expect(page.locator('main')).toBeVisible();
      // Walk the story as a visitor would so below-fold lazy artwork is ready
      // before the full-page evidence is captured.
      await page.getByTestId('export-card').scrollIntoViewIfNeeded();
      await expect(page.locator('.expedition-card__image')).toHaveJSProperty('complete', true);
      expect(await page.locator('.expedition-card__image').evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0);
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
      await page.screenshot({ path: path.join(evidenceDirectory, `${phase}-${viewport.name}-full.png`), fullPage: true, animations: 'disabled' });
      await page.screenshot({ path: path.join(evidenceDirectory, `${phase}-${viewport.name}-hero.png`), animations: 'disabled' });
      const geometry = await page.evaluate(() => ({
        viewport: window.innerWidth,
        documentWidth: document.documentElement.scrollWidth,
        bodyWidth: document.body.scrollWidth,
        headings: [...document.querySelectorAll('h1,h2')].map(heading => heading.textContent?.trim()),
        buttons: [...document.querySelectorAll('button')].map(button => {
          const box = button.getBoundingClientRect();
          return { name: button.getAttribute('aria-label') || button.textContent?.trim(), width: Math.round(box.width), height: Math.round(box.height) };
        }),
        markerLabels: [...document.querySelectorAll('.terrain__marker-label')].map(label => {
          const box = label.getBoundingClientRect();
          return { name: label.textContent?.trim(), left: box.left, right: box.right };
        }),
      }));
      measurements.push({ name: viewport.name, ...geometry, errors });
      expect(geometry.documentWidth, `${viewport.name} document overflow`).toBeLessThanOrEqual(viewport.width + 1);
      for (const label of geometry.markerLabels) {
        expect(label.left, `${viewport.name} ${label.name} left crop`).toBeGreaterThanOrEqual(4);
        expect(label.right, `${viewport.name} ${label.name} right crop`).toBeLessThanOrEqual(viewport.width - 4);
      }
      expect(errors, `${viewport.name} browser runtime errors`).toEqual([]);
      await context.close();
    }
    await writeFile(path.join(evidenceDirectory, `${phase}-responsive-measurements.json`), `${JSON.stringify(measurements, null, 2)}\n`);
  });

  test('map, night palette, touch selection, and visible keyboard focus', async ({ browser }) => {
    test.setTimeout(60_000);
    await mkdir(evidenceDirectory, { recursive: true });
    for (const viewport of [viewports[1], viewports[3]]) {
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
        deviceScaleFactor: 1,
        reducedMotion: 'reduce',
        hasTouch: viewport.width < 768,
        isMobile: viewport.width < 768,
      });
      const page = await context.newPage();
      await page.goto(baseUrl, { waitUntil: 'networkidle' });
      await page.getByTestId('view-map').click();
      await expect(page.getByTestId('view-map')).toHaveAttribute('aria-pressed', 'true');
      await page.getByRole('button', { name: 'Chapter 03: Unwritten ridge, 3,860 metres' }).click();
      await expect(page.getByTestId('active-chapter')).toHaveText('The white horizon');
      await page.screenshot({ path: path.join(evidenceDirectory, `${phase}-${viewport.name}-map.png`), animations: 'disabled' });
      await page.getByTestId('night-toggle').click();
      await expect(page.getByTestId('night-toggle')).toHaveAttribute('aria-pressed', 'true');
      await page.screenshot({ path: path.join(evidenceDirectory, `${phase}-${viewport.name}-map-night.png`), animations: 'disabled' });
      await page.getByTestId('view-landscape').click();
      await page.screenshot({ path: path.join(evidenceDirectory, `${phase}-${viewport.name}-landscape-night.png`), animations: 'disabled' });
      await page.goto(baseUrl, { waitUntil: 'networkidle' });
      await page.keyboard.press('Tab');
      await expect(page.getByRole('link', { name: 'Skip to the expedition' })).toBeFocused();
      await page.screenshot({ path: path.join(evidenceDirectory, `${phase}-${viewport.name}-keyboard-focus.png`), animations: 'disabled' });
      await page.keyboard.press('Enter');
      await expect(page).toHaveURL(/#route$/);
      await page.getByTestId('chapter-1').focus();
      await page.keyboard.press('Enter');
      await expect(page.getByTestId('active-chapter')).toHaveText('Across the blue');
      await expect(page.getByTestId('chapter-1')).toBeFocused();
      await context.close();
    }
  });
});
