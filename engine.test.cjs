const assert=require('node:assert/strict');
const G=require('./engine.js');
const c=(s,r)=>s*13+r-2;
function seed(n){return ()=>((n=(Math.imul(n,1664525)+1013904223)>>>0)/4294967296);}
function conserved(s){
 const all=[...s.deck,...s.hands.flat(),...s.trick.map(m=>m.card),...s.waste,...s.pot,...s.captured.flat()];
 assert.equal(all.length,52);assert.equal(new Set(all).size,52);
 assert.equal(s.score[0]+s.score[1]+s.pot.length/4,s.kind==='rang'?s.rounds:0);
}
let s=G.create('rang',seed(1));assert.deepEqual(s.hands.map(h=>h.length),[5,5,5,5]);
assert.throws(()=>G.chooseTrump(s,4));G.chooseTrump(s,1);assert.deepEqual(s.hands.map(h=>h.length),[13,13,13,13]);conserved(s);
assert.equal(G.winning([{player:0,card:c(0,14)},{player:1,card:c(1,2)}],1),1);
assert.equal(G.winning([{player:0,card:c(0,3)},{player:1,card:c(2,14)}],1),0);
s.hands[0]=[c(0,2),c(1,14)];s.turn=0;s.trick=[{player:3,card:c(0,10)}];
assert.deepEqual(G.legal(s),[c(0,2)]);assert.throws(()=>G.play(s,0,c(1,14)));assert.throws(()=>G.play(s,1,c(0,2)));
// A human win followed by a partner win collects. A third win starts a new pile.
s=G.create('rang',seed(2));G.chooseTrump(s,1);
function trick(winner){s.trick=[0,1,2,3].map(p=>({player:p,card:c(0,p===winner?14:p+2)}));s.phase='resolve';G.resolve(s);}
trick(0);assert.equal(s.pot.length,4);trick(2);assert.deepEqual(s.score,[2,0]);assert.equal(s.streak,0);
trick(0);assert.deepEqual(s.score,[2,0]);trick(1);assert.equal(s.pot.length,8);trick(3);assert.deepEqual(s.score,[2,3]);
s.rounds=12;s.pot=[c(2,2),c(2,3),c(2,4),c(2,5)];trick(0);assert.equal(s.phase,'over');assert.equal(s.pot.length,0);
// First round cannot cause Thulla, but a later off-suit card ends immediately.
s=G.create('thulla',seed(3));s.hands=[[12,c(1,2)],[c(1,3)],[c(0,2)],[c(0,3)]];s.turn=0;
assert.deepEqual(G.legal(s),[12]);G.play(s,0,12);G.play(s,1,c(1,3));assert.equal(s.phase,'play');
G.play(s,2,c(0,2));G.play(s,3,c(0,3));G.resolve(s);assert.equal(s.waste.length,4);
s=G.create('thulla',seed(4));s.rounds=1;s.turn=0;s.hands=[[c(0,3),c(1,4)],[c(0,10),c(2,5)],[c(2,14)],[c(0,11)]];
G.play(s,0,c(0,3));G.play(s,1,c(0,10));G.play(s,2,c(2,14));assert.equal(s.phase,'resolve');
assert.throws(()=>G.play(s,3,c(0,11)));G.resolve(s);assert.equal(s.hands[1].length,4);assert.equal(s.turn,1);assert.equal(s.out[2],true);
// Empty-handed highest player draws from old waste, not the trick just played.
s=G.create('thulla',seed(5));s.rounds=1;s.turn=0;s.hands=[[c(0,14)],[c(0,3),c(2,5)],[],[]];s.out=[false,false,true,true];s.participants=[0,1];s.waste=[c(1,2)];
G.play(s,0,c(0,14));G.play(s,1,c(0,3));G.resolve(s);assert.deepEqual(s.hands[0],[c(1,2)]);assert.equal(s.forcedLead,0);
G.play(s,0,c(1,2));G.play(s,1,c(2,5));G.resolve(s);assert.equal(s.phase,'over');assert.equal(s.loser,0);
// When both last cards follow suit, the higher card still has the power and loses.
s=G.create('thulla',seed(6));s.rounds=2;s.turn=0;s.hands=[[c(0,14)],[c(0,3)],[],[]];s.out=[false,false,true,true];s.participants=[0,1];
G.play(s,0,c(0,14));G.play(s,1,c(0,3));G.resolve(s);assert.equal(s.phase,'over');assert.equal(s.loser,0);
let maxMoves=0;
for(const difficulty of ['easy','medium','hard'])for(const kind of ['rang','thulla'])for(let i=1;i<=200;i++){
 const rng=seed(i);const state=G.create(kind,rng,i%4,difficulty);let moves=0;
 if(state.phase==='choose')G.chooseTrump(state,G.botTrump(state.hands[state.caller],difficulty,rng));
 while(state.phase!=='over' && moves<10000){
  conserved(state);
  if(state.phase==='resolve')G.resolve(state,rng);
  else {const card=G.botCard(G.botView(state),rng);assert.ok(G.legal(state).includes(card));G.play(state,state.turn,card);}
  moves++;
 }
 assert.equal(state.phase,'over',`${kind} seed ${i} did not finish`);conserved(state);maxMoves=Math.max(maxMoves,moves);
 if(kind==='rang')assert.equal(state.score[0]+state.score[1],13);
 else assert.ok(state.loser>=0 && state.loser<=3);
}
assert.throws(()=>G.create('rang',seed(1),0,'impossible'));
// Easy random selection and Hard's safe high-card discard differ from Medium.
const scenario={kind:'thulla',turn:0,hand:[c(0,3),c(0,14),c(1,5)],legal:[c(0,3),c(0,14)],trick:[{player:1,card:c(0,8)}],trump:null,remaining:1,voids:Array.from({length:4},()=>[false,false,false,false]),active:[0,1],gone:[]};
assert.equal(G.botCard({...scenario,difficulty:'easy'},()=>0.99),c(0,14));
assert.equal(G.botCard({...scenario,difficulty:'medium'}),c(0,3));
assert.equal(G.botCard({...scenario,difficulty:'hard'}),c(0,14));
const lead={...scenario,trick:[],remaining:2,hand:[c(0,2),c(1,3)],legal:[c(0,2),c(1,3)],difficulty:'hard'};
lead.voids[1][0]=true;assert.equal(G.botCard(lead),c(1,3));
// Different hidden hands and hidden waste draws must produce the same bot observation.
s=G.create('thulla',seed(19),0,'hard');s.turn=0;
const publicView=G.botView(s);[s.hands[1],s.hands[2]]=[s.hands[2],s.hands[1]];
assert.deepEqual(G.botView(s),publicView);
s.waste=[1,2,3];assert.deepEqual(G.botView(s),publicView);
assert.equal('hands' in publicView,false);
console.log(`Rules, strategy cases, privacy and 1,200 complete games across all levels passed; longest ${maxMoves} steps.`);
