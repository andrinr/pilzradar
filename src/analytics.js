// Optional aggregate analytics. Never read notebook, geolocation or browser storage.
(function () {
  'use strict';
  const script = document.currentScript;
  const token = script && script.dataset.token;
  const host = script && script.dataset.host;
  const optedOut = [navigator.doNotTrack, window.doNotTrack, navigator.msDoNotTrack]
    .some(value => value === '1' || value === 'yes');
  if (optedOut || navigator.globalPrivacyControl === true) return;
  if (!/^[a-f0-9]{32}$/.test(token || '') || location.protocol !== 'https:' || location.hostname !== host) return;
  // Skip previews and unknown URL fields rather than risk collecting private URL content.
  const url = new URL(location.href);
  const allowed = {lang:/^(en|de|fr|it|rm)$/, region:/^(ch|zh|be|lu|ur|sz|ow|nw|gl|zg|fr|so|bs|bl|sh|ar|ai|sg|gr|ag|tg|ti|vd|vs|ne|ge|ju)$/, species:/^[a-z_]{1,40}$/};
  for (const [key,value] of url.searchParams) if (!allowed[key] || !allowed[key].test(value)) return;
  if (url.hash && !/^#(top|map|explore|method|field-notes|notebook|support)$/.test(url.hash)) return;
  if (document.querySelector('script[data-shrooms-beacon]')) return;
  const beacon = document.createElement('script');
  beacon.src = 'https://static.cloudflareinsights.com/beacon.min.js';
  beacon.type = 'module';
  beacon.defer = true;
  beacon.referrerPolicy = 'no-referrer';
  beacon.dataset.shroomsBeacon = 'true';
  // Map interactions and notebook updates are not virtual page views.
  beacon.setAttribute('data-cf-beacon', JSON.stringify({token, spa:false}));
  document.head.appendChild(beacon);
}());
