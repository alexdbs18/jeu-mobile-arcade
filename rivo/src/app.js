(() => {
  'use strict';
  if(new URLSearchParams(location.search).has('jeux')){RivoGameLab.boot();return}
  const {directions:d,situations,names,perceptions,icon:i,esc,state:s,leagues,options:o,saved,save,phone,ib,btn,buttonFace,eyebrow,currentLeague:leftLeague,left,caseRuns,sampleGame,sampleResult,best,sortScores,shapeNames,stickers,frog,q}=R;
  const validWidths=['320','390','430'];
  if(validWidths.includes(q.get('format'))){
    const width=q.get('format');const source=new URL(location.href);source.searchParams.delete('format');const displayMode=q.has('cadre');
    const wrapper=document.createElement('div');wrapper.className='format-page'+(displayMode?' raw':'');
    if(!displayMode){const header=document.createElement('header');const back=document.createElement('a');back.href=source.href;back.textContent='Revenir à l’atelier';header.append('Téléphone · '+width+' px',back);wrapper.append(header)}
    const frame=document.createElement('iframe');frame.title='Rivo sur téléphone de '+width+' pixels';frame.width=width;frame.src=source.href;wrapper.append(frame);
    document.body.replaceChildren(wrapper);return;
  }
  const stage=document.querySelector('#stage'), studio=document.querySelector('#studio'), panel=document.querySelector('#inspector'), mobile=document.querySelector('#mobile-tools'), workspace=document.querySelector('#workspace'), dialog=document.querySelector('#modal'), announcement=document.querySelector('#announcement');
  const announce=text=>{announcement.textContent=text};
  const modeNames={try:'Essayer',compare:'Comparer',style:'Planches de style'};
  let audio, clockTimer, chatTimer, afterAnswer, loadTimer, dialogKind='', historyFocus=null;
  const reduce=()=>o.reduced||matchMedia('(prefers-reduced-motion: reduce)').matches;
  const kbd=()=>document.body.matches(':has(:focus-visible)');
  const cssEscape=v=>typeof CSS.escape==='function'?CSS.escape(v):v.replace(/[^a-z0-9_-]/gi,'');
  const currentFocus=()=>{const f=document.activeElement;if(!f?.dataset.do)return null;return '[data-do="'+cssEscape(f.dataset.do)+'"]'+(f.dataset.value?'[data-value="'+cssEscape(f.dataset.value)+'"]':'')};
  const selectors=(values,selected)=>Object.entries(values).map(([k,label])=>'<option value="'+k+'" '+(selected===k?'selected':'')+'>'+label+'</option>').join('');
  const modeGlyph={try:'play',compare:'layers',style:'spark'};
  const modeButtons=()=>'<div class="modes">'+Object.entries(modeNames).map(([k,v])=>'<button type="button" class="mode-btn" data-do="mode" data-value="'+k+'" aria-pressed="'+(s.mode===k)+'">'+i(modeGlyph[k])+v+'</button>').join('')+'</div>';
  const directionBtns=()=>'<div class="directions">'+Object.entries(d).map(([k,x])=>'<button type="button" data-do="theme" data-value="'+k+'" aria-pressed="'+(s.theme===k)+'" class="direction-pick dir-'+k+'"><span class="letter">'+k.toUpperCase()+'</span><span><b>'+x.name+'</b><small>'+x.tag+'</small></span></button>').join('')+'</div>';
  function fields() {
    const view=s.mode==='compare'?s.compareView:Object.hasOwn(names,s.view)?s.view:'home';
    return '<div class="lab-fields">'+(s.mode==='style'?'':'<label>Écran<select data-input="scene">'+selectors(names,view)+'</select></label><label>Situation d’accueil<select data-input="scenario">'+selectors(situations,s.scenario)+'</select></label>')+'<label>Perception des couleurs<select data-input="vision">'+selectors(perceptions,s.perception)+'</select></label></div>';
  }
  const svgOpts={protan:'0.152286 1.052583 -0.204868 0 0 0.114503 0.786281 0.099216 0 0 -0.003882 -0.048116 1.051998 0 0 0 0 0 1 0',deutan:'0.367322 0.860646 -0.227968 0 0 0.280085 0.672501 0.047413 0 0 -0.011820 0.042940 0.968881 0 0 0 0 0 1 0',tritan:'1.255528 -0.076749 -0.178779 0 0 -0.078411 0.930809 0.147602 0 0 0.004733 0.691367 0.303900 0 0 0 0 0 1 0'};
  document.body.insertAdjacentHTML('afterbegin','<svg aria-hidden="true" focusable="false" width="0" height="0" style="position:absolute;pointer-events:none"><defs>'+Object.entries(svgOpts).map(([k,v])=>'<filter id="'+k+'" color-interpolation-filters="linearRGB"><feColorMatrix type="matrix" values="'+v+'"/></filter>').join('')+'</defs></svg>');
  const stamp=()=>'<div class="studio-id"><span class="studio-stamp">'+window.brandSymbol('c')+'</span><div><b>Atelier Rivo</b><small>Direction artistique</small></div></div>';
  function toolsUI(){
    studio.innerHTML=stamp()+'<div><p class="lab-label">Les trois directions</p>'+directionBtns()+'</div><div><p class="lab-label">Exploration</p>'+modeButtons()+'</div>'+fields()+'<button class="mode-btn" type="button" data-do="test">'+i('flag')+'Test sur téléphone</button><button class="mode-btn" type="button" data-do="games-lab">🎮 Tester les 15 mini-jeux ↗</button>';
    mobile.innerHTML='<button class="lab-open" data-do="studio" type="button">'+i('layers')+' Atelier '+i('down')+'</button><div class="abc" aria-label="Direction artistique">'+Object.keys(d).map(k=>'<button class="dir-'+k+'" type="button" aria-label="Direction '+k.toUpperCase()+' · '+d[k].name+'" aria-pressed="'+(s.theme===k)+'" data-do="theme" data-value="'+k+'"><b>'+k.toUpperCase()+'</b></button>').join('')+'</div>';
  }
  function display({motion=false,focus=false,scroll=0}={}) {
    const prevFocus=kbd()?currentFocus():null;
    const t=s.theme,x=d[t];
    document.documentElement.lang=s.language;
    toolCleanup();
    toolsUI();
    document.body.classList.toggle('reduce',o.reduced);
    document.body.classList.toggle('capture',s.capture);
    document.body.classList.toggle('rebond-stage',t==='a'&&s.mode==='try');
    document.body.classList.toggle('with-atelier',q.has('atelier')||s.mode!=='try');
    document.querySelector('meta[name=theme-color]').content=x.main;
    workspace.classList.toggle('gallery-mode',s.mode==='compare'&&!s.capture);
    panel.className='inspector dir-'+t;
    panel.innerHTML=eyebrow('','Direction '+t.toUpperCase()+' / 03')+'<h2>'+x.name+'</h2><p><b>'+x.tag+'</b></p><div class="strip-colors">'+[x.main,x.accent,x.ink,'#fff'].map(c=>'<div style="background:'+c+'"></div>').join('')+'</div><p>'+x.note+'</p><div style="height:12px"></div>'+btn(s.mode==='style'?'Essayer cette piste':'Voir la planche',s.mode==='style'?'try-current':'style-current','outline','layers');
    panel.insertAdjacentHTML('beforeend','<div class="format-tools" aria-label="Prévisualiser la largeur du téléphone">'+validWidths.map(w=>'<a href="?da='+t+'&amp;format='+w+'">'+w+' px</a>').join('')+'</div>');
    if(s.mode==='compare'&&!s.capture){
      stage.innerHTML='<div class="gallery-shell"><div class="gallery-head"><div><h1>Comparer les directions</h1><p>'+names[s.compareView]+' · '+situations[s.scenario]+'</p></div><div class="tabs-top" aria-label="Aller à une direction">'+Object.keys(d).map(k=>'<button data-do="locate" data-value="'+k+'" aria-pressed="'+(s.theme===k)+'">'+k.toUpperCase()+'</button>').join('')+'</div></div><div class="gallery">'+Object.entries(d).map(([k,v])=>'<figure data-figure="'+k+'"><figcaption><b>'+k.toUpperCase()+' · '+v.name+'</b><button type="button" data-do="open-dir" data-value="'+k+'">Essayer</button></figcaption>'+phone(k,s.compareView)+'</figure>').join('')+'</div></div>';
    } else {
      const view=s.mode==='style'?'style':s.view;
      stage.innerHTML='<div class="preview-label dir-'+t+'"><span><b class="live-dot"></b>'+t.toUpperCase()+' · '+x.name+'</span><span>'+(s.mode==='style'?'Planche de style':names[s.view]||({world:'Classement mondial',rules:'Règles',profile:'Profil',chat:'Chat de ligue'}[s.view]||'Jouer'))+'</span></div>'+phone(t,view);
    }
    for(const el of stage.querySelectorAll('.phone')){
      if(s.perception!=='normal')el.classList.add('vision-'+s.perception);
      if(motion&&!reduce())el.classList.add('nav-motion');
      const scroller=el.querySelector('.phone-scroll');if(scroller)scroller.scrollTop=scroll;
      const row=el.querySelector('.league-tabs'),chosen=row?.querySelector('[aria-pressed=true]');
      if(row&&chosen){const off=chosen.offsetLeft-row.offsetLeft;if(off+chosen.clientWidth>row.scrollLeft+row.clientWidth-10||off<row.scrollLeft)row.scrollLeft=Math.max(0,off-12)}
    }
    RivoI18n.apply(stage,s.language);RivoI18n.apply(panel,s.language);RivoI18n.apply(studio,s.language);
    if(s.view==='chat')stage.querySelectorAll('.chat-stream').forEach(e=>e.scrollTop=e.scrollHeight);
    if(focus)stage.querySelector('h1')?.focus({preventScroll:true});
    else if(prevFocus&&!dialog.open)stage.querySelector(prevFocus)?.focus({preventScroll:true});
    const track=stage.querySelector('.rebond-playfield');
    if(s.game?.locked && s.mode==='try' && track){
      R.rebond.showChoice(track,s.game.log.at(-1).choice,s.game,()=>true);
    }
    if(s.view==='game'&&s.mode==='try'&&s.game&&!s.capture&&!s.game.locked){
      clockTimer=setInterval(()=>{const g=s.game;if(!g)return;const el=stage.querySelector('[data-clock]');if(el)el.textContent=R.clock(g.total+Math.max(0,performance.now()-g.started))},100);
    }
  }
  function toolCleanup(){clearInterval(clockTimer)}
  function stopTimers(){toolCleanup();clearInterval(chatTimer);clearTimeout(loadTimer);clearTimeout(afterAnswer);s.busy=false;s.revision++}
  function startChatPolling(){
    clearInterval(chatTimer);if(!s.backendMode||s.view!=='chat'||!leftLeague())return;
    chatTimer=setInterval(async()=>{try{const rows=await RivoBackend.leagueChat(leftLeague().id);if(s.view!=='chat')return;s.messages=rows;display()}catch{}},12000);
  }
  function closeDialog(){if(dialog.open)dialog.close();dialogKind=''}
  function modal(kind,heading,html){
    if(!dialog.open)historyFocus=currentFocus();
    dialog.dataset.theme=s.theme;
    dialogKind=kind;dialog.innerHTML='<div class="dialog-inner dir-'+s.theme+'"><div class="dialog-header"><h2 id="dialog-title">'+heading+'</h2>'+ib('Fermer','close','close')+'</div><div class="dialog-content">'+html+'</div><div role="status" class="dialog-message"></div></div>';
    RivoI18n.apply(dialog,s.language);
    if(!dialog.open)dialog.showModal();
    const f=dialog.querySelector('[data-initial]');if(f)f.focus({preventScroll:true});
  }
  dialog.addEventListener('close',()=>{if(!dialog.open){dialogKind='';if(historyFocus)document.querySelector(historyFocus)?.focus({preventScroll:true});historyFocus=null}});
  const msg=(text)=>{const el=dialog.querySelector('.dialog-message');if(el)el.textContent=text;announce(text)};
  function studioMenu(){modal('studio','Atelier Rivo',directionBtns()+modeButtons()+fields()+btn('Test sur téléphone','test','outline','flag')+btn('Tester les 15 mini-jeux','games-lab','outline wide','play'))}
  function sound(which){
    if(!o.sound)return;
    try{const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;audio??=new AC();if(audio.state!=='running')audio.resume().catch(()=>{});const time=audio.currentTime;
      const osc=audio.createOscillator(),gain=audio.createGain();const notes=which==='bad'?[235,180]:which==='record'?[620,1080]:[520,770];
      osc.type='sine';osc.frequency.setValueAtTime(notes[0],time);osc.frequency.exponentialRampToValueAtTime(notes[1],time+.07);gain.gain.setValueAtTime(.0001,time);gain.gain.exponentialRampToValueAtTime(.035,time+.016);gain.gain.exponentialRampToValueAtTime(.0001,time+.10);osc.connect(gain);gain.connect(audio.destination);osc.start(time);osc.stop(time+.11);
    }catch{}
  }
  function vib(kind){if(o.vibrate&&navigator.vibrate)try{navigator.vibrate(kind==='record'?[12,40,20]:12)}catch{}}
  function recordDemo(){
    s.game=null;s.result=sampleResult();s.record=false;s.firstScore=false;
    const l=leftLeague();const current=s.runs[l.id]||[];
    if(!current.length)s.runs[l.id]=[s.result];
  }
  function scenario(k){
    if(!Object.hasOwn(situations,k))return;
    stopTimers();s.scenario=k;s.league=k==='rival'?'promo':'brains';s.runs=caseRuns(k);
    s.result=null;s.record=false;s.firstScore=false;s.practice=false;s.game=null;s.history=[];s.view='home';s.compareView='home';s.level=1;s.recordGame='all';s.globalBest=null;
    closeDialog();display({motion:true});
  }
  function go(view,saveHistory=true){
    const old=s.view;
    stopTimers();if(saveHistory&&old!==view)s.history.push(old);
    if(old==='game'&&view!=='game')s.game=null;
    s.view=view;closeDialog();display({motion:true,focus:kbd()});if(view==='chat')startChatPolling();
  }
  function direct(view) {
    stopTimers();s.history=[];s.game=null;s.result=null;s.record=false;s.firstScore=false;s.view=view;
    if(view==='result'&&s.mode!=='compare')recordDemo();
    if(view==='game'&&s.mode!=='compare'){
      s.game=sampleGame();s.game.started=performance.now();s.practice=true;
      if(!s.capture)s.game.demo=false;
    }
    closeDialog();display({motion:true})
  }
  function leave(next){
    if(s.game&&!s.game.demo&&s.view==='game'&&s.mode==='try'&&!s.capture){
      pendingLeave=next;modal('leave','Quitter la partie ?', '<p>'+(s.game.practice?'Cette partie d’entraînement sera interrompue.':'Cet essai classé est déjà engagé.')+'</p>'+btn('Continuer à jouer','close','primary','play')+btn('Quitter la partie','leave','outline'));
    }else next();
  }
  let pendingLeave=null;
  function loaded(el,done){
    if(s.busy||!el)return;s.busy=true;
    const old=el.innerHTML;el.setAttribute('aria-busy','true');el.disabled=true;el.innerHTML=buttonFace('Chargement…','timer');announce('Chargement du défi.');
    const rev=s.revision;
    loadTimer=setTimeout(()=>{
      if(s.revision!==rev)return;s.busy=false;el.disabled=false;el.removeAttribute('aria-busy');el.innerHTML=old;
      if(s.fail){s.fail=false;const p=stage.querySelector('.ui-error');if(p){p.hidden=false;p.textContent='× Le défi n’a pas chargé. Appuie de nouveau sur Jouer.';p.scrollIntoView({block:'nearest'})}return}
      done();
    },300);
  }
  function play(el,practice){
    const l=leftLeague();if(!practice&&!left(l)){go('league');return}
    vib('play');sound('play');
    loaded(el,()=>{s.practice=practice;go('rules')});
  }
  async function start(){
    const l=leftLeague();if(!s.practice&&!left(l)){go('league');return}
    if(s.backendMode){
      if(!s.currentDay?.id){announce('Aucun défi de saison n’est ouvert.');return}
      if(!RivoGames.get(s.currentDay.game_id)){announce('Ce jeu n’a pas encore son adaptateur Rivo complet.');return}
      try{
        const response=await RivoBackend.startAttempt(s.currentDay.id,s.practice?'practice':'official',Boolean(s.useDoublePoints));
        s.currentAttempt=Array.isArray(response)?response[0]:response;
      }catch(error){announce(error.message||'Le serveur n’a pas ouvert cet essai.');return}
    }
    const arr=s.runs[l.id]||[];const old=best(arr),slot=arr.length;
    if(!s.practice)arr.push(null);
    const seq=s.practice?['circle','square','triangle']:['triangle','circle','square'];
    s.result=null;s.game={seq,step:0,started:performance.now(),total:0,log:[],locked:false,practice:s.practice,old,slot,last:'',lastOk:null};
    go('game');s.game.started=performance.now();announce('Wagon 1. '+shapeNames[seq[0]]);
  }
  function answer(value){
    const game=s.game;
    if(!game||game.locked||!Object.hasOwn(shapeNames,value))return;
    const elapsed=Math.max(1,Math.round(performance.now()-game.started));
    const expected=game.seq[game.step], correct=expected===value;
    game.locked=true;
    game.log.push({expected,choice:value,ms:elapsed});
    game.total+=elapsed;
    game.last='Wagon '+(game.step+1)+' · '+(correct?'Bon quai':'Mauvais quai');
    game.lastOk=correct;

    toolCleanup();
    sound(correct?'good':'bad');
    announce(game.last);
    const field=stage.querySelector('.rebond-playfield');
    const scroll=stage.querySelector('.phone-scroll')?.scrollTop||0;
    if(field) R.rebond.showChoice(field,value,game,reduce);
    else display({scroll});

    const revision=s.revision;
    const feedbackDelay=field&&!reduce()?650:480;
    afterAnswer=setTimeout(async()=>{
      if(revision!==s.revision||s.game!==game)return;
      if(game.step<2){
        game.step++;
        game.locked=false;
        display({scroll});
        game.started=performance.now();
        if(kbd()) stage.querySelector('[data-do=answer][data-value="'+value+'"]')?.focus({preventScroll:true});
        announce(game.last+'. Wagon '+(game.step+1)+'. '+shapeNames[game.seq[game.step]]);
        return;
      }
      const result={
        hits:game.log.filter(item=>item.expected===item.choice).length,
        ms:game.total,
        log:game.log,
        practice:game.practice
      };
      s.record=!game.practice&&Boolean(game.old&&sortScores(result,game.old)<0);
      s.firstScore=!game.practice&&!game.old;
      s.result=result;
      if(s.backendMode){
        try{
          const adapter=RivoGames.get(s.currentDay.game_id);
          if(!adapter)throw new Error('Ce jeu n’a pas encore son vérificateur serveur.');
          const verified=await RivoBackend.invoke(adapter.verify,{attemptId:s.currentAttempt?.attempt_id,gameId:s.currentDay?.game_id,events:game.log});
          s.result.hits=Number(verified.correctAnswers);s.result.ms=Number(verified.durationMs);
          s.currentAttempt=null;
          await loadCloudWorkspace();
        }catch(error){
          s.result=null;s.currentAttempt=null;announce(error.message||'Le résultat n’a pas été accepté par le serveur.');go('home');return;
        }
      }else if(!game.practice){
        s.runs[leftLeague().id][game.slot]=result;
        if(sortScores(result,s.globalBest||{hits:3,ms:8600})<0)s.globalBest=result;
        if(s.record){vib('record');sound('record')}
      }
      s.history=['home'];
      go('result',false);
    },s.capture?0:feedbackDelay);
  }
  function manage(){
    modal('manage','Mes ligues','<div class="manage-list">'+leagues.map(l=>'<button type="button" data-do="switch" data-value="'+esc(l.id)+'"'+(l.id===s.league?' aria-current="true"':'')+'>'+i(l.icon)+'<span>'+esc(l.name)+'</span>'+i(l.id===s.league?'check':'arrow')+'</button>').join('')+'</div>'+btn('Créer une ligue','create','primary','plus')+btn('Rejoindre par code','join','outline','link'));
  }
  function invite(){
    const l=leftLeague();if(!l){msg('Crée ou rejoins une ligue avant de l’inviter.');return}
    modal('invite','Inviter un pote','<p>Partage ce code pour faire entrer tes amis dans <b>'+esc(l.name)+'</b>.</p><code class="invite">'+esc(l.code)+'</code>'+btn('Copier le code','copy','primary','link'));
  }
  function openVoteUI(){
    const vote=s.activeVote;
    if(!vote){announce('Aucun vote n’est ouvert pour le moment.');return}
    const options=(vote.candidates||[]).map(game=>{const local=s.gameCatalog.find(item=>item.id===game.id)||game;const name=local.name_i18n?.[s.language]||local.name;const description=local.description_i18n?.[s.language]||local.description;return '<button type="button" class="vote-option" data-do="vote-option" data-value="'+esc(game.id)+'" '+(vote.myVote===game.id?'aria-pressed="true"':'')+'><span class="vote-art"><img src="'+esc(game.illustration_path)+'" alt=""></span><span><b>'+esc(name)+'</b><small>'+esc(description)+'</small></span>'+i(vote.myVote===game.id?'check':'arrow')+'</button>'}).join('');
    modal('vote','Choisis le prochain jeu','<p>Un seul vote par personne · '+new Intl.DateTimeFormat(RivoI18n.locale(s.language),{hour:'2-digit',minute:'2-digit'}).format(new Date(vote.closes_at))+' · Chaque vote compte pour la ligue.</p><div class="vote-options">'+options+'</div>');
  }
  async function castVote(gameId){
    if(!s.activeVote)return;
    try{await RivoBackend.castVote(s.activeVote.id,gameId);closeDialog();await loadCloudWorkspace();announce('Ton vote est enregistré.');}
    catch(error){msg(error.message||'Le vote n’a pas pu être enregistré.')}
  }
  function settings(){
    const toggles=[['sound','Sons arcade'],['vibrate','Vibrations sur Jouer et record'],['reduced','Mouvement réduit']];
    modal('settings','Son et mouvements',toggles.map(([k,v])=>'<label class="checkline"><input data-opt="'+k+'" type="checkbox" '+(o[k]?'checked':'')+'>'+v+'</label>').join('')+'<label class="field">Langue<select data-input="language">'+RivoI18n.supported.map(lang=>'<option value="'+lang+'" '+(s.language===lang?'selected':'')+'>'+RivoI18n.labels[lang]+'</option>').join('')+'</select></label><p>Le réglage de mouvement du téléphone est également respecté.</p><details><summary>Essayer un incident de chargement</summary><label class="checkline"><input data-opt="fail" type="checkbox" '+(s.fail?'checked':'')+'>Échec au prochain appui sur Jouer</label></details>'+btn('Terminé','close','primary','check'));
  }
  function stickersUI(identity=false){
    if(s.backendMode&&!identity){
      const owned=(s.ownedStickers||[]).map(row=>row.sticker).filter(Boolean);
      return '<div class="sticker-choices">'+(owned.length?owned.map(sticker=>'<button type="button" data-do="sticker" data-value="'+esc(sticker.id)+'"><img src="'+esc(sticker.asset_path)+'" alt=""><span>'+esc(sticker.name_i18n?.[s.language]||sticker.display_key.replace(/^sticker\./,''))+'</span></button>').join(''):'<p class="empty">Aucun sticker n’est débloqué pour le moment.</p>')+'</div>'+btn('Boutique de stickers','shop','outline wide','star');
    }
    return '<div class="sticker-choices">'+Object.entries(stickers).map(([k,v])=>'<button type="button" data-do="'+(identity?'pose':'sticker')+'" data-value="'+k+'" '+(identity?'aria-pressed="'+((saved.pose||'focus')===k)+'"':'')+'>'+frog(k)+'<span>'+v+'</span></button>').join('')+'</div>';
  }
  async function sendSticker(stickerId){
    const league=leftLeague();if(!league)return;
    try{await RivoBackend.postMessage(league.id,null,stickerId);closeDialog();await loadCloudWorkspace();display();announce('Sticker envoyé à la ligue.')}
    catch(error){msg(error.message||'Le sticker n’a pas pu être envoyé.')}
  }
  function stickerShop(){
    modal('shop','Boutique de stickers','<p>La collection de départ est gratuite et liée à ton personnage.</p><p>Les achats de stickers seront activés quand les achats intégrés iOS/Android seront configurés. Aucun paiement n’est simulé ici.</p>'+btn('Voir ma collection','stickers','primary wide','spark'));
  }
  function addMessage(m){
    saved.chats??={};const id=leftLeague().id;saved.chats[id]??=[];saved.chats[id].push(m);save();closeDialog();display();announce('Message ajouté à la conversation de démo.');
  }
  function identity(){
    const profile=s.profile||saved.profileDraft||{};
    s.selectedCharacter=profile.character_id||s.selectedCharacter||'grenouille';
    const notice=RivoBackend.configured
      ? '<p class="profile-sync-note">Profil invité : aucune adresse e-mail ni mot de passe.</p>'
      : '<p class="profile-sync-note">Aperçu local uniquement. Configure l’URL et la clé publique Supabase pour synchroniser ce profil.</p>';
    modal('identity','Ton profil joueur',
      '<form data-form="identity"><label class="field">Ton pseudo<input name="nickname" maxlength="20" required value="'+esc(profile.nickname||'')+'" placeholder="Ex. Léo" data-initial></label>'+
      '<label class="field">Ton pays<select name="country_code">'+R.countryOptions(profile.country_code||'FR')+'</select></label>'+
      '<fieldset class="character-picker"><legend>Choisis ton personnage</legend><div class="character-grid">'+Object.entries(R.characters).map(([id,item])=>'<button type="button" class="character-option" data-do="avatar" data-value="'+id+'" aria-pressed="'+(id===s.selectedCharacter)+'">'+R.characterImage(id,'')+'<span>'+esc(item.name)+'</span></button>').join('')+'</div></fieldset>'+notice+
      '<button type="submit" class="btn primary">'+buttonFace('Enregistrer','check')+'</button></form>');
  }
  const testQuestions=['Trouver le défi du jour','Changer de ligue','Trouver son record de niveau 2','Ouvrir le chat de la ligue'];
  function test(){
    saved.tests??={};
    const test=saved.tests,order=test.order||'ABC';const archived=Array.isArray(saved.testSheets)?saved.testSheets.length:0;
    modal('test','Test sur téléphone','<p>Montre chaque accueil 5 secondes. Demande « Où tu appuies pour jouer ? », puis laisse la personne accomplir les quatre tâches.</p>'+
      '<label class="field">Ordre de passage<select data-input="test-order">'+selectors(Object.fromEntries(['ABC','BCA','CAB','ACB','CBA','BAC'].map(k=>[k,k.split('').join(' → ')])),order)+'</select></label>'+
      '<label class="field">Direction observée<select data-input="test-dir">'+selectors({a:'A · Rebond',b:'B · Chrono',c:'C · Ricochet'},test.dir||s.theme)+'</select></label>'+
      '<div class="test-rows">'+testQuestions.map((v,j)=>'<label class="field">'+v+'<select data-input="task-'+j+'">'+selectors({'':'À observer',seul:'Réussi sans aide',aide:'Réussi avec aide',echec:'Non trouvé'},test[(test.dir||s.theme)+j]||'')+'</select></label>').join('')+'</div>'+
      ['Direction préférée','Sur laquelle as-tu le plus envie de lancer une partie ?'].map((v,j)=>'<label class="field">'+v+'<select data-input="pref-'+j+'">'+selectors({'':'À recueillir',a:'A · Rebond',b:'B · Chrono',c:'C · Ricochet',aucune:'Aucune préférence'},test['pref'+j]||'')+'</select></label>').join('')+'<p>Fiche '+(archived+1)+' · Réponses gardées sur cet appareil.</p>'+btn('Revenir au prototype','close','primary','play')+btn('Fiche du joueur suivant','next-player','outline','plus')+btn('Exporter les réponses','export-test','outline','list'));
  }
  function switchLeague(id){
    const valid=leagues.find(l=>l.id===id);if(!valid)return;
    stopTimers();
    s.league=id;s.history=[];s.game=null;s.view='home';s.compareView='home';closeDialog();display({motion:true});announce('Ligue sélectionnée. '+valid.name);
    if(s.backendMode)loadCloudWorkspace();
  }
  async function loadCloudWorkspace(){
    if(!RivoBackend.configured||!RivoBackend.hasSession)return;
    try{
      try{await RivoBackend.invoke('maintenance')}catch{}
      const [memberRows,catalog]=await Promise.all([RivoBackend.listLeagues(),RivoBackend.listGames()]);
      s.gameCatalog=catalog||[];
      const rankResults=await Promise.allSettled(s.gameCatalog.filter(game=>game.playable).map(async game=>[game.id,await RivoBackend.gamePublicRank(game.id)]));
      s.publicRanks=Object.fromEntries(rankResults.filter(result=>result.status==='fulfilled').map(result=>result.value));
      const rows=(memberRows||[]).map(league=>({
        id:league.id,name:league.name,code:league.invite_code,icon:'flag',count:Number(league.member_count)||0,opps:[],timezone:league.timezone,launchTime:league.launch_time
      }));
      R.setLeagues(rows);s.backendMode=true;s.seasonByLeague={};
      await Promise.all(rows.map(async league=>{
        const seasons=await RivoBackend.listSeasons(league.id);
        if(!seasons?.length)return;
        const season=seasons[0],days=await RivoBackend.listSeasonDays(season.id);
        s.seasonByLeague[league.id]={...season,days};
      }));
      if(R.currentLeague()){
        const season=s.seasonByLeague[R.currentLeague().id];
        s.currentDay=season?.days.find(day=>Date.now()>=Date.parse(day.starts_at)&&Date.now()<Date.parse(day.ends_at))||null;
        s.dailyBoard=s.currentDay?.game_id?await RivoBackend.dailyLeaderboard(s.currentDay.id):[];
        s.seasonBoard=season?await RivoBackend.seasonLeaderboard(season.id):[];
        s.seasonRecap=season?.status==='completed'?await RivoBackend.seasonRecap(season.id):null;
        s.messages=await RivoBackend.leagueChat(R.currentLeague().id);
        s.activeVote=null;
        if(season){
          const votes=await RivoBackend.listVotes(season.id),now=Date.now();
          for(const vote of votes||[]){
            if(vote.winner_game_id&&now>=Date.parse(vote.closes_at))continue;
            if(now>=Date.parse(vote.closes_at)){
              try{await RivoBackend.invoke('resolve-vote',{voteId:vote.id});}catch{}
              continue;
            }
            if(now>=Date.parse(vote.opens_at)&&now<Date.parse(vote.closes_at)){
              try{
                const opened=await RivoBackend.openVote(vote.id),ballot=await RivoBackend.myBallot(vote.id);
                s.activeVote={...vote,candidates:opened?.[0]?.candidates||[],myVote:ballot?.[0]?.game_id||null};
              }catch{}
            }
          }
        }
      }else{s.currentDay=null;s.dailyBoard=[];s.seasonBoard=[];s.activeVote=null;s.seasonRecap=null}
      s.ownedStickers=await RivoBackend.ownedStickers();
      s.recentStreak=await RivoBackend.recentStreak();
      display();
      if(s.view==='chat')startChatPolling();
      RivoBackend.recordDayOpen().then(result=>{
        const row=Array.isArray(result)?result[0]:result;
        if(row){
          s.streak=row.current_streak;s.day4Reward=row.day4_reward;display();
          if(row.day4_reward)modal('day4-reward','Bravo, belle série !','<p>Quatre jours d’affilée : tu as gagné un essai officiel supplémentaire.</p>'+btn('Super !','close','primary wide','spark'));
        }
      }).catch(()=>{});
    }catch(error){s.backendError=error.message||'Les données Supabase n’ont pas pu être chargées.';display();announce(s.backendError)}
  }
  function focusFigure(t){
    const gallery=stage.querySelector('.gallery'),f=gallery?.querySelector('[data-figure="'+t+'"]');
    if(gallery&&f)gallery.scrollTo({left:f.offsetLeft-gallery.querySelector('figure').offsetLeft,behavior:reduce()?'instant':'smooth'});
    stage.querySelectorAll('[data-do=locate]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.value===t));
  }
  function applyTheme(t){
    if(!Object.hasOwn(d,t))return;
    closeDialog();s.theme=t;
    if(s.mode==='compare'){toolsUI();focusFigure(t)}else display({motion:true});
  }
  function mode(k){
    if(!Object.hasOwn(modeNames,k))return;
    closeDialog();stopTimers();
    if(s.view==='game'){s.game=null;s.view='home'}
    if(k==='compare')s.compareView=Object.hasOwn(names,s.view)?s.view:'home';
    s.mode=k;display();
  }
  function handle(action,value,el){
    switch(action){
      case 'studio':studioMenu();break;
      case 'games-lab':window.open('/rivo/?jeux=1','_blank','noopener');break;
      case 'theme':applyTheme(value);break;
      case 'mode':leave(()=>mode(value));break;
      case 'style-current':leave(()=>mode('style'));break;
      case 'try-current':mode('try');break;
      case 'locate':s.theme=value;focusFigure(value);toolsUI();break;
      case 'open-dir':s.theme=value;s.mode='try';direct(s.compareView);break;
      case 'close':closeDialog();break;
      case 'leave':{const next=pendingLeave;pendingLeave=null;closeDialog();if(next)next();break}
      case 'home':case 'records':case 'profile':leave(()=>{s.history=[];go(action,false)});break;
      case 'back':leave(()=>{let previous=s.history.pop();if(!previous||previous==='game'||previous===s.view)previous='home';go(previous,false)});break;
      case 'switch':switchLeague(value);break;
      case 'manage':manage();break;
      case 'settings':settings();break;
      case 'league':case 'chat':go(action);break;
      case 'recap':s.recapSlide=0;go('recap');break;
      case 'recap-prev':s.recapSlide=Math.max(0,s.recapSlide-1);display();break;
      case 'recap-next':s.recapSlide=Math.min(4,s.recapSlide+1);display();break;
      case 'share-recap':{
        const r=s.seasonRecap;if(!r){announce('Le récapitulatif n’est pas disponible.');break}
        const text=`Saison Rivo · ${r.rank}e · ${r.points} pts · ${r.wins} victoires · ${r.podiums} podiums`;
        if(navigator.share)navigator.share({title:'Mon récap Rivo',text}).catch(()=>{});
        else if(navigator.clipboard?.writeText)navigator.clipboard.writeText(text).then(()=>announce('Résumé copié pour le partager.')).catch(()=>announce(text));
        else announce(text);break;
      }
      case 'world':if(Object.hasOwn(R.gamesData,value)||s.gameCatalog.some(game=>game.id===value)){s.worldGame=value;go('world')}break;
      case 'level':s.level=Number(value);display();break;
      case 'play':play(el,false);break;
      case 'practice':play(el,true);break;
      case 'start':start();break;
      case 'answer':answer(value);break;
      case 'invite':invite();break;
      case 'copy':{const code=leftLeague().code;if(navigator.clipboard?.writeText)navigator.clipboard.writeText(code).then(()=>msg('Code copié.')).catch(()=>msg('Sélectionne le code pour le copier.'));else msg('Sélectionne le code pour le copier.');break}
      case 'join':modal('join','Rejoindre une ligue','<form data-form="join"><label class="field">Code de ligue<input name="code" data-initial maxlength="12" required placeholder="RIVO24" autocapitalize="characters"></label><button class="btn primary" type="submit">'+buttonFace('Rejoindre','link')+'</button></form>');break;
      case 'create':modal('create','Créer une ligue','<form data-form="create"><label class="field">Nom de la ligue<input name="name" data-initial maxlength="40" required placeholder="Les sprinteurs du jeudi"></label><label class="field">Heure de lancement<select name="launch_time"><option value="09:00">09 h 00</option><option value="14:00">14 h 00</option><option value="18:00" selected>18 h 00</option></select></label><small>Fuseau utilisé · '+esc(Intl.DateTimeFormat().resolvedOptions().timeZone||'Europe/Paris')+'</small><button type="submit" class="btn primary">'+buttonFace('Créer la ligue','plus')+'</button></form>');break;
      case 'open-vote':openVoteUI();break;
      case 'vote-option':castVote(value);break;
      case 'identity':identity();break;
      case 'submit-identity':el.closest('form')?.requestSubmit();break;
      case 'avatar':
        if(Object.hasOwn(R.characters,value)){
          s.selectedCharacter=value;
          if(dialog.open)dialog.querySelectorAll('[data-do=avatar]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.value===value));
          else identity();
        }
        break;
      case 'pose':saved.pose=value;dialog.querySelectorAll('[data-do=pose]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.value===value));break;
      case 'stickers':modal('stickers','Un mot de la grenouille',stickersUI());break;
      case 'sticker':if(s.backendMode)sendSticker(value);else if(Object.hasOwn(stickers,value))addMessage({sticker:value});break;
      case 'shop':stickerShop();break;
      case 'test':test();break;
      case 'next-player':{
        const rows=saved.testSheets??=[];
        if(!Object.keys(saved.tests||{}).some(k=>/^[abc][0-3]$|^pref[01]$/.test(k))){msg('Note au moins une réponse avant de passer au joueur suivant.');break}
        rows.push({...saved.tests,order:saved.tests.order||'ABC'});saved.tests={order:['ABC','BCA','CAB','ACB','CBA','BAC'][rows.length%6]};save();test();msg('La fiche précédente est enregistrée.');break
      }
      case 'export-test':{
        const forms=[...(saved.testSheets||[]),saved.tests||{}];
        const keys=['a','b','c'].flatMap(t=>[0,1,2,3].map(j=>t+j));
        const cells=['Joueur','Ordre',...keys.map(k=>k[0].toUpperCase()+' · '+testQuestions[Number(k[1])]),'Direction préférée','Envie de jouer'];
        const lines=[cells,...forms.map((f,j)=>[j+1,f.order||'ABC',...keys.map(k=>f[k]||''),f.pref0||'',f.pref1||''])];
        const blob=new Blob(['\ufeff',lines.map(line=>line.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(';')).join('\r\n')],{type:'text/csv;charset=utf-8'});
        const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='Rivo-Test-joueurs.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);msg('Export des fiches préparé.');break
      }
      case 'noop':announce('Exemple de commande du prototype.');break;
    }
  }
  // Apply the press to the moving face, leaving the hit area fixed.
  let press;
  function releasePress(event){
    if(press&&(!event||event.pointerId===press.pointerId)){
      press.button.classList.remove('is-pressed');
      press=null;
    }
  }
  document.addEventListener('pointerdown',event=>{
    if(!event.isPrimary||event.button!==0)return;
    releasePress();
    const button=event.target.closest('.dir-a .btn:is(.primary,.outline), .dock-control');
    if(!button||button.disabled||button.getAttribute('aria-disabled')==='true')return;
    press={button,pointerId:event.pointerId};
    button.classList.add('is-pressed');
  });
  document.addEventListener('pointerup',releasePress);
  document.addEventListener('pointercancel',releasePress);
  window.addEventListener('blur',()=>releasePress());

  document.addEventListener('click',e=>{
    const b=e.target.closest('button[data-do]');if(!b||b.disabled)return;
    const action=b.dataset.do,value=b.dataset.value;
    if(s.mode==='compare'&&b.closest('figure .phone')){
      const k=b.closest('.phone').dataset.theme;s.mode='try';s.theme=k;direct(s.compareView);
      const fresh=[...stage.querySelectorAll('button[data-do]')].find(x=>x.dataset.do===action&&x.dataset.value===value);
      if(fresh)handle(action,value,fresh);return;
    }
    handle(action,value,b);
  });
  document.addEventListener('change',e=>{
    const el=e.target,k=el.dataset.input,v=el.value;
    if(k==='language'){if(RivoI18n.supported.includes(v)){s.language=v;saved.language=v;save();closeDialog();display();announce('Langue mise à jour.')}return}
    if(el.dataset.opt){if(el.dataset.opt==='fail')s.fail=el.checked;else{o[el.dataset.opt]=el.checked;saved.options=o;save();document.body.classList.toggle('reduce',o.reduced)}return}
    if(k==='scenario'){leave(()=>scenario(v));return}
    if(k==='scene'){leave(()=>{if(s.mode==='compare'){s.compareView=v;closeDialog();display()}else direct(v)});return}
    if(k==='vision'){s.perception=v;closeDialog();display();return}
    if(k==='record-game'){if(el.closest('figure')){s.theme=el.closest('figure').dataset.figure;s.mode='try';s.view='records'}s.recordGame=v;display();return}
    if(k?.startsWith('test-')||k?.startsWith('task-')||k?.startsWith('pref-')){
      const st=saved.tests??={};if(k==='test-order')st.order=v;else if(k==='test-dir')st.dir=v;else if(k.startsWith('task-'))st[(st.dir||s.theme)+k.slice(5)]=v;else st['pref'+k.slice(5)]=v;
      save();if(k==='test-dir')test();
    }
  });
  document.addEventListener('submit',async e=>{
    const form=e.target,type=form.dataset.form;if(!type)return;e.preventDefault();
    const raw=new FormData(form);
    if(type==='chat'){
      const val=form.querySelector('input').value.trim();if(!val)return;
      if(s.backendMode){try{await RivoBackend.postMessage(leftLeague().id,val,null);closeDialog();await loadCloudWorkspace();display();announce('Message envoyé à la ligue.')}catch(error){msg(error.message||'Le message n’a pas pu être envoyé.')}}
      else addMessage({text:val.slice(0,240)});
      stage.querySelector('#chat-message')?.focus();return
    }
    if(type==='identity'){
      const nickname=String(raw.get('nickname')||'').trim().slice(0,20);
      const countryCode=String(raw.get('country_code')||'FR').toUpperCase();
      const characterId=s.selectedCharacter;
      const timezone=Intl.DateTimeFormat().resolvedOptions().timeZone||'Europe/Paris';
      if(!nickname){msg('Indique un pseudo.');return}
      if(!R.countryCodes.includes(countryCode)||!Object.hasOwn(R.characters,characterId)){msg('Vérifie le pays et le personnage choisis.');return}
      const profile={nickname,country_code:countryCode,character_id:characterId};
      const submit=form.querySelector('[type=submit]');if(submit){submit.disabled=true;submit.setAttribute('aria-busy','true')}
      try{
        if(RivoBackend.configured){
          if(!RivoBackend.hasSession)await RivoBackend.signInAnonymously({nickname,countryCode,characterId,timezone});
          s.profile=await RivoBackend.saveProfile({nickname,countryCode,characterId,timezone});
          if(!s.profile)throw new Error('Supabase n’a pas renvoyé le profil enregistré.');
        }else{
          saved.profileDraft={...profile,timezone,_localOnly:true};save();s.profile=profile;
        }
        closeDialog();display();announce(RivoBackend.configured?'Profil invité synchronisé.':'Brouillon de profil enregistré sur cet appareil.');
        if(RivoBackend.configured)await loadCloudWorkspace();
      }catch(error){msg(error.message||'Le profil n’a pas pu être enregistré.');if(submit){submit.disabled=false;submit.removeAttribute('aria-busy')}}
      return;
    }
    if(type==='join'){
      const val=String(raw.get('code')||'').trim().toUpperCase();
      if(s.backendMode){try{await RivoBackend.joinLeague(val);closeDialog();await loadCloudWorkspace();announce('Tu as rejoint la ligue.')}catch(error){msg(error.message||'Code de ligue inconnu.')}return}
      const l=leagues.find(x=>x.code===val);if(!l){msg('Code inconnu dans cette maquette locale.');return}switchLeague(l.id);return
    }
    if(type==='create'){
      const name=String(raw.get('name')||'').trim().slice(0,40);if(!name){msg('Indique un nom de ligue.');return}
      if(s.backendMode){try{const timezone=Intl.DateTimeFormat().resolvedOptions().timeZone||'Europe/Paris';await RivoBackend.createLeague(name,timezone,String(raw.get('launch_time')||'18:00'));closeDialog();await loadCloudWorkspace();announce('Ligue créée.')}catch(error){msg(error.message||'La ligue n’a pas pu être créée.')}return}
      let code;do{code=Math.random().toString(36).slice(2,8).toUpperCase()}while(!code||leagues.some(x=>x.code===code));
      const l={id:'club-'+code.toLowerCase(),name,code,icon:'flag',count:1,opps:[]};leagues.push(l);(saved.custom??=[]).push({name,code,id:l.id});save();s.runs[l.id]=[];switchLeague(l.id);invite();return
    }
    if(type==='season'){
      if(!s.backendMode||!leftLeague())return;
      try{await RivoBackend.createSeason(leftLeague().id,String(raw.get('start_date')||''));closeDialog();await loadCloudWorkspace();announce('Saison créée côté serveur.')}
      catch(error){s.backendError=error.message||'La saison n’a pas pu être créée.';msg(s.backendError);display()}
      return
    }
  });
  if(q.get('vue')==='style')s.mode='style';
  if(Object.hasOwn(names,q.get('vue'))){s.view=q.get('vue');if(s.view==='result')recordDemo();if(s.view==='game'){s.game=sampleGame();s.game.started=performance.now();if(!s.capture)s.game.demo=false}}
  if(q.get('mode')==='comparer'){s.mode='compare';s.compareView=Object.hasOwn(names,s.view)?s.view:'home'}
  if(Object.hasOwn(perceptions,q.get('vision')))s.perception=q.get('vision');
  display();
  if(RivoBackend.configured){
    if(RivoBackend.hasSession){
      RivoBackend.loadProfile().then(async profile=>{if(profile){s.profile=profile;s.selectedCharacter=profile.character_id;display();await loadCloudWorkspace()}else identity()})
        .catch(error=>{announce(error.message||'Impossible de charger le profil invité.');identity()});
    }else identity();
  }else if(!saved.profileDraft){identity()}
})();
