import { chapters } from './chapters';
import type { ChapterIndex } from './chapters';

export const STORAGE_KEY = 'glacier-atlas:progress:v1';

export interface Progress {
  version: 1;
  visited: ChapterIndex[];
  chapter: ChapterIndex;
}

const isChapter = (value: unknown): value is ChapterIndex => value === 0 || value === 1 || value === 2;

export function initialProgress(): Progress {
  return { version: 1, visited: [0], chapter: 0 };
}

function validateProgress(value: unknown): Progress | null {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as Partial<Progress>;
  if (candidate.version !== 1 || !isChapter(candidate.chapter) || !Array.isArray(candidate.visited)) return null;
  if (candidate.visited.length > 32 || !candidate.visited.every(isChapter)) return null;
  const visited = [...new Set([...candidate.visited, candidate.chapter])].sort() as ChapterIndex[];
  return { version: 1, visited, chapter: candidate.chapter };
}

export function readProgress(storage?: Pick<Storage, 'getItem'>): Progress {
  try {
    const target = storage ?? (typeof window !== 'undefined' ? window.localStorage : undefined);
    const raw = target?.getItem(STORAGE_KEY);
    return raw ? validateProgress(JSON.parse(raw)) ?? initialProgress() : initialProgress();
  } catch {
    return initialProgress();
  }
}

export function saveProgress(progress: Progress, storage?: Pick<Storage, 'setItem'>): boolean {
  try {
    const valid = validateProgress(progress);
    if (!valid) return false;
    const target = storage ?? (typeof window !== 'undefined' ? window.localStorage : undefined);
    if (!target) return false;
    target.setItem(STORAGE_KEY, JSON.stringify(valid));
    return true;
  } catch {
    return false;
  }
}

export function visitChapter(progress: Progress, index: ChapterIndex): Progress {
  const valid = validateProgress(progress) ?? initialProgress();
  if (!isChapter(index)) return valid;
  return { version: 1, chapter: index, visited: [...new Set([...valid.visited, index])].sort() as ChapterIndex[] };
}

const xmlText = (value: string): string => value.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[character]!);

export function buildExpeditionSvg(chapter: ChapterIndex, visited: readonly ChapterIndex[]): string {
  const selected = chapters[isChapter(chapter) ? chapter : 0];
  const safeVisited = new Set(visited.filter(isChapter));
  const contours = Array.from({ length: 13 }, (_, index) => {
    const inset = index * 14;
    return `<path d="M${80 + inset} 414 C${110 + inset} ${326 - inset / 3} ${230 + inset / 2} ${320 - inset} 367 ${210 + inset / 3} S${500 - inset} ${130 + inset / 2} ${608 - inset / 2} ${275 + inset / 3} S${710 - inset / 2} ${326 + inset / 2} ${770 - inset} ${430 - inset / 2}"/>`;
  }).join('');
  const markers = chapters.map((item, index) => {
    const x = 222 + index * 188;
    const y = [370, 290, 228][index];
    return `<g><circle cx="${x}" cy="${y}" r="${chapter === index ? 12 : 8}" fill="${safeVisited.has(index as ChapterIndex) ? '#d96b54' : '#143e40'}" stroke="#f1f3e9" stroke-width="2"/><text x="${x + 18}" y="${y + 5}" fill="#f1f3e9" font-size="14" letter-spacing="1">${item.number}</text></g>`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="620" viewBox="0 0 900 620" role="img" aria-labelledby="title description">
<title id="title">GLACIER — ${xmlText(selected.name)}</title>
<desc id="description">An illustrated expedition card for an imagined alpine journey. Chapter ${selected.number} of three. Fictional terrain and route; not for navigation.</desc>
<rect width="900" height="620" fill="#143e40"/>
<g stroke="#9fbfba" fill="none" stroke-width="1" opacity=".38">${contours}</g>
<path d="M120 440 235 310 295 348 437 155 525 296 600 204 766 440Z" fill="#80aaa5"/>
<path d="m235 310 60 38 142-193-57 185-62 41 87 59H120Z" fill="#dce8de"/>
<path d="m437 155 88 141 75-92-39 150 77 86H405l-87-59 62-41Z" fill="#b8d1c9"/>
<path d="m437 155 39 188-71 97-87-59 62-41Z" fill="#63938e"/>
<path d="m600 204 166 236H638l-77-86Z" fill="#4b7b77"/>
<path d="M222 370Q280 382 338 338T410 290T505 275T598 228" fill="none" stroke="#f1e4d2" stroke-width="2" stroke-dasharray="5 6"/>
<g font-family="Arial, Helvetica, sans-serif">${markers}
<text x="44" y="52" fill="#f1f3e9" font-size="13" letter-spacing="3">FIELD ATLAS / VOL. 01</text>
<text x="856" y="52" fill="#f1f3e9" font-size="13" letter-spacing="2" text-anchor="end">AN IMAGINED EXPEDITION</text>
<text x="39" y="151" fill="#f1f3e9" font-size="102" font-weight="700" letter-spacing="-7">GLACIER</text>
<path d="M44 473H856" stroke="#9fbfba" stroke-opacity=".5"/>
<text x="44" y="511" fill="#b3ccc5" font-size="12" letter-spacing="2">CHAPTER ${selected.number} / ${xmlText(selected.day)}</text>
<text x="44" y="552" fill="#f1f3e9" font-size="32">${xmlText(selected.name)}</text>
<text x="856" y="510" fill="#b3ccc5" font-size="12" letter-spacing="2" text-anchor="end">${safeVisited.size} OF 3 CHAPTERS EXPLORED</text>
<text x="856" y="549" fill="#f1f3e9" font-size="25" text-anchor="end">${selected.altitude.toLocaleString('en-US')} m</text>
<text x="44" y="590" fill="#b3ccc5" font-size="11" letter-spacing="1">FICTIONAL TERRAIN + ROUTE. AN ART OBJECT, NOT FOR NAVIGATION.</text>
<text x="856" y="590" fill="#b3ccc5" font-size="11" letter-spacing="1" text-anchor="end">GLACIER / ARCHIVE 001</text>
</g></svg>`;
}
