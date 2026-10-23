import { useEffect, useMemo, useRef, useState } from 'react';
import { chapters } from '../lib/chapters';
import type { ChapterIndex } from '../lib/chapters';
import { buildExpeditionSvg } from '../lib/expedition';
import './expedition-card.css';

interface ExpeditionCardProps {
  chapter: ChapterIndex;
  visited: readonly ChapterIndex[];
  onReset: () => void;
}

export default function ExpeditionCard({ chapter, visited, onReset }: ExpeditionCardProps) {
  const svg = useMemo(() => buildExpeditionSvg(chapter, visited), [chapter, visited]);
  const [status, setStatus] = useState('Your card follows the chapter you are exploring.');
  const downloads = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  useEffect(() => {
    const pending = downloads.current;
    return () => {
      pending.forEach((timer, url) => {
        clearTimeout(timer);
        URL.revokeObjectURL(url);
      });
      pending.clear();
    };
  }, []);

  const download = () => {
    let url: string | undefined;
    let anchor: HTMLAnchorElement | undefined;
    try {
      url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
      anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `glacier-expedition-${chapters[chapter].id}.svg`;
      document.body.append(anchor);
      anchor.click();
      const fileUrl = url;
      const timer = setTimeout(() => {
        URL.revokeObjectURL(fileUrl);
        downloads.current.delete(fileUrl);
      }, 1500);
      downloads.current.set(fileUrl, timer);
      setStatus(`Chapter ${chapters[chapter].number} card prepared. Check your downloads.`);
    } catch {
      if (url) URL.revokeObjectURL(url);
      setStatus('The card could not be downloaded in this browser. Please try again.');
    } finally {
      anchor?.remove();
    }
  };

  const reset = () => {
    onReset();
    setStatus('Chapter progress reset. The quiet approach is open again.');
  };

  return <div className="expedition-card">
    <figure className="expedition-card__figure">
      <img className="expedition-card__image" src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`} alt={`GLACIER expedition card: ${chapters[chapter].name}. An illustrated mountain route with ${new Set(visited).size} of 3 chapters explored.`} width="900" height="620" loading="lazy"/>
      <figcaption>Yours to keep. A small record of an imagined place.</figcaption>
    </figure>
    <div className="expedition-card__actions">
      <button type="button" data-testid="export-card" className="expedition-card__download" onClick={download}>Download expedition card <span aria-hidden="true">↗</span></button>
      <button type="button" data-testid="reset-progress" className="expedition-card__reset" onClick={reset}>Reset chapter progress</button>
    </div>
    <p className="expedition-card__status" role="status" aria-live="polite">{status}</p>
  </div>;
}
