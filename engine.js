(function (root) {
  'use strict';
  const suits = ['♠', '♥', '♦', '♣'];
  const names = ['Tum', 'Ali', 'Sara', 'Hamza'];
  const suit = c => Math.floor(c / 13);
  const rank = c => c % 13 + 2;
  const label = c => ({11:'J',12:'Q',13:'K',14:'A'}[rank(c)] || String(rank(c)));
  const team = p => p % 2;
  const sort = cards => [...cards].sort((a,b) => suit(a)-suit(b) || rank(a)-rank(b));

  function create(kind, rng = Math.random, caller = 0, difficulty = 'medium') {
    if (!['rang','thulla'].includes(kind)) throw new Error('Unknown game');
    if (!Number.isInteger(caller) || caller < 0 || caller > 3) throw new Error('Invalid caller');
    if (!['easy','medium','hard'].includes(difficulty)) throw new Error('Invalid difficulty');
    const deck = Array.from({length:52}, (_,i) => i);
    for (let i=51;i>0;i--) {const j=Math.floor(rng()*(i+1));[deck[i],deck[j]]=[deck[j],deck[i]];}
    const s = {kind, difficulty, voids:Array.from({length:4},()=>[false,false,false,false]), hands:[[],[],[],[]], deck, trick:[], waste:[], pot:[], captured:[[],[]],
      score:[0,0], knownDiscard:[], out:[false,false,false,false], phase:kind==='rang'?'choose':'play',
      turn:caller, caller, trump:null, rounds:0, streakTeam:null, streak:0,
      participants:[0,1,2,3], forcedLead:null, loser:null, winner:null, log:[], message:''};
    for (let n=0;n<(kind==='rang'?5:13);n++) for(let p=0;p<4;p++) s.hands[p].push(s.deck.pop());
    if(kind==='thulla') s.turn=s.hands.findIndex(h=>h.includes(12));
    s.message=kind==='rang'?`${names[caller]} pehle 5 patton se rang chunenge.`:'A♠ se pehla haath shuru hoga.';
    return s;
  }
  function chooseTrump(s, value) {
    if(s.phase!=='choose' || !Number.isInteger(value) || value<0 || value>3) throw new Error('Invalid trump');
    s.trump=value;
    while(s.deck.length) for(let p=0;p<4;p++) s.hands[p].push(s.deck.pop());
    s.phase='play';s.message=`${names[s.caller]} ne ${suits[value]} rang chuna.`;
    s.log.push(s.message);
  }
  function legal(s, p=s.turn) {
    if(s.phase!=='play' || p!==s.turn) return [];
    const hand=s.hands[p];
    if(s.kind==='thulla' && s.rounds===0 && s.trick.length===0) return hand.filter(c=>c===12);
    if(!s.trick.length) return [...hand];
    const matches=hand.filter(c=>suit(c)===suit(s.trick[0].card));
    return matches.length?matches:[...hand];
  }
  function winning(trick, trump=null) {
    let best=trick[0];
    for(const move of trick.slice(1)) {
      if((suit(move.card)===suit(best.card) && rank(move.card)>rank(best.card)) ||
        (suit(move.card)===trump && suit(best.card)!==trump)) best=move;
    }
    return best.player;
  }
  function next(s,p) {
    const step=s.kind==='rang'?3:1;
    for(let n=1;n<=4;n++){const q=(p+step*n)%4;if(!s.out[q] && s.hands[q].length) return q;}
    return p;
  }
  function play(s,p,c) {
    if(!Number.isInteger(c) || !legal(s,p).includes(c)) throw new Error('Yeh patta abhi nahi chal sakte.');
    s.hands[p].splice(s.hands[p].indexOf(c),1);
    s.trick.push({player:p,card:c});
    const led=suit(s.trick[0].card);
    if(suit(c)!==led)s.voids[p][led]=true;
    const hit=s.kind==='thulla' && s.rounds>0 && suit(c)!==suit(s.trick[0].card);
    s.message=`${names[p]} ne ${label(c)}${suits[suit(c)]} chala.`;
    if(hit || s.trick.length===s.participants.length) s.phase='resolve';
    else s.turn=next(s,p);
  }
  function resolve(s,rng=Math.random) {
    if(s.phase!=='resolve') throw new Error('Haath abhi poora nahi hua.');
    const win=winning(s.trick,s.kind==='rang'?s.trump:null);
    const cards=s.trick.map(m=>m.card);
    const hit=s.kind==='thulla' && s.rounds>0 && cards.some(c=>suit(c)!==suit(cards[0]));
    s.rounds++;
    if(s.kind==='rang') {
      s.pot.push(...cards);
      const t=team(win);
      s.streak=s.streakTeam===t?s.streak+1:1;s.streakTeam=t;
      if(s.streak===2 || s.rounds===13) {
        const count=s.pot.length/4;
        s.score[t]+=count;s.captured[t].push(...s.pot);s.pot=[];
        s.message=`${names[win]} ne sar jeeta. ${t===0?'Tum + Sara':'Ali + Hamza'} ne ${count} sar uthaye${s.rounds===13?' (aakhri sar)':''}.`;
        s.streak=0;s.streakTeam=null;
      } else s.message=`${names[win]} ne sar jeeta. Isi team ka agla sar pile uthayega.`;
      if(s.rounds===13){s.phase='over';s.winner=s.score[0]>s.score[1]?0:1;}
    } else {
      if(hit){s.hands[win].push(...cards);for(const c of cards)s.voids[win][suit(c)]=false;s.message=`Thulla! ${names[win]} ne ${cards.length} patte uthaye.`;}
      else s.message=`${names[win]} ka bara patta. Haath ke ${cards.length} patte nikal gaye.`;
      // The highest player still has the power, even after playing their last card.
      for(let p=0;p<4;p++) if(p!==win && !s.hands[p].length) s.out[p]=true;
      const remaining=s.out.map((out,p)=>!out?p:-1).filter(p=>p!==-1);
      if(remaining.length===1 || (hit && s.participants.length===2 && s.forcedLead===win)) {
        s.loser=win;s.phase='over';
      } else if(!s.hands[win].length) {
        // Draw from the old waste: cards in this trick are not eligible yet.
        const index=Math.floor(rng()*s.waste.length);
        if(!s.waste.length) throw new Error('Waste pile unavailable');
        s.hands[win].push(s.waste.splice(index,1)[0]);s.forcedLead=win;
        s.knownDiscard=[];
        // A hidden waste draw can restore any suit: forget previous void claims.
        s.voids[win]=[false,false,false,false];
        s.message+=` ${names[win]} ko power ki wajah se waste se ek patta mila.`;
      } else s.forcedLead=null;
      if(!hit){s.waste.push(...cards);s.knownDiscard.push(...cards);}
    }
    s.log.push(s.message);s.log=s.log.slice(-12);
    s.trick=[];s.turn=win;
    s.participants=s.out.map((out,p)=>!out?p:-1).filter(p=>p!==-1);
    if(s.phase!=='over')s.phase='play';
  }
  function botTrump(hand, difficulty='medium', rng=Math.random) {
    if(difficulty==='easy')return suit(hand[Math.floor(rng()*hand.length)]);
    const scores=suits.map((_,i)=>{
      const cards=hand.filter(c=>suit(c)===i);
      return difficulty==='hard'?cards.length*cards.length*10+cards.reduce((n,c)=>n+Math.max(0,rank(c)-10)*3,0):cards.reduce((n,c)=>n+15+rank(c),0);
    });
    return scores.indexOf(Math.max(...scores));
  }
  function botView(s) {
    // Bots only receive their own cards and public table information.
    return {kind:s.kind,difficulty:s.difficulty,turn:s.turn,hand:[...s.hands[s.turn]],legal:legal(s),
      voids:s.voids.map(v=>[...v]),active:s.participants.slice(),
      gone:s.kind==='thulla'?[...s.knownDiscard]:[...s.captured.flat(),...s.pot],
      trick:s.trick.map(m=>({...m})),trump:s.trump,remaining:s.participants.length-s.trick.length};
  }
  function botCard(v,rng=Math.random) {
    const cards=[...v.legal].sort((a,b)=>rank(a)-rank(b));
    if(!cards.length)throw new Error('No legal bot move');
    if(v.difficulty==='easy')return cards[Math.floor(rng()*cards.length)];
    if(v.difficulty==='hard')return hardCard(v,cards);
    if(!v.trick.length){
      const counts=suits.map((_,i)=>v.hand.filter(c=>suit(c)===i).length);
      const longest=counts.indexOf(Math.max(...counts));
      const pool=cards.filter(c=>suit(c)===longest);
      if(v.kind==='rang')return pool[pool.length-1] ?? cards[0];
      return cards[Math.floor(rng()*Math.min(3,cards.length))];
    }
    const current=winning(v.trick,v.kind==='rang'?v.trump:null);
    if(v.kind==='thulla') {
      if(suit(cards[0])!==suit(v.trick[0].card))return cards[cards.length-1];
      const lower=cards.filter(c=>winning([...v.trick,{player:v.turn,card:c}])!==v.turn);
      return lower.length?lower[lower.length-1]:cards[cards.length-1];
    }
    if(team(current)===team(v.turn))return cards[0];
    const winningCards=cards.filter(c=>winning([...v.trick,{player:v.turn,card:c}],v.trump)===v.turn);
    return winningCards[0]??cards[0];
  }
  function hardCard(v,cards) {
    const unavailable=new Set([...v.hand,...v.gone,...v.trick.map(m=>m.card)]);
    const higher=c=>Array.from({length:13},(_,i)=>suit(c)*13+i).filter(x=>rank(x)>rank(c)&&!unavailable.has(x)).length;
    const count=c=>v.hand.filter(x=>suit(x)===suit(c)).length;
    const cheapest=choices=>[...choices].sort((a,b)=>(suit(a)===v.trump?20:0)+rank(a)-(suit(b)===v.trump?20:0)-rank(b))[0];
    if(!v.trick.length){
      if(v.kind==='rang'){
        const opponents=v.active.filter(p=>team(p)!==team(v.turn));
        const score=c=>(higher(c)===0?40:0)+count(c)*3-rank(c)/10-
          (suit(c)!==v.trump?opponents.filter(p=>v.voids[p][suit(c)]&&!v.voids[p][v.trump]).length*30:0);
        return [...cards].sort((a,b)=>score(b)-score(a))[0];
      }
      const others=v.active.filter(p=>p!==v.turn);
      // Lead low where opponents can follow; keep high cards out of unsafe suits.
      const score=c=>higher(c)*3-rank(c)-others.filter(p=>v.voids[p][suit(c)]).length*40-count(c);
      return [...cards].sort((a,b)=>score(b)-score(a))[0];
    }
    const current=winning(v.trick,v.kind==='rang'?v.trump:null);
    if(v.kind==='rang'){
      if(team(current)===team(v.turn))return cheapest(cards);
      const wins=cards.filter(c=>winning([...v.trick,{player:v.turn,card:c}],v.trump)===v.turn);
      return cheapest(wins.length?wins:cards);
    }
    const led=suit(v.trick[0].card);
    if(suit(cards[0])!==led)return [...cards].sort((a,b)=>(rank(b)*2-count(b))-(rank(a)*2-count(a)))[0];
    const lower=cards.filter(c=>winning([...v.trick,{player:v.turn,card:c}])!==v.turn);
    // Last to follow can safely shed a high card, unless that keeps their last-card power.
    if(v.remaining===1 && v.hand.length>1)return cards[cards.length-1];
    if(lower.length)return lower[lower.length-1];
    return cards[0];
  }
  const api={suits,names,suit,rank,label,team,sort,create,chooseTrump,legal,winning,play,resolve,botTrump,botView,botCard};
  if(typeof module!=='undefined' && module.exports)module.exports=api;
  else root.Taash=api;
})(typeof globalThis!=='undefined'?globalThis:this);
