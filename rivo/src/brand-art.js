/* Rivo's illustrated sets are independent of the existing, interchangeable frog poses. */
(() => {
  'use strict';

  const artSvg = (box, body) =>
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${box}" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;

  const toySet = `
    <ellipse cx="92" cy="137" rx="64" ry="8" fill="#191743" opacity=".24"/>
    <g transform="rotate(-6 88 78)" fill="none">
      <path d="M28 104V83a62 63 0 0 1 124 0v24" stroke="#191743" stroke-width="20" transform="translate(0 4)" opacity=".48"/>
      <path d="M28 104V83a62 63 0 0 1 124 0v24" stroke="#FF9652" stroke-width="19"/>
      <path d="M23 67q6-27 29-41" stroke="#FFF" stroke-width="3.8"/>
      <path d="M58 22l5-2" stroke="#FFF" stroke-width="3.8"/>
      <path d="M147 81v17" stroke="#191743" stroke-width="2.6" opacity=".26"/>
    </g>
    <path d="M27 124l123-7 3 9c1 7-24 13-58 15-37 2-65-1-67-8z" fill="#FF9652"/>
    <ellipse cx="90" cy="122" rx="63" ry="10" transform="rotate(-3 90 122)" fill="#FFF"/>
    <path d="M41 134q11 2 28 2" stroke="#FFF" stroke-width="2.3" fill="none"/>
    <path d="M8 88l3-5 4 1-3 5z" fill="#FF9652"/>
    <circle cx="165" cy="50" r="3.3" fill="#FFF"/>
    <circle cx="170" cy="59" r="1.8" fill="#FF9652"/>`;

  const stadiumSet = `
    <path d="M0 138c27-34 77-47 114-58 24-8 35-17 44-35l13 5c-7 24-11 41-3 61l5 12-119 24-54-1z" fill="#2636AF"/>
    <g fill="none" stroke="#FFF">
      <path d="M6 144c25-28 66-40 110-55 29-10 38-23 44-38" stroke-width="2.6"/>
      <path d="M49 146c20-22 55-38 86-53 17-9 23-26 29-40" stroke-width="2.6"/>
      <path d="M98 140c8-15 27-28 47-44 12-10 17-27 23-43" stroke-width="2.6"/>
    </g>
    <path d="M101 82l17-5m-10-2 12-4" fill="none" stroke="#14243D" stroke-width="2.5"/>
    <g transform="translate(144 13) rotate(9)">
      <path d="M4 4L1 46" fill="none" stroke="#14243D" stroke-width="4"/>
      <path d="M4 4c7-5 14-5 20-1 4 2 7 2 9 1l-2 18c-3 1-6 0-10-2-5-3-11-2-18 2z" fill="#FFF" stroke="#14243D" stroke-width="2"/>
      <path d="M4 4q4-3 9-4l-.6 9q-4 1-9 4zm9 5q4-.5 9 2l-1 9q-4-2-9-2zM23 2q5 3 10 2l-.9 9q-5 1-10-2z" fill="#14243D"/>
    </g>
    <g stroke="#2636AF" fill="none" stroke-width="3">
      <path d="M15 51l13-9m-7 16 11-7"/>
    </g>`;

  const popSet = `
    <path d="M24 72c2-14 19-15 24-26s-1-22 16-29c13-6 24 5 35 0s17-13 30-10c16 4 10 18 20 25s22 6 23 20c2 14-12 19-10 33s7 20-4 32c-11 10-23 4-36 10s-21 16-36 12c-14-4-14-15-30-15-18 1-24 0-30-11-7-13 3-20 1-25-2-6-5-11-3-16z" fill="#28123B" transform="translate(3 4)"/>
    <path d="M24 72c2-14 19-15 24-26s-1-22 16-29c13-6 24 5 35 0s17-13 30-10c16 4 10 18 20 25s22 6 23 20c2 14-12 19-10 33s7 20-4 32c-11 10-23 4-36 10s-21 16-36 12c-14-4-14-15-30-15-18 1-24 0-30-11-7-13 3-20 1-25-2-6-5-11-3-16z" fill="#FF69AB"/>
    <g transform="translate(149 91) rotate(-26)" fill="none" stroke="#FFF" stroke-width="3">
      <path d="M-5-10q3 4 0 8t0 8 0 8"/>
      <path d="M1-11q3 4 0 8t0 8 0 8"/>
    </g>
    <g fill="#28123B">
      <circle cx="46" cy="50" r="1.9"/><circle cx="52" cy="48" r="1.9"/><circle cx="58" cy="46" r="1.9"/>
      <circle cx="46" cy="56" r="1.9"/><circle cx="52" cy="54" r="1.9"/><circle cx="58" cy="52" r="1.9"/>
      <circle cx="46" cy="62" r="1.9"/><circle cx="52" cy="60" r="1.9"/>
    </g>
    <path d="M31 15q2 9 9 10-8 2-9 10-1-8-9-10 7-1 9-10zM161 14q1 5 6 6-5 1-6 6-1-5-6-6 5-1 6-6z" fill="#FFF"/>
    <path d="M17 114l6-5 3 5-6 5z" fill="#FF69AB"/>`;

  const headband = `
    <g transform="rotate(-12 19 22)" fill="currentColor">
      <path fill-rule="evenodd" d="M2.6 17.4C5.5 11.9 16 10.1 23.4 12c4 1 6.5 3.7 6.1 7.8-.3 3.6-2 6.6-5.8 8.5-5.5 2.7-14 3.2-18.4.5-3.6-2.2-4.9-7.7-2.7-11.4zm3.9.4c-1.3 1.5-.8 2.8.9 3.3 3.2 1 10.1.2 14.1-1.7 2.2-1 3.3-2.2 2.6-3.1-1.7-2.4-14.1-1.8-17.6 1.5z"/>
      <path d="M26 17c2.7-4 6.6-6.7 11.7-6.3-.6 4.5-4.6 7.9-9.4 8.8 4.9-.2 7.4 2.1 9 6.6-5.7.5-9.4-2.2-11.7-6.2z"/>
    </g>`;

  const switchmark = `
    <g fill="currentColor">
      <path d="M7 6.2a4.4 4.4 0 0 1 5.5 3c.8 3 2 4.2 5.4 5.8l2.3 1.2c3.4-1.8 5.3-4.3 6.1-8 .6-2.9 2.7-4.1 5.3-3.6 2.6.6 4 2.9 3.4 5.5-1.3 6-4.8 9.5-10.6 12.6-2.9 1.5-4.5 3.2-4.4 7.9.1 3-1.2 4.8-4 5.1-2.7.2-4.7-1.8-4.8-4.6-.2-4.6.6-7.7 2.7-10.5-5.4-2.6-8.5-5.8-9.5-9.2-.7-2.5.3-4.4 2.6-5.2z"/>
      <circle cx="19.4" cy="8" r="2.6"/>
    </g>`;

  window.heroBackdrop = function heroBackdrop(theme) {
    const set = theme === 'b' ? stadiumSet : theme === 'c' ? popSet : toySet;
    return artSvg('180 150', set);
  };

  window.brandSymbol = function brandSymbol(theme) {
    if (theme === 'b') return artSvg('40 40', headband);
    if (theme === 'c') return artSvg('40 40', switchmark);
    return '';
  };
})();
