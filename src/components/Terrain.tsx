import { useId } from 'react';
import type { CSSProperties } from 'react';
import { chapters } from '../lib/chapters';
import type { ChapterIndex, ViewMode } from '../lib/chapters';
import { createTerrain, surveyRing } from '../lib/terrainGeometry';
import './terrain.css';

type TerrainProps = { chapter: ChapterIndex; view: ViewMode; night: boolean; onSelectChapter: (index: ChapterIndex) => void };
const geometry = createTerrain();
const landscapeMarkers = [{x:30.5,y:77},{x:52.5,y:64},{x:68,y:42.5}];
const mapMarkers = [{x:30.5,y:72},{x:52.5,y:54},{x:68,y:34}];
const landscapeRoute = 'M439 585 C480 570 488 528 555 525 S666 567 704 532 S716 480 756 486 S818 473 844 421 S915 396 979 323';
const mapRoute = 'M439 547 C478 554 491 501 539 510 S629 455 665 464 S715 434 756 410 S844 440 864 387 S943 322 979 258';

export default function Terrain({chapter,view,night,onSelectChapter}: TerrainProps) {
  const rawId = useId();
  const id = `terrain-${rawId.replace(/:/g,'')}`;
  const markers = view === 'map' ? mapMarkers : landscapeMarkers;
  return <div className={`terrain terrain--${view}${night ? ' terrain--night' : ''}`} data-testid="terrain" aria-label={`${night ? 'Moonlit' : 'Daylight'} fictional alpine ${view}`}>
    <svg className="terrain__art" viewBox="0 0 1440 760" preserveAspectRatio="none" role="img" aria-labelledby={`${id}-title ${id}-desc`}>
      <title id={`${id}-title`}>The imagined Vesper massif</title>
      <desc id={`${id}-desc`}>{view === 'landscape' ? 'An original faceted snow massif, with a blue glacier and a red line linking three expedition chapters.' : 'Original topographic contours of the fictional massif, with a red route linking three chapter markers.'} This illustration is not a navigational map.</desc>
      <defs>
        <linearGradient id={`${id}-sky`} x2="0" y2="1"><stop stopColor="var(--terrain-sky-top)"/><stop offset="1" stopColor="var(--terrain-sky-bottom)"/></linearGradient>
        <linearGradient id={`${id}-glacier`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="var(--terrain-ice-light)"/><stop offset=".5" stopColor="var(--terrain-ice)"/><stop offset="1" stopColor="var(--terrain-ice-light)"/></linearGradient>
        <linearGradient id={`${id}-fade`} x2="0" y2="1"><stop offset="0" stopColor="var(--terrain-ground)" stopOpacity="0"/><stop offset="1" stopColor="var(--terrain-ground)"/></linearGradient>
        <pattern id={`${id}-grid`} width="80" height="80" patternUnits="userSpaceOnUse"><path d="M80 0H0V80" fill="none" stroke="var(--terrain-grid)" strokeWidth=".6"/></pattern>
        <clipPath id={`${id}-massif`}><path d={geometry.outline}/></clipPath>
      </defs>
      <rect width="1440" height="760" fill={`url(#${id}-sky)`}/>
      <g className="terrain__survey" fill="none" stroke="var(--terrain-line)" strokeWidth=".65">
        {Array.from({length:17},(_,i)=><path key={i} d={surveyRing(i)}/>)}
      </g>
      <g className="terrain__landscape">
        <path d="M-80 505 11 465 70 475 136 421 211 447 301 356 375 393 431 356 512 408 597 370 681 426 761 400 850 443 963 371 1021 407 1135 338 1211 382 1285 370 1386 457 1510 482V760H-80Z" fill="var(--terrain-far)"/>
        <path d="m-90 548 164-71 74 25 67-50 88 43 122-76 114 78 78-36 125 50 107-51 107 54 88-22 125 56 102-83 89 21 86-34 95 82 140 21v205H-90Z" fill="var(--terrain-middle)"/>
        <path d={geometry.outline} fill="var(--terrain-base)"/>
        {geometry.faces.map((path,index)=><path key={index} className={`terrain__face terrain__face--${index}`} d={path} strokeWidth=".4" strokeLinejoin="round"/>)}
        <g clipPath={`url(#${id}-massif)`}>
          <path d="M875 335c-14 45-68 59-94 88-18 21-14 47-41 62-32 19-96 24-99 61-4 43 120 35 135 80 12 37-52 82-41 159H544c-13-81 114-108 103-148-11-36-102-34-101-85 1-62 114-69 146-99 34-31 59-89 107-112Z" fill={`url(#${id}-glacier)`} opacity=".9"/>
          <g fill="none" stroke="var(--terrain-crevasse)" strokeWidth="1.1" opacity=".5">
            <path d="m791 411 33 5m-49 8 28 4m-38 12 31 1m-43 10 27 4m-48 6 28 8m-51 5 28 6m-72 2 49 14m-74-1 40 17m-62-9 30 21m-57-12 28 27m-37-10 28 24m-25-7 42 16m-20-1 51 16m-27-5 52 18m-30-4 55 16m-35-1 49 17m-34-3 45 17m-43-1 37 16m-51-2 35 20m-49-5 32 22m-49-4 35 22m-52-5 39 23"/>
            <path d="M852 358c-55 24-42 70-106 117S563 527 599 572s121 30 114 86-71 90-56 133"/>
          </g>
        </g>
        <path d="M-10 677c163-10 196-46 331-22s213 63 380 31 239-30 399-7 217 35 350-12v113H-10Z" fill={`url(#${id}-fade)`}/>
      </g>
      <g className="terrain__map">
        <rect x="75" y="170" width="1290" height="555" fill={`url(#${id}-grid)`}/>
        <g fill="none" stroke="var(--terrain-contour)" strokeWidth="1.1">
          {geometry.contourPaths.map((d,i)=><path key={i} d={d} opacity={i%4===0?'.8':'.42'} strokeWidth={i%4===0?'1.5':'.8'}/>)}
        </g>
        <path d="M719 298c-11 34-31 65-19 96s-48 50-43 91 59 46 48 95-49 77-44 129" fill="none" stroke="var(--terrain-ice)" strokeWidth="36" opacity=".35"/>
        <g fill="var(--terrain-map-label)" className="terrain__map-label"><text x="479" y="308" transform="rotate(-24 479 308)">VESPER MASSIF</text><text x="870" y="582" transform="rotate(-28 870 582)">THE SILENT FIELDS</text><text x="1035" y="245">3 860</text><text x="275" y="615">2 180</text></g>
        <g fill="none" stroke="var(--terrain-contour)" strokeWidth="1"><path d="M1050 629v-46m-7 7 7-12 7 12m-15 46h16"/><path d="M128 668v8h100v-8m-50 0v8"/></g>
        <g className="terrain__scale" fill="var(--terrain-map-label)"><text x="1045" y="652">N</text><text x="127" y="696">0</text><text x="208" y="696">2 KM*</text></g>
      </g>
      <g className="terrain__route" fill="none" stroke="var(--terrain-route)" strokeWidth="2.2" strokeLinecap="round" strokeDasharray="2 7"><path d={view === 'landscape' ? landscapeRoute : mapRoute}/></g>
      <g className="terrain__crosshairs" stroke="var(--terrain-grid)" strokeWidth=".8"><path d="M58 192h18m-9-9v18m1296-9h18m-9-9v18M58 699h18m-9-9v18m1296-9h18m-9-9v18"/></g>
    </svg>
    <div className="terrain__markers" aria-label="Expedition chapter points">
      {chapters.map((item,index)=><button key={item.id} type="button" className={`terrain__marker${chapter===index?' is-active':''}`} style={{'--marker-x':`${markers[index].x}%`,'--marker-y':`${markers[index].y}%`,'--marker-mobile-x':`${(view === 'map' ? [19.775,53.875,77.9] : [14.9,54.5,82.4])[index]}%`} as CSSProperties} aria-pressed={chapter===index} aria-label={`Chapter ${item.number}: ${item.place}, ${item.altitude.toLocaleString('en-US')} metres`} onClick={()=>onSelectChapter(index as ChapterIndex)}>
        <span className="terrain__dot" aria-hidden="true"><span>{item.number}</span></span>
        <span className="terrain__marker-label"><span>{item.place}</span><small>{item.altitude.toLocaleString('en-US')} M</small></span>
      </button>)}
    </div>
    <div className="terrain__caption"><span>VESPER MASSIF</span><span>ARTIST’S SURVEY / NO REAL COORDINATES</span></div>
  </div>;
}
