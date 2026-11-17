/* Six original mechanic diagrams, drawn in the same toy vocabulary as the UI.
   Everything inside the returned SVG is decorative; the caller supplies the game name. */
(() => {
  'use strict';

  const palettes = {
    a: { base: '#3046DF', accent: '#DDE4FF', ink: '#191743' },
    b: { base: '#2636AF', accent: '#C8FA38', ink: '#14243D' },
    c: { base: '#611BD1', accent: '#FF69AB', ink: '#28123B' }
  };

  function illustrate(game, theme, mode = 'banner') {
    const direction = Object.hasOwn(palettes, theme) ? theme : 'a';
    const { base, accent, ink } = palettes[direction];
    const white = '#FFFFFF';
    const outline = direction === 'c' ? 3.2 : 2.7;
    const path = (d, fill = 'none', stroke = 'none', width = 0, extra = '') =>
      `<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${width}" ${extra}/>`;
    const rim = (d, fill) => path(d, fill, ink, outline);
    const line = (d, fill, w, extra = '') => path(d, 'none', fill, w, extra);
    const oval = (x, y, rx, ry, fill, stroke = 'none', w = 0, extra = '') =>
      `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${fill}" stroke="${stroke}" stroke-width="${w}" ${extra}/>`;
    const dot = (x, y, r, fill, stroke = 'none', w = 0) => oval(x,y,r,r,fill,stroke,w);
    const group = (transform, parts) => `<g transform="${transform}">${parts}</g>`;
    const shine = (d) => direction === 'a' ? line(d, white, 2.7) : '';
    const speed = (d) => direction === 'b' ? line(d, ink, 2.4) : '';
    const shade = (d) => path(d, ink, 'none', 0, 'opacity=".18"');
    const ground = (x, y, rx) => oval(x, y, rx, 4, ink, 'none', 0, 'opacity=".13"');
    const pin = (x, y, face) => dot(x, y, 3, white, ink, 1.45) + dot(x, y, 1, face);
    const spark = (x, y, size, fill = white) => group(`translate(${x} ${y}) scale(${size})`,
      path('M0-8 Q1-1 8 0 Q1 1 0 8 Q-1 1-8 0 Q-1-1 0-8Z', fill, ink, 1.3));
    const stamp = (x, y, angle, size = 1) => {
      const mark = direction === 'b'
        ? path('M-6 3l4-7h3l-4 7zm6 0 4-7h3L3 3z', ink)
        : direction === 'c'
          ? dot(-5, -2, 1.4, ink) + dot(0, -2, 1.4, ink) + dot(5, -2, 1.4, ink) + dot(-2.5, 2, 1.4, ink) + dot(2.5, 2, 1.4, ink)
          : '';
      return group(`translate(${x} ${y}) rotate(${angle}) scale(${size})`, mark);
    };
    const checker = (x, y, size) => group(`translate(${x} ${y}) scale(${size})`,
      path('M0 0H5V5H0ZM5 5H10V10H5ZM10 0H15V5H10ZM15 5H20V10H15Z', ink));
    // These accents sit beyond the mechanic, so the silhouette is legible at thumbnail size.
    function marginMark() {
      if (mode === 'hero') return '';
      if (direction === 'a') return spark(220, 24, .64) + oval(21, 75, 3.5, 3.5, accent, ink, 1.6);
      if (direction === 'b') return group('translate(18 22) skewX(-24)', line('M0 0h19m-14 6h11', accent, 3.4)) + checker(205, 83, .62);
      return group('translate(19 24) rotate(-10)', path('M0 0l8-3 4 5-8 3z', accent, ink, 1.3)) +
        group('translate(211 76)', dot(0, 0, 2.2, white, ink, 1) + dot(6, 6, 2.2, white, ink, 1));
    }

    function aiguillage() {
      // One incoming pair of rails splits into two berths. A little angled wagon occupies the switch.
      const left = 'M31 87 C55 77 86 65 105 58 S140 36 160 22';
      const right = 'M31 87 C55 77 86 65 105 58 S155 52 194 57';
      const bed = (d) => line(d, ink, 16) + line(d, white, 11.5) + line(d, base, 5.2);
      let sleepers = '';
      [[33,86],[49,80],[66,74],[83,67],[101,60],[124,48],[141,36],[155,56],[173,56]].forEach(([x,y],i) => {
        sleepers += group(`translate(${x} ${y}) rotate(${i < 7 ? -22 : 0})`, line('M0-10v20', ink, 4));
      });
      const berth = (x,y,rotation,mark) => group(`translate(${x} ${y}) rotate(${rotation})`,
        rim('M-13-5Q-12-8-8-8H9Q12-8 13-5L14 6Q14 9 10 9H-10Q-14 9-14 6Z', accent) +
        (mark === 'triangle' ? path('M0-4l4 7h-8z',ink) : oval(0,0,3.8,3.8, ink)));
      const wagon = group('translate(86 53) rotate(-17)',
        oval(1, 12, 26, 4.5, ink, 'none', 0, 'opacity=".2"') +
        dot(-16, 9, 6.1, ink) + dot(14, 9, 6.1, ink) + dot(-16,9,2,white) + dot(14,9,2,white) +
        rim('M-25-11Q-25-15-20-16L13-18Q17-18 20-15L25-10V4Q25 9 19 10H-18Q-24 10-25 5Z', accent) +
        rim('M-24-12L-17-20Q-15-22-10-22L12-23Q16-23 18-20L24-12Q25-9 20-8L-18-6Q-23-6-24-9Z', white) +
        path('M-14-17l29-1 2 4-31 1z',base) +
        shade('M17-7l7-4v14q0 5-6 6h-4q3-3 3-7z') +
        (direction === 'a' ? line('M-19 2h18', ink, 2.1) : stamp(-9, 1, 0)) + pin(14, 0, accent) + shine('M-19-2h7'));
      return sleepers + bed(left) + bed(right) +
        // Preserve the open fork when the right branch overlaps the shared approach.
        line('M101 60q13-5 25-13',base,4.8) + line('M106 59q12-4 25-4',base,4.8) +
        berth(167,18,-27,'triangle') + berth(198,57,6,'circle') +
        speed('M38 50h14m-8-6h11') + wagon;
    }

    function table() {
      const pawn = (x, y, fill, rotation = 0) => group(`translate(${x} ${y}) rotate(${rotation})`,
        oval(0,5,11,4,ink,'none',0,'opacity=".16"') +
        rim('M-9 4l2-8q1-4 4-6q-3-2-3-5a6 6 0 1 1 12 0q0 4-3 6q4 2 5 6l1 7q-9 5-18 0z',fill) +
        shine('M-3-17q1-2 3-2'));
      const plate = (x,y) => oval(x,y,10,4.8,white,ink,1.7) + line(`M${x-4} ${y+1}q4 1 8-1`,base,1.3);
      return ground(120,88,69) + pawn(88,39,accent,-7) + pawn(153,34,white,8) +
        rim('M59 54C70 38 117 30 151 36q27 4 32 13v11c-4 12-30 24-68 27-29 3-54-3-58-13z',base) +
        rim('M58 57c6-13 39-23 67-24 25-2 51 4 57 14 7 12-22 26-56 30-34 4-63 0-69-11q-2-5 1-9z',accent) +
        shine('M65 58q16-13 51-18') +
        plate(88,56)+plate(129,44)+plate(155,57)+plate(114,68) + stamp(142,66,-12,.7) +
        path('M119 50q-3-5-6-2-4 4 6 9 9-8 5-10-3-2-5 3z',ink) +
        pawn(143,91,base,6) + pawn(66,80,white,-10) +
        group('translate(187 32) rotate(9)', line('M-10 5q7-14 21-8',ink,2.5,'stroke-dasharray="3 5"') + path('M9-7l7 4-8 3z',ink));
    }

    function photo() {
      function card(x,y,angle,swap,frame) {
        return group(`translate(${x} ${y}) rotate(${angle})`,
          rim('M-34-29q0-5 5-5h58q5 0 5 5v59q0 5-5 5h-58q-5 0-5-5z',frame) +
          rim('M-28-25h56v45h-56z',base) +
          path('M-27 7l14-17 16 16 8-8 16 17v4h-54z',white) +
          path('M-27 16l16-12 7 7 8-5 13 13h-44z',accent) +
          (swap ? path('M12-20l6 8-10 1z',accent) : dot(13,-15,4.6,accent)) +
          (direction === 'a' ? line('M-9 28h18',ink,2.2) : stamp(0,27,0,1.1)) + shine('M-27-29h15'));
      }
      return ground(121,94,66) + card(90,51,-13,false,accent) + card(151,58,10,true,white) +
        group('translate(171 42) rotate(10)', line('M-10-3v-6h6m17 6v-6H7m6 15v5H7m-17-5v5h6',ink,3.1)) +
        group('translate(189 14) rotate(12)', rim('M-2-5L-9 8h7l-3 8L10 0H3l4-7z',accent)) +
        speed('M39 52h10m-6 7h9');
    }

    function trace() {
      const pad = (x,y,scale,fill) => group(`translate(${x} ${y}) scale(${scale})`,
        oval(0,8,23,4,ink,'none',0,'opacity=".14"') +
        rim('M-23 0c2-6 13-9 26-9 10 0 19 3 19 7v6C20 10 6 13-6 11c-10-1-17-4-17-8z',base) +
        rim('M-23-1c1-5 13-9 24-9 10 0 20 3 21 7L9 0l14 2c-3 5-15 8-26 8-13 0-21-5-20-11z',fill) +
        shine('M-16-3q6-4 13-4'));
      const print = (x,y,r) => group(`translate(${x} ${y}) rotate(${r})`,
        path('M-4 3q0-2-3-6l-1-2q-1-2 1-3 2-1 3 1l2 6v-9q0-2 2-2 2 0 2 2v8l3-6q1-2 3 0 1 1 0 3l-4 9q-2 2-4 1z',ink));
      return pad(53,78,.81,accent) + pad(122,59,1.05,white) + pad(190,44,.8,accent) +
        line('M55 68Q77 13 112 46',white,6.5,'stroke-dasharray="3 6"') + line('M55 68Q77 13 112 46',ink,3.9,'stroke-dasharray="3 6"') +
        line('M127 48q25-52 53-16',white,6.5,'stroke-dasharray="3 6"') + line('M127 48q25-52 53-16',ink,3.9,'stroke-dasharray="3 6"') +
        path('M107 45l9 5-2-11z',ink) + path('M176 30l9 5-2-11z',ink) +
        print(49,76,36) + print(121,58,39) + print(187,44,40);
    }

    function doubleFond() {
      const cup = (x, y, scale, tilt, face) => group(`translate(${x} ${y}) rotate(${tilt}) scale(${scale})`,
        rim('M-13-33q0-5 13-6 13 0 14 5l7 33q1 4-5 6-15 6-33 0-5-2-4-6z',face) +
        oval(.5,-34,13.3,4.7,white,ink,2.3) +
        shade('M6-29q5-2 7-4l7 32q0 3-5 4l-4 1z') +
        rim('M-21-2c12 5 28 5 42 0l1 5c-7 7-36 8-45 0z',face) +
        shine('M-9-25l-2 10') + stamp(-3,-13,-10,.95));
      return ground(114,90,73) +
        line('M52 35q37-27 74-9',ink,3.1) + path('M123 20l11 8-13 2z',ink) +
        line('M131 18q19-4 40 1',ink,2.7,'stroke-dasharray="3 5"') +
        cup(77,70,.92,-12,base) + cup(166,74,.94,10,white) +
        cup(120,71,1.16,-6,accent) +
        dot(91,90,7.4,accent,ink,2.5) + shine('M88 87l2-1') +
        speed('M173 32l13-4m-10 11 13-4');
    }

    function miroir() {
      const tile = (x, mirror) => group(`translate(${x} 56) scale(${mirror ? -1 : 1} 1)`,
        rim('M-25-19l20-12 17 10v15l15 9v18L7 33l-16-10V9l-16-10z',base) +
        rim('M-25-19l20-12 17 10L-8-9z',accent) + rim('M-25-19L-8-9V8l-17-10z',white) +
        rim('M-8 8l20-12 15 9L7 17z',accent) +
        path('M7 17v16l-16-10V8z',white,ink,outline) +
        line('M12-20v15',ink,outline) + shine('M-18-19l11-7') +
        (direction === 'a' ? dot(0,20,2.1,ink) : stamp(-1,19,30,.65)));
      return ground(119,93,79) +
        line('M120 12v78',ink,3,'stroke-dasharray="4 6"') +
        rim('M116 10l4-4 4 4-4 4z',accent) + rim('M116 92l4-4 4 4-4 4z',accent) +
        tile(78,false)+tile(162,true) +
        group('translate(120 52)',line('M-9 0H9',ink,1.8) + path('M-5-3l-5 3 5 3m10-6 5 3-5 3','none',ink,2));
    }

    const draw = { aiguillage, table, photo, trace, double: doubleFond, miroir };
    const illustration = Object.hasOwn(draw, game) ? draw[game]() : '';
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 110" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false" fill="none" stroke-linecap="round" stroke-linejoin="round">${marginMark()}${illustration}</svg>`;
  }

  window.mechanicArt = illustrate;
})();
