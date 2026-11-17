(() => {
  'use strict';
  const {directions:d,games,gamesData,icon:i,esc,state:s,currentLeague,leagues,left,best,leagueScores,clock,gapLabel,shapeNames,frog,saved,stickers}=R;
  const attr=(name,v)=>v!==undefined?' data-'+name+'="'+esc(v)+'"':'';
  const buttonFace=(label,glyph='')=>'<span class="button-face">'+(glyph?i(glyph):'')+'<span>'+label+'</span></span>';
  const btn=(label,act,cls='outline',glyph='',value,extra='')=>'<button type="button" class="btn '+cls+'" data-do="'+act+'"'+attr('value',value)+' '+extra+'>'+buttonFace(label,glyph)+'</button>';
  const ib=(label,act,glyph,cls='icon-btn',value)=>'<button type="button" class="'+cls+'" data-do="'+act+'"'+attr('value',value)+' aria-label="'+esc(label)+'">'+i(glyph)+'</button>';
  const mark=t=>'<span class="wordmark logo-'+t+'" aria-label="Rivo">'+window.brandSymbol(t)+'<b>rivo</b><em aria-hidden="true">.</em></span>';
  const eyebrow=(ico,txt)=>'<span class="kicker">'+(ico?i(ico):'')+txt+'</span>';
  const title=(k,label)=>'<div class="section-title">'+(k?eyebrow('',k):'')+'<h1 tabindex="-1">'+label+'</h1></div>';
  const art=(game,t,mode)=>window.mechanicArt(game,t,mode);
  const gameArt=(game,theme,mode)=>theme==='a'?R.rebond.toyArt(game):art(game,theme,mode);
  const leadName=l=>l.opps[0]?.[0]||'';
  function topbar(t,view,l) {
    const major=['home','records','profile'].includes(view);
    return '<header class="topbar">'+(major?mark(t):ib('Retour','back','back'))+(major?'<button type="button" class="avatar-me" data-do="profile" aria-label="Ouvrir mon profil">'+esc((saved.name||'Alex').slice(0,1).toUpperCase())+'</button>':'<span class="context-name">'+esc(l.name)+'</span><span class="context-emblem">'+i(l.icon)+'</span>')+'</header>';
  }
  function nav(view) {
    return '<nav class="bottom" aria-label="Navigation principale">'+[['home','play','Jouer'],['records','rank','Classement'],['profile','user','Profil']].map(([k,g,label])=>'<button type="button" data-do="'+k+'"'+((k==='home'&&!['records','world','profile'].includes(view))||(k==='records'&&['records','world'].includes(view))||k===view?' aria-current="page"':'')+'><span>'+i(g)+'</span>'+label+'</button>').join('')+'</nav>';
  }
  function tabs(l) {
    const ordered=s.scenario==='rival'?[leagues.find(x=>x.id==='promo'),...leagues.filter(x=>x.id!=='promo')]:leagues;
    return '<div class="heading-line"><h1 tabindex="-1">Mes ligues</h1>'+ib('Gérer mes ligues','manage','plus')+'</div><div class="league-tabs" role="group" aria-label="Choisir une ligue">'+ordered.map(x=>'<button class="league-tab" type="button" data-do="switch" data-value="'+esc(x.id)+'" aria-pressed="'+(x.id===l.id)+'">'+i(x.icon)+'<span>'+esc(x.name)+'</span></button>').join('')+'</div>';
  }
  function socialRow(act,gl,title,sub) {
    return '<button class="link-row" type="button" data-do="'+act+'"><span class="tile-icon">'+i(gl)+'</span><span class="row-copy"><strong>'+title+'</strong><small>'+sub+'</small></span>'+i('arrow')+'</button>';
  }
  function home(t,l) {
    if(t==='a') return R.rebond.home(l);
    const n=left(l), runs=s.runs[l.id]||[], own=best(runs), lead=l.opps[0], gap=lead&&own&&own.hits===lead[1]?own.ms-lead[2]:null;
    const rival=s.scenario==='rival'&&l.id==='promo'&&n>0&&gap>0;
    const improved=runs.length>1&&runs.at(-1)&&best(runs.slice(0,-1))&&R.sortScores(runs.at(-1),best(runs.slice(0,-1)))<0;
    const mood=n===0&&improved?'win':rival?'lose':'focus';
    const allDone=leagues.every(group=>left(group)===0);
    const stateLabel=n===0?(allDone?'Journée terminée':'Défi terminé'):rival?'Revanche disponible':'Défi du jour';
    const time=lead?clock(lead[2]):'—';
    const status=n===0?'Essais terminés':n+' essai'+(n>1?'s':'')+' restant'+(n>1?'s':'');
    const line=rival?esc(lead[0])+' t’a passé de '+gapLabel(gap)+'. Ça pique.':n===0?(improved?'Record battu. Tu peux faire le malin.':'Tous les scores sont dans la ligue.'):'Trois wagons à diriger.';
    const action=n===0?'Voir le classement':rival?'Prendre ma revanche':'Jouer';
    const tag='<div class="hero-meta"><span class="hero-tag">'+i(n===0?'check':rival?'retry':'flag')+stateLabel+'</span><span class="level-tag">NIV. 1</span></div>';
    const gameLabel='<h2>Aiguillage</h2>';
    const target='<div class="target"><small>'+(!lead?'Premier score':n===0&&own?'Ton temps':'À battre')+'</small><strong class="digits">'+(n===0&&own?clock(own.ms):time)+'</strong></div>';
    return tabs(l)+'<article class="challenge '+(n===0?'settled':'')+'">'+tag+'<div class="hero-body"><div class="hero-type">'+gameLabel+target+'</div><div class="hero-art" aria-hidden="true">'+window.heroBackdrop(t)+frog(mood,'hero-frog')+'</div></div><p class="hero-line">'+line+'</p><div class="hero-bottom">'+btn(action,n===0?'league':'play','primary wide',n===0?'rank':'play')+'<div class="hero-foot">'+i(n===0?'check':'ticket')+status+'</div></div></article>'+
    '<div class="heading-line subsection"><h2>Dans la ligue</h2><span class="member-count">'+i('people')+l.count+'</span></div><div class="community">'+socialRow('league','rank','Résultats des amis',lead?esc(lead[0])+' mène en '+clock(lead[2]):'Le premier score t’attend')+socialRow('chat','chat','Chat de ligue',esc(l.name))+'</div>'+
    '<div class="quiet-actions">'+btn('Créer une ligue','create','text','plus')+btn('Inviter','invite','text','link')+'</div>';
  }
  function scoreList(l,own,animate=false) {
    const list=leagueScores(l,own);
    if(!list.length)return '<p class="empty">Le classement s’ouvre avec le premier score de la ligue.</p>';
    return '<ol class="score-list '+(animate?'rank-intro':'')+'">'+list.map(r=>'<li class="'+(r.you?'you':'')+'"><span class="place">'+r.rank+'</span><span class="player"><strong>'+esc(r.name)+'</strong><small>'+r.hits+'/3 quais</small></span><b class="digits">'+clock(r.ms)+'</b></li>').join('')+'</ol>';
  }
  function league(t,l) {
    const own=best(s.runs[l.id]||[]);
    const available=left(l)>0;
    const earlyAction=t==='a'&&available;
    const playButton=available?btn(own?'Jouer un essai':'Jouer','play','primary wide','play'):
      btn('S’entraîner','practice','outline wide','retry');
    const members=l.count+' membre'+(l.count>1?'s':'');
    return `
      ${title('Ligue entre amis',esc(l.name))}
      <section class="league-banner">
        <div>${eyebrow('flag','Défi du jour')}<h2>Aiguillage</h2><p>${members} · Niveau 1</p></div>
        <div class="banner-art">${gameArt('aiguillage',t)}</div>
      </section>
      ${earlyAction?'<div class="league-action">'+playButton+'</div>':''}
      <div class="duo">${btn('Ouvrir le chat','chat',t==='a'?'outline':'primary','chat')}${btn('Inviter','invite','outline','link')}</div>
      <div class="heading-line subsection"><h2>Résultats du jour</h2>${i('rank')}</div>
      ${scoreList(l,own)}
      ${own?'':'<p class="empty"><b>Toi</b> · Ton premier score t’attend.</p>'}
      ${earlyAction?'':playButton}`;
  }
  const tabsLevel=()=>'<div class="levels" role="group" aria-label="Niveau">'+[1,2,3].map(k=>'<button type="button" data-do="level" data-value="'+k+'" aria-pressed="'+(k===s.level)+'">Niveau '+k+'</button>').join('')+'</div>';
  const num=n=>new Intl.NumberFormat('fr-FR').format(n);
  function records(t) {
    const list=Object.keys(gamesData).filter(game=>s.recordGame==='all'||s.recordGame===game);
    const cards = list.map(game=>{
      const record=gamesData[game].levels[s.level];
      const local=game==='aiguillage' && s.level===1 && s.globalBest;
      const score=local?s.globalBest.hits+'/3 · '+clock(s.globalBest.ms):record?.[2];
      const thumb=gameArt(game,t,'hero');
      const content=`<span class="record-thumb">${thumb}</span><span class="record-copy">
        <strong>${games[game]}</strong>${record?'<span class="record-metric"><small>Record</small><b class="digits">'+score+'</b></span>':'<small>Niveau à jouer</small>'}</span>`+
        (record?`<span class="record-ranking"><b class="digits">Nº ${num(record[0])}</b><small>${local?'Dernier rang':'Mondial'}</small></span>`:'');
      return `<article class="record-card ${record?'':'unplayed'}">${record?
        '<button type="button" class="record-open" data-do="world" data-value="'+game+'">'+content+'</button>':
        '<div class="record-open">'+content+'</div>'}</article>`;
    }).join('');
    return '<div class="section-title records-title"><h1 tabindex="-1">Classement</h1></div>'+
      tabsLevel()+'<div class="record-toolbar"><span>'+i('globe')+'Jeux déjà joués</span>'+
      '<label class="select-game"><span class="sr">Filtrer par mini-jeu</span><select data-input="record-game">'+
      '<option value="all">Tous les jeux</option>'+Object.keys(gamesData).map(game=>'<option value="'+game+'" '+(s.recordGame===game?'selected':'')+'>'+games[game]+'</option>').join('')+
      '</select></label></div><div class="records">'+cards+'</div><p class="footnote">Classements mondiaux simulés pour le prototype.</p>';
  }
  function world(t) {
    const key=s.worldGame, r=gamesData[key]?.levels[s.level];
    if(!r)return records(t);
    const nearby=(delta)=>{
      const parts=r[2].match(/^(.* · )([\d,]+) s$/);
      if(parts)return parts[1]+clock((parseFloat(parts[2].replace(',','.'))+delta*.1)*1000);
      return r[2].replace(/^\d+/,n=>String(+n-delta));
    };
    const fresh=key==='aiguillage'&&s.level===1&&s.globalBest;
    return title('Classement mondial',games[key])+'<div class="league-banner world-banner"><div>'+eyebrow('globe','Niveau '+s.level)+'<h2>Nº '+num(r[0])+'</h2><p>sur '+num(r[1])+' joueurs</p></div><div class="banner-art">'+gameArt(key,t)+'</div></div><div class="heading-line subsection"><h2>Autour de toi</h2></div><ol class="score-list">'+[-1,0,1].map((z,j)=>'<li class="'+(z===0?'you':'')+'"><span class="worldplace digits">'+num(r[0]+z)+'</span><strong>'+['Nina','Toi','Eden'][j]+'</strong><b>'+nearby(z)+'</b></li>').join('')+'</ol>'+(fresh?'<p class="empty">Ton nouveau record local attend son rang mondial.</p>':'')+'<p class="footnote">Classement simulé · '+games[key]+' · Niveau '+s.level+'</p>'+btn('Mes records','records','outline wide','back');
  }
  const paths={circle:'M150 10v16q0 18-19 27L65 85q-18 9-18 27v11',triangle:'M150 10v113',square:'M150 10v16q0 18 19 27l66 32q18 9 18 27v11'};
  function tracks(choice) {
    const end={circle:47,triangle:150,square:253};
    const still=R.options.reduced||matchMedia('(prefers-reduced-motion: reduce)').matches;
    const vehicle=choice?'<g class="moving-wagon" '+(still?'transform="translate('+end[choice]+' 123)"':'')+'>'+(still?'':'<animateMotion dur="0.26s" path="'+paths[choice]+'" fill="freeze"/>')+'<rect x="-11" y="-8" width="22" height="14" rx="4" fill="var(--accent)" stroke="var(--ink)" stroke-width="2"/><circle cx="-6" cy="7" r="3" fill="var(--ink)"/><circle cx="6" cy="7" r="3" fill="var(--ink)"/><rect x="-5" y="-5" width="10" height="3" rx="1.5" fill="white"/></g>':'';
    return '<svg class="tracks" viewBox="0 0 300 135" aria-hidden="true">'+Object.values(paths).map(p=>'<path class="bed" d="'+p+'"/>').join('')+Object.values(paths).map(p=>'<path class="line" d="'+p+'"/>').join('')+Object.values(paths).map(p=>'<path class="ties" d="'+p+'"/>').join('')+(choice?'<path class="chosen" d="'+paths[choice]+'"/>':'')+vehicle+'</svg>';
  }
  const sampleGame=()=>({seq:['triangle','circle','square'],step:1,log:[{expected:'triangle',choice:'triangle',ms:2700}],total:2700,locked:false,started:0,practice:true,demo:true,last:'Wagon 1 · Bon quai',lastOk:true});
  const sampleResult=()=>({hits:3,ms:8600,log:[{expected:'triangle',choice:'triangle',ms:2100},{expected:'circle',choice:'circle',ms:3900},{expected:'square',choice:'square',ms:2600}],practice:false,sample:true});
  const hits=g=>g.log.filter(x=>x.choice===x.expected).length;
  function gameView(t,l,g=s.game||sampleGame()) {
    if(t==='a') return R.rebond.game(g);
    const symbol=g.seq[g.step], last=g.locked?g.log.at(-1):null;
    return title('Défi du jour','Aiguillage')+'<p class="intro-rule">Envoie le wagon au quai de même forme.</p><div class="game-meta"><span>'+i('flag')+'Wagon '+(g.step+1)+' / 3</span><b class="digits" data-clock>'+clock(g.total)+'</b></div><div class="progress" aria-label="'+g.step+' wagons terminés sur 3">'+[0,1,2].map(k=>'<b class="'+(k<g.step?'counted':k===g.step?'current':'')+'"></b>').join('')+'</div><div class="track-board"><div class="wagon"><span>'+i(symbol)+'</span><strong>Wagon '+shapeNames[symbol].toLowerCase()+'</strong><b aria-hidden="true"></b></div>'+tracks(last?.choice)+'<div class="platforms" aria-hidden="true">'+Object.keys(shapeNames).map(k=>'<span class="'+(last?.choice===k?'lit':'')+'">'+i(last?.choice===k?(g.lastOk?'check':'close'):k)+'</span>').join('')+'</div></div><div class="choices" role="group" aria-label="Choisir un quai">'+Object.entries(shapeNames).map(([k,name])=>'<button type="button" data-do="answer" data-value="'+k+'" '+(g.locked?'aria-disabled="true"':'')+' class="choice '+(last?.choice===k?'chosen':'')+'">'+i(k)+'<span>'+name+'</span></button>').join('')+'</div><div class="game-feedback">'+i(g.last?g.lastOk?'check':'close':'flag')+'<span>'+esc(g.last||'Choisis un quai.')+'</span></div><div class="game-total"><span>'+hits(g)+'/3 bons quais</span><span>'+(g.practice&&!g.demo?'Entraînement':'Essai classé')+'</span></div>';
  }
  function situationResult(t,l,r=s.result||sampleResult()) {
    const rival=l.opps[0];
    const rivalName=esc(leadName(l));
    const ranked=!r.practice;
    const delta=rival&&r.hits===rival[1]?r.ms-rival[2]:null;
    const behind=ranked&&delta!==null&&delta>0;
    const close=behind&&delta<=1000;
    const record=ranked&&s.record&&!r.sample;
    const place=leagueScores(l,r).find(row=>row.you)?.rank||1;
    const first=ranked&&place===1;
    const remaining=left(l);
    const titleText=behind?'À '+gapLabel(delta):r.practice?'Bien joué !':first?'En tête !':record?'Record battu !':'Partie terminée';
    const description=behind?'derrière '+rivalName:r.practice?'Entraînement terminé':r.hits+' bons quais sur 3';
    const action=r.practice?'practice':remaining?'play':'league';
    const label=r.practice?'Rejouer en entraînement':remaining?(first?'Améliorer mon chrono':'Prendre ma revanche'):'Voir le classement';
    const quote=close?'Ça pique.':first?'À eux de te rattraper.':record?'Tu peux faire le malin.':r.practice?'Encore un tour ?':'Je sens venir la revanche.';
    const pose=close?'lose':first||record?'win':ranked?'lose':'focus';
    const bestInLeague=best([...(s.runs[l.id]||[]),r]);
    const showReview=r.practice||remaining===0;
    const firstWrong=r.log.findIndex(item=>item.choice!==item.expected);
    const slowest=r.log.reduce((max,item,j,list)=>max<0||item.ms>list[max].ms?j:max,-1);
    const tip=firstWrong>=0?'Premier écart au wagon '+(firstWrong+1)+'.':
      slowest>=0?'Le wagon '+(slowest+1)+' t’a pris le plus de temps.':'Le nombre de bons quais départage les scores, puis le chrono.';
    const cardBadge=r.practice?'Entraînement':record?'Record personnel':place===1?'1ʳᵉ place':place+'ᵉ place';
    const crest=t==='a'?'<span class="reaction-perch"></span>':window.heroBackdrop(t);
    return `
      ${title('Aiguillage · Niveau 1','Ton résultat')}
      <section class="finish">
        <div class="finish-type">
          ${eyebrow(record||first?'medal':'flag',cardBadge)}
          <h2>${titleText}</h2><strong>${description}</strong><p>« ${quote} »</p>
        </div>
        <div class="finish-art" aria-hidden="true">${crest}${frog(pose,'finish-frog'+(record?' record-frog':''))}</div>
      </section>
      <div class="score-pair"><div><small>Ton chrono</small><strong class="digits">${clock(r.ms)}</strong></div>
      <div><small>Quais corrects</small><strong class="digits">${r.hits}/3</strong></div></div>
      ${btn(label,action,'primary wide result-action',action==='league'?'rank':'retry')}
      ${ranked&&remaining?'<p class="result-remaining">'+remaining+(remaining===1?' essai classé restant':' essais classés restants')+'</p>':''}
      ${ranked?'<div class="heading-line subsection"><h2>Dans la ligue</h2>'+i('rank')+'</div>'+scoreList(l,bestInLeague,true):''}
      <div class="result-links">${btn('Ouvrir le chat','chat','outline wide','chat')}</div>
      <div class="review"><b>Pour progresser</b><p>${showReview?tip:'À nombre de bons quais égal, le chrono départage.'}</p>${
        showReview&&r.log.length?'<details><summary>Revoir les wagons</summary>'+r.log.map((item,j)=>'<p>'+i(item.expected===item.choice?'check':'close')+'Wagon '+(j+1)+' · '+shapeNames[item.choice]+' · '+clock(item.ms)+'</p>').join('')+'</details>':''
      }</div>`;
  }
  function rules(t,l){
    const shapes=t==='a'?'<div class="rule-shapes" aria-hidden="true">'+Object.keys(shapeNames).map(shape=>'<span>'+i(shape)+'</span>').join('')+'</div>':'';
    return `
      ${title(s.practice?'Entraînement':'Défi de '+esc(l.name),'Aiguillage')}
      <section class="rule-sheet">
        <div class="rule-illustration">${gameArt('aiguillage',t)}${shapes}</div>
        <h2>Un wagon, un symbole.</h2>
        <p class="intro-rule">Touche le quai qui porte la même forme que le wagon.</p>
      </section>
      <div class="review"><b>Trois wagons à diriger</b><p>Le nombre de bons quais compte en premier. À égalité, le temps de décision départage.</p></div>
      ${btn('Démarrer','start','primary wide','play')}
      <p class="footnote">${s.practice?'Essai libre · Hors classement':'Essai classé '+(3-left(l))+' sur 2'}</p>`;
  }
  function chat(t,l) {
    const messages=Array.isArray(saved.chats?.[l.id])?saved.chats[l.id]:[];
    const intro=l.opps.length?'<div class="chat-bubble"><b>'+esc(leadName(l))+'</b><p>Qui vient chercher mon chrono ?</p></div>':'';
    const history=messages.map(message=>`<div class="chat-bubble mine">
      <b>Toi</b>${Object.hasOwn(stickers,message.sticker)?
        frog(message.sticker,'chat-frog')+'<p>'+stickers[message.sticker]+'</p>':'<p>'+esc(message.text)+'</p>'}
    </div>`).join('');
    return `
      ${title('Chat de ligue',esc(l.name))}
      <div class="chat-stream" aria-live="polite">${intro+history||'<p class="empty">Lance la conversation.</p>'}</div>
      <div class="chat-actions">
        ${btn('Stickers','stickers','outline','spark')}
        <form data-form="chat">
          <label class="sr" for="chat-message">Message à la ligue</label>
          <input id="chat-message" required maxlength="240" placeholder="Ton message…" autocomplete="off">
          <button type="submit" class="icon-btn send" aria-label="Envoyer le message">${i('send')}</button>
        </form>
      </div>
      <p class="footnote">Messages de démo conservés sur cet appareil.</p>`;
  }
  function profile(t){
    return `
      ${title('Profil','Mon vestiaire')}
      <section class="profile-hero">
        <div class="profile-art">${frog(saved.pose||'focus')}</div>
        <div class="profile-copy"><b>${esc(saved.name||'Alex')}</b><small>${leagues.length} ligues</small></div>
      </section>
      ${btn('Personnaliser','identity','outline wide','user')}
      <div class="heading-line subsection"><h2>Préférences</h2></div>
      ${socialRow('settings','settings','Son et mouvements','Silence, vibrations et mouvement réduit')}`;
  }
  function styleBoard(t){
    const a=d[t];
    const sw=[[a.main,'Surface'],[a.accent,'Action'],[a.ink,'Encre'],['#FFFFFF','Respiration']];
    return '<div class="style-head">'+mark(t)+'<div>'+eyebrow('','Direction '+t.toUpperCase())+'<h1>'+a.name+'</h1></div></div><div class="style-body"><h2>Palette</h2><div class="swatches">'+sw.map(([c,n])=>'<div><b style="background:'+c+'"></b><small>'+n+'</small><code>'+c+'</code></div>').join('')+'</div><h2>Commandes</h2><div class="spec-buttons">'+btn('Jouer','noop','primary','play')+btn('Choisi','noop','outline selected','check')+btn('Chargement','noop','outline','timer',undefined,'aria-busy="true"')+btn('Indisponible','noop','outline','',undefined,'disabled')+'</div><h2>Carte de résultat</h2><div class="mini-result"><span>'+i('rank')+'2ᵉ place</span><b class="digits">8,6 s</b></div><div class="type-sample"><h2>Typographies</h2><strong class="display-type">Aiguillage</strong><p>'+a.type+' · Titres</p><p>Nunito · Texte &nbsp; <b class="digits">08,6</b> · Chiffres</p></div><h2>Bannières</h2><div class="style-banners">'+a.pair.map(k=>'<div>'+art(k,t)+'<b>'+games[k]+'</b></div>').join('')+'</div><details class="more-games"><summary>Les quatre autres mini-jeux</summary><div class="style-banners">'+Object.keys(games).filter(k=>!a.pair.includes(k)).map(k=>'<div>'+art(k,t)+'<b>'+games[k]+'</b></div>').join('')+'</div></details></div>';
  }
  function phone(t,view=s.view,flags={}) {
    const l=currentLeague();
    if(view==='style')return '<section class="phone style-phone dir-'+t+'" data-theme="'+t+'">'+styleBoard(t)+'</section>';
    const funcs={home,league,records,world,game:gameView,result:situationResult,chat,profile,rules};
    return '<section class="phone dir-'+t+'" data-theme="'+t+'" aria-label="Direction '+t.toUpperCase()+' · '+d[t].name+'">'+topbar(t,view,l)+'<div class="phone-scroll"><div class="content view-'+view+'">'+(funcs[view]||home)(t,l)+'<p class="ui-error" role="alert" hidden></p></div></div>'+nav(view)+'</section>';
  }
  Object.assign(R,{btn,buttonFace,ib,mark,eyebrow,phone,styleBoard,sampleGame,sampleResult,gameView});
})();
