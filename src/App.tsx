import { useEffect, useState } from 'react';
import Terrain from './components/Terrain';
import ExpeditionCard from './components/ExpeditionCard';
import { chapters } from './lib/chapters';
import type { ChapterIndex, ViewMode } from './lib/chapters';
import { initialProgress, readProgress, saveProgress, visitChapter } from './lib/expedition';
import { chapterFromSearch, chapterUrl } from './lib/navigation';

function MountainMark({ className = '' }: {className?:string}) {
  return <svg className={className} aria-hidden="true" viewBox="0 0 40 32" fill="none"><path d="M2 29 19 3l19 26H2ZM19 3v26m-9-13 9 5 8-6" stroke="currentColor" strokeWidth="1.5"/><path d="m30 4 3 3m0-3-3 3" stroke="#b83f31" strokeWidth="1.5"/></svg>;
}
function Arrow() {
 return <span aria-hidden="true">↗</span>;
}
function App() {
 const [progress,setProgress]=useState(()=>{
   const saved=readProgress();
   const linked=chapterFromSearch(window.location.search);
   return linked === null ? saved : visitChapter(saved,linked);
 });
 const [view,setView]=useState<ViewMode>('landscape');
 const [night,setNight]=useState(false);
 const chapter=progress.chapter;
 const current=chapters[chapter];
 useEffect(()=>{
  saveProgress(progress);
  if(chapterFromSearch(window.location.search)===null) window.history.replaceState(null,'',chapterUrl(window.location.href,progress.chapter));
 },[progress]);
 useEffect(()=>{
  const restore=()=>setProgress(previous=>visitChapter(previous,chapterFromSearch(window.location.search) ?? 0));
  window.addEventListener('popstate',restore);
  return ()=>window.removeEventListener('popstate',restore);
 },[]);
 const selectChapter=(index:ChapterIndex)=>{
  if(index!==chapter) window.history.pushState(null,'',chapterUrl(window.location.href,index));
  setProgress(previous=>visitChapter(previous,index));
 };
 const reset=()=>{
  setProgress(initialProgress());
  window.history.replaceState(null,'',chapterUrl(window.location.href,0));
 };
 return <div className={`atlas ${night?'is-night':''}`}>
  <a className="skip-link" href="#route">Skip to the expedition</a>
  <header className="site-header">
   <a className="brand" href="#top" aria-label="Glacier atlas, top"><MountainMark/><span>GLACIER<span className="brand-sub">EXPEDITION ATLAS</span></span></a>
   <nav aria-label="Main navigation"><a href="#route">The route <span>01</span></a><a href="#journal">Field notes <span>02</span></a><a href="#field-card">Your keepsake <Arrow/></a></nav>
   <span className="header-edition"><i/> AN IMAGINED EXPEDITION</span>
  </header>
  <main>
   <section id="top" className={`hero hero--${view}`} aria-labelledby="hero-title">
    <Terrain chapter={chapter} view={view} night={night} onSelectChapter={selectChapter}/>
    <div className="hero-heading">
     <div className="hero-kicker"><span>FIELD ATLAS — VOL. 001</span><span>BEYOND THE FAMILIAR</span></div>
     <h1 id="hero-title">GLACIER<span className="title-star" aria-hidden="true">✳</span></h1>
    </div>
    <div className="hero-description"><span className="tiny-cross">+</span><p>A line through the mountains.<br/>A little closer to the unknown.</p><span className="mono">AN ATLAS OF THE UNCHARTED</span></div>
    <div className="hero-side mono">SOMEWHERE THAT DOES NOT EXIST. YET.</div>
    <div className="hero-floor">
     <a className="hero-cta" href="#route"><span className="cta-circle">↓</span><span>Follow the expedition<small>THREE CHAPTERS. ONE HORIZON.</small></span></a>
     <div className="scene-tools">
      <div className="view-switch" role="group" aria-label="Terrain view"><button data-testid="view-landscape" aria-pressed={view==='landscape'} onClick={()=>setView('landscape')}><MountainMark/> Landscape</button><button data-testid="view-map" aria-pressed={view==='map'} onClick={()=>setView('map')}><span aria-hidden="true">▱</span> Map</button></div>
      <button className="night-switch" data-testid="night-toggle" onClick={()=>setNight(value=>!value)} aria-pressed={night} aria-label={night?'Switch to day palette':'Switch to night palette'}><span aria-hidden="true">{night?'☀':'◐'}</span><span>{night?'Day':'Night'}</span></button>
     </div>
    </div>
   </section>
   <div className="expedition-strip mono"><span><i className="route-dot"/> THE UNWRITTEN RANGE</span><span>21.6 KM OF IMAGINATION</span><span>03 DAYS / 03 CHAPTERS</span><span>NO COORDINATES. JUST CURIOSITY.</span></div>
   <section id="route" className="route-section section-shell" aria-labelledby="route-title">
    <div className="section-heading"><p className="eyebrow"><span>01 /</span> THE TRAVERSE</p><div className="intro-grid"><h2 id="route-title">A line through<br/>the unfamiliar.</h2><div className="section-intro"><p>Some journeys begin with a destination.<br/>This one began with a blank page.</p><p>Trace an imagined crossing of the Unwritten Range — from the last stones of the valley to the place where the map runs out.</p><span className="fiction-label">FICTIONAL TERRAIN · ARTISTIC ATLAS</span></div></div></div>
    <div className="chapter-tabs" role="group" aria-label="Expedition chapters">{chapters.map((item,index)=><button key={item.id} data-testid={`chapter-${index}`} className={chapter===index?'active':''} aria-pressed={chapter===index} onClick={()=>selectChapter(index as ChapterIndex)}><span className="chapter-number">{item.number}<span className="chapter-visited">{progress.visited.includes(index as ChapterIndex)?'●':'○'}</span></span><span><small>{item.day} / {item.altitude.toLocaleString('en')} M</small><strong>{item.place}</strong></span><span className="tab-arrow" aria-hidden="true">↗</span></button>)}</div>
    <div className="chapter-detail">
     <div className="altitude-art"><div className="profile-top mono"><span>THE SHAPE OF A JOURNEY</span><span>FIG. 01 — ELEVATION STUDY</span></div><svg className="altitude-profile" role="img" aria-label="Illustrated fictional elevation profile: Moraine basin 2180 metres, Glass traverse 3040 metres, Unwritten ridge 3860 metres" viewBox="0 0 700 260"><defs><linearGradient id="profile-fill" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#639c95" stopOpacity=".3"/><stop offset="1" stopColor="#639c95" stopOpacity="0"/></linearGradient></defs><path className="profile-grid" d="M20 50H680M20 110H680M20 170H680M20 230H680"/><path d="M20 224 65 217 100 202 135 207 172 170 208 180 245 149 280 155 320 128 353 144 388 110 422 91 450 110 477 83 510 52 535 69 568 25 595 45 624 29 650 17 680 28V250H20Z" fill="url(#profile-fill)"/><path d="M20 224 65 217 100 202 135 207 172 170 208 180 245 149 280 155 320 128 353 144 388 110 422 91 450 110 477 83 510 52 535 69 568 25 595 45 624 29 650 17 680 28" className="profile-line"/><path d="M100 202Q250 169 388 110T650 17" fill="none" stroke="#b83f31" strokeWidth="2" strokeDasharray="4 6"/>{[[100,202],[388,110],[650,17]].map(([x,y],index)=><g key={x}><circle cx={x} cy={y} r={index===chapter?9:6} fill={index===chapter?'#b83f31':'#eef2eb'} stroke="#b83f31" strokeWidth="2"/><text x={x} y={y+30} textAnchor="middle" className="profile-label">0{index+1}</text></g>)}</svg><div className="profile-bottom mono"><span>THE VALLEY FLOOR</span><span>THE WHITE HORIZON ↗</span></div><p className="profile-disclaimer">An imagined elevation study. Not a navigational map.</p></div>
     <article className="chapter-copy" aria-live="polite" aria-atomic="true"><p className="eyebrow">CHAPTER {current.number} <span> / {current.tag}</span></p><h3 data-testid="active-chapter">{current.name}</h3><p>{current.text}</p><div className="chapter-stats"><div><span>ALTITUDE IN THE STORY</span><strong>{current.altitude.toLocaleString('en')}<small> m</small></strong></div><div><span>DISTANCE IN THE STORY</span><strong>{current.distance}<small> km</small></strong></div></div><a className="text-link" href="#journal">Open the field journal <Arrow/></a></article>
    </div>
   </section>
   <section id="journal" className="journal-section" aria-labelledby="journal-title">
    <div className="section-shell"><div className="journal-top"><p className="eyebrow"><span>02 /</span> THE FIELD JOURNAL</p><h2 id="journal-title">What the map<br/>couldn’t hold.</h2><span className="journal-volume mono">COLLECTED ALONG THE WAY<br/>UNWRITTEN RANGE, VOLUME I</span></div>
     <div className="journal-spread"><div className="field-drawing" aria-hidden="true"><svg viewBox="0 0 480 420"><defs><pattern id="paper-lines" width="30" height="30" patternUnits="userSpaceOnUse"><path d="M0 30H30M30 0V30" stroke="currentColor" strokeOpacity=".07" fill="none"/></pattern></defs><rect width="480" height="420" fill="url(#paper-lines)"/><g fill="none" stroke="currentColor" strokeWidth="1"><path d="m45 305 80-111 49 26 67-135 45 73 23-17 119 164M125 194l35 111m14-85 25 85m42-220-13 101 30 33-20 86m48-147 13 66 20 12 13 69m-104-119-55 119m75-86 33 86M65 276l55-18 40 18 40-28 38 18 40-19 54 29 43-15 32 23"/><path d="m41 323 392-1m-379 13 365 2m-346 13 322 3m-293 12 267 1" strokeOpacity=".25"/><path d="m113 208 10-12 8 11m102-105 8-15 9 17"/></g><g fill="#b83f31"><circle cx="278" cy="247" r="4"/><path d="M278 247v-58h37v25h-37" fill="none" stroke="#b83f31"/></g><text x="32" y="40" fill="currentColor" fontFamily="monospace" fontSize="10">PLATE 0{chapter+1} / OBSERVED, THEN IMAGINED</text><text x="325" y="392" fill="currentColor" fontFamily="monospace" fontSize="10">NOT TO SCALE</text></svg><span className="drawing-caption">A study in stillness. Graphite, from memory.</span></div>
      <div className="journal-entry"><div className="journal-entry-meta mono"><span>ENTRY {current.number} / {current.day}</span><span>{current.place}</span></div><blockquote>“{current.quote}”</blockquote><p>{current.note}</p><div className="journal-pagination"><span className="mono">{current.number} <span>/ 03</span></span><div><button disabled={chapter===0} aria-label="Previous journal chapter" onClick={()=>selectChapter((chapter-1) as ChapterIndex)}>←</button><button disabled={chapter===2} aria-label="Next journal chapter" onClick={()=>selectChapter((chapter+1) as ChapterIndex)}>→</button></div></div></div></div>
    </div>
   </section>
   <section id="field-card" className="keepsake-section section-shell" aria-labelledby="keepsake-title"><div className="keepsake-intro"><p className="eyebrow"><span>03 /</span> A SMALL KEEPSAKE</p><h2 id="keepsake-title">Bring a little<br/>of it back.</h2><p>Every journey leaves a trace. Save your expedition as a printable, original SVG field card — a small reminder to keep looking.</p><div className="progress-summary"><span className="mono">YOUR ATLAS</span><span>{progress.visited.length} of 3 chapters discovered</span><div className="progress-track" aria-hidden="true">{chapters.map((item,index)=><i key={item.id} className={progress.visited.includes(index as ChapterIndex)?'complete':''}/>)}</div><small>Chapter progress stays in this browser when local storage is available.</small></div></div><ExpeditionCard chapter={chapter} visited={progress.visited} onReset={reset}/></section>
  </main>
  <footer className="site-footer section-shell"><div className="footer-top"><a className="footer-brand" href="#top">GLACIER<span>↗</span></a><p>For the places we haven’t been.<br/>And the ones that only exist in us.</p></div><div className="footer-bottom"><span>AN ORIGINAL INTERACTIVE ATLAS · 2026</span><p>A work of fiction. Terrain, places and journey are imagined. This atlas provides no real coordinates, navigation, weather or safety guidance.</p><a href="#top">BACK TO THE SUMMIT ↑</a></div></footer>
 </div>;
}
export default App;
