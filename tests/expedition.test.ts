import { describe, expect, it, vi } from 'vitest';
import { buildExpeditionSvg, initialProgress, readProgress, saveProgress, STORAGE_KEY, visitChapter } from '../src/lib/expedition';
import type { Progress } from '../src/lib/expedition';
import type { ChapterIndex } from '../src/lib/chapters';

describe('chapter progress', () => {
  it('returns independent defaults for absent, corrupted and unsupported storage', () => {
    for (const raw of [null, '', 'not json', 'null', '[]', '{"version":2,"chapter":0,"visited":[0]}', '{"version":1,"chapter":8,"visited":[0]}', '{"version":1,"chapter":0,"visited":["0"]}']) {
      expect(readProgress({ getItem: () => raw })).toEqual(initialProgress());
    }
    expect(readProgress({ getItem: () => { throw new Error('Storage blocked'); } })).toEqual(initialProgress());
    const initial = initialProgress();
    initial.visited.push(1);
    expect(initialProgress().visited).toEqual([0]);
  });

  it('deduplicates visits, preserves the active chapter and never mutates input', () => {
    const previous = { version: 1, visited: [2, 2, 0], chapter: 1 } as Progress;
    expect(readProgress({ getItem: () => JSON.stringify(previous) })).toEqual({ version: 1, visited: [0, 1, 2], chapter: 1 });
    const next = visitChapter(initialProgress(), 2);
    expect(visitChapter(next, 2)).toEqual(next);
    expect(visitChapter(next, 1)).toEqual({ version: 1, visited: [0, 1, 2], chapter: 1 });
    expect(next).toEqual({ version: 1, visited: [0, 2], chapter: 2 });
  });

  it('contains write errors and refuses invalid runtime values', () => {
    const setItem = vi.fn();
    expect(saveProgress(visitChapter(initialProgress(), 1), { setItem })).toBe(true);
    expect(setItem).toHaveBeenCalledWith(STORAGE_KEY, '{"version":1,"visited":[0,1],"chapter":1}');
    expect(saveProgress(initialProgress(), { setItem: () => { throw new Error('Quota'); } })).toBe(false);
    expect(saveProgress({ version: 1, chapter: 3, visited: [0] } as unknown as Progress, { setItem })).toBe(false);
    expect(setItem).toHaveBeenCalledTimes(1);
    expect(visitChapter(initialProgress(), 'bad' as unknown as ChapterIndex)).toEqual(initialProgress());
  });
});

describe('expedition card export', () => {
  it('makes a deterministic, self-contained SVG for the current chapter', () => {
    const svg = buildExpeditionSvg(1, [0, 1]);
    expect(svg).toBe(buildExpeditionSvg(1, [0, 1]));
    expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
    expect(svg).toContain('Across the blue');
    expect(svg).toContain('2 OF 3 CHAPTERS EXPLORED');
    expect(svg).toContain('FICTIONAL TERRAIN + ROUTE. AN ART OBJECT, NOT FOR NAVIGATION.');
    expect(svg).not.toMatch(/<script|<foreignObject|https:\/\/|onload=|href=/i);
    expect(svg).toContain('width="900" height="620"');
  });

  it('does not interpolate invalid runtime values or duplicate visited chapters', () => {
    const unsafe = '<script>alert("test")</script>' as unknown as ChapterIndex;
    const svg = buildExpeditionSvg(unsafe, [unsafe, 0, 0]);
    expect(svg).toContain('The quiet approach');
    expect(svg).toContain('1 OF 3 CHAPTERS EXPLORED');
    expect(svg).not.toContain('<script>');
    expect(svg).not.toContain('undefined');
  });
});
