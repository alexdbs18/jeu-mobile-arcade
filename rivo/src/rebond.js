(() => {
  'use strict';

  const {
    state, icon, esc, btn, left, best, sortScores, clock, gapLabel, frog, shapeNames
  } = R;
  const toyImages = {
    aiguillage: 'TOY_WAGON',
    photo: 'TOY_PHOTO',
    trace: 'TOY_TRACE',
    miroir: 'TOY_MIROIR'
  };
  const toyArt = (game, className = '') =>
    '<img class="toy-art ' + className + '" src="' + toyImages[game] + '" alt="" draggable="false">';

  function home(league) {
    const remaining = left(league);
    const runs = state.runs[league.id] || [];
    const own = best(runs);
    const opponent = league.opps[0];
    const gap = opponent && own?.hits === opponent[1] ? own.ms - opponent[2] : 0;
    const revenge = state.scenario === 'rival' && league.id === 'promo' && remaining > 0 && gap > 0;
    const complete = remaining === 0;
    const last = runs.at(-1);
    const previousBest = best(runs.slice(0, -1));
    const improved = last && previousBest && sortScores(last, previousBest) < 0;
    const pose = complete && improved ? 'win' : revenge ? 'lose' : 'focus';
    const cta = complete ? 'Voir le classement' : revenge ? 'Prendre ma revanche' : 'Jouer';
    const match = complete ? (own ? clock(own.ms) : 'Défi terminé') : opponent ? clock(opponent[2]) : 'À toi de jouer';
    const targetLabel = complete ? (own ? 'Ton meilleur temps' : 'La ligue du jour') :
      opponent ? esc(opponent[0]) + ' · À battre' : 'Premier score';
    const tries = complete ? 'Essais terminés' : remaining + (remaining === 1 ? ' essai restant' : ' essais restants');
    const status = revenge ? esc(opponent[0]) + ' t’a passé de ' + gapLabel(gap) + '.' :
      complete && improved ? 'Nouveau record personnel !' : '';

    const selector = `
      <section class="league-context" aria-label="Ligue active">
        <div class="context-heading">
          <h1 tabindex="-1">Mes ligues</h1>
          ${btn('Inviter', 'invite', 'text invite-link', 'link')}
        </div>
        <button class="league-trigger" type="button" data-do="manage" aria-haspopup="dialog">
          <span class="league-token">${icon(league.icon)}</span>
          <strong>${esc(league.name)}</strong>
          <span class="league-change">${icon('down')}<span class="sr">Changer de ligue</span></span>
        </button>
      </section>`;

    return selector + `
      <article class="rebond-challenge ${complete ? 'is-complete' : ''}">
        <span class="challenge-caption">${icon(complete ? 'check' : 'flag')}${complete ? 'Défi terminé' : 'Défi du jour'}</span>
        <div class="challenge-display">
          <div class="challenge-copy">
            <h2>Aiguillage</h2>
            <p class="duel-target">
              <span>${targetLabel}</span>
              <strong class="${match.includes(' s') ? 'duel-time' : 'duel-message'}">${match}</strong>
            </p>
          </div>
          <div class="mascot-scene" aria-hidden="true">
            <span class="scene-shadow"></span>
            ${frog(pose, 'scene-frog')}
            <span class="scene-ledge"></span>
            ${toyArt('aiguillage', 'scene-wagon')}
          </div>
        </div>
        ${status ? '<p class="challenge-status">' + status + '</p>' : ''}
        ${btn(cta, complete ? 'league' : 'play', 'primary wide challenge-action', complete ? 'rank' : 'play')}
        <div class="challenge-facts">
          <span>${icon('flag')}Niveau 1</span><span>${icon('ticket')}${tries}</span>
        </div>
      </article>
      <section class="league-social" aria-labelledby="league-social-title">
        <div class="heading-line subsection">
          <h2 id="league-social-title">Dans la ligue</h2>
          <span class="member-count" aria-label="${league.count} membres">${icon('people')}${league.count}</span>
        </div>
        <div class="community-links">
          ${socialLink('league', 'rank', 'Résultats des amis')}
          ${socialLink('chat', 'chat', 'Chat de ligue')}
        </div>
      </section>`;
  }

  function socialLink(action, glyph, label) {
    return `<button type="button" data-do="${action}" class="community-link">
      <span class="social-token">${icon(glyph)}</span><strong>${label}</strong>${icon('arrow')}
    </button>`;
  }

  const routes = {
    circle: 'M150 49V74C150 96 130 104 105 116L71 132Q50 142 50 159V172',
    triangle: 'M150 49V172',
    square: 'M150 49V74C150 96 170 104 195 116L229 132Q250 142 250 159V172'
  };
  const turnAngles = { circle: 32, triangle: 0, square: -32 };

  function railSet(className) {
    return Object.values(routes).map(route => '<path class="' + className + '" d="' + route + '"/>').join('');
  }

  function tracks(symbol) {
    return `<svg viewBox="0 0 300 177" class="toy-tracks" aria-hidden="true">
      <g class="track-rails">
        ${railSet('rail-base')}
        ${railSet('rail-lip')}
        ${railSet('rail-groove')}
        ${railSet('rail-dashes')}
      </g>
      ${Object.entries(routes).map(([shape, route]) => '<path class="active-route" data-route="' + shape + '" d="' + route + '"/>').join('')}
      <circle class="switch-pin" cx="150" cy="83" r="7"/>
      <g class="switch-arm">
        <path d="M150 83v17"/>
        <circle cx="150" cy="83" r="3.5"/>
      </g>
      <g class="track-wagon" transform="translate(150 49)">
        <ellipse class="track-shadow" cx="0" cy="1" rx="21" ry="5"/>
        <image href="${toyImages.aiguillage}" x="-33" y="-44" width="66" height="47"/>
        <rect class="wagon-mark" x="-9" y="-18" width="18" height="18" rx="7"/>
        <svg x="-6" y="-15" width="12" height="12" viewBox="0 0 24 24">${icon(symbol).replace(/^<svg[^>]*>|<\/svg>$/g, '')}</svg>
      </g>
    </svg>`;
  }

  function game(round) {
    const symbol = round.seq[round.step];
    const progress = [0, 1, 2].map(step => '<b class="' +
      (step < round.step ? 'counted' : step === round.step ? 'current' : '') + '"></b>').join('');
    const correct = round.log.filter(item => item.choice === item.expected).length;
    return `
      <div class="section-title track-title"><h1 tabindex="-1">Aiguillage</h1></div>
      <p class="track-instruction">Envoie le wagon au quai de même forme.</p>
      <div class="round-summary">
        <div><strong>Wagon ${round.step + 1} / 3</strong><span class="round-progress" aria-hidden="true">${progress}</span></div>
        <span class="round-timer">${icon('timer')}<b class="digits" data-clock>${clock(round.total)}</b></span>
      </div>
      <div class="rebond-playfield" aria-label="Plateau d’aiguillage">
        <div class="wagon-title">${icon(symbol)}Wagon ${shapeNames[symbol].toLowerCase()}</div>
        ${tracks(symbol)}
        <div class="dock-controls" role="group" aria-label="Choisis un quai">
          ${Object.entries(shapeNames).map(([shape, name]) => `<button type="button" class="dock-control" data-do="answer" data-value="${shape}" aria-label="Quai ${name}">
            <span class="dock-face">${icon(shape)}<strong>${name}</strong><span class="dock-verdict"></span></span>
          </button>`).join('')}
        </div>
      </div>
      <div class="game-feedback rebond-feedback" data-feedback>${icon(round.last ? round.lastOk ? 'check' : 'close' : 'flag')}<span>${esc(round.last || 'Touche un quai pour aiguiller le wagon.')}</span></div>
      <div class="game-total"><span data-hits>${correct}/3 bons quais</span><span>${round.practice && !round.demo ? 'Entraînement' : 'Essai classé'}</span></div>`;
  }

  function showChoice(field, choice, round, reduced) {
    field.dataset.choice = choice;
    field.style.setProperty('--turn-angle', turnAngles[choice] + 'deg');
    const target = field.querySelector('[data-value="' + choice + '"]');
    for (const dock of field.querySelectorAll('.dock-control')) dock.setAttribute('aria-disabled', 'true');
    target.dataset.verdict = round.lastOk ? 'correct' : 'incorrect';
    target.querySelector('.dock-verdict').innerHTML = icon(round.lastOk ? 'check' : 'close');
    target.setAttribute('aria-label', target.getAttribute('aria-label') + ', ' + (round.lastOk ? 'bon quai' : 'mauvais quai'));

    const panel = field.closest('.view-game');
    const feedback = panel.querySelector('[data-feedback]');
    feedback.innerHTML = icon(round.lastOk ? 'check' : 'close') + '<span>' + esc(round.last) + '</span>';
    feedback.dataset.verdict = target.dataset.verdict;
    panel.querySelector('[data-clock]').textContent = clock(round.total);
    panel.querySelector('[data-hits]').textContent = round.log.filter(item => item.choice === item.expected).length + '/3 bons quais';

    const path = field.querySelector('[data-route="' + choice + '"]');
    const wagon = field.querySelector('.track-wagon');
    const length = path.getTotalLength();
    const firstFrame = performance.now();

    function draw(now) {
      if (!field.isConnected) return;
      const progress = reduced() ? 1 : Math.min(1, Math.max(0, (now - firstFrame - 45) / 285));
      const point = path.getPointAtLength(length * (1 - (1 - progress) ** 2));
      wagon.setAttribute('transform', 'translate(' + Number(point.x.toFixed(2)) + ' ' + Number(point.y.toFixed(2)) + ')');
      if (progress < 1) requestAnimationFrame(draw);
      else field.dataset.arrived = choice;
    }

    draw(firstFrame);
  }

  R.rebond = { home, game, showChoice, toyArt };
})();
