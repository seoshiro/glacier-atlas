import type { ChapterIndex } from './chapters';
export function chapterFromSearch(search: string): ChapterIndex | null {
  const value = new URLSearchParams(search).get('chapter');
  return value === '1' ? 0 : value === '2' ? 1 : value === '3' ? 2 : null;
}
export function chapterUrl(href: string, chapter: ChapterIndex): string {
  const url = new URL(href);
  url.searchParams.set('chapter', String(chapter + 1));
  return `${url.pathname}${url.search}${url.hash}`;
}
