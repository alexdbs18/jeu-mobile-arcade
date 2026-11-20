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
  const gameName=game=>game?.name_i18n?.[s.language]||game?.name||game?.id||'';
  const gameDescription=game=>game?.description_i18n?.[s.language]||game?.description||'';
  function topbar(t,view,l) {
    const major=['home','records','profile'].includes(view);
    const profile=s.profile||saved.profileDraft||{};
    const streak=Number(s.streak||profile.current_streak)||0;
    const context=view==='league'
      ? gameName(s.gameCatalog.find(item=>item.id===s.currentDay?.game_id))||'Aiguillage'
      : view==='world'?'Classement':l?.name||'Rivo';
    const side=view==='league'||view==='world'
      ? ib('Ouvrir le chat','chat','chat','icon-btn context-chat')
      : '<span class="context-emblem">'+i(l?.icon||'flag')+'</span>';
    return '<header class="topbar">'+(major?mark(t):ib('Retour','back','back'))+(major?'<button type="button" class="avatar-me streak-me" data-do="profile" aria-label="Série de '+streak+' jour(s), ouvrir mon profil" title="'+streak+' jour(s) consécutif(s)"><span aria-hidden="true">🔥</span><b>'+streak+'</b></button>':'<span class="context-name">'+esc(context)+'</span>'+side)+'</header>';
  }
  function nav(view) {
    return '<nav class="bottom" aria-label="Navigation principale">'+[['home','play','Jouer'],['records','rank','Classement'],['profile','user','Profil']].map(([k,g,label])=>'<button type="button" data-do="'+k+'"'+((k==='home'&&['home','rules','game','result','recap'].includes(view))||(k==='records'&&['records','world','league'].includes(view))||k===view?' aria-current="page"':'')+'><span>'+i(g)+'</span>'+label+'</button>').join('')+'</nav>';
  }
  function tabs(l) {
    const ordered=s.scenario==='rival'?[leagues.find(x=>x.id==='promo'),...leagues.filter(x=>x.id!=='promo')]:leagues;
    return '<div class="heading-line"><h1 tabindex="-1">Mes ligues</h1>'+ib('Gérer mes ligues','manage','plus')+'</div><div class="league-tabs" role="group" aria-label="Choisir une ligue">'+ordered.map(x=>'<button class="league-tab" type="button" data-do="switch" data-value="'+esc(x.id)+'" aria-pressed="'+(x.id===l.id)+'">'+i(x.icon)+'<span>'+esc(x.name)+'</span></button>').join('')+'</div>';
  }
  function socialRow(act,gl,title,sub) {
    return '<button class="link-row" type="button" data-do="'+act+'"><span class="tile-icon">'+i(gl)+'</span><span class="row-copy"><strong>'+title+'</strong><small>'+sub+'</small></span>'+i('arrow')+'</button>';
  }
  function home(t,l) {
    if(s.backendMode){
      if(!l)return title('Mes ligues','À toi de jouer')+'<section class="review cloud-empty"><h2>Ta première ligue</h2><p>Crée une ligue ou rejoins tes amis avec leur code. Les classements apparaîtront après les premières parties réelles.</p>'+btn('Créer une ligue','create','primary wide','plus')+btn('Rejoindre par code','join','outline wide','link')+'</section>'+(s.backendError?'<p class="ui-error">'+esc(s.backendError)+'</p>':'');
      const season=s.seasonByLeague[l.id];
      if(!season){
        const playable=RivoGames.catalogReady(s.gameCatalog).length;
        const tomorrow=new Date();tomorrow.setDate(tomorrow.getDate()+1);
        const day=[tomorrow.getFullYear(),String(tomorrow.getMonth()+1).padStart(2,'0'),String(tomorrow.getDate()).padStart(2,'0')].join('-');
        return '<div class="heading-line"><h1 tabindex="-1">Mes ligues</h1>'+ib('Gérer mes ligues','manage','plus')+'</div><section class="challenge"><div class="hero-meta"><span class="hero-tag">'+i('people')+esc(l.name)+'</span></div><div class="hero-type"><h2>La saison n’a pas commencé</h2><p>Choisissez le premier jour; les défis se suivront par périodes fixes de 24 heures dans le fuseau de la ligue.</p></div></section><form class="season-start" data-form="season"><label for="season-start-date">Premier jour de la saison</label><input id="season-start-date" type="date" name="start_date" min="'+day+'" value="'+day+'" required><small>Lancement quotidien · '+esc(l.launchTime||'18:00')+' · '+esc(l.timezone||'Europe/Paris')+'</small><p class="catalog-gate">'+playable+' / 12 mini-jeux jouables. Il en faut 12 pour garantir deux votes de trois options sans répétition.</p><button class="btn primary wide" type="submit" '+(playable<12?'disabled':'')+'>'+buttonFace(playable<12?'Catalogue incomplet':'Créer la saison','play')+'</button></form>'+(s.backendError?'<p class="ui-error">'+esc(s.backendError)+'</p>':'');
      }
      const day=s.currentDay;
      const vote=s.activeVote;
      if(!day){
        const next=season.days.find(item=>Date.parse(item.starts_at)>Date.now());
        return '<div class="heading-line"><h1 tabindex="-1">Mes ligues</h1>'+ib('Gérer mes ligues','manage','plus')+'</div><section class="league-banner"><div>'+eyebrow('timer','Saison '+season.number)+'<h2>10 défis · 10 jours</h2><p>'+(next?'Prochain défi · '+new Intl.DateTimeFormat(RivoI18n.locale(s.language),{dateStyle:'medium',timeStyle:'short'}).format(new Date(next.starts_at)):'Cette saison est terminée.')+'</p></div><div class="banner-art">'+gameArt('aiguillage',t)+'</div></section>'+(!next&&season.status==='completed'&&s.seasonRecap?btn('Voir mon récapitulatif','recap','primary wide','spark'):'')+btn('Classement de la saison','league','outline wide','rank')+btn('Inviter un ami','invite','outline wide','link');
      }
      if(vote)return '<div class="heading-line"><h1 tabindex="-1">Défi du jour</h1><span>'+vote.vote_number+'/2 votes</span></div><section class="challenge"><div class="hero-meta"><span class="hero-tag">'+i('flag')+'Jour '+day.day_number+' / 10</span></div><div class="hero-type"><h2>Choisis le prochain jeu</h2><p>Vote avant la fin du défi. Chaque membre de la ligue choisit une option.</p></div>'+btn(vote.myVote?'Modifier mon vote':'Voter pour un jeu','open-vote','primary wide','star')+'</section><p class="footnote">Fin du vote · '+new Intl.DateTimeFormat(RivoI18n.locale(s.language),{dateStyle:'short',timeStyle:'short'}).format(new Date(vote.closes_at))+'</p>';
      const game=s.gameCatalog.find(item=>item.id===day.game_id);
      const titleText=gameName(game)||day.game_id;
      return '<div class="heading-line"><h1 tabindex="-1">Mes ligues</h1>'+ib('Gérer mes ligues','manage','plus')+'</div><section class="challenge"><div class="hero-meta"><span class="hero-tag">'+i('flag')+'Jour '+day.day_number+' / 10</span><span class="level-tag">'+new Intl.DateTimeFormat(RivoI18n.locale(s.language),{hour:'2-digit',minute:'2-digit'}).format(new Date(day.ends_at))+'</span></div><div class="hero-body"><div class="hero-type"><h2>'+esc(titleText)+'</h2><p>Défi commun à la ligue · 24 heures</p></div><div class="hero-art">'+gameArt(day.game_id,t,'hero')+'</div></div>'+btn('Jouer le défi','play','primary wide','play')+'<p class="footnote">Essais et résultat enregistrés par Supabase.</p></section>'+ (vote?'<section class="review"><b>Vote de la ligue</b><p>Choisis le jeu du prochain défi.</p>'+btn('Ouvrir le vote','open-vote','outline wide','star')+'</section>':'')+'<div class="heading-line subsection"><h2>Classement du jour</h2>'+i('rank')+'</div>'+cloudScoreList(s.dailyBoard)+btn('Classement de la saison','league','outline wide','rank');
    }
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
  function cloudScoreList(rows){
    if(!rows?.length)return '<p class="empty">Aucun membre dans cette ligue.</p>';
    return '<ol class="score-list">'+rows.map(row=>'<li class="'+(row.user_id===RivoBackend.userId?'you ':'')+(row.rank?'':'not-played')+'"><span class="place">'+(row.rank||'—')+'</span>'+R.characterImage(row.character_id,'rank-character')+'<span class="player"><strong>'+esc(row.nickname)+'</strong><small>'+R.countryFlag(row.country_code)+' '+esc(R.countryName(row.country_code))+' · '+(row.rank?'Résultat vérifié':'Pas encore joué')+'</small></span><b class="digits">'+(row.points==null?'—':row.points+' pts')+'</b></li>').join('')+'</ol>';
  }
  function scoreList(l,own,animate=false) {
    const list=leagueScores(l,own);
    if(!list.length)return '<p class="empty">Le classement s’ouvre avec le premier score de la ligue.</p>';
    return '<ol class="score-list '+(animate?'rank-intro':'')+'">'+list.map(r=>'<li class="'+(r.you?'you':'')+'"><span class="place">'+r.rank+'</span><span class="player"><strong>'+esc(r.name)+'</strong><small>'+r.hits+'/3 quais</small></span><b class="digits">'+clock(r.ms)+'</b></li>').join('')+'</ol>';
  }
  function league(t,l) {
    if(s.backendMode){
      if(!l)return home(t,l);
      const season=s.seasonByLeague[l.id];
      return '<section class="ranking-block"><div class="heading-line subsection"><h2>Classement du jour</h2><span class="board-period">AUJOURD’HUI</span></div>'+cloudScoreList(s.dailyBoard)+'</section><section class="ranking-block season-ranking"><div class="heading-line subsection"><h2>Classement de la saison</h2><span class="board-period">'+(season?'SAISON '+esc(String(season.number)):'À VENIR')+'</span></div>'+(season?cloudSeasonScoreList(s.seasonBoard):'<p class="empty">La saison n’a pas encore commencé.</p>')+'</section>';
    }
    const own=best(s.runs[l.id]||[]);
    const daily=scoreList(l,own);
    const season=seasonPreviewList(l,own);
    return '<section class="ranking-block"><div class="heading-line subsection"><h2>Classement du jour</h2><span class="board-period">AUJOURD’HUI</span></div>'+daily+'</section><section class="ranking-block season-ranking"><div class="heading-line subsection"><h2>Classement de la saison</h2><span class="board-period">APERÇU</span></div>'+season+'</section>';
  }
  function seasonPreviewList(l,own){
    const rows=leagueScores(l,own);
    if(!rows.length)return '<p class="empty">La saison commence avec les premiers défis.</p>';
    return '<ol class="score-list season-score-list">'+rows.map(row=>{
      const points=Math.max(60,520-(row.rank-1)*76);
      return '<li class="'+(row.you?'you':'')+'"><span class="place">'+row.rank+'</span><span class="player"><strong>'+esc(row.name)+'</strong><small>'+row.hits+' quais réussis · saison</small></span><b class="digits">'+points+' pts</b></li>';
    }).join('')+'</ol>';
  }
  function cloudSeasonScoreList(rows){
    if(!rows?.length)return '<p class="empty">Les points de saison apparaîtront après le premier défi terminé.</p>';
    return '<ol class="score-list">'+rows.map(row=>'<li class="'+(row.user_id===RivoBackend.userId?'you ':'')+(Number(row.rank)<=3?'top-'+row.rank:'')+'"><span class="place">'+row.rank+'</span>'+R.characterImage(row.character_id,'rank-character')+'<span class="player"><strong>'+esc(row.nickname)+'</strong><small>'+R.countryFlag(row.country_code)+' · '+row.wins+' victoire(s) · '+row.podiums+' podium(s)</small></span><b class="digits">'+row.points+' pts</b></li>').join('')+'</ol>';
  }
  function recap(t){
    const data=s.seasonRecap,league=currentLeague(),slides=data?[
      '<section class="recap-slide recap-summary"><span class="kicker">Saison '+esc(String(league?.name||''))+'</span>'+R.characterImage((s.profile||{}).character_id,'recap-character')+'<strong class="recap-rank">'+data.rank+'<small>e place</small></strong><b class="recap-points">'+data.points+' pts</b></section>',
      '<section class="recap-slide"><span class="kicker">Tes performances</span><div class="profile-stats"><div><b>'+data.wins+'</b><small>Victoires</small></div><div><b>'+data.podiums+'</b><small>Podiums</small></div><div><b>'+data.gamesPlayed+'</b><small>Jeux joués</small></div></div></section>',
      '<section class="recap-slide"><span class="kicker">Écart de points</span><h2>'+(data.gapToPrevious==null?'Tu es en tête de ton classement.':data.gapToPrevious+' pts avec le joueur devant toi')+'</h2><p>'+(data.gapToLeader===0?'Tu termines en tête.':data.gapToLeader+' pts derrière le vainqueur.')+'</p><small>Vainqueur · '+data.leaderPoints+' pts</small></section>',
      '<section class="recap-slide"><span class="kicker">Tes meilleurs jours</span>'+(data.bestDays||[]).map(day=>'<div class="recap-best-day"><b>J'+day.day+' · '+esc(day.game)+'</b><span>'+day.points+' pts · Nº '+day.rank+'</span></div>').join('')+'</section>',
      '<section class="recap-slide"><span class="kicker">Ta fidélité</span><h2>'+data.bonusesUsed+' bonus utilisés</h2><p>'+data.currentStreak+' jours de streak à la fin de saison</p><small>Parties officielles jouées · '+data.gamesPlayed+'</small></section>'
    ]:[];
    const index=Math.min(Math.max(0,s.recapSlide),Math.max(0,slides.length-1));
    return title('Fin de saison','Ton récapitulatif')+(slides.length?'<div class="recap-carousel" aria-live="polite">'+slides[index]+'</div><div class="recap-controls">'+btn('Précédente','recap-prev','outline','back',undefined,index===0?'disabled':'')+'<b>'+(index+1)+' / '+slides.length+'</b>'+btn('Suivante','recap-next','outline','arrow',undefined,index===slides.length-1?'disabled':'')+'</div>'+btn('Partager ce résumé','share-recap','primary wide','link')+btn('Classement collectif','league','outline wide','rank'):'<p class="empty">Le récapitulatif apparaîtra quand la saison sera finalisée.</p>');
  }
  const num=n=>new Intl.NumberFormat(RivoI18n.locale(s.language)).format(n);
  function records(t) {
    if(s.backendMode){
      const readyIds=new Set(RivoGames.catalogReady(s.gameCatalog).map(game=>game.id));
      const rows=(s.gameCatalog||[]).filter(game=>readyIds.has(game.id));
      const cards=rows.map(game=>{
        const rank=s.publicRanks?.[game.id]?.[0]||null;
        const score=rank?.personal_best==null?'Pas encore de score':`${Number(rank.personal_best)} pts · ${clock(Number(rank.duration_ms)||0)}`;
        const pct=rank?.global_percentile==null?'Classement en attente':`Top ${new Intl.NumberFormat(RivoI18n.locale(s.language),{minimumFractionDigits:1,maximumFractionDigits:1}).format(Number(rank.global_percentile))} % mondial`;
        return '<button type="button" class="cloud-record-card" data-do="world" data-value="'+esc(game.id)+'"><span class="record-thumb">'+gameArt(game.id,t,'hero')+'</span><b>'+esc(gameName(game))+'</b><small>'+score+'</small><em>'+pct+'</em></button>';
      }).join('');
      return title('Classement','Mes jeux')+'<p class="intro-rule">Meilleurs résultats vérifiés · rangs calculés à partir des parties officielles.</p><div class="cloud-records">'+(cards||'<p class="empty">Aucun mini-jeu jouable dans le catalogue.</p>')+'</div>';
    }
    const list=Object.keys(gamesData);
    const cards = list.map(game=>{
      const record=gamesData[game].levels[1];
      const local=game==='aiguillage' && s.globalBest;
      const score=local?s.globalBest.hits+'/3 · '+clock(s.globalBest.ms):record?.[2];
      const percentile=record?Math.max(1,Math.ceil(100*record[0]/record[1])):null;
      const thumb=gameArt(game,t,'hero');
      return '<button type="button" class="cloud-record-card" data-do="world" data-value="'+game+'"><span class="record-thumb">'+thumb+'</span><b>'+esc(games[game])+'</b><small>'+(score||'Aucune partie dans la démo')+'</small><em>'+(percentile?'Top '+percentile+' % mondial · démo':'Pas de rang')+'</em></button>';
    }).join('');
    return '<div class="section-title records-title"><h1 tabindex="-1">Classement</h1></div><p class="intro-rule">Tous les mini-jeux dans une grille unique.</p><div class="cloud-records">'+cards+'</div><p class="footnote">Les scores et rangs affichés ici sont des exemples de prévisualisation.</p>';
  }
  function world(t) {
    if(s.backendMode){
      const key=s.worldGame,game=s.gameCatalog.find(item=>item.id===key),row=s.publicRanks?.[key]?.[0];
      if(!game)return records(t);
      if(!row?.global_rank)return '<section class="game-rank-page"><div class="rank-game-hero">'+gameArt(key,t,'hero')+'<div class="rank-game-shade"></div><div class="rank-game-title">'+eyebrow('globe','CLASSEMENT DU JEU')+'<h1 tabindex="-1">'+esc(gameName(game))+'</h1><span class="rank-source">RÉSULTATS VÉRIFIÉS</span></div></div><section class="rank-empty"><span class="rank-empty-icon">'+i('medal')+'</span><h2>Ton rang arrive bientôt</h2><p>Le classement s’affichera dès que les premiers résultats officiels de ce jeu seront validés.</p></section></section>';
      const percentile=new Intl.NumberFormat(RivoI18n.locale(s.language),{minimumFractionDigits:1,maximumFractionDigits:1}).format(Number(row.global_percentile));
      return '<section class="game-rank-page"><div class="rank-game-hero">'+gameArt(key,t,'hero')+'<div class="rank-game-shade"></div><div class="rank-game-title">'+eyebrow('globe','CLASSEMENT DU JEU')+'<h1 tabindex="-1">'+esc(gameName(game))+'</h1><span class="rank-source">RÉSULTATS VÉRIFIÉS</span></div></div><div class="rank-position-card"><div class="rank-position-heading"><span>TA POSITION MONDIALE</span><span class="rank-medal">'+i('medal')+'</span></div><div class="rank-position-number"><strong>'+num(row.global_rank)+'</strong><span>sur '+num(row.global_players)+'</span></div><div class="rank-progress"><span style="width:'+Math.max(3,Math.min(100,100-Number(row.global_percentile)))+'%"></span></div><div class="rank-percentile">Top <b>'+percentile+' %</b> mondial</div></div><div class="rank-personal-card"><span class="rank-personal-icon">'+i('star')+'</span><div><small>MEILLEUR SCORE</small><strong>'+Number(row.personal_best)+' pts</strong><span>'+clock(Number(row.duration_ms)||0)+' de jeu</span></div></div></section>';
    }
    const key=s.worldGame, r=gamesData[key]?.levels[1];
    if(!r)return records(t);
    const fresh=key==='aiguillage'&&s.level===1&&s.globalBest;
    const top=new Intl.NumberFormat(RivoI18n.locale(s.language),{minimumFractionDigits:1,maximumFractionDigits:1}).format(Math.max(0.1,100*r[0]/r[1]));
    return '<section class="game-rank-page demo-rank-page"><div class="rank-game-hero">'+gameArt(key,t,'hero')+'<div class="rank-game-shade"></div><div class="rank-game-title">'+eyebrow('globe','CLASSEMENT DU JEU')+'<h1 tabindex="-1">'+esc(games[key])+'</h1><span class="rank-source">APERÇU</span></div></div><div class="rank-position-card"><div class="rank-position-heading"><span>TA POSITION MONDIALE</span><span class="rank-medal">'+i('medal')+'</span></div><div class="rank-position-number"><strong>'+num(r[0])+'</strong><span>sur '+num(r[1])+'</span></div><div class="rank-progress"><span style="width:'+Math.max(3,Math.min(100,100-100*r[0]/r[1]))+'%"></span></div><div class="rank-percentile">Top <b>'+top+' %</b> mondial</div></div><div class="rank-personal-card"><span class="rank-personal-icon">'+i('star')+'</span><div><small>MEILLEUR SCORE</small><strong>'+esc(r[2]||'—')+'</strong><span>Résultat de prévisualisation</span></div></div>'+(fresh?'<p class="rank-local-note">Nouveau record local : le rang officiel apparaîtra après connexion.</p>':'')+'</section>';
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
    if(s.backendMode){
      const messages=(s.messages||[]).slice().reverse();
      const history=messages.map(message=>'<div class="chat-bubble '+(message.user_id===RivoBackend.userId?'mine':'')+'"><div class="chat-author">'+R.characterImage(message.character_id,'chat-character')+'<span><b>'+esc(message.nickname)+'</b><small>'+R.countryFlag(message.country_code)+' '+esc(R.countryName(message.country_code))+'</small></span></div>'+(message.sticker_id?'<img class="chat-sticker" src="'+esc(message.sticker_asset||'')+'" alt="Sticker '+esc(message.sticker_id)+'">':'<p>'+esc(message.body||'')+'</p>')+'</div>').join('');
      return `${title('Chat de ligue',esc(l?.name||'Rivo'))}<div class="chat-stream" aria-live="polite">${history||'<p class="empty">La conversation commence ici.</p>'}</div><div class="chat-actions">${btn('Collection de stickers','stickers','outline','spark')}<form data-form="chat"><label class="sr" for="chat-message">Message à la ligue</label><input id="chat-message" required maxlength="240" placeholder="Ton message…" autocomplete="off"><button type="submit" class="icon-btn send" aria-label="Envoyer le message">${i('send')}</button></form></div><p class="footnote">Les messages et stickers sont partagés avec les membres de cette ligue.</p>`;
    }
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
    const profile=s.profile||saved.profileDraft||{};
    const nickname=profile.nickname||'Ton pseudo';
    const character=profile.character_id||'grenouille';
    const streakEvents=new Set((s.recentStreak||[]).map(event=>event.local_date));
    const zone=profile.timezone||Intl.DateTimeFormat().resolvedOptions().timeZone||'Europe/Paris';
    const parts=new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
    const today=parts.find(x=>x.type==='year').value+'-'+parts.find(x=>x.type==='month').value+'-'+parts.find(x=>x.type==='day').value;
    const streakDays=Array.from({length:7},(_,index)=>{const date=new Date(today+'T12:00:00Z');date.setUTCDate(date.getUTCDate()-(6-index));const key=date.toISOString().slice(0,10);const label=new Intl.DateTimeFormat(RivoI18n.locale(s.language),{weekday:'short',timeZone:'UTC'}).format(date);return '<span class="streak-day '+(streakEvents.has(key)?'done':'')+'"><b>'+esc(label)+'</b><i>'+(streakEvents.has(key)?'✓':'·')+'</i></span>'}).join('');
    const syncState=RivoBackend.configured
      ? (RivoBackend.hasSession?'Profil invité synchronisé':'Session invitée à initialiser')
      : 'Aperçu local · configuration Supabase requise pour synchroniser';
    return `
      ${title('','Profil')}
      <section class="profile-hero">
        <div class="profile-art">${R.characterImage(character,'profile-character')}</div>
        <div class="profile-copy"><b>${esc(nickname)}</b><small>${R.countryFlag(profile.country_code||'FR')} ${esc(R.countryName(profile.country_code||'FR'))}</small><small>${esc(syncState)}</small></div>
      </section>
      ${btn('Personnaliser','identity','outline wide','user')}
      <div class="heading-line subsection"><h2>Statistiques</h2></div>
      <div class="profile-stats"><div><b>${Number(profile.lifetime_wins)||0}</b><small>Victoires</small></div><div><b>${Number(profile.lifetime_podiums)||0}</b><small>Podiums</small></div><div><b>${Number(profile.lifetime_games)||0}</b><small>Défis joués</small></div></div>
      <div class="heading-line subsection"><h2>Streak</h2><b>${s.streak||Number(profile.current_streak)||0} jours</b></div>
      <div class="streak-week" aria-label="Activité des sept derniers jours">${streakDays}</div>
      <p class="footnote">Record · ${Number(profile.best_streak)||0} jours</p>
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
    const funcs={home,league,records,world,game:gameView,result:situationResult,chat,profile,rules,recap};
    return '<section class="phone dir-'+t+' view-shell-'+view+'" data-theme="'+t+'" aria-label="Direction '+t.toUpperCase()+' · '+d[t].name+'">'+topbar(t,view,l)+'<div class="phone-scroll"><div class="content view-'+view+'">'+(funcs[view]||home)(t,l)+'<p class="ui-error" role="alert" hidden></p></div></div>'+nav(view)+'</section>';
  }
  Object.assign(R,{btn,buttonFace,ib,mark,eyebrow,phone,styleBoard,sampleGame,sampleResult,gameView});
})();
