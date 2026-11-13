/* Local-only UI. Game rules live in engine.js and never depend on DOM timing. */
'use strict';
const G=Taash;
const games={thulla:{name:'Bhabhi / Thulla',symbol:'♠',line:'Patte khatam karo. Aakhri khiladi banne se bacho.'},rang:{name:'Double Sar Rang',symbol:'♥',line:'Tum aur Sara. Team ke do sar par uthaan.'}};
let match=null,view='home',selectedGame='thulla',timer=null,lastTable=[],notice='',nextCaller=0;
const levels={easy:{name:'Easy',text:'Aasaan computer: random legal chaal.'},medium:{name:'Medium',text:'Soch kar chaal: suit aur partner ka khayal.'},hard:{name:'Hard',text:'Chalay patton aur missing suits ko yaad rakhne wala computer.'}};
let selectedDifficulty='medium';
const $=id=>document.getElementById(id);
const btn=(text,action,primary=false)=>`<button ${primary?'class="primary"':''} data-action="${action}">${text}</button>`;
function card(c,playable=false,disabled=false){
 const r=G.label(c),s=G.suits[G.suit(c)];
 return `<${playable?'button':'div'} class="playing ${G.suit(c)===1||G.suit(c)===2?'red':''}" ${playable?`data-play="${c}" ${disabled?'disabled':''} aria-label="${r} ${s}${disabled?' abhi nahi chal sakte':''}"`:''}><span>${r}${s}</span><span class="pip">${s}</span><span class="bottom">${r}${s}</span></${playable?'button':'div'}>`;
}
function fan(){return `<div class="fan" aria-label="Taash ke patte">${card(12)}${card(24)}${card(31)}</div>`;}
function header(){return `<div class="topbar"><div class="brand"><span>♠</span>Mehfil</div><nav class="toplinks" aria-label="App navigation">${btn('Baithak','home')}${btn('Rules','rules')}${match?btn('Table','table'):''}</nav></div>`;}
function narrow(title,text,body){return `<div class="content"><div class="narrow"><h1>${title}</h1><p class="muted">${text}</p>${body}</div></div>`;}
function setView(next){
 clearTimeout(timer);timer=null;view=next;notice='';
 if(location.hash!==`#${next}`)location.hash=next;
 render();window.scrollTo(0,0);
}
function startGame(){
 clearTimeout(timer);match=G.create(selectedGame,Math.random,selectedGame==='rang'?nextCaller:0,selectedDifficulty);
 if(selectedGame==='rang')nextCaller=(nextCaller+3)%4;
 lastTable=[];setView('table');
}
function setup(){const g=games[selectedGame];return narrow(g.name,'Tumhare saamne teen computer khiladi.',`
 <fieldset class="difficulty"><legend>Computer ka level</legend><div class="options">${Object.entries(levels).map(([id,level])=>`<button data-level="${id}" aria-pressed="${selectedDifficulty===id}">${level.name}</button>`).join('')}</div><p class="hint">${levels[selectedDifficulty].text}</p><small>Yeh level teenon computer khiladiyon par lagega.</small></fieldset>
 <div class="row"><span>Tum</span><strong>South seat</strong></div>
 <div class="row"><span>Sara</span><span>${selectedGame==='rang'?'Tumhari partner':'Computer'}</span></div>
 <div class="row"><span>Ali aur Hamza</span><span>${selectedGame==='rang'?'Doosri team':'Computer'}</span></div>
 <p class="note">${selectedGame==='rang'?'Pehle 5 patton se rang chuno. Tum ya Sara, dono ki lagataar jeet se pile uthti hai. Har nayi baazi mein rang bolne wala badalta hai.':'A♠ se shuruat. Suit nahi hai to Thulla do. Aakhir mein bachne wala haarta hai.'}</p>
 ${match&&match.phase!=='over'?'<p class="error">Nayi baazi shuru karne se chalti hui baazi khatam hogi.</p>':''}
 <div class="actions">${btn('Baazi shuru karo','start',true)}${btn('Rules dekho','rules')}</div>`);}
function rules(){
 const kind=selectedGame;
 const list=kind==='rang'?[
 '52 patte, har khiladi ko 13. Tum aur Sara ek team; Ali aur Hamza doosri.',
 'Rang bolne wala pehle 5 patte dekh kar trump chunta hai; phir baaqi 8 milte hain. A sab se bara, phir K, Q, J, 10 se 2.',
 'Baari tum se Hamza, Sara, Ali ki taraf chalti hai. Chala hua suit ho to wahi chalo; nahi ho to rang ya koi aur patta.',
 'Sab se bara rang sar jeetta hai. Rang na ho to chalay hue suit ka sab se bara patta jeetta hai; winner agla haath shuru karta hai.',
 'Ek hi team ke do lagataar sar par beech ki poori pile uthti hai. Ek tum jeeto aur doosra Sara, tab bhi uthaan.',
 'Uthaan ke baad streak zero. Doosri team sar jeete to unki streak shuru. Aakhri, 13wan sar baaqi pile uthata hai.',
 '13 haath ke baad 7 ya zyada collected sar wali team jeetti hai. Har baazi alag hai; coat/session scoring abhi nahi.'
 ]:[
 '52 patte, chaar khiladi, har ek ko 13. A sab se bara, 2 sab se chhota. Tum se baari Ali, Sara, Hamza ki taraf chalti hai.',
 'A♠ wala pehla patta chalata hai. Pehle haath mein sab ek patta chalte hain aur woh haath discard hota hai, Thulla nahi lagta.',
 'Chala hua suit ho to wahi suit chalo. Suit na ho to kisi aur suit ka patta Thulla hai.',
 'Thulla par haath foran rukta hai. Chalay hue suit ka sab se bara patta rakhne wala saare chalay patte uthata hai aur agla haath shuru karta hai.',
 'Sab suit follow karein to haath discard hota hai aur sab se bara patta wala agla haath shuru karta hai.',
 'Patte khatam hone par tum safe ho, magar sab se bara aakhri patta ho to power tumhare paas rehti hai: purani discard pile se ek random patta milta hai aur wahi chalna hota hai.',
 'Aakhri bacha hua khiladi haarta hai. Dono ke patte ek saath khatam hon to power wala haarta hai. Do-player endgame mein waste se niklay patte par Thulla aaye to power wala haar jata hai.'
 ];
 return narrow('Khel ke rules',games[kind].name,`<div class="options">${Object.entries(games).map(([id,g])=>`<button data-rules="${id}" aria-pressed="${kind===id}">${g.name}</button>`).join('')}</div><ol class="rule-list">${list.map(t=>`<li>${t}</li>`).join('')}</ol><p class="subtle">Rang mein tumhara team-rule laga hai. Baaqi defaults: <a href="https://www.pagat.com/whist/rang.html" target="_blank" rel="noreferrer">Rang</a> aur <a href="https://www.pagat.com/inflation/getaway.html" target="_blank" rel="noreferrer">Thulla</a>. Khelne ke liye internet nahi chahiye.</p><div class="actions">${match?btn('Apni table par','table',true):btn('Khelne chalo','setup',true)}</div>`);
}
function seat(p,position){const active=match.phase==='play'&&match.turn===p;
 return `<div class="seat ${position} ${active?'current-seat':''}"><span class="avatar">${G.names[p][0]}</span><strong>${G.names[p]}</strong><small>${match.out[p]?'Safe':`${match.hands[p].length} patte`}</small>${match.kind==='rang'&&p===2?'<small>Tumhari partner</small>':''}${active?'<small>Chaal soch rahe hain</small>':''}</div>`;
}
function gameTable(){
 const s=match;if(s.phase==='over')return result();
 if(s.phase==='choose')return narrow(s.caller===0?'Tumhara rang kya hoga?':`${G.names[s.caller]} rang chun rahe hain`,s.caller===0?'Pehle paanch patte dekho. Phir rang chuno.':'Computer apne pehle paanch patton se rang chunta hai.',`
 <div class="hand">${G.sort(s.hands[0]).map(c=>card(c)).join('')}</div>
 ${s.caller===0?`<div class="options trump-options">${G.suits.map((suit,i)=>`<button data-trump="${i}" aria-label="${['Hukam','Paan','Eent','Chiri'][i]} rang chuno">${suit}<small>${['Hukam','Paan','Eent','Chiri'][i]}</small></button>`).join('')}</div>`:'<p class="center" role="status">Bas ek lamha…</p>'}
 <p class="note">Team ke lagataar do sar par jama patte uthayenge.</p>${btn('Menu','pause')}`);
 const legal=G.legal(s,0),isHuman=s.phase==='play'&&s.turn===0;
 const moves=s.trick.length?s.trick:lastTable;
 const turn=s.phase==='resolve'?'Haath poora ho raha hai…':s.out[0]?'Tum safe ho. Baaqi baazi dekho.':isHuman?'Tumhari baari. Patta chalo.':`${G.names[s.turn]} ki baari…`;
 return `<div class="tablehead"><h2>${games[s.kind].name}</h2><span class="score">${s.kind==='rang'?`Tum + Sara <b>${s.score[0]}</b> / Ali + Hamza <b>${s.score[1]}</b>`:`${s.out.filter(Boolean).length} khiladi safe`}</span>${btn('Menu','pause')}</div>
 <div class="live-meta"><span>Level: ${levels[s.difficulty].name}</span>${s.kind==='rang'?`<span>Rang: <b>${G.suits[s.trump]}</b></span><span>Beech mein: ${s.pot.length/4} sar</span><span>Haath ${Math.min(s.rounds+1,13)} / 13</span>`:`<span>Haath ${s.rounds+1}</span><span>Discard: ${s.waste.length} patte</span>`}</div>
 <div class="arena">${seat(2,'north')}${seat(1,'west')}${seat(3,'east')}<div class="felt"><div class="trick live-trick">${moves.length?moves.map(m=>`<div class="played-card"><small>${G.names[m.player]}</small>${card(m.card)}</div>`).join(''):'<span class="table-mark">Mehfil</span>'}</div></div></div>
 <div class="hand-area"><div id="game-status" tabindex="-1" role="status" aria-live="polite"><strong>${turn}</strong><p class="hint">${notice||s.message}</p></div>
 ${s.kind==='rang'?`<div class="sar"><span ${s.streak?'class="won"':''}>${s.streak?`${s.streakTeam===0?'Tumhari team':'Doosri team'}: 1 sar`:'Streak: 0 sar'}</span><span>Uthaan: team ke 2 sar</span></div>`:''}
 <div class="hand live-hand" aria-label="Tumhare patte">${G.sort(s.hands[0]).map(c=>card(c,true,!legal.includes(c))).join('')}</div>
 <span class="subtle">${s.out[0]?'Tumhare patte khatam.':`Tumhare ${s.hands[0].length} patte`}${s.trick.length?` / Chala hua suit: ${G.suits[G.suit(s.trick[0].card)]}`:''}</span>
 ${isHuman?`<div class="actions">${btn('Chaal ka ishara','hint')}</div>`:''}
 <details class="game-log"><summary>Pichhle haathon ka hisaab</summary><ol>${s.log.length?s.log.map(t=>`<li>${t}</li>`).join(''):'<li>Abhi pehla haath hai.</li>'}</ol></details></div>`;
}
function result(){const s=match;const won=s.kind==='rang'?s.winner===0:s.loser!==0;
 return narrow(s.kind==='rang'?(won?'Tumhari team jeet gayi!':'Ali aur Hamza jeet gaye.'):won?'Tum safe ho!':'Is baazi mein tum Bhabhi.',s.kind==='rang'?'Double Sar Rang ka nateeja':'Bhabhi / Thulla ka nateeja',`
 <p class="center subtle">Level: ${levels[s.difficulty].name}</p>
 <div class="big-symbol center">${games[s.kind].symbol}</div>
 ${s.kind==='rang'?`<div class="row"><strong>Tum + Sara</strong><span>${s.score[0]} sar</span></div><div class="row"><strong>Ali + Hamza</strong><span>${s.score[1]} sar</span></div>`:G.names.map((name,p)=>`<div class="row"><strong>${name}</strong><span>${s.loser===p?'Bhabhi / Thulla':'Safe'}</span></div>`).join('')}
 <p class="note">${s.kind==='rang'?'Team ke jama kiye hue sar ka final hisaab.':`${G.names[s.loser]} aakhri khiladi rahe. ${s.hands[s.loser].length?'Unke paas '+s.hands[s.loser].length+' patte bache.':'Aakhri patta bara hone ki wajah se power unke paas thi.'}`}</p>
 <div class="actions">${btn('Dobara khelo','rematch',true)}${btn('Baithak','home')}</div>`);
}
function render(){
 clearTimeout(timer);timer=null;let body;
 if(view==='table'&&!match)view='home';
 switch(view){
 case 'home':body=`<div class="content"><div class="intro"><div><h1>Taash ki apni baithak.</h1><p>Computer ke saath khelo. Internet aur hosting ke baghair.</p>${match?btn(match.phase==='over'?'Pichhla nateeja':'Baazi jaari rakho','table',true):btn('Khel chuno','games',true)}</div>${fan()}</div><div class="section-title"><h2>Aaj kya khelenge?</h2><small>Offline baazi</small></div><div class="games" id="game-list">${Object.entries(games).map(([id,g])=>`<div class="game-choice"><span class="suit">${g.symbol}</span><h3>${g.name}</h3><p>${g.line}</p><button data-game="${id}" aria-label="${g.name} khelo">Khelo</button></div>`).join('')}<div class="game-choice"><span class="suit">♦</span><h3>Number Milao</h3><p>Gameplay baad mein. Abhi design dekho.</p><a class="preview-link" href="design.html#number">Design dekho</a></div></div></div>`;break;
 case 'setup':body=setup();break;
 case 'rules':body=rules();break;
 case 'table':body=gameTable();break;
 case 'pause':body=narrow('Baazi ruki hui hai',match?games[match.kind].name+' / '+levels[match.difficulty].name:'Mehfil',`<div class="stack">${btn('Jaari rakho','table',true)}${btn('Rules dekho','rules')}${btn('Nayi baazi','restart')}${btn('Baithak par jao','home')}</div><p class="note">Yahan aur baithak par bots rukte hain. Tab band ya refresh karne par baazi reset hogi.</p>`);break;
 case 'restart':body=narrow('Nayi baazi shuru karein?','Maujooda baazi ka progress khatam ho jayega.',`<div class="actions">${btn('Nahi, jaari rakho','table',true)}${btn('Haan, nayi baazi','rematch')}</div>`);break;
 default:view='home';return render();
 }
 $('app').innerHTML=`<section class="shell ${view==='table'?'live-shell':''} ${view==='table' && ['play','resolve'].includes(match.phase)?'playing-shell':''}">${view==='table' && ['play','resolve'].includes(match.phase)?'':header()}${body}</section>`;
 schedule();
}
function schedule(){
 if(view!=='table'||!match||match.phase==='over'||document.hidden)return;
 const s=match;
 const auto=s.phase==='resolve'||(s.phase==='play'&&s.turn!==0)||(s.phase==='choose'&&s.caller!==0);
 if(!auto)return;
 timer=setTimeout(()=>{
  if(view!=='table'||match!==s||document.hidden)return;
  try{
   if(s.phase==='resolve'){lastTable=s.trick.map(m=>({...m}));G.resolve(s);}
   else if(s.phase==='choose')G.chooseTrump(s,G.botTrump(s.hands[s.caller],s.difficulty));
   else if(s.phase==='play'&&s.turn!==0){if(!s.trick.length)lastTable=[];G.play(s,s.turn,G.botCard(G.botView(s)));}
   render();
  }catch(error){notice=error.message;renderError();}
 },s.phase==='resolve'?1500:850);
}
function renderError(){clearTimeout(timer);$('app').innerHTML=`<section class="shell">${header()}${narrow('Baazi ruk gayi','Ek unexpected masla aaya. Nayi baazi shuru kar sakte ho.',btn('Nayi baazi','rematch',true))}</section>`;console.error(notice);}
document.addEventListener('click',e=>{
 const target=e.target.closest('button');if(!target||target.disabled)return;
 try{
  if(target.dataset.game){selectedGame=target.dataset.game;setView('setup');}
  else if(target.dataset.level){if(view!=='setup'||!levels[target.dataset.level])return;selectedDifficulty=target.dataset.level;render();}
  else if(target.dataset.rules){selectedGame=target.dataset.rules;setView('rules');}
  else if(target.dataset.trump!==undefined){if(view!=='table'||match?.phase!=='choose'||match.caller!==0)return;G.chooseTrump(match,Number(target.dataset.trump));render();}
  else if(target.dataset.play!==undefined){if(view!=='table'||match?.turn!==0||match.phase!=='play')return;if(!match.trick.length)lastTable=[];G.play(match,0,Number(target.dataset.play));notice='';render();$('game-status')?.focus({preventScroll:true});}
  else switch(target.dataset.action){
   case 'start':startGame();break;
   case 'rematch':if(match){selectedGame=match.kind;selectedDifficulty=match.difficulty;}startGame();break;
   case 'games':$('game-list')?.scrollIntoView({block:'start'});break;
   case 'hint':if(match&&match.phase==='play'&&match.turn===0){const c=G.botCard(G.botView(match));notice=`Ishara: ${G.label(c)}${G.suits[G.suit(c)]} chala sakte ho.`;render();}break;
   case 'rules':if(match&&(view==='table'||view==='pause'))selectedGame=match.kind;setView('rules');break;
   case 'home':case 'setup':case 'table':case 'pause':case 'restart':setView(target.dataset.action);break;
  }
 }catch(error){notice=error.message;renderError();}
});
document.addEventListener('visibilitychange',()=>{clearTimeout(timer);timer=null;if(!document.hidden)schedule();});
window.addEventListener('hashchange',()=>{const next=location.hash.slice(1);if(next!==view)setView(['home','table','setup','pause','rules','restart'].includes(next)?next:'home');});
setView('home');
