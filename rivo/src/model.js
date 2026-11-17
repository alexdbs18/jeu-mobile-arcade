(() => {
  'use strict';
  const directions = {
    a: {name:'Rebond', tag:'Volumes de jouet', main:'#3046DF', accent:'#FFDA35', ink:'#191743', note:'Fond bleu électrique, cartes blanches en relief et jaune solaire pour les actions principales.', type:'Nunito Black', pair:['aiguillage','double']},
    b: {name:'Chrono', tag:'Tournoi sportif', main:'#C8FA38', accent:'#2636AF', ink:'#14243D', note:'Le temps à battre prend la taille d’un dossard. Les couloirs de piste relient le défi au résultat.', type:'Sprint condensée', pair:['table','trace']},
    c: {name:'Ricochet', tag:'Graphisme pop', main:'#611BD1', accent:'#FF69AB', ink:'#28123B', note:'Un cartouche rose, une bulle de travers et des pois autour de la grenouille donnent au défi une allure d’affiche.', type:'Nunito Black', pair:['photo','miroir']}
  };
  const names = {home:'Accueil',league:'Ligue et amis',records:'Mes records',game:'Aiguillage',result:'Résultat serré'};
  const situations = {ready:'Défi disponible',rival:'Un pote me dépasse',done:'Journée terminée'};
  const perceptions = {normal:'Vision non simulée',protan:'Protanopie',deutan:'Deutéranopie',tritan:'Tritanopie'};
  const games = {aiguillage:'Aiguillage',table:'Plan de table',photo:'Photo Flash',trace:'Trace Fantôme',double:'Double Fond',miroir:'Miroir'};
  const paths = {
    play:'<path d="M6 4.9a1.5 1.5 0 0 1 2.3-1.3l12 7.1a1.5 1.5 0 0 1 0 2.6l-12 7.1A1.5 1.5 0 0 1 6 19.1z"/>',
    rank:'<path d="M2 12h5.5v9H2zM9 4h6v17H9zM16.5 9H22v12h-5.5z"/>',
    user:'<circle cx="12" cy="7" r="4.4"/><path d="M3.7 21c0-5.4 3.7-8.3 8.3-8.3s8.3 2.9 8.3 8.3z"/>',
    chat:'<path fill-rule="evenodd" d="M3 3.5h18a1.7 1.7 0 0 1 1.7 1.7v11a1.7 1.7 0 0 1-1.7 1.7h-9l-5.4 4v-4H3a1.7 1.7 0 0 1-1.7-1.7v-11A1.7 1.7 0 0 1 3 3.5Zm3.4 5.9v2.5h2.4V9.4zm4.5 0v2.5h2.4V9.4zm4.5 0v2.5h2.4V9.4z"/>',
    flag:'<path d="M3 2h2.5v20H3zm4 1c4-2 8 3 14 0v11c-5 3-10-2-14 0z"/>',
    bolt:'<path d="m14.8 0-12 13.4h7.8l-1.5 10.4L22 9.9h-8z"/>',
    star:'<path d="m12 1.2 3.2 6.5 7.1 1-5.2 5.1 1.3 7.1-6.4-3.4-6.4 3.4 1.3-7.1-5.2-5.1 7.1-1z"/>',
    spark:'<path d="M12 0c1.4 8.2 3.8 10.3 12 12-8.2 1.7-10.6 3.8-12 12C10.6 15.8 8.2 13.7 0 12 8.2 10.3 10.6 8.2 12 0z"/>',
    globe:'<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2.5"/><path d="M3 12h18M12 3c2.4 2.6 3.5 6 3.5 9s-1.1 6.4-3.5 9c-2.4-2.6-3.5-6-3.5-9S9.6 5.6 12 3Z" fill="none" stroke="currentColor" stroke-width="2"/>',
    timer:'<path fill-rule="evenodd" d="M9 1h6v2H9zm3 3.5a8.8 8.8 0 1 0 0 17.6 8.8 8.8 0 0 0 0-17.6Zm-1.4 3.6h2.8v4.4l3.3 2.1-1.4 2-4.7-2.9z"/>',
    people:'<circle cx="9" cy="7" r="3.6"/><path d="M1.5 20c.2-5 2.8-7.6 7.5-7.6s7.3 2.6 7.5 7.6zm15-7.3c3.8 0 6 2.6 6 6.8h-4c0-2.9-.7-5.1-2-6.8z"/><circle cx="17.6" cy="7.8" r="2.9"/>',
    triangle:'<path d="m12 2 10 19H2z"/>', circle:'<circle cx="12" cy="12" r="9"/>',square:'<rect x="3" y="3" width="18" height="18" rx="3"/>'
  };
  const lines = {arrow:'m8 5 7 7-7 7',back:'m15 5-7 7 7 7',down:'m5 9 7 7 7-7',plus:'M12 4v16M4 12h16',close:'M5 5l14 14M19 5 5 19',check:'m3.5 12 5.5 5.5L20.5 6',retry:'M3 8a9 9 0 1 1 .5 8M3 3v6h6',settings:'M3 6h11m4 0h3M3 12h3m6 0h9M3 18h11m4 0h3M15 3v6M8 9v6m7 0v6',link:'m9 15 6-6M7.5 9.5 5 12a4 4 0 0 0 6 6l2.5-2.5m-3-7L13 6a4 4 0 0 1 6 6l-2.5 2.5',list:'M4 6h16M4 12h16M4 18h16',send:'m3 3 19 9-19 9 3-9-3-9zm3 9h12',volume:'M4 9h4l5-4v14l-5-4H4zM16 8q4 4 0 8',layers:'m3 8 9-5 9 5-9 5zm0 5 9 5 9-5m-18 5 9 5 9-5',eye:'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zm10-2a2 2 0 1 0 0 4 2 2 0 0 0 0-4',ticket:'M3 5h18v4a3 3 0 0 0 0 6v4H3v-4a3 3 0 0 0 0-6z',medal:'m8 3 4 6 4-6m0 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0z',wave:'m2 13 3-4 4 6 5-8 4 6 4-3'};
  const icon = k => '<svg class="ico" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">'+(paths[k]||'<path d="'+(lines[k]||lines.arrow)+'" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>')+'</svg>';
  const esc = s => String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const storeKey='rivo.atelier.5';
  let saved={};
  try{saved=JSON.parse(localStorage.getItem(storeKey)||'{}')||{}}catch{}
  const save = () => {try{localStorage.setItem(storeKey,JSON.stringify(saved))}catch{}};
  const baseLeagues=[
    {id:'brains',name:'Les Cerveaux',icon:'bolt',count:6,code:'RIVO24',opps:[['Hugo',3,8400],['Emma',3,10000],['Rafa',2,9900]]},
    {id:'promo',name:'La Promo',icon:'star',count:12,code:'PROMO8',opps:[['Hugo',3,8400],['Lina',3,9800],['Sam',2,10400]]},
    {id:'rebels',name:'Les Irréductibles du jeudi soir',icon:'spark',count:5,code:'IRRED5',opps:[['Lina',3,9100],['Emma',3,9400],['Rafa',2,10300]]}];
  const custom=Array.isArray(saved.custom)?saved.custom.filter(item=>item&&typeof item.name==='string'&&typeof item.id==='string'&&typeof item.code==='string').map(l=>({...l,icon:'flag',opps:[],count:1})):[];
  const leagues=[...baseLeagues,...custom];
  const seedRun=(hits,ms)=>({hits,ms,log:[]});
  const clock=ms=>new Intl.NumberFormat('fr-FR',{minimumFractionDigits:1,maximumFractionDigits:1}).format(ms/1000)+' s';
  const gapLabel=ms=>ms>0 && ms<100?Math.round(ms)+' ms':clock(ms);
  const sortScores=(a,b)=>b.hits-a.hits||a.ms-b.ms;
  const best=rows=>rows.filter(Boolean).slice().sort(sortScores)[0];
  const caseRuns=scenario=>Object.fromEntries(leagues.map(l=>[l.id,scenario==='done'?[seedRun(3,8600),seedRun(3,8900)]:l.id==='promo'?[seedRun(3,8600)]:l.id==='rebels'?[seedRun(2,12900),seedRun(3,10300)]:[]]));
  const gamesData={
    aiguillage:{levels:{1:[1248,48320,'3/3 · 8,6 s'],2:[3102,22810,'3/3 · 12,1 s']}},
    photo:{levels:{1:[348,36420,'9/10 · 18,4 s'],2:[1209,19450,'7/10 · 21,6 s'],3:[2846,8930,'5/10 · 24,2 s']}},
    trace:{levels:{1:[672,31800,'12 sauts'],2:[2104,15240,'8 sauts']}},
    miroir:{levels:{1:[2016,42100,'18 réponses'],3:[4018,9250,'9 réponses']}}
  };
  const options={sound:false,vibrate:true,reduced:false,...(saved.options||{})};
  const q=new URLSearchParams(location.search);
  const theme=Object.hasOwn(directions,q.get('da'))?q.get('da'):'a';
  const sc=Object.hasOwn(situations,q.get('situation'))?q.get('situation'):'ready';
  const state={theme,scenario:sc,league:sc==='rival'?'promo':'brains',runs:caseRuns(sc),view:'home',mode:'try',level:1,recordGame:'all',worldGame:'aiguillage',history:[],game:null,result:null,record:false,practice:false,globalBest:null,lastFeedback:'',fail:false,busy:false,perception:'normal',capture:q.has('cadre'),compareView:'home',revision:0};
  const currentLeague=()=>leagues.find(l=>l.id===state.league)||leagues[0];
  const left=(l=currentLeague())=>Math.max(0,2-(state.runs[l.id]||[]).length);
  const leagueScores=(l, own=best(state.runs[l.id]||[]))=>{
    const scores=l.opps.map(([name,hits,ms])=>({name,hits,ms}));
    if(own)scores.push({...own,name:'Toi',you:true});
    scores.sort(sortScores);
    let rank=0;
    return scores.map((r,i)=>{if(i===0||sortScores(scores[i-1],r)!==0)rank=i+1;return {...r,rank}});
  };
  const shapeNames={circle:'Cercle',triangle:'Triangle',square:'Carré'};
  const poseData={focus:'POSE_FOCUS',lose:'POSE_LOSE',win:'POSE_WIN'};
  const frog=(mood,cls='')=>'<img class="frog '+cls+'" src="'+poseData[mood]+'" alt="" draggable="false" width="144" height="142">';
  const stickers={win:'Bien joué !',lose:'Ça pique.',focus:'Revanche ?'};
  window.R={directions,names,situations,perceptions,games,gamesData,icon,esc,saved,save,options,leagues,caseRuns,seedRun,state,currentLeague,left,leagueScores,best,sortScores,clock,gapLabel,shapeNames,frog,stickers,q};
})();
