'use strict';
const STORAGE_KEY = 'rivo-prototype-v1';
const isPalettePreview = document.documentElement.dataset.palettePreview === 'true';
const $ = selector => document.querySelector(selector);
const icons = {
 plus:'<path d="M12 5v14M5 12h14"/>', right:'<path d="m9 5 7 7-7 7"/>',back:'<path d="m14 5-7 7 7 7"/>',close:'<path d="m6 6 12 12M6 18 18 6"/>',
 bolt:'<path d="m14 2-9 12h7l-2 8 9-12h-7z"/>', people:'<path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2m14-13a3 3 0 0 1 0 6m3 7v-2a4 4 0 0 0-3-3"/><circle cx="9.5" cy="7" r="4"/>',
 settings:'<path d="m10 3-1 3-3 1-3 3 2 2-1 4 3 1 2 4 3-1 3 1 2-4 3-1-1-4 2-2-3-3-3-1-1-3z"/><circle cx="12" cy="12" r="3"/>',
 lock:'<rect x="5" y="10" width="14" height="11" rx="3"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>', check:'<path d="m5 12 4 4L19 6"/>',
 globe:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c5 5 5 13 0 18-5-5-5-13 0-18z"/>',ticket:'<path d="M3 6h18v4a2 2 0 0 0 0 4v4H3v-4a2 2 0 0 0 0-4zM14 8v2m0 4v2"/>',
 copy:'<rect x="8" y="8" width="12" height="13" rx="2"/><path d="M15 8V3H3v13h5"/>',chat:'<path d="M21 11a8 8 0 0 1-8 8H7l-5 3 2-6a8 8 0 1 1 17-5Z"/><path d="M8 10h8M8 14h5"/>', send:'<path d="m4 4 17 8-17 8 3-8-3-8Zm3 8h14"/>', clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', user:'<circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/>', crown:'<path d="m3 6 5 4 4-7 4 7 5-4-2 12H5zM5 21h14"/>',arrow:'<path d="M4 12h16m-6-6 6 6-6 6"/>'
};
function icon(name){return `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${icons[name]||icons.bolt}</svg>`;}
function escapeHTML(value){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
const frog = (mood='focus',cls='') => `<img class="frog ${cls}" src="assets/frog-${mood}.webp" alt="Grenouille ${mood==='win'?'ravie':mood==='lose'?'piquée au vif':'concentrée'}">`;
const timeText = value => (value/1000).toFixed(1).replace('.',',');
const questions = {
 sequence:[{prompt:'2 · 4 · 8 · 16 · ?',answers:['24','32','30','20'],correct:1,solution:'32. On multiplie chaque nombre par 2.'},{prompt:'3 · 6 · 12 · 24 · ?',answers:['36','42','48','30'],correct:2,solution:'48. On multiplie chaque nombre par 2.'}],
 shapes:[{prompt:'●  ▲  ■  ●  ▲  ?',answers:['●','■','▲','◆'],correct:1,solution:'■. Le motif répète rond, triangle, carré.'},{prompt:'◆  ●  ▲  ◆  ●  ?',answers:['◆','■','●','▲'],correct:3,solution:'▲. Le motif répète losange, rond, triangle.'}],
 quiz:[{prompt:'Quelle planète est la plus proche du Soleil ?',answers:['Vénus','Mercure','Mars','Jupiter'],correct:1,solution:'Mercure est la planète la plus proche du Soleil.'},{prompt:'Quel est le plus grand océan ?',answers:['Atlantique','Indien','Pacifique','Arctique'],correct:2,solution:'Le Pacifique est le plus grand océan.'}]
};
const gameCatalog = {
 suite:{id:'suite',name:'La suite logique',kind:'sequence',category:'Logique',art:['2','4','8','?'],color:'',opponents:[['Hugo',8400],['Emma',10900],['Rafa',12500],['Léa',15700]]},
 motif:{id:'motif',name:'Le bon motif',kind:'shapes',category:'Observation',art:['●','▲','■','?'],color:'pink',opponents:[['Hugo',8400],['Emma',11700],['Rafa',14600],['Léa',18300]]},
 quiz:{id:'quiz',name:'Question flash',kind:'quiz',category:'Culture G',art:['A','B','C','?'],color:'gold',opponents:[['Emma',7200],['Hugo',11400],['Léa',16000],['Rafa',19100]]}
};
function freshState(){return {version:1,haptics:true,leagues:[
 {id:'cerveaux',name:'Les Cerveaux',emblem:'ϟ',color:'',members:6,code:'RIVO24',games:['suite'],attempts:{suite:[]}},
 {id:'promo',name:'La Promo',emblem:'✦',color:'purple',members:12,code:'PROMO8',games:['motif','quiz'],attempts:{motif:[{time:8600,correct:true,finished:true}],quiz:[]}},
 {id:'irreductibles',name:'Les Irréductibles',emblem:'✹',color:'green',members:5,code:'IRRED5',games:['quiz'],attempts:{quiz:[{time:12900,correct:true,finished:true},{time:10300,correct:true,finished:true}]}}
 ]};}
function loadState(){try{const value=JSON.parse(localStorage.getItem(STORAGE_KEY));if(value?.version===1&&Array.isArray(value.leagues)&&value.leagues.every(l=>typeof l.id==='string'&&typeof l.name==='string'&&Array.isArray(l.games)&&l.games.every(g=>gameCatalog[g]&&Array.isArray(l.attempts?.[g]))))return value;}catch{}return freshState();}
let state=isPalettePreview?freshState():loadState();
prepareSocialState();
let route=isPalettePreview&&new URLSearchParams(location.search).get('view')==='league'?{screen:'league',leagueId:'promo',tab:'day'}:{screen:'home'};
let active=null;
let ticker=null;
let toastTimer;
let lastFocus;
let volatileNotice=false;
const dialog=$('#dialog');
function save(){prepareSocialState();if(isPalettePreview)return;try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}catch{if(!volatileNotice){volatileNotice=true;toast('Progression conservée pour cette session.');}}}
function haptic(){if(state.haptics&&navigator.vibrate)navigator.vibrate(12);}
function toast(message){
 clearTimeout(toastTimer);
 if(dialog.open){
  let feedback=dialog.querySelector('.modal-feedback');
  if(!feedback){feedback=document.createElement('p');feedback.className='modal-feedback';feedback.setAttribute('role','status');dialog.append(feedback);}
  feedback.textContent=message;
  toastTimer=setTimeout(()=>feedback.remove(),2500);
  return;
 }
 $('#toast').textContent=message;$('#toast').classList.add('show');toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),2500);
}
function league(id=route.leagueId){return state.leagues.find(item=>item.id===id);}
function attempts(l,g){return l.attempts[g]||[];}
function best(l,g){const values=attempts(l,g).filter(a=>a.correct&&Number.isFinite(a.time)).map(a=>a.time);return values.length?Math.min(...values):null;}
function remaining(l,g){return Math.max(0,2-attempts(l,g).length);}
function status(l){const played=l.games.reduce((sum,g)=>sum+attempts(l,g).length,0);if(l.members<2)return {text:'En attente d’un pote',type:'waiting'};if(!played)return {text:'Défi du jour à jouer',type:'pending'};if(l.games.every(g=>remaining(l,g)===0))return {text:'Terminé aujourd’hui',type:'done'};if(l.games.some(g=>attempts(l,g).length===1))return {text:'1 essai restant',type:'ongoing'};return {text:'Un autre jeu à découvrir',type:'ongoing'};}
function rankData(l,g){const mine=best(l,g);return [...gameCatalog[g].opponents.filter(([name])=>roster(l).some(p=>!p.me&&p.name===name)).map(([name,time])=>({name,time,me:false})),{name:'Toi',time:mine,me:true}].sort((a,b)=>(a.time??Infinity)-(b.time??Infinity)||Number(a.me)-Number(b.me));}
function myRank(l,g){return rankData(l,g).findIndex(item=>item.me)+1;}
function emblem(l){return `<span class="league-emblem ${l.color}">${l.emblem}</span>`;}
function button(label,action,style='primary',data=''){return `<button class="btn ${style}" data-action="${action}" ${data}>${label}</button>`;}
function art(g){return `<div class="game-art ${g.color}" aria-hidden="true">${g.art.map(n=>`<span class="number-tile">${n}</span>`).join('')}</div>`;}
function navigate(next){clearInterval(ticker);ticker=null;active=null;route=next;window.scrollTo({top:0,behavior:'instant'});render();}
function render(){
 const root=['home','profile'].includes(route.screen);
 const inLeague=route.screen==='league';
 const home=route.screen==='home';
 document.querySelector('.phone').classList.toggle('is-home',home);
 document.querySelector('.phone').classList.toggle('chat-open',inLeague&&route.tab==='chat');
 $('#topbar').innerHTML=root?`<button class="brand brand-button" data-action="home" aria-label="Rivo · Mes ligues"><b>ϟ</b>rivo<span class="brand-dot">.</span></button><div class="header-actions"><button class="icon-button" data-action="settings" aria-label="Réglages de la démo">${icon('settings')}</button>${home?'':`<button class="avatar" data-action="profile" aria-label="Mon profil" style="background:${state.profile.color}">${escapeHTML(state.profile.name[0].toUpperCase())}</button>`}</div>`:`<button class="icon-button" data-action="back" aria-label="Retour">${icon('back')}</button><span class="back-title">${inLeague?'Mes ligues':escapeHTML(league()?.name||'Rivo')}</span><button class="icon-button" data-action="invite" aria-label="Inviter un pote">${icon('people')}</button>`;
 $('#footer').hidden=home;
 $('#footer').innerHTML=`<div class="footer-line"><span>Démo locale · données fictives</span><i></i><button data-action="reset">Réinitialiser</button></div>`;
 $('#bottom-nav').innerHTML=(root||inLeague)?`<button class="${route.screen!=='profile'?'selected':''}" data-action="home" ${route.screen!=='profile'?'aria-current="page"':''}>${icon('people')}Mes ligues</button><button class="${route.screen==='profile'?'selected':''}" data-action="profile" ${route.screen==='profile'?'aria-current="page"':''}>${icon('user')}Profil</button>`:'';
 $('#bottom-nav').hidden=!(root||inLeague);
 const screens={home:renderHome,league:renderLeague,instructions:renderInstructions,result:renderResult,ranking:renderRanking,profile:renderProfile};
 $('#app').innerHTML=(screens[route.screen]||renderHome)();
 $('#app').style.animation='none';requestAnimationFrame(()=>$('#app').style.animation='');
}
function renderHome(){
 const promo=league('promo');
 const noticeVisible=promo&&best(promo,'motif')===8600;
 const nextLeague=state.leagues.find(l=>l.members>=2&&l.games.some(g=>remaining(l,g)));
 return `<section class="home-heading"><h1>Mes ligues</h1>${frog(nextLeague?'focus':'win')}</section>
 <div class="home-leagues">${state.leagues.map(l=>{
  const st=status(l);
  return `<article class="home-league ${nextLeague?.id===l.id?'is-next':''} ${st.type}">
   <button class="home-league-main" data-action="league" data-id="${l.id}" aria-label="${escapeHTML(l.name)} · ${st.text}">
    <span class="home-emblem ${l.color}" aria-hidden="true">${l.emblem}</span>
    <span class="home-league-copy"><strong>${escapeHTML(l.name)}</strong><span>${st.text}</span></span>
    <span class="home-league-arrow" aria-hidden="true">${icon('right')}</span>
   </button>
   ${noticeVisible&&l.id==='promo'?`<button class="home-alert" data-action="alert" aria-label="Hugo t’a passé de 0,2 s. Voir le classement de La Promo."><span>Hugo t’a passé de 0,2 s.</span>${icon('arrow')}</button>`:''}
  </article>`;
 }).join('')}</div>
 ${button(icon('plus')+'Ajouter une ligue','add','home-add')}`;
}
function renderLeague(){
 const l=league();const tab=route.tab||'day';const n=unread(l);
 return `<div class="league-heading">${emblem(l)}<div><h1>${escapeHTML(l.name)}</h1><p class="muted">Ligue ${l.public?'publique':'privée'} · ${l.games.length} jeu${l.games.length>1?'x':''} aujourd’hui</p></div></div>
 <div class="league-presence"><button data-action="members" class="members-button" aria-label="Voir ${l.members>1?'les':'le'} ${l.members} membre${l.members>1?'s':''}">${avatarStack(l)}<span>${l.members} joueur${l.members>1?'s':''} ${icon('right')}</span></button><span class="daily-time">${icon('clock')}Fin à minuit</span></div>
 <div class="tabs" role="tablist" aria-label="Dans la ligue">${[['day','Aujourd’hui'],['week','Semaine'],['chat','La bande']].map(([key,label])=>`<button role="tab" aria-selected="${tab===key}" class="${tab===key?'active':''}" data-action="tab" data-tab="${key}">${label}${key==='chat'&&n?'<i class="unread-dot"></i>':''}</button>`).join('')}</div>
 ${tab==='chat'?renderChat(l):l.members<2?`<div class="empty">${frog('focus')}<h2>À deux, ça commence.</h2><p>Invite un pote pour lancer<br>votre premier défi.</p>${button('Inviter un pote','invite')}</div>`:tab==='week'?weekBoard(l):`<div class="daily-heading"><h3>${l.games.length>1?'Deux jeux. Deux occasions.':'Le défi du jour'}</h3><span class="day-pill">2 essais / jeu</span></div>${l.games.map(id=>gameCard(l,id)).join('')}<button class="chat-teaser" data-action="open-chat">${icon('chat')}<span><b>Ça chambre dans la bande.</b><small>${n?`${n} messages à lire`:'Viens défendre ton score.'}</small></span>${icon('right')}</button>`}
 ${tab!=='chat'&&l.members>=2?button(icon('people')+'Inviter un pote','invite','ghost invite'):''}`;
}
function gameCard(l,id){const g=gameCatalog[id],played=attempts(l,id).length,left=remaining(l,id);return `<article class="game-card"><div class="art-wrap">${art(g)}<span class="art-tag">${g.category}</span></div><div class="game-body"><h3>${g.name}</h3><div class="game-meta"><span>30 s max · meilleur temps retenu</span><span class="attempt-dots" aria-label="${left} essai${left>1?'s':''} restant${left>1?'s':''}"><i class="${played>0?'used':''}"></i><i class="${played>1?'used':''}"></i></span></div>${button(!played?'Jouer mon 1er essai':left?'Jouer mon 2e essai':'Voir le classement',left?'instructions':'ranking',left?'primary':'secondary',`data-game="${id}"`)}${!played?`<p class="locked">${icon('lock')}Les scores ? Fais ton 1er essai pour voir.</p>`:`<p class="game-rank">${best(l,id)!==null?`Toi · <b>${timeText(best(l,id))} s</b> · ${myRank(l,id)}${myRank(l,id)===1?'er':'e'} ${left?'· 1 essai restant':'· essais terminés'}`:'Pas de score valide pour le moment.'}</p>${miniPodium(l,id)}`}</div></article>`;}
function weekBoard(l){const base=weekData(l);const me=base.findIndex(p=>p.me)+1;return `<section class="week-hero"><span class="eyebrow">LA COURONNE SE MÉRITE</span>${icon('crown')}<h2>${me===1?'Ta semaine. Pour l’instant.':'La semaine est loin d’être finie.'}</h2><p>Tu es ${me}${me===1?'er':'e'} · couronne décernée dimanche</p></section><div class="board">${base.map((p,i)=>rankRow({...p,time:p.points},i,'points')).join('')}</div><div class="result-note">5 à 1 points pour les cinq meilleurs temps valides de chaque jeu. Les points des jeux joués s’ajoutent au total de démonstration.</div>${button(icon('chat')+'Chambrer la bande','open-chat','secondary')}`;}
function rankRow(row,i,unit='s',reveal=false){return `<div class="rank-row ${row.me?'me':''} ${row.me&&reveal?'reveal-row':''}" ${row.me&&reveal?`style="--rank-distance:${(4-i)*73}px"`:''}><span class="place">${i===0&&row.time!==null?'♛':i+1}</span><span class="mini-avatar" ${row.me?`style="background:${state.profile.color}"`:""}>${row.me?escapeHTML(state.profile.name[0].toUpperCase()):escapeHTML(row.name[0])}</span><span class="rank-name">${escapeHTML(row.name)}${row.me?`<small>${escapeHTML(state.profile.name)}</small>`:''}</span><span class="rank-score">${row.time===null?'—':unit==='points'?row.time:timeText(row.time)} <small>${row.time===null?'sans score':unit==='points'?'pts':'s'}</small></span></div>`;}
function renderInstructions(){const l=league();const g=gameCatalog[route.gameId];const left=remaining(l,g.id);return `<section class="instruction-hero">${art(g)}<span class="eyebrow">${g.category}</span><h1 style="margin-top:8px">${g.name}</h1><p>${g.kind==='quiz'?'Choisis la bonne réponse le plus vite possible.':g.kind==='shapes'?'Repère le motif et touche la forme qui vient ensuite.':'Trouve le nombre qui complète la suite. Vite et juste.'}</p></section><div class="rules"><div class="rule"><strong>30 s</strong><span>pour répondre</span></div><div class="rule"><strong>${3-left}/2</strong><span>essai du jour</span></div></div><div class="result-note">Ton meilleur temps est retenu. Une mauvaise réponse utilise un essai. Le chrono démarre après le décompte.</div>${button('C’est parti ! '+icon('arrow'),'start')}<p class="small muted" style="text-align:center;margin:20px 0">${attempts(l,g.id).length?'Tes potes ont placé la barre. À toi.':'Surprise. Les scores se révèlent après ton essai.'}</p>`;}
function renderRanking(){const l=league(),g=gameCatalog[route.gameId];if(!attempts(l,g.id).length)return `<div class="empty">${icon('lock')}<h2>À toi de jouer d’abord.</h2><p>Les scores se dévoilent après ton premier essai.</p>${button('Jouer','instructions','primary',`data-game="${g.id}"`)}</div>`;return `<div class="section-title"><div><p class="eyebrow">Classement du jour</p><h1 style="font-size:27px;margin-top:7px">${g.name}</h1></div></div><p class="muted small" style="margin-bottom:20px">${rankData(l,g.id).length} résultats · meilleur temps retenu.<br>Chaque dixième compte.</p><div class="board">${rankData(l,g.id).map((p,i)=>rankRow(p,i)).join('')}</div><div class="button-stack">${remaining(l,g.id)?button('Jouer mon 2e essai','instructions','primary',`data-game="${g.id}"`):button('Retour à la ligue','league','primary',`data-id="${l.id}"`)}${button(icon('chat')+'Chambrer la bande','brag','secondary',`data-game="${g.id}"`)}${button('Mes ligues','home','ghost')}</div>`;}
function renderResult(){const l=league(),g=gameCatalog[route.gameId];const last=attempts(l,g.id).at(-1);const rank=myRank(l,g.id);const win=last.correct&&rank===1;const title=!last.correct?'Ça se joue à peu.':win?'La place est à toi.':'Bien joué. Et maintenant ?';const confetti=win?`<div class="confetti" aria-hidden="true">${Array.from({length:16},(_,i)=>`<i style="left:${5+i*6}%;--drift:${i%2?30:-30}px;animation-delay:${i*.04}s"></i>`).join('')}</div>`:'';return `<section class="result-hero">${confetti}${frog(win?'win':'lose')}<h1>${title}</h1>${last.correct?`<p class="performance">${timeText(last.time)}<small>s</small></p>`:'<p>Ce tour-ci, la bonne réponse t’a échappé.</p>'}<p>${win?'Tes potes ont un nouveau temps à battre.':last.correct?'Le classement vient de bouger.':remaining(l,g.id)?'Le prochain essai peut tout changer.':'Demain, nouvelle occasion de prendre la tête.'}</p></section><div class="board result-leader">${rankData(l,g.id).map((p,i)=>rankRow(p,i,'s',true)).join('')}</div><div class="result-note">${escapeHTML(last.solution||'Essai interrompu. Il compte dans tes deux tentatives.')} ${last.correct&&best(l,g.id)<last.time?'Ton meilleur temps précédent est conservé.':''}</div><div class="button-stack">${remaining(l,g.id)?button('Jouer mon 2e essai','instructions','primary',`data-game="${g.id}"`):nextGameButton(l,g.id)}${button('Voir le classement','ranking','secondary',`data-game="${g.id}"`)}${button(icon('chat')+'Envoyer une pique à la bande','brag','ghost',`data-game="${g.id}"`)}${button('Retour à Mes ligues','home','ghost')}</div>`;}
function nextGameButton(l,current){const next=l.games.find(g=>g!==current&&remaining(l,g));return next?button('Jouer à '+gameCatalog[next].name,'instructions','primary',`data-game="${next}"`):button('Retour à la ligue','league','primary',`data-id="${l.id}"`);}
function start(){const l=league(),g=gameCatalog[route.gameId];if(!l||l.members<2||!remaining(l,g.id)){navigate({screen:'league',leagueId:l.id});return;}const index=attempts(l,g.id).length;const q=questions[g.kind][index];l.attempts[g.id].push({correct:false,time:null,finished:false,solution:'Essai interrompu. Il compte dans tes deux tentatives.'});save();active={leagueId:l.id,gameId:g.id,index,q,running:false,started:0};route.screen='playing';$('#footer').innerHTML='';$('#bottom-nav').hidden=true;$('#topbar').innerHTML=`<span class="brand"><b>ϟ</b>rivo<span class="brand-dot">.</span></span><span class="count">Essai ${index+1}/2</span>`;let count=3;const countdown=()=>{$('#app').innerHTML=`<div class="countdown">${frog()}<strong>${count}</strong><p>Prêt à prendre la tête ?</p></div>`;haptic();};countdown();ticker=setInterval(()=>{count--;if(count){countdown();return;}clearInterval(ticker);showPuzzle();},650);}
function showPuzzle(){if(!active)return;active.running=true;active.started=Date.now();const q=active.q;$('#app').innerHTML=`<div class="game-top"><span>${gameCatalog[active.gameId].name}</span><span class="clock" id="clock">30,0 s</span></div><div class="timer-track"><div class="timer-bar" id="timer-bar"></div></div><section class="puzzle"><h1>${gameCatalog[active.gameId].kind==='quiz'?'À toi de répondre.':'La suite, c’est quoi ?'}</h1><div class="prompt ${gameCatalog[active.gameId].kind==='quiz'?'quiz':''}">${q.prompt}</div><div class="answers">${q.answers.map((a,i)=>`<button class="answer ${a.length>3?'word':''}" data-action="answer" data-answer="${i}">${a}</button>`).join('')}</div><p class="game-bottom">Une réponse. Fais-la compter.</p></section>`;ticker=setInterval(()=>{if(!active?.running)return;const left=Math.max(0,30000-(Date.now()-active.started));$('#clock').textContent=timeText(left)+' s';$('#clock').classList.toggle('urgent',left<=5000);$('#timer-bar').style.width=(left/300)+'%';if(!left)finish(null);},100);}
function finish(answer){if(!active?.running)return;active.running=false;clearInterval(ticker);ticker=null;const elapsed=Date.now()-active.started;const correct=elapsed<30000&&answer===active.q.correct;const l=league(active.leagueId);l.attempts[active.gameId][active.index]={correct,time:correct?Math.max(100,Math.round(elapsed/100)*100):null,finished:true,solution:active.q.solution};l.messages.push({id:'score-'+Date.now(),type:'score',name:'Toi',me:true,gameId:active.gameId,time:correct?Math.max(100,Math.round(elapsed/100)*100):null,at:'À l’instant'});save();haptic();navigate({screen:'result',leagueId:active.leagueId,gameId:active.gameId});}
function openModal(title,content){lastFocus=document.activeElement;dialog.innerHTML=`<div class="modal-heading"><h2 id="dialog-title">${title}</h2><button class="close" data-action="close" aria-label="Fermer">${icon('close')}</button></div>${content}`;if(!dialog.open)dialog.showModal();}
function closeModal(){dialog.close();lastFocus?.focus?.();}
function option(title,description,action,symbol,data=''){return `<button class="option" data-action="${action}" ${data}><span class="icon-wrap">${icon(symbol)}</span><span><strong>${title}</strong>${description?`<small>${description}</small>`:''}</span>${icon('right')}</button>`;}
function addModal(){openModal('Une nouvelle rivalité ?',`<p class="modal-copy">Retrouve tes potes ou rencontre tes prochains adversaires.</p>${option('Créer une ligue','À toi de réunir la bande.','create','plus')}${option('Rejoindre avec un code','Tes potes t’ont gardé une place.','join','ticket')}${option('Trouver une ligue publique','Du monde, un défi, et c’est parti.','public','globe')}`);}
function inviteModal(){const l=league();if(!l)return;const invite=`https://rivo.example/ligue/${l.code}`;openModal('Ramène la bande.',`<p class="modal-copy">${escapeHTML(l.name)} · le défi attend tes potes.</p><div class="copy-box"><p class="label">LIEN D’INVITATION</p><div class="copy-line"><span class="copy-value">${invite}</span><button class="copy-button" aria-label="Copier le lien" data-action="copy" data-value="${invite}">${icon('copy')}</button></div></div><div class="copy-box"><p class="label">CODE DE LA LIGUE</p><div class="copy-line"><span class="copy-value code">${l.code}</span><button class="copy-button" aria-label="Copier le code" data-action="copy" data-value="${l.code}">${icon('copy')}</button></div></div><p class="demo-hint">Lien et code fictifs pour tester le parcours.</p>${l.members<2?button('Simuler l’arrivée d’un pote','simulate-friend','secondary',`data-id="${l.id}"`):''}`);}
async function copy(value){try{await navigator.clipboard.writeText(value);toast('Copié ! À toi de partager.');}catch{const field=document.createElement('textarea');field.value=value;field.style.cssText='position:fixed;opacity:0;';dialog.append(field);field.select();let ok=false;try{ok=document.execCommand('copy');}catch{}field.remove();toast(ok?'Copié ! À toi de partager.':'Copie manuelle disponible dans le champ.');if(!ok){openModal('Copier l’invitation',`<input readonly value="${escapeHTML(value)}" aria-label="Texte à copier">`);dialog.querySelector('input').select();}}}
function createModal(){openModal('Crée ta ligue.',`<form class="modal-form" id="create-form"><label class="input-label" for="league-name">Nom de la ligue</label><input id="league-name" name="name" maxlength="24" placeholder="Les rois du canapé" required autocomplete="off"><p class="field-help">Choisis un nom. Ramène un pote. Jouez.</p><p class="field-error" id="form-error" role="alert"></p><button class="btn primary" type="submit">Créer ma ligue</button></form>`);}
function joinModal(){openModal('Entre dans la ligue.',`<form class="modal-form" id="join-form"><label class="input-label" for="league-code">Code d’invitation</label><input id="league-code" name="code" maxlength="8" placeholder="Ex. RIVO42" required autocomplete="off" autocapitalize="characters" style="text-transform:uppercase;letter-spacing:2px"><p class="field-help">Pour essayer la démo, utilise <b>RIVO42</b>.</p><p class="field-error" id="form-error" role="alert"></p><button class="btn primary" type="submit">Rejoindre la ligue</button></form>`);}
function publicModal(){openModal('Trouve tes adversaires.',`<p class="modal-copy">Ces ligues de démonstration t’attendent.</p>${option('Les Lève-tôt','8 joueurs · logique','join-public','globe','data-id="matin"')}${option('Les Quizzeurs','11 joueurs · culture G','join-public','globe','data-id="quizzeurs"')}`);}
function newLeague(id,name,members,game,publicLeague=false){if(state.leagues.some(l=>l.id===id)){closeModal();navigate({screen:'league',leagueId:id});toast('Tu es déjà dans cette ligue.');return;}state.leagues.push({id,name,members,public:publicLeague,emblem:'✦',color:'purple',code:id==='rivo42'?'RIVO42':('RV'+Math.random().toString(36).slice(2,6)).toUpperCase(),games:[game],attempts:{[game]:[]}});save();closeModal();navigate({screen:'league',leagueId:id});toast(members>1?'Bienvenue dans la ligue !':'Ta ligue est prête. Invite un pote.');}
function settings(){openModal('Ta démo Rivo',`<p class="modal-copy">Salut ${escapeHTML(state.profile.name)}. Ta progression est enregistrée sur cet appareil.</p><div class="settings-row"><span>Vibrations</span><button class="switch" role="switch" aria-label="Vibrations" aria-checked="${state.haptics}" data-action="haptics"></button></div><p class="demo-hint">Selon les capacités du téléphone et du navigateur.</p>${button('Réinitialiser la démo','reset','danger','style="margin-top:22px"')}`);}
function resetModal(){openModal('On remet les scores à zéro ?',`<p class="modal-copy">Retrouve les trois ligues et leurs essais de départ pour refaire le parcours.</p>${button('Réinitialiser','confirm-reset','primary')}${button('Garder ma progression','close','ghost','style="color:#516187;margin-top:12px;border-color:#ccd4e4"')}`);}

// Social state is local to this demo. No message leaves this device.
function prepareSocialState(){
 state.profile ||= {name:'Alex',color:'#b5d1ff'};
 for(const l of state.leagues){
  if(!Array.isArray(l.messages))l.messages=l.id==='promo'?[
   {id:'p1',type:'text',name:'Emma',text:'Le deuxième jeu a l’air tranquille… méfiance.',at:'14:04'},
   {id:'p2',type:'score',name:'Hugo',gameId:'motif',time:8400,at:'14:12'},
   {id:'p3',type:'text',name:'Hugo',text:'Le trône est confortable. Je vous le conseille.',at:'14:13'},
   {id:'p4',type:'sticker',name:'Rafa',mood:'lose',at:'14:14'}
  ]:l.id==='cerveaux'?[
   {id:'c1',type:'text',name:'Rafa',text:'30 secondes. Même pas le temps de trouver une excuse.',at:'12:06'},
   {id:'c2',type:'text',name:'Emma',text:'J’attends de voir le score d’Alex 👀',at:'12:08'}
  ]:l.id==='irreductibles'?[
   {id:'i1',type:'text',name:'Emma',text:'On remet ça demain ? La couronne m’appelle.',at:'15:02'}
  ]:[];
  if(!Number.isInteger(l.readCount))l.readCount=0;
 }
}
function unread(l){return Math.max(0,l.messages.length-l.readCount);}
function roster(l){return [{name:state.profile.name,me:true},...['Hugo','Emma','Rafa','Léa','Sacha','Inès','Tom','Lou','Max','Nina','Noé'].slice(0,Math.max(0,l.members-1)).map(name=>({name}))];}
function avatarStack(l){return `<span class="avatar-stack" aria-hidden="true">${roster(l).slice(0,3).map((p,i)=>`<i style="--avatar-color:${p.me?state.profile.color:['#b9d5ff','#ffd08a','#d9b9ff'][i]}">${escapeHTML(p.name[0].toUpperCase())}</i>`).join('')}</span>`;}
function miniPodium(l,g){const rows=rankData(l,g).filter(p=>p.time!==null).slice(0,3);return `<button class="podium" data-action="ranking" data-game="${g}" aria-label="Voir le podium et le classement de ${gameCatalog[g].name}">${rows.map((p,i)=>`<span class="podium-person ${p.me?'is-me':''}"><span class="podium-avatar" ${p.me?`style="background:${state.profile.color}"`:""}>${i===0?'<span class="crown-tiny">♛</span>':''}${p.me?escapeHTML(state.profile.name[0].toUpperCase()):p.name[0]}</span><b>${p.name}</b><small>${timeText(p.time)} s</small></span>`).join('')}<span class="podium-caption">${rows[0].me?'Tu mènes la danse.':`${rows[0].name} mène la danse.`} ${icon('right')}</span></button>`;}
function weekData(l){const base=[{name:'Hugo',points:42},{name:'Emma',points:38},{name:'Toi',points:31,me:true},{name:'Rafa',points:27},{name:'Léa',points:19}].filter(p=>p.me||roster(l).some(r=>!r.me&&r.name===p.name));if(!['cerveaux','promo','irreductibles'].includes(l.id))base.forEach(p=>p.points=0);for(const g of l.games){if(!attempts(l,g).length)continue;rankData(l,g).forEach((p,i)=>{const person=base.find(b=>b.name===p.name);if(person&&p.time!==null)person.points+=5-i;});}return base.sort((a,b)=>b.points-a.points);}
function openChat(){const l=league();l.readCount=l.messages.length;save();route={screen:'league',leagueId:l.id,tab:'chat'};render();scrollChat();}
function scrollChat(){requestAnimationFrame(()=>$('#chat-end')?.scrollIntoView({behavior:'smooth',block:'nearest'}));}
function renderChat(l){return `<div class="chat-head"><h3>Le coin des grandes bouches.</h3><p>Parlez peu. Ou prouvez-le.</p></div><div class="chat-feed" aria-label="Messages de la ligue"><span class="chat-date">AUJOURD’HUI · DÉMO</span>${l.messages.map(m=>messageHTML(l,m)).join('')}${!l.messages.length?'<p class="muted small">Le premier mot est pour toi. Invite ta bande pour la suite.</p>':''}<div id="chat-end"></div></div><div class="chat-compose"><div class="quick-reactions"><button data-action="quick-chat" data-text="J’arrive. Gardez la place au chaud.">J’arrive. 👀</button><button data-action="quick-chat" data-text="Ça pique. On remet ça demain.">Ça pique.</button><button class="sticker-button" data-action="sticker" data-mood="lose" aria-label="Envoyer la grenouille vexée">${frog('lose')}</button><button class="sticker-button" data-action="sticker" data-mood="win" aria-label="Envoyer la grenouille victorieuse">${frog('win')}</button></div><form id="chat-form"><input name="message" aria-label="Ton message à la bande" placeholder="Une petite pique ?" maxlength="240" required autocomplete="off"><button class="send-button" aria-label="Envoyer le message">${icon('send')}</button></form><p>Messages simulés, enregistrés sur cet appareil.</p></div>`;}
function messageHTML(l,m){
 let content='';
 if(m.type==='score'){const visible=attempts(l,m.gameId).length>0;content=`<div class="score-event">${icon(visible?'bolt':'lock')}<span><b>${m.me?'Tu':escapeHTML(m.name)} ${visible?(m.time!==null?`${m.me?'as':'a'} fait ${timeText(m.time)} s`:`${m.me?'as':'a'} tenté sa chance`):`${m.me?'as':'a'} joué`}</b><small>${gameCatalog[m.gameId].name}${!visible?' · score encore caché':''}</small></span></div>`;}
 else if(m.type==='sticker'){content=`<div class="sticker-bubble">${frog(m.mood==='win'?'win':'lose')}<span>${m.mood==='win'?'Le trône est pris.':'0,2 s. Sérieusement ?'}</span></div>`;}
 else content=`<div class="message-bubble">${escapeHTML(m.text)}</div>`;
 return `<article class="message ${m.me?'own':''}"><div class="message-meta"><span>${m.me?escapeHTML(state.profile.name):escapeHTML(m.name)}</span><time>${escapeHTML(m.at)}</time></div>${content}<button class="react ${m.liked?'liked':''}" data-action="react" data-id="${escapeHTML(m.id)}" aria-label="${m.liked?'Retirer la réaction':'Réagir au message'}" aria-pressed="${!!m.liked}">🔥 ${m.liked?'1':'+'}</button></article>`;
}
function sendMessage(text,mood){const l=league();text=text.trim().slice(0,240);if(!text&&!mood)return;l.messages.push({id:'msg-'+Date.now()+'-'+Math.random().toString(36).slice(2,6),type:mood?'sticker':'text',text,mood,name:'Toi',me:true,at:'À l’instant'});l.readCount=l.messages.length;save();route={screen:'league',leagueId:l.id,tab:'chat'};render();scrollChat();}
function brag(g){const l=league(),rank=myRank(l,g),b=best(l,g);const text=b===null?'Le prochain essai est le bon. Retenez bien ça.':rank===1?`${timeText(b)} s sur ${gameCatalog[g].name}. Le trône est pris. Qui vient ?`:`${timeText(b)} s sur ${gameCatalog[g].name}. ${rank}e pour l’instant. Profitez-en.`;openModal('Ta petite pique',`<p class="modal-copy">À envoyer dans ${escapeHTML(l.name)}.</p><form id="brag-form"><label class="input-label" for="brag-message">Ton message</label><textarea id="brag-message" name="message" maxlength="240" required>${escapeHTML(text)}</textarea><button class="btn primary" style="margin-top:18px">Envoyer dans la bande</button></form><p class="demo-hint">Dans cette démo, le message reste sur ton appareil.</p>`);}
function membersModal(){const l=league();openModal('La bande au complet',`<p class="modal-copy">${escapeHTML(l.name)} · ${l.members} joueur${l.members>1?'s':''}</p><div class="members-list">${roster(l).map((p,i)=>`<div><span class="mini-avatar" style="background:${['#b9d5ff','#ffd08a','#d9b9ff','#bff2d9'][i%4]}">${escapeHTML(p.name[0].toUpperCase())}</span><strong>${escapeHTML(p.name)}${p.me?' <small>toi</small>':''}</strong></div>`).join('')}</div>${button(icon('plus')+'Inviter un pote','invite','primary','style="margin-top:20px"')}`);}
function renderProfile(){const played=state.leagues.flatMap(l=>l.games.filter(g=>attempts(l,g).length).map(g=>({l,g})));const wins=played.filter(({l,g})=>best(l,g)!==null&&myRank(l,g)===1).length;const podiums=played.filter(({l,g})=>best(l,g)!==null&&myRank(l,g)<=3).length;return `<section class="profile-hero"><div class="profile-aura">${frog(wins?'win':'focus')}</div><span class="eyebrow">PRÊT À CHAMBRER</span><h1>${escapeHTML(state.profile.name)}<span class="profile-tag">TOI</span></h1><p>Petit temps de jeu. Gros esprit de compétition.</p><button class="edit-profile" data-action="edit-profile">Modifier mon profil ${icon('right')}</button></section><div class="profile-stats"><div><strong>${played.length}</strong><span>jeux joués</span></div><div><strong>${wins}</strong><span>1res places</span></div><div><strong>${podiums}</strong><span>podiums</span></div></div><p class="stats-caption">Tes résultats du jour, dans cette démo.</p><div class="section-title"><h2>Ta course à la couronne</h2></div><div class="season-list">${state.leagues.map(l=>{const board=weekData(l);const rank=board.findIndex(p=>p.me)+1;return `<button data-action="week-league" data-id="${l.id}">${emblem(l)}<span><b>${escapeHTML(l.name)}</b><small>${l.members<2?'En attente d’un pote':`${rank}${rank===1?'er':'e'} cette semaine · ${board.find(p=>p.me).points} points`}</small></span>${icon('right')}</button>`;}).join('')}</div><div class="profile-note">${icon('crown')}<p>La couronne se gagne dimanche.<br>Chaque jeu peut changer la donne.</p></div>`;}
function editProfile(){openModal('Comment on t’appelle ?',`<form id="profile-form"><label class="input-label" for="profile-name">Ton pseudo</label><input id="profile-name" name="name" value="${escapeHTML(state.profile.name)}" maxlength="18" minlength="2" required autocomplete="nickname"><fieldset class="color-options"><legend>Ta couleur</legend>${['#b5d1ff','#ffd08a','#d9b9ff','#bff2d9'].map((color,i)=>`<label style="background:${color}"><input type="radio" name="color" value="${color}" ${state.profile.color===color?'checked':''} aria-label="${['Bleu','Orange','Violet','Menthe'][i]}"><span>${icon('check')}</span></label>`).join('')}</fieldset><p class="field-error" id="profile-error" role="alert"></p><button class="btn primary" type="submit">C’est moi.</button></form>`);}
document.addEventListener('submit',event=>{
 if(!['chat-form','brag-form','profile-form'].includes(event.target.id))return;
 event.preventDefault();const data=new FormData(event.target);
 if(event.target.id==='profile-form'){const name=String(data.get('name')).trim();if(name.length<2){$('#profile-error').textContent='Choisis un pseudo d’au moins 2 caractères.';return;}state.profile={name:name.slice(0,18),color:['#b5d1ff','#ffd08a','#d9b9ff','#bff2d9'].includes(data.get('color'))?data.get('color'):'#b5d1ff'};save();closeModal();render();toast('La bande saura qui accuser.');}
 else {const message=String(data.get('message')).trim();if(!message)return;if(dialog.open)closeModal();sendMessage(message);}
});
document.addEventListener('click',event=>{const target=event.target.closest('[data-action]');if(!target||target.disabled)return;haptic();const action=target.dataset.action;const data=target.dataset;switch(action){
 case'week-league':navigate({screen:'league',leagueId:data.id,tab:'week'});break;
 case'profile':navigate({screen:'profile'});break;
 case'edit-profile':editProfile();break;
 case'members':membersModal();break;
 case'open-chat':openChat();break;
 case'quick-chat':sendMessage(data.text);break;
 case'sticker':sendMessage('',data.mood);break;
 case'brag':brag(data.game);break;
 case'react':{const message=league().messages.find(m=>m.id===data.id);if(message){message.liked=!message.liked;save();render();}break;}
 case'home':navigate({screen:'home'});break;
 case'league':navigate({screen:'league',leagueId:data.id,tab:'day'});break;
 case'tab':if(data.tab==='chat'){openChat();}else{route.tab=data.tab;render();}break;
 case'back':navigate(route.screen==='league'?{screen:'home'}:{screen:'league',leagueId:route.leagueId,tab:'day'});break;
 case'instructions':navigate({screen:'instructions',leagueId:route.leagueId,gameId:data.game});break;
 case'ranking':navigate({screen:'ranking',leagueId:route.leagueId,gameId:data.game});break;
 case'alert':navigate({screen:'ranking',leagueId:'promo',gameId:'motif'});break;
 case'start':start();break;
 case'answer':finish(Number(data.answer));break;
 case'add':addModal();break;
 case'invite':inviteModal();break;
 case'close':closeModal();break;
 case'copy':copy(data.value);break;
 case'create':createModal();break;
 case'join':joinModal();break;
 case'public':publicModal();break;
 case'join-public':newLeague(data.id,data.id==='matin'?'Les Lève-tôt':'Les Quizzeurs',data.id==='matin'?9:12,data.id==='matin'?'suite':'quiz',true);break;
 case'simulate-friend':{const l=league(data.id);l.members=2;l.messages.push({id:'joined-'+Date.now(),type:'text',name:'Hugo',text:'La bande est réunie. On joue ?',at:'À l’instant'});save();closeModal();render();toast('Hugo rejoint ta ligue. À vous de jouer !');break;}
 case'settings':settings();break;
 case'haptics':state.haptics=!state.haptics;save();target.setAttribute('aria-checked',state.haptics);break;
 case'reset':resetModal();break;
 case'confirm-reset':state=freshState();save();closeModal();navigate({screen:'home'});toast('La démo est prête pour un nouveau tour.');break;
 }});
document.addEventListener('submit',event=>{if(!['create-form','join-form'].includes(event.target.id))return;event.preventDefault();const fields=new FormData(event.target);if(event.target.id==='create-form'){const name=String(fields.get('name')).trim();if(name.length<2){$('#form-error').textContent='Choisis un nom d’au moins 2 caractères.';return;}newLeague('local-'+Date.now(),name,1,'suite');}else{const code=String(fields.get('code')).trim().toUpperCase();const known=state.leagues.find(l=>l.code===code);if(known){closeModal();navigate({screen:'league',leagueId:known.id});return;}if(code!=='RIVO42'){$('#form-error').textContent='Code inconnu. Essaie RIVO42 pour la démo.';return;}newLeague('rivo42','Les Rois du canapé',7,'suite');}});
dialog.addEventListener('click',event=>{if(event.target===dialog){const bounds=dialog.getBoundingClientRect();if(event.clientY<bounds.top||event.clientX<bounds.left||event.clientX>bounds.right)closeModal();}});
window.addEventListener('pagehide',()=>save());
render();
