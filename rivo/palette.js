// Approved palette A is the app default. Explicit alternatives remain isolated previews.
(() => {
 const params = new URLSearchParams(location.search);
 const requested = params.get('palette');
 const preview = ['azur', 'lilas', 'menthe'].includes(requested);
 const palette = preview ? requested : 'azur';
 document.documentElement.dataset.palette = palette;
 document.documentElement.dataset.palettePreview = String(preview);
 if (params.get('embed') === '1') document.documentElement.dataset.embedded = 'true';
 document.querySelector('meta[name="theme-color"]').content = { azur:'#3054E8', lilas:'#DDCFF6', menthe:'#C8E8D7' }[palette];
})();
