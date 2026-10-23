import { test, expect, type Page } from '@playwright/test';
import { STORAGE_KEY } from '../src/lib/expedition';

const storageKey = STORAGE_KEY;
const appPath = process.env.GLACIER_URL ?? '/glacier-atlas/';

function observeErrors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('requestfailed', request => errors.push(`${request.method()} ${request.url()}: ${request.failure()?.errorText}`));
  page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
  return errors;
}

async function progress(page: Page) {
  return page.evaluate(key => JSON.parse(localStorage.getItem(key) ?? 'null') as {version:number;chapter:number;visited:number[]} | null, storageKey);
}

test('chapters persist, browser history works, and reset starts a new reading', async ({ page }) => {
  const errors = observeErrors(page);
  await page.goto(appPath);
  await expect(page.getByRole('heading', { name: 'GLACIER', exact: true })).toBeVisible();
  await page.getByTestId('chapter-1').click();
  await expect(page.getByTestId('active-chapter')).toContainText('Across the blue');
  await expect.poll(async () => (await progress(page))?.chapter).toBe(1);
  await page.getByTestId('chapter-2').click();
  await expect(page.getByTestId('active-chapter')).toContainText('The white horizon');
  await page.goBack();
  await expect(page.getByTestId('active-chapter')).toContainText('Across the blue');
  await page.reload();
  await expect(page.getByTestId('active-chapter')).toContainText('Across the blue');
  await page.getByTestId('chapter-2').click();
  await page.getByTestId('chapter-2').click();
  const remembered = await progress(page);
  expect(remembered?.version).toBe(1);
  expect(new Set(remembered?.visited).size).toBe(remembered?.visited.length);
  await page.getByTestId('reset-progress').click();
  await expect(page.getByTestId('active-chapter')).toContainText('The quiet approach');
  await page.reload();
  await expect(page.getByTestId('active-chapter')).toContainText('The quiet approach');
  expect(errors).toEqual([]);
});

test('back restores a chapter loaded from saved progress without an initial query', async ({ page }) => {
  const errors = observeErrors(page);
  await page.addInitScript(key => {
    if (!sessionStorage.getItem('glacier-test-seeded')) {
      localStorage.setItem(key, JSON.stringify({version:1,chapter:1,visited:[0,1]}));
      sessionStorage.setItem('glacier-test-seeded','yes');
    }
  }, storageKey);
  await page.goto(appPath);
  await expect(page.getByTestId('active-chapter')).toContainText('Across the blue');
  await page.getByTestId('chapter-2').click();
  await expect(page.getByTestId('active-chapter')).toContainText('The white horizon');
  await page.goBack();
  await expect(page.getByTestId('active-chapter')).toContainText('Across the blue');
  expect(errors).toEqual([]);
});

test('map, landscape and night support repeated actions without losing selected chapter', async ({ page }) => {
  const errors = observeErrors(page);
  await page.goto(appPath);
  await page.getByTestId('chapter-1').click();
  for (let i = 0; i < 3; i++) {
    await page.getByTestId('view-map').click();
    await expect(page.getByTestId('view-map')).toHaveAttribute('aria-pressed', 'true');
    await page.getByTestId('night-toggle').click();
    await page.getByTestId('view-landscape').click();
    await expect(page.getByTestId('view-landscape')).toHaveAttribute('aria-pressed', 'true');
    await page.getByTestId('night-toggle').click();
  }
  await expect(page.getByTestId('active-chapter')).toContainText('Across the blue');
  expect((await progress(page))?.chapter).toBe(1);
  expect(errors).toEqual([]);
});

test('SVG card exports repeatedly and contains the fictional expedition label', async ({ page }) => {
  const errors = observeErrors(page);
  await page.goto(appPath);
  await page.getByTestId('chapter-2').click();
  for (let i = 0; i < 2; i++) {
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByTestId('export-card').click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/\.svg$/);
    const stream = await download.createReadStream();
    expect(stream).not.toBeNull();
    let text = '';
    for await (const chunk of stream!) text += chunk.toString();
    expect(text).toContain('<svg');
    expect(text).toMatch(/fictional|imagined/i);
    expect(text).toContain('GLACIER');
    expect(text).not.toMatch(/<script|foreignObject|(?:href|src)\s*=\s*["']https?:\/\//i);
    expect(await download.failure()).toBeNull();
  }
  await page.getByTestId('reset-progress').click();
  await expect(page.getByTestId('active-chapter')).toContainText('The quiet approach');
  expect(errors).toEqual([]);
});

test('an interrupted export reports the error and a later attempt succeeds', async ({ page }) => {
  const errors = observeErrors(page);
  await page.goto(appPath);
  await page.evaluate(() => {
    const create = URL.createObjectURL.bind(URL);
    let failNext = true;
    URL.createObjectURL = value => {
      if (failNext) {
        failNext = false;
        throw new DOMException('Synthetic one-time export interruption', 'NotSupportedError');
      }
      return create(value);
    };
  });
  await page.getByTestId('export-card').click();
  await expect(page.getByRole('status').filter({hasText:'could not be downloaded'})).toBeVisible();
  const [download] = await Promise.all([page.waitForEvent('download'),page.getByTestId('export-card').click()]);
  expect(download.suggestedFilename()).toMatch(/\.svg$/);
  expect(await download.failure()).toBeNull();
  expect(errors).toEqual([]);
});

for (const malformed of ['{broken json', JSON.stringify({version:999, chapter:2, visited:[2]}), JSON.stringify({version:1, chapter:99, visited:['oops',-1,2,2]})]) {
  test(`corrupted storage is recoverable: ${malformed.slice(0, 35)}`, async ({ page }) => {
    const errors = observeErrors(page);
    await page.addInitScript(({ key, value }) => localStorage.setItem(key, value), { key:storageKey, value:malformed });
    await page.goto(appPath);
    await expect(page.getByRole('heading', { name:'GLACIER', exact:true })).toBeVisible();
    await page.getByTestId('chapter-1').click();
    await expect(page.getByTestId('active-chapter')).toContainText('Across the blue');
    expect((await progress(page))?.chapter).toBe(1);
    expect(errors).toEqual([]);
  });
}

test('denied browser storage leaves the whole expedition usable', async ({ page }) => {
  const errors = observeErrors(page);
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('Test storage is unavailable', 'SecurityError'); } });
  });
  await page.goto(appPath);
  await page.getByTestId('chapter-2').click();
  await expect(page.getByTestId('active-chapter')).toContainText('The white horizon');
  await page.getByTestId('view-map').click();
  await expect(page.getByTestId('view-map')).toHaveAttribute('aria-pressed', 'true');
  await page.getByTestId('reset-progress').click();
  await expect(page.getByTestId('active-chapter')).toContainText('The quiet approach');
  expect(errors).toEqual([]);
});

test('unknown chapter hashes do not break the atlas', async ({ page }) => {
  const errors = observeErrors(page);
  await page.goto(`${appPath}#chapter-does-not-exist`);
  await expect(page.getByRole('heading', { name:'GLACIER', exact:true })).toBeVisible();
  await page.getByTestId('chapter-1').click();
  await expect(page.getByTestId('active-chapter')).toContainText('Across the blue');
  expect(errors).toEqual([]);
});

test('the atlas and route stay usable when WebGL is unavailable', async ({ page }) => {
  const errors = observeErrors(page);
  await page.addInitScript(() => {
    HTMLCanvasElement.prototype.getContext = new Proxy(HTMLCanvasElement.prototype.getContext, {
      apply(target, receiver, args) {
        if (String(args[0]).toLowerCase().includes('webgl')) return null;
        return Reflect.apply(target, receiver, args);
      },
    });
    Object.defineProperty(window, 'WebGLRenderingContext', { value:undefined });
    Object.defineProperty(window, 'WebGL2RenderingContext', { value:undefined });
  });
  await page.goto(appPath);
  await expect(page.getByRole('heading', { name:'GLACIER', exact:true })).toBeVisible();
  await expect(page.getByTestId('terrain').getByRole('img')).toBeVisible();
  await page.getByTestId('chapter-2').click();
  await page.getByTestId('view-map').click();
  await expect(page.getByTestId('active-chapter')).toContainText('The white horizon');
  await expect(page.getByTestId('view-map')).toHaveAttribute('aria-pressed', 'true');
  expect(errors).toEqual([]);
});
