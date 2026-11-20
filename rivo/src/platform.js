(() => {
  'use strict';
  const unavailable = (provider, reason) => Object.freeze({provider, available:false, reason});
  const host = globalThis.RivoNativeBridge || {};
  const ad = typeof host.showRewardedAd === 'function'
    ? Object.freeze({provider:'native',available:true,showRewarded:host.showRewardedAd.bind(host)})
    : unavailable('none','A rewarded-ad SDK and its signed server callback must be configured.');
  const store = typeof host.purchase === 'function'
    ? Object.freeze({provider:'native',available:true,purchase:host.purchase.bind(host),restore:host.restore?.bind(host)})
    : unavailable('none','An iOS/Android wrapper and store products must be configured.');
  const review = typeof host.requestReview === 'function'
    ? Object.freeze({available:true,request:host.requestReview.bind(host)})
    : unavailable('web','The native in-app review API is not available in the browser.');
  globalThis.RivoPlatform = Object.freeze({ad,store,review});
})();
