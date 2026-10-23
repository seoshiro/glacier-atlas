import {describe,it,expect} from 'vitest';
import {chapterFromSearch,chapterUrl} from '../src/lib/navigation';
describe('chapter history',()=>{
 it('accepts only three exact chapter values',()=>{expect(chapterFromSearch('?chapter=2')).toBe(1);for(const value of ['','?chapter=0','?chapter=4','?chapter=1.5','?chapter=01','?chapter=<script>'])expect(chapterFromSearch(value)).toBeNull();});
 it('preserves base path, unrelated query and anchor',()=>{expect(chapterUrl('https://example.test/glacier-atlas/?test=yes#route',2)).toBe('/glacier-atlas/?test=yes&chapter=3#route');});
});
