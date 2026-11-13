const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const elements=new Map();
const element=id=>{if(!elements.has(id))elements.set(id,{innerHTML:'',value:'',addEventListener(){}});return elements.get(id)};
const location={hash:''};
const context=vm.createContext({document:{getElementById:element,addEventListener(){}},window:{location,scrollTo(){},addEventListener(){}},location,console});
vm.runInContext(fs.readFileSync('design.js','utf8'),context);
const ids=vm.runInContext('screens.map(s=>s[0])',context);
assert.equal(ids.length,29);
for(const id of ids){vm.runInContext(`render(${JSON.stringify(id)})`,context);assert.ok(element('app').innerHTML.includes('class="shell"'),id);assert.equal(element('screen-picker').value,id);assert.ok(!element('app').innerHTML.includes('undefined'),id);}
vm.runInContext('overview()',context);
for(const id of ids)assert.ok(element('app').innerHTML.includes(`data-go="${id}"`),id);
console.log('29 screen renders and overview links passed.');

const handlers={},timers=new Map();let timerId=0;
const liveElements=new Map();
const liveElement=id=>{if(!liveElements.has(id))liveElements.set(id,{innerHTML:'',focus(){},scrollIntoView(){}});return liveElements.get(id);};
const liveLocation={hash:''};
const live=vm.createContext({Taash:require('./engine.js'),document:{hidden:false,getElementById:liveElement,addEventListener(name,fn){handlers[name]=fn;}},window:{scrollTo(){},addEventListener(){}},location:liveLocation,console,setTimeout(fn){timers.set(++timerId,fn);return timerId;},clearTimeout(id){timers.delete(id);}});
vm.runInContext(fs.readFileSync('app.js','utf8'),live);
const evaluate=code=>vm.runInContext(code,live);
const click=dataset=>handlers.click({target:{closest(){return {dataset,disabled:false};}}});
for(const difficulty of ['easy','medium','hard'])for(const kind of ['rang','thulla']){
 click({game:kind});assert.ok(liveElement('app').innerHTML.includes('Baazi shuru karo'));
 click({level:difficulty});assert.ok(liveElement('app').innerHTML.includes(`data-level="${difficulty}" aria-pressed="true"`));click({action:'start'});
 assert.equal(evaluate('match.difficulty'),difficulty);
 if(kind==='rang'&&evaluate('match.caller')===0){assert.ok(liveElement('app').innerHTML.includes('data-trump'));click({trump:'1'});}
 click({action:'pause'});assert.equal(timers.size,0);const before=evaluate('JSON.stringify(match)');
 click({action:'rules'});assert.equal(timers.size,0);assert.equal(evaluate('JSON.stringify(match)'),before);click({action:'table'});
 let steps=0;
 while(evaluate('match.phase')!=='over'&&steps++<2000){
  if(timers.size){const [id,fn]=timers.entries().next().value;timers.delete(id);fn();}
  else {assert.equal(evaluate('match.turn'),0);const c=evaluate('G.legal(match)[0]');assert.ok(liveElement('app').innerHTML.includes(`data-play="${c}"`));click({play:String(c)});}
 }
 assert.equal(evaluate('match.phase'),'over');assert.ok(liveElement('app').innerHTML.includes('Dobara khelo'));assert.equal(timers.size,0);
 click({action:'rematch'});assert.notEqual(evaluate('match.phase'),'over');assert.equal(evaluate('match.difficulty'),difficulty);click({action:'home'});assert.equal(timers.size,0);
}
console.log('Both complete UI games at every level, rules/pause/resume, results and level-preserving rematches passed.');
